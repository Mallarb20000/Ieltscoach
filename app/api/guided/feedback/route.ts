import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProvider } from '@/lib/llm/select';
import { getValidatedFeedback } from '@/lib/validation/retry';
import type { StageInput } from '@/lib/llm/adapter';

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
  prompt: z.string().min(1),
  userText: z.string().min(1),
  priorContext: z.object({
    hook: z.string().optional(),
    thesis: z.string().optional(),
    bridge: z.string().optional(),
    topicSentences: z.array(z.string()).optional(),
    bodyParagraphs: z.array(z.string()).optional(),
    conclusion: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
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
