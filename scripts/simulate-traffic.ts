/**
 * Traffic + workflow simulation for the IELTS Writing Coach.
 *
 * Part 1 - Incremental load ramp against non-LLM page routes. This accumulates
 *   up to MAX_TRAFFIC requests in stages of growing concurrency and reports
 *   latency percentiles and throughput. It deliberately avoids the provider
 *   endpoints so it costs nothing and is not blocked by the per-IP limiter.
 *
 * Part 2 - Two real end-to-end journeys: register two accounts, run one guided
 *   workflow and one unguided workflow against the configured LLM provider, then
 *   persist each result as a saved report (exercising Supabase auth + RLS).
 *   This makes a small, bounded number of real provider calls.
 *
 * Run with the helper command in the task notes (sets BASE_URL + Supabase keys).
 *   npx tsx scripts/simulate-traffic.ts
 */

export {};

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const SUPABASE_URL = (process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321').replace(/\/$/, '');
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const MAX_TRAFFIC = Number(process.env.MAX_TRAFFIC ?? 5000);

const PAGE_ROUTES = ['/', '/login', '/signup', '/guided', '/unguided'];

interface StageResult {
  requests: number;
  concurrency: number;
  ok: number;
  errors: number;
  latencies: number[];
  elapsedSec: number;
}

function randomIp(): string {
  const o = () => 1 + Math.floor(Math.random() * 254);
  return `${o()}.${o()}.${o()}.${o()}`;
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.ceil((p / 100) * sortedAsc.length) - 1);
  return sortedAsc[Math.max(0, idx)]!;
}

function pad(s: string | number, width: number): string {
  return String(s).padStart(width);
}

async function runStage(requests: number, concurrency: number): Promise<StageResult> {
  const latencies: number[] = [];
  let ok = 0;
  let errors = 0;
  let next = 0;
  const start = Date.now();

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= requests) return;
      const route = PAGE_ROUTES[i % PAGE_ROUTES.length]!;
      const t0 = performance.now();
      try {
        const res = await fetch(BASE_URL + route, {
          redirect: 'manual',
          headers: { 'X-Forwarded-For': randomIp() },
        });
        await res.arrayBuffer();
        latencies.push(performance.now() - t0);
        if (res.status < 400) ok++;
        else errors++;
      } catch {
        latencies.push(performance.now() - t0);
        errors++;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return { requests, concurrency, ok, errors, latencies, elapsedSec: (Date.now() - start) / 1000 };
}

function buildPlan(max: number): Array<{ requests: number; concurrency: number }> {
  const fractions = [
    { frac: 0.02, conc: 10 },
    { frac: 0.05, conc: 25 },
    { frac: 0.1, conc: 50 },
    { frac: 0.2, conc: 100 },
    { frac: 0.23, conc: 150 },
    { frac: 0.4, conc: 200 },
  ];
  const plan = fractions.map((f) => ({
    requests: Math.max(1, Math.round(f.frac * max)),
    concurrency: f.conc,
  }));
  const sum = plan.reduce((a, s) => a + s.requests, 0);
  plan[plan.length - 1]!.requests += max - sum;
  return plan;
}

async function loadRamp(): Promise<void> {
  console.log(`\n=== Part 1: incremental load ramp -> ${MAX_TRAFFIC} requests on ${BASE_URL} ===`);
  console.log(`Routes: ${PAGE_ROUTES.join(', ')}`);
  console.log(
    `${pad('conc', 6)} ${pad('reqs', 7)} ${pad('ok', 7)} ${pad('err', 6)} ${pad('req/s', 8)} ${pad('p50ms', 8)} ${pad('p95ms', 8)} ${pad('p99ms', 8)} ${pad('maxms', 8)}`
  );

  let totalOk = 0;
  let totalErr = 0;
  let totalReq = 0;
  const allLatencies: number[] = [];
  const t0 = Date.now();

  for (const stage of buildPlan(MAX_TRAFFIC)) {
    const r = await runStage(stage.requests, stage.concurrency);
    const sorted = [...r.latencies].sort((a, b) => a - b);
    const rps = r.elapsedSec > 0 ? r.requests / r.elapsedSec : r.requests;
    console.log(
      `${pad(r.concurrency, 6)} ${pad(r.requests, 7)} ${pad(r.ok, 7)} ${pad(r.errors, 6)} ${pad(rps.toFixed(0), 8)} ${pad(percentile(sorted, 50).toFixed(0), 8)} ${pad(percentile(sorted, 95).toFixed(0), 8)} ${pad(percentile(sorted, 99).toFixed(0), 8)} ${pad((sorted[sorted.length - 1] ?? 0).toFixed(0), 8)}`
    );
    totalOk += r.ok;
    totalErr += r.errors;
    totalReq += r.requests;
    allLatencies.push(...r.latencies);
  }

  const sorted = allLatencies.sort((a, b) => a - b);
  const wall = (Date.now() - t0) / 1000;
  console.log(
    `\nTotals: ${totalReq} requests in ${wall.toFixed(1)}s | ok ${totalOk} | errors ${totalErr} | avg ${(totalReq / wall).toFixed(0)} req/s | p95 ${percentile(sorted, 95).toFixed(0)}ms | p99 ${percentile(sorted, 99).toFixed(0)}ms`
  );
}

