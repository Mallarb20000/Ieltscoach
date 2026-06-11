import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import type { AnalysisProvider } from './adapter';

export function getProvider(): AnalysisProvider {
  const choice = process.env.DEFAULT_LLM_PROVIDER ?? 'claude';
  switch (choice) {
    case 'openai': return new OpenAIProvider();
    case 'gemini': return new GeminiProvider();
    case 'claude':
    default: return new ClaudeProvider();
  }
}
