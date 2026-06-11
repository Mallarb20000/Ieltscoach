import type { AnalysisProvider, StageInput, StageFeedback, FullEssayFeedback } from './adapter';

export class OpenAIProvider implements AnalysisProvider {
  readonly name = 'openai';

  async guidedFeedback(_input: StageInput): Promise<StageFeedback> {
    throw new Error('OpenAIProvider not implemented yet');
  }

  async fullEssayFeedback(_prompt: string, _essay: string): Promise<FullEssayFeedback> {
    throw new Error('OpenAIProvider not implemented yet');
  }
}
