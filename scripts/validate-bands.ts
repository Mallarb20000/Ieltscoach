/**
 * Band accuracy check: runs the synthesis pipeline against every essay in
 * docs/samples/ and compares AI band scores with the official ones.
 * Run with: npx tsx --env-file=.env scripts/validate-bands.ts
 * Calls the configured LLM provider directly (no dev server needed).
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { getProvider } from '@/lib/llm/select';
import { getValidatedFeedback } from '@/lib/validation/retry';

const BandsSchema = z.object({
  TR: z.number(),
  CC: z.number(),
  LR: z.number(),
  GRA: z.number(),
  overall: z.number(),
});

const SampleSchema = z.object({
  id: z.string(),
  source: z.string(),
  prompt: z.string().min(1),
  essay: z.string().min(1),
  officialBand: BandsSchema,
});

type Bands = z.infer<typeof BandsSchema>;

const CRITERIA = ['TR', 'CC', 'LR', 'GRA', 'overall'] as const;

function formatRow(label: string, official: Bands, ai: Bands): string {
  const cells = CRITERIA.map((c) => {
    const delta = ai[c] - official[c];
    const sign = delta > 0 ? '+' : '';
    return `${c} ${official[c].toFixed(1)}->${ai[c].toFixed(1)} (${sign}${delta.toFixed(1)})`;
  });
  return `${label}  ${cells.join('  ')}`;
}

async function main() {
  const samplesDir = join(process.cwd(), 'docs', 'samples');
  const files = readdirSync(samplesDir).filter((f) => f.endsWith('.json')).sort();

  if (files.length === 0) {
    console.error('No sample files found in docs/samples/');
    process.exit(1);
  }

  const provider = getProvider();
  console.log(`Provider: ${provider.name}`);
  console.log(`Samples: ${files.length}\n`);

  const overallDeltas: number[] = [];
  let failures = 0;

  for (const file of files) {
    const raw: unknown = JSON.parse(readFileSync(join(samplesDir, file), 'utf-8'));
    const sample = SampleSchema.safeParse(raw);
    if (!sample.success) {
      console.error(`${file}: invalid sample format, skipping`);
      failures++;
      continue;
    }

    const { id, prompt, essay, officialBand } = sample.data;

    try {
      const result = await getValidatedFeedback(
        (i, extra) => provider.guidedFeedback(i, extra),
        { stage: 'synthesis', prompt, userText: essay, priorContext: {} }
      );

      const bands = result.feedback.bands;
      if (!bands) {
        console.error(`${id}: synthesis returned no bands, skipping`);
        failures++;
        continue;
      }

      console.log(formatRow(id, officialBand, bands));
      if (!result.validated) {
        console.log(`  note: quote validation failed after retries, findings were filtered`);
      }
      overallDeltas.push(Math.abs(bands.overall - officialBand.overall));
    } catch (err) {
      console.error(`${id}: pipeline error: ${err instanceof Error ? err.message : String(err)}`);
      failures++;
    }
  }

  if (overallDeltas.length > 0) {
    const mae = overallDeltas.reduce((a, b) => a + b, 0) / overallDeltas.length;
    const within = overallDeltas.filter((d) => d <= 0.5).length;
    console.log(`\nOverall band MAE: ${mae.toFixed(2)}`);
    console.log(`Within 0.5 of official: ${within}/${overallDeltas.length}`);
  }
  if (failures > 0) {
    console.log(`Failures: ${failures}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
