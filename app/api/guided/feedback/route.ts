import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProvider } from '@/lib/llm/select';
import { getValidatedFeedback } from '@/lib/validation/retry';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';
import type { StageInput } from '@/lib/llm/adapter';

export const maxDuration = 120;

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const StageIdSchema = z.enum([
  'hook',
  'bridge',
  'thesis',
  'topic-sentence-1',
  'body-paragraph-1',
  'topic-sentence-2',
  'body-paragraph-2',
  'topic-sentence-3',
  'body-paragraph-3',
  'conclusion',
  'synthesis',
]);

const StageInputSchema = z.object({
  stage: StageIdSchema,
  prompt: z.string().min(1).max(2_000),
  userText: z.string().min(1).max(12_000),
  priorContext: z.object({
    hook: z.string().max(2_000).optional(),
    thesis: z.string().max(2_000).optional(),
    bridge: z.string().max(2_000).optional(),
    topicSentences: z.array(z.string().max(2_000)).max(3).optional(),
    bodyParagraphs: z.array(z.string().max(4_000)).max(3).optional(),
    conclusion: z.string().max(2_000).optional(),
  }),
});

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`guided:${clientKey(req)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many feedback requests. Wait about ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s) and try again.`,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = StageInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input: StageInput = parsed.data;
  const provider = getProvider();

  try {
    const result = await getValidatedFeedback(
      (i, extra) => provider.guidedFeedback(i, extra),
      input
    );
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('[guided/feedback] provider error:', err);
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
  }
}
