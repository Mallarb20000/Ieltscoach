import { ZodError } from 'zod';
import type { StageInput, StageFeedback, FullEssayFeedback } from '@/lib/llm/adapter';
import { validateQuotes } from './quote-validator';

const MAX_RETRIES = 3;

// Providers occasionally return JSON that fails schema parsing (e.g. a full
// criterion name instead of TR/CC/LR/GRA). Those are retryable; network and
// API errors are not.
function formatErrorInstruction(err: unknown): string | null {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return `Previous response did not match the required JSON schema (${issues}). Return STRICTLY valid JSON matching the schema in the system prompt. rubricCriterion must be exactly one of "TR", "CC", "LR", "GRA".`;
  }
  if (err instanceof SyntaxError || (err instanceof Error && err.message.includes('No JSON object'))) {
    return 'Previous response was not valid JSON. Return STRICTLY valid JSON matching the schema in the system prompt — no prose, no markdown.';
  }
  return null;
}

export async function getValidatedFeedback(
  call: (input: StageInput, extraInstruction?: string) => Promise<StageFeedback>,
  input: StageInput
): Promise<{ feedback: StageFeedback; retries: number; validated: boolean }> {

  let lastFeedback: StageFeedback | null = null;
  let extraInstruction = '';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let feedback: StageFeedback;
    try {
      feedback = await call(input, extraInstruction);
    } catch (err) {
      const instruction = formatErrorInstruction(err);
      if (instruction === null || attempt === MAX_RETRIES - 1) throw err;
      extraInstruction = instruction;
      continue;
    }
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
    let feedback: FullEssayFeedback;
    try {
      feedback = await call(extraInstruction);
    } catch (err) {
      const instruction = formatErrorInstruction(err);
      if (instruction === null || attempt === MAX_RETRIES - 1) throw err;
      extraInstruction = instruction;
      continue;
    }
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
