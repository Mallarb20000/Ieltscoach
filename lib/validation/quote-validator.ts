import type { Finding } from '@/lib/llm/adapter';

export interface QuoteValidationResult {
  valid: boolean;
  invalidQuotes: string[];
}

/**
 * Returns valid=true only if every Finding's evidenceQuote
 * is a substring of the user's text.
 * Whitespace-normalized comparison (collapses multiple spaces).
 */
export function validateQuotes(
  userText: string,
  findings: Finding[]
): QuoteValidationResult {
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const haystack = normalize(userText);
  const invalid: string[] = [];

  for (const f of findings) {
    const needle = normalize(f.evidenceQuote);
    if (needle.length === 0) continue;
    if (!haystack.includes(needle)) {
      invalid.push(f.evidenceQuote);
    }
  }

  return { valid: invalid.length === 0, invalidQuotes: invalid };
}
