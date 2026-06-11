export type StageId =
  | 'hook'
  | 'bridge'
  | 'thesis'
  | 'topic-sentence-1'
  | 'body-paragraph-1'
  | 'topic-sentence-2'
  | 'body-paragraph-2'
  | 'topic-sentence-3'
  | 'body-paragraph-3'
  | 'conclusion'
  | 'synthesis';

export interface StageInput {
  stage: StageId;
  prompt: string;
  userText: string;
  priorContext: {
    hook?: string;
    thesis?: string;
    bridge?: string;
    topicSentences?: string[];
    bodyParagraphs?: string[];
    conclusion?: string;
  };
}

export interface StageFeedback {
  rating: 'strong' | 'okay' | 'needs_improvement';
  summary: string;
  findings: Finding[];
  rewriteExample?: string;
  bands?: { TR: number; CC: number; LR: number; GRA: number; overall: number };
  topImprovements?: string[];
  meta: {
    wordCount: number;
    targetWordCount?: { min: number; max: number };
  };
}

export interface Finding {
  evidenceQuote: string;
  issue: string;
  suggestion: string;
  severity: 'minor' | 'major';
  rubricCriterion: 'TR' | 'CC' | 'LR' | 'GRA';
}

export interface AnalysisProvider {
  name: string;
  guidedFeedback(input: StageInput, extraInstruction?: string): Promise<StageFeedback>;
  fullEssayFeedback(prompt: string, essay: string, extraInstruction?: string): Promise<FullEssayFeedback>;
}

export interface FullEssayFeedback {
  bands: { TR: number; CC: number; LR: number; GRA: number; overall: number };
  paragraphFeedback: Array<{ paragraph: string; findings: Finding[] }>;
  topImprovements: string[];
}
