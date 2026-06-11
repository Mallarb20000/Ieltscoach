import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProvider } from '@/lib/llm/select';
import { getValidatedEssayFeedback } from '@/lib/validation/retry';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';

export const maxDuration = 120;

const MIN_ESSAY_WORDS = 250;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const AnalyzeRequestSchema = z.object({
  prompt: z.string().min(10).max(2_000),
  essay: z.string().min(1).max(12_000),
});

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`unguided:${clientKey(req)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many analysis requests. Wait about ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s) and try again.`,
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

  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prompt, essay } = parsed.data;

  const words = wordCount(essay);
  if (words < MIN_ESSAY_WORDS) {
    return NextResponse.json(
      {
        error: `Essay must be at least ${MIN_ESSAY_WORDS} words for a full analysis (currently ${words}). IELTS Task 2 penalises essays under ${MIN_ESSAY_WORDS} words.`,
      },
      { status: 400 }
    );
  }

  const provider = getProvider();

  try {
    const result = await getValidatedEssayFeedback(
      (extra) => provider.fullEssayFeedback(prompt, essay, extra),
      essay
    );
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('[unguided/analyze] provider error:', err);
    return NextResponse.json({ error: 'Failed to analyze essay' }, { status: 500 });
  }
}
