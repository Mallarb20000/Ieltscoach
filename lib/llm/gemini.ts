import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { AnalysisProvider, StageInput, StageFeedback, FullEssayFeedback } from './adapter';
import { StageFeedbackSchema } from '@/lib/validation/schemas';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const MODEL_ID = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';

function loadPrompt(relativePath: string): string {
  return readFileSync(join(process.cwd(), 'prompts', relativePath), 'utf-8');
}

function loadRubric(): string {
  return loadPrompt('_shared/ielts-rubric.md');
}

function loadStagePrompt(stage: StageInput['stage']): string {
  if (stage.startsWith('topic-sentence')) return loadPrompt('guided/topic-sentence.md');
  if (stage.startsWith('body-paragraph')) return loadPrompt('guided/body-paragraph.md');
  return loadPrompt(`guided/${stage}.md`);
}

const STAGE_DESCRIPTIONS: Partial<Record<StageInput['stage'], string>> = {
  'topic-sentence-1': 'topic sentence for Body Paragraph 1 (first body paragraph)',
  'topic-sentence-2': 'topic sentence for Body Paragraph 2 (second body paragraph)',
  'topic-sentence-3': 'topic sentence for Body Paragraph 3 (third body paragraph)',
  'body-paragraph-1': 'Body Paragraph 1',
  'body-paragraph-2': 'Body Paragraph 2',
  'body-paragraph-3': 'Body Paragraph 3',
};

function buildUserMessage(input: StageInput, extraInstruction?: string): string {
  const priorLines: string[] = [];
  if (input.priorContext.hook) priorLines.push(`Hook: ${input.priorContext.hook}`);
  if (input.priorContext.bridge) priorLines.push(`Bridge: ${input.priorContext.bridge}`);
  if (input.priorContext.thesis) priorLines.push(`Thesis: ${input.priorContext.thesis}`);
  if (input.priorContext.topicSentences?.length) {
    input.priorContext.topicSentences.forEach((ts, i) => {
      priorLines.push(`Topic sentence (Body ${i + 1}): ${ts}`);
    });
  }
  if (input.priorContext.bodyParagraphs?.length) {
    input.priorContext.bodyParagraphs.forEach((bp, i) => {
      priorLines.push(`Body Paragraph ${i + 1}:\n${bp}`);
    });
  }
  if (input.priorContext.conclusion) priorLines.push(`Conclusion: ${input.priorContext.conclusion}`);

  const stageLabel = STAGE_DESCRIPTIONS[input.stage] ?? input.stage;
  const parts = [
    `IELTS Task 2 prompt: ${input.prompt}`,
    `Student's ${stageLabel}: ${input.userText}`,
  ];
  if (priorLines.length > 0) {
    parts.push(`Prior approved sections:\n${priorLines.join('\n')}`);
  }
  if (extraInstruction) {
    parts.push(`CORRECTION REQUIRED: ${extraInstruction}`);
  }

  return parts.join('\n\n');
}

function parseJsonResponse(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in response');
  return JSON.parse(match[0]);
}

export class GeminiProvider implements AnalysisProvider {
  readonly name = 'gemini';

  async guidedFeedback(input: StageInput, extraInstruction?: string): Promise<StageFeedback> {
    const rubric = loadRubric();
    const stagePrompt = loadStagePrompt(input.stage);
    const systemInstruction = `${rubric}\n\n---\n\n${stagePrompt}`;
    const userMessage = buildUserMessage(input, extraInstruction);

    const model = genai.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction,
    });

    const result = await model.generateContent(userMessage);
    const raw = result.response.text();

    const parsed = parseJsonResponse(raw);
    return StageFeedbackSchema.parse(parsed);
  }

  async fullEssayFeedback(_prompt: string, _essay: string): Promise<FullEssayFeedback> {
    throw new Error('fullEssayFeedback not implemented yet');
  }
}