interface Account {
  email: string;
  password: string;
  displayName: string;
  id?: string;
  accessToken?: string;
}

async function registerAccount(acc: Account): Promise<void> {
  const create = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: { display_name: acc.displayName },
    }),
  });
  if (!create.ok) {
    throw new Error(`admin create user failed (${create.status}): ${await create.text()}`);
  }
  const created = (await create.json()) as { id: string };
  acc.id = created.id;

  const signIn = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: acc.email, password: acc.password }),
  });
  if (!signIn.ok) {
    throw new Error(`sign-in failed (${signIn.status}): ${await signIn.text()}`);
  }
  const session = (await signIn.json()) as { access_token: string };
  acc.accessToken = session.access_token;
  console.log(`  registered + signed in: ${acc.email} (${acc.id})`);
}

interface Bands {
  TR: number;
  CC: number;
  LR: number;
  GRA: number;
  overall: number;
}

async function saveReport(acc: Account, row: {
  mode: 'guided' | 'unguided';
  topic: string;
  essay: string;
  word_count: number;
  bands: Bands | null;
  feedback: unknown;
  sections: Array<{ id: string; label: string; text: string }> | null;
}): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${acc.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: acc.id,
      mode: row.mode,
      topic: row.topic,
      essay: row.essay,
      word_count: row.word_count,
      band_overall: row.bands?.overall ?? null,
      bands: row.bands,
      feedback: row.feedback,
      sections: row.sections,
    }),
  });
  if (!res.ok) {
    throw new Error(`save report failed (${res.status}): ${await res.text()}`);
  }
  const saved = (await res.json()) as Array<{ id: string }>;
  console.log(`  saved ${row.mode} report ${saved[0]?.id} (band ${row.bands?.overall ?? 'n/a'})`);
}

const TOPIC =
  'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?';

const GUIDED = {
  hook:
    'Imagine a teenager who has never once stepped outside the classroom to help a stranger; for many students, that is simply the reality of school today.',
  thesis:
    'This essay will argue that unpaid community service should be a compulsory part of every high school programme, because it builds genuine empathy and practical skills that lessons alone cannot teach.',
  body1:
    'The first reason to support compulsory service is that it connects young people to the realities of life around them. When a student spends an afternoon helping at a local charity or cleaning a public park, they begin to understand problems that they might otherwise ignore, and this direct experience often teaches empathy far more effectively than any textbook.',
  conclusion:
    'In conclusion, although compulsory community service certainly has its critics, the advantages for both the individual and wider society are considerable, and schools should therefore treat it as an essential part of a complete education.',
};

const UNGUIDED_ESSAY = [
  'Many educators argue that students should be required to take part in unpaid community service before they finish secondary school. I strongly agree with this view, because such work builds practical skills and a sense of responsibility that classroom lessons alone cannot provide.',
  'The first reason to support compulsory service is that it connects young people to the realities of life around them. When a student spends an afternoon helping at a local charity or cleaning a public park, they begin to understand problems that they might otherwise ignore. This direct experience often teaches empathy more effectively than a textbook, because the lesson is felt rather than simply read.',
  'A further benefit is the development of skills that employers and universities value. Organising a small event, working in a team of volunteers, or teaching a sport to younger children all require communication, planning and patience. Students who practise these abilities while still at school enter adult life with a clear advantage over those who have never worked outside the classroom.',
  'Opponents claim that forcing teenagers to volunteer removes the genuine spirit of giving, and that service should remain a free choice. While this concern is reasonable, I believe that a well designed programme can still allow students to choose the cause they care about. The requirement simply ensures that every young person is given the opportunity, rather than leaving it to chance.',
  'In conclusion, although compulsory community service is not without its critics, the advantages for both the individual and society are considerable. Schools should therefore treat it as an essential part of a complete education.',
].join('\n\n');

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

