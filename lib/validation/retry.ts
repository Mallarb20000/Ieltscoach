import type { StageInput, StageFeedback } from '@/lib/llm/adapter';
import { validateQuotes } from './quote-validator';

const MAX_RETRIES = 3;

export async function getValidatedFeedback(
  call: (input: StageInput, extraInstruction?: string) => Promise<StageFeedback>,
  input: StageInput
): Promise<{ feedback: StageFeedback; retries: number; validated: boolean }> {

  let lastFeedback: StageFeedback | null = null;
  let extraInstruction = '';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const feedback = await call(input, extraInstruction);
    const { valid, invalidQuotes } = validateQuotes(input.userText, feedback.findings);

    if (valid) {
      return { feedback, retries: attempt, validated: true };
    }

    lastFeedback = feedback;
    extraInstruction = `Previous response had quotes not found in the user's text: ${
      JSON.stringify(invalidQuotes)
    }. Every evidenceQuote MUST be a verbatim substring of the user's text. Re-check each quote.`;
  }

  const filteredFindings = lastFeedback!.findings.filter(f =>
    validateQuotes(input.userText, [f]).valid
  );

  return {
    feedback: { ...lastFeedback!, findings: filteredFindings },
    retries: MAX_RETRIES,
    validated: false,
  };
}
