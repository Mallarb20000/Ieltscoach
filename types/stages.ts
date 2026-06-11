import type { StageId, StageFeedback } from '@/lib/llm/adapter';

export type StageState = 'locked' | 'in_progress' | 'approved' | 'warned_pass';

export interface StageData {
  state: StageState;
  userText: string;
  feedback: StageFeedback | null;
  turns: number;
}

export interface SessionState {
  topic: string;
  stages: Record<StageId, StageData>;
  currentStageId: StageId;
}