async function guidedStage(
  stage: string,
  userText: string,
  priorContext: Record<string, unknown>
): Promise<{ ok: boolean; bands?: Bands; status: number }> {
  const res = await fetch(`${BASE_URL}/api/guided/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage, prompt: TOPIC, userText, priorContext }),
  });
  if (!res.ok) {
    console.log(`  [guided:${stage}] HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return { ok: false, status: res.status };
  }
  const json = (await res.json()) as {
    data: { feedback: { rating: string; bands?: Bands }; validated: boolean; retries: number };
  };
  const fb = json.data.feedback;
  console.log(
    `  [guided:${stage}] rating=${fb.rating} validated=${json.data.validated} retries=${json.data.retries}${fb.bands ? ` band=${fb.bands.overall}` : ''}`
  );
  return { ok: true, bands: fb.bands, status: 200 };
}

async function runGuidedWorkflow(acc: Account): Promise<void> {
  console.log(`\n  guided workflow as ${acc.email}`);
  const essay = [GUIDED.hook, GUIDED.thesis, GUIDED.body1, GUIDED.conclusion].join('\n\n');
  await guidedStage('hook', GUIDED.hook, {});
  await guidedStage('thesis', GUIDED.thesis, { hook: GUIDED.hook });
  await guidedStage('body-paragraph-1', GUIDED.body1, { hook: GUIDED.hook, thesis: GUIDED.thesis });
  await guidedStage('conclusion', GUIDED.conclusion, {
    hook: GUIDED.hook,
    thesis: GUIDED.thesis,
    bodyParagraphs: [GUIDED.body1],
  });
  const synth = await guidedStage('synthesis', essay, {
    hook: GUIDED.hook,
    thesis: GUIDED.thesis,
    bodyParagraphs: [GUIDED.body1],
    conclusion: GUIDED.conclusion,
  });

  await saveReport(acc, {
    mode: 'guided',
    topic: TOPIC,
    essay,
    word_count: wordCount(essay),
    bands: synth.bands ?? null,
    feedback: { source: 'simulation', synthesisOk: synth.ok },
    sections: [
      { id: 'hook', label: 'Hook', text: GUIDED.hook },
      { id: 'thesis', label: 'Thesis', text: GUIDED.thesis },
      { id: 'body-paragraph-1', label: 'Body 1', text: GUIDED.body1 },
      { id: 'conclusion', label: 'Conclusion', text: GUIDED.conclusion },
    ],
  });
}

async function runUnguidedWorkflow(acc: Account): Promise<void> {
  console.log(`\n  unguided workflow as ${acc.email}`);
  const res = await fetch(`${BASE_URL}/api/unguided/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: TOPIC, essay: UNGUIDED_ESSAY }),
  });

  let bands: Bands | null = null;
  let feedback: unknown = { source: 'simulation' };
  if (!res.ok) {
    console.log(`  [unguided] HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  } else {
    const json = (await res.json()) as {
      data: { feedback: { bands: Bands; topImprovements: string[] }; validated: boolean; retries: number };
    };
    bands = json.data.feedback.bands;
    feedback = json.data.feedback;
    console.log(
      `  [unguided] band=${bands.overall} validated=${json.data.validated} retries=${json.data.retries} | ${json.data.feedback.topImprovements?.length ?? 0} improvements`
    );
  }

  await saveReport(acc, {
    mode: 'unguided',
    topic: TOPIC,
    essay: UNGUIDED_ESSAY,
    word_count: wordCount(UNGUIDED_ESSAY),
    bands,
    feedback,
    sections: null,
  });
}

async function workflows(): Promise<void> {
  console.log(`\n=== Part 2: account registration + real workflows ===`);
  if (!ANON_KEY || !SERVICE_KEY) {
    console.log('  skipped: SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }
  const ts = Date.now();
  const guidedAcc: Account = {
    email: `sim-guided-${ts}@example.com`,
    password: 'SimPass12345',
    displayName: 'Sim Guided User',
  };
  const unguidedAcc: Account = {
    email: `sim-unguided-${ts}@example.com`,
    password: 'SimPass12345',
    displayName: 'Sim Unguided User',
  };

  await registerAccount(guidedAcc);
  await registerAccount(unguidedAcc);

  try {
    await runGuidedWorkflow(guidedAcc);
  } catch (err) {
    console.log(`  guided workflow error: ${(err as Error).message}`);
  }
  try {
    await runUnguidedWorkflow(unguidedAcc);
  } catch (err) {
    console.log(`  unguided workflow error: ${(err as Error).message}`);
  }
}

async function main(): Promise<void> {
  console.log(`Target server: ${BASE_URL}`);
  await loadRamp();
  await workflows();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
