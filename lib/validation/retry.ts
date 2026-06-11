import type { StageInput, StageFeedback, FullEssayFeedback } from '@/lib/llm/adapter';
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

export async function getValidatedEssayFeedback(
  call: (extraInstruction?: string) => Promise<FullEssayFeedback>,
  essay: string
): Promise<{ feedback: FullEssayFeedback; retries: number; validated: boolean }> {

  let lastFeedback: FullEssayFeedback | null = null;
  let extraInstruction: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const feedback = await call(extraInstruction);
    const allFindings = feedback.paragraphFeedback.flatMap(p => p.findings);
    const { valid, invalidQuotes } = validateQuotes(essay, allFindings);

    if (valid) {
      return { feedback, retries: attempt, validated: true };
    }

    lastFeedback = feedback;
    extraInstruction = `Previous response had quotes not found in the user's essay: ${
      JSON.stringify(invalidQuotes)
    }. Every evidenceQuote MUST be a verbatim substring of the user's essay. Re-check each quote.`;
  }

  const filteredParagraphs = lastFeedback!.paragraphFeedback.map(p => ({
    ...p,
    findings: p.findings.filter(f => validateQuotes(essay, [f]).valid),
  }));

  return {
    feedback: { ...lastFeedback!, paragraphFeedback: filteredParagraphs },
    retries: MAX_RETRIES,
    validated: false,
  };
}
