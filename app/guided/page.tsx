'use client';

import { useEffect, useState } from 'react';
import { randomTopic } from '@/lib/topics';
import { TopicHeader } from '@/components/guided/TopicHeader';
import { StageEditor } from '@/components/guided/StageEditor';
import { FeedbackPanel } from '@/components/guided/FeedbackPanel';
import { FinalReport, type ReportSection } from '@/components/guided/FinalReport';
import { StageTracker } from '@/components/guided/StageTracker';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { StageFeedback, StageId } from '@/lib/llm/adapter';
import type { StageState, StageData } from '@/types/stages';

type SessionStages = Record<StageId, StageData>;

// Ordered list of stages that are always present
const BASE_STAGE_ORDER: StageId[] = [
  'hook',
  'bridge',
  'thesis',
  'topic-sentence-1',
  'body-paragraph-1',
  'topic-sentence-2',
  'body-paragraph-2',
  'conclusion',
  'synthesis',
];

// Extended order when the student opts in to a 3rd body paragraph
const EXTENDED_STAGE_ORDER: StageId[] = [
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
];

// All stage IDs that can ever exist (used for initialisation)
const ALL_STAGE_IDS: StageId[] = [
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
];

const STAGE_LABELS: Record<StageId, string> = {
  hook: 'Hook Sentence',
  bridge: 'Bridge',
  thesis: 'Thesis Statement',
  'topic-sentence-1': 'Topic Sentence (Body 1)',
  'body-paragraph-1': 'Body Paragraph 1',
  'topic-sentence-2': 'Topic Sentence (Body 2)',
  'body-paragraph-2': 'Body Paragraph 2',
  'topic-sentence-3': 'Topic Sentence (Body 3)',
  'body-paragraph-3': 'Body Paragraph 3',
  conclusion: 'Conclusion',
  synthesis: 'Final Synthesis',
};

const STAGE_HINTS: Record<StageId, string> = {
  hook: "Write 1–2 sentences that open your essay. Aim for 15–35 words. Use a specific statistic, counterintuitive claim, or concrete scenario — avoid openers like \"Nowadays...\" or \"In today's world...\"",
  bridge:
    'Write 1–2 sentences connecting your hook to your thesis. Aim for 10–30 words. Smooth the logical flow — no abrupt jump between your opening idea and your position.',
  thesis:
    'Write 1 sentence that states your clear position and previews your two main arguments. Aim for 25–40 words. Example: "I believe X is beneficial because of Y and Z."',
  'topic-sentence-1':
    'Write the opening sentence of Body Paragraph 1. It should introduce your FIRST main argument and link back to the thesis. Aim for 15–25 words.',
  'body-paragraph-1':
    'Develop your first argument: (1) clear claim, (2) specific example or evidence, (3) a sentence linking back to the thesis. Aim for 80–120 words.',
  'topic-sentence-2':
    'Write the opening sentence of Body Paragraph 2. It should introduce your SECOND main argument (different from Body 1) and connect to the thesis. Aim for 15–25 words.',
  'body-paragraph-2':
    'Develop your second argument: (1) clear claim, (2) specific example or evidence, (3) a sentence linking back to the thesis. Aim for 80–120 words.',
  'topic-sentence-3':
    'Write the opening sentence of Body Paragraph 3. Introduce a supporting or contrasting point not covered in Body 1 or 2. Aim for 15–25 words.',
  'body-paragraph-3':
    'Develop your third argument: (1) clear claim, (2) specific example or evidence, (3) a sentence linking back to the thesis. Aim for 80–120 words.',
  conclusion:
    'Restate your position and summarise your main points in different words. Do NOT introduce new ideas or examples. Aim for 40–60 words.',
  synthesis:
    'Your approved structure is assembled below and is now editable. Add supporting details, examples, and linking sentences in between your approved sentences, then get your final review with band score estimates (TR, CC, LR, GRA).',
};

// Soft targets only — guided stages never block on word count
const STAGE_TARGETS: Partial<Record<StageId, { min: number; max: number }>> = {
  hook: { min: 15, max: 35 },
  bridge: { min: 10, max: 30 },
  thesis: { min: 25, max: 40 },
  'topic-sentence-1': { min: 15, max: 25 },
  'body-paragraph-1': { min: 80, max: 120 },
  'topic-sentence-2': { min: 15, max: 25 },
  'body-paragraph-2': { min: 80, max: 120 },
  'topic-sentence-3': { min: 15, max: 25 },
  'body-paragraph-3': { min: 80, max: 120 },
  conclusion: { min: 40, max: 60 },
};

function initialStages(): SessionStages {
  const stages = {} as SessionStages;
  for (const id of ALL_STAGE_IDS) {
    stages[id] = {
      state: id === 'hook' ? 'in_progress' : 'locked',
      userText: '',
      feedback: null,
      turns: 0,
    };
  }
  return stages;
}

function isDone(s: StageData): boolean {
  return s.state === 'approved' || s.state === 'warned_pass';
}

function buildPriorContext(stages: SessionStages, currentStage: StageId) {
  const ctx: {
    hook?: string;
    bridge?: string;
    thesis?: string;
    topicSentences?: string[];
    bodyParagraphs?: string[];
    conclusion?: string;
  } = {};

  for (const id of ALL_STAGE_IDS) {
    if (id === currentStage) break;
    const s = stages[id];
    if (!s || !isDone(s) || !s.userText.trim()) continue;

    if (id === 'hook') ctx.hook = s.userText;
    else if (id === 'bridge') ctx.bridge = s.userText;
    else if (id === 'thesis') ctx.thesis = s.userText;
    else if (id.startsWith('topic-sentence'))
      ctx.topicSentences = [...(ctx.topicSentences ?? []), s.userText];
    else if (id.startsWith('body-paragraph'))
      ctx.bodyParagraphs = [...(ctx.bodyParagraphs ?? []), s.userText];
    else if (id === 'conclusion') ctx.conclusion = s.userText;
  }
  return ctx;
}

// Intro = hook + bridge + thesis joined as ONE paragraph
function assembleEssay(stages: SessionStages): string {
  const parts: string[] = [];

  const introParts = (['hook', 'bridge', 'thesis'] as StageId[])
    .map((id) => stages[id]?.userText.trim())
    .filter(Boolean);
  if (introParts.length > 0) parts.push(introParts.join(' '));

  for (const n of [1, 2, 3] as const) {
    const tsId = `topic-sentence-${n}` as StageId;
    const bpId = `body-paragraph-${n}` as StageId;
    const ts = stages[tsId]?.userText.trim();
    const bp = stages[bpId]?.userText.trim();
    if (ts || bp) parts.push([ts, bp].filter(Boolean).join(' '));
  }

  const conc = stages.conclusion?.userText.trim();
  if (conc) parts.push(conc);

  return parts.join('\n\n');
}

export default function GuidedPage() {
  const [topic, setTopic] = useState('');
  const [topicDraft, setTopicDraft] = useState('');
  const [topicSet, setTopicSet] = useState(false);
  const [editingTopic, setEditingTopic] = useState(false);

  const [stages, setStages] = useState<SessionStages>(initialStages);
  const [currentStageId, setCurrentStageId] = useState<StageId>('hook');
  const [hasThirdBody, setHasThirdBody] = useState(false);
  const [showBodyChoice, setShowBodyChoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warnConfirm, setWarnConfirm] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const stageOrder = hasThirdBody ? EXTENDED_STAGE_ORDER : BASE_STAGE_ORDER;
  const currentStage = stages[currentStageId];

  // Seed after mount (not in initial state) to avoid a hydration mismatch
  // from Math.random on the prerendered page
  useEffect(() => {
    setTopicDraft((prev) => (prev === '' ? randomTopic() : prev));
  }, []);

  async function handleGetFeedback() {
    const text = currentStage.userText;
    if (!text.trim()) return;

    setLoading(true);
    setFeedbackError(null);
    try {
      const res = await fetch('/api/guided/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Flaky connections are common for our users — fail to a retry banner, never hang
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          stage: currentStageId,
          prompt: topic,
          userText: text,
          priorContext:
            currentStageId === 'synthesis' ? {} : buildPriorContext(stages, currentStageId),
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error: string };
        throw new Error(body.error ?? 'Unknown error');
      }

      const { data } = (await res.json()) as { data: { feedback: StageFeedback } };
      setStages((prev) => ({
        ...prev,
        [currentStageId]: {
          ...prev[currentStageId],
          feedback: data.feedback,
          turns: prev[currentStageId].turns + 1,
        },
      }));
    } catch (err) {
      console.error('Feedback error:', err);
      setFeedbackError(
        'Could not get feedback. Check your internet connection and try again — your writing is safe.'
      );
    } finally {
      setLoading(false);
    }
  }

  function advanceToNext(fromId: StageId, newState: 'approved' | 'warned_pass') {
    // After body-paragraph-2, pause to ask about optional 3rd body
    if (fromId === 'body-paragraph-2' && !hasThirdBody) {
      setStages((prev) => ({
        ...prev,
        [fromId]: { ...prev[fromId], state: newState },
      }));
      setShowBodyChoice(true);
      return;
    }

    // Skip stages already approved/warned so revising an earlier stage
    // doesn't demote downstream work back to in_progress
    const idx = stageOrder.indexOf(fromId);
    const nextId = stageOrder.slice(idx + 1).find((id) => !isDone(stages[id])) ?? null;

    setStages((prev) => {
      const updated = { ...prev, [fromId]: { ...prev[fromId], state: newState } };
      if (nextId) {
        // Seed the synthesis draft from the approved structure only once —
        // never clobber details the user has already typed into it
        const seedSynthesis =
          nextId === 'synthesis' && prev.synthesis.userText.trim() === '';
        updated[nextId] = {
          ...prev[nextId],
          state: 'in_progress',
          userText: seedSynthesis ? assembleEssay(updated) : prev[nextId].userText,
        };
      }
      return updated;
    });
    if (nextId) setCurrentStageId(nextId);
  }

  function handleApprove() {
    advanceToNext(currentStageId, 'approved');
  }

  function handleContinueAnyway() {
    setWarnConfirm(true);
  }

  function confirmContinueAnyway() {
    setWarnConfirm(false);
    advanceToNext(currentStageId, 'warned_pass');
  }

  function handleStageClick(id: StageId) {
    setStages((prev) => ({ ...prev, [id]: { ...prev[id], state: 'in_progress' } }));
    setCurrentStageId(id);
    setWarnConfirm(false);
    setShowBodyChoice(false);
    setFeedbackError(null);
  }

  function addThirdBody() {
    setHasThirdBody(true);
    setShowBodyChoice(false);
    setStages((prev) => ({
      ...prev,
      'topic-sentence-3': { ...prev['topic-sentence-3'], state: 'in_progress' },
    }));
    setCurrentStageId('topic-sentence-3');
  }

  function skipToConclusion() {
    setShowBodyChoice(false);
    setStages((prev) => ({
      ...prev,
      conclusion: { ...prev.conclusion, state: 'in_progress' },
    }));
    setCurrentStageId('conclusion');
  }

  const canSynthesize = stageOrder
    .filter((id) => id !== 'synthesis')
    .every((id) => isDone(stages[id]));

  const anyStageApproved = ALL_STAGE_IDS.some((id) => isDone(stages[id]));

  const trackerStages = stageOrder.map((id) => ({
    id,
    label: STAGE_LABELS[id],
    state: stages[id].state,
  }));

  const stageNumber = stageOrder.indexOf(currentStageId) + 1;

  if (!topicSet) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold">Start a new session</h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Here is a real Task 2 question to practise with. Try another, or replace it with your
            own question.
          </p>
          <Textarea
            value={topicDraft}
            onChange={(e) => setTopicDraft(e.target.value)}
            placeholder="Paste the IELTS Writing Task 2 question you are working on..."
            className="min-h-[100px] text-sm"
          />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="sm:w-40"
              onClick={() => setTopicDraft(randomTopic(topicDraft))}
            >
              Try another
            </Button>
            <Button
              className="flex-1"
              disabled={topicDraft.trim().length < 10}
              onClick={() => {
                setTopic(topicDraft.trim());
                setTopicSet(true);
              }}
            >
              Start writing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (editingTopic) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold">Edit prompt</h1>
          <Textarea
            value={topicDraft || topic}
            onChange={(e) => setTopicDraft(e.target.value)}
            className="min-h-[100px] text-sm"
          />
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                setTopic((topicDraft || topic).trim());
                setEditingTopic(false);
              }}
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setEditingTopic(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopicHeader
        topic={topic}
        canEdit={!anyStageApproved}
        onEdit={() => {
          setTopicDraft(topic);
          setEditingTopic(true);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-5">
            {feedbackError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm">
                <p className="text-red-900">{feedbackError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={handleGetFeedback}
                  disabled={loading}
                >
                  {loading ? 'Retrying...' : 'Retry'}
                </Button>
              </div>
            )}
            {showBodyChoice ? (
              <BodyChoicePanel onAddThird={addThirdBody} onSkip={skipToConclusion} />
            ) : currentStageId === 'synthesis' ? (
              <SynthesisPanel
                feedback={currentStage.feedback}
                sections={stageOrder
                  .filter((id) => id !== 'synthesis')
                  .map((id) => ({ id, label: STAGE_LABELS[id], text: stages[id].userText }))}
                draft={currentStage.userText}
                onDraftChange={(v) =>
                  setStages((prev) => ({
                    ...prev,
                    synthesis: { ...prev.synthesis, userText: v, feedback: null },
                  }))
                }
                onReloadStructure={() =>
                  setStages((prev) => ({
                    ...prev,
                    synthesis: { ...prev.synthesis, userText: assembleEssay(prev), feedback: null },
                  }))
                }
                loading={loading}
                turns={currentStage.turns}
                onGetSynthesis={handleGetFeedback}
              />
            ) : (
              <>
                <StageEditor
                  stageLabel={STAGE_LABELS[currentStageId]}
                  stageNumber={stageNumber}
                  totalStages={stageOrder.length}
                  hint={STAGE_HINTS[currentStageId]}
                  value={currentStage.userText}
                  onChange={(v) =>
                    setStages((prev) => ({
                      ...prev,
                      [currentStageId]: { ...prev[currentStageId], userText: v, feedback: null },
                    }))
                  }
                  onGetFeedback={handleGetFeedback}
                  onApprove={handleApprove}
                  onContinueAnyway={handleContinueAnyway}
                  feedback={currentStage.feedback}
                  loading={loading}
                  turns={currentStage.turns}
                  targetWordCount={STAGE_TARGETS[currentStageId]}
                />

                {warnConfirm && (
                  <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm">
                    <p className="font-medium text-yellow-900">
                      This section needs improvement and may affect your final band score. Proceed
                      anyway?
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="destructive" onClick={confirmContinueAnyway}>
                        Yes, continue anyway
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setWarnConfirm(false)}>
                        Go back and improve
                      </Button>
                    </div>
                  </div>
                )}

                {currentStage.feedback && !warnConfirm && (
                  <FeedbackPanel
                    feedback={currentStage.feedback}
                    userText={currentStage.userText}
                  />
                )}
              </>
            )}
          </div>
        </main>

        <aside className="w-56 shrink-0 overflow-y-auto border-l">
          <StageTracker
            stages={trackerStages}
            currentStageId={currentStageId}
            onStageClick={handleStageClick}
            canSynthesize={canSynthesize}
            onSynthesize={() => {
              setCurrentStageId('synthesis');
              setStages((prev) => ({
                ...prev,
                synthesis: {
                  ...prev.synthesis,
                  state: 'in_progress',
                  userText:
                    prev.synthesis.userText.trim() === ''
                      ? assembleEssay(prev)
                      : prev.synthesis.userText,
                },
              }));
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function BodyChoicePanel({
  onAddThird,
  onSkip,
}: {
  onAddThird: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-1 text-base font-semibold">Body paragraphs complete</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        You have two body paragraphs. IELTS Task 2 essays typically need two strong body paragraphs
        to reach Band 7. A third is optional — add one if you have a strong additional argument.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onAddThird} variant="outline" className="flex-1">
          Add 3rd Body Paragraph
        </Button>
        <Button onClick={onSkip} className="flex-1">
          Continue to Conclusion
        </Button>
      </div>
    </div>
  );
}

const MAX_TURNS = 3;

interface SynthesisPanelProps {
  feedback: StageFeedback | null;
  sections: ReportSection[];
  draft: string;
  onDraftChange: (v: string) => void;
  onReloadStructure: () => void;
  loading: boolean;
  turns: number;
  onGetSynthesis: () => void;
}

function SynthesisPanel({
  feedback,
  sections,
  draft,
  onDraftChange,
  onReloadStructure,
  loading,
  turns,
  onGetSynthesis,
}: SynthesisPanelProps) {
  const turnsExhausted = turns >= MAX_TURNS;
  const essayWordCount = draft.trim() === '' ? 0 : draft.trim().split(/\s+/).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border bg-card p-5">
        <div className="mb-3">
          <span className="text-xs text-muted-foreground">Final stage</span>
          <h2 className="text-base font-semibold">Final Synthesis</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">{STAGE_HINTS.synthesis}</p>

        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Your approved structure will appear here..."
          className="min-h-[280px] text-sm"
          disabled={loading}
        />

        <p
          className={`mt-2 text-xs ${essayWordCount < 250 ? 'font-medium text-amber-600' : 'text-muted-foreground'}`}
        >
          {essayWordCount} words
          {essayWordCount < 250 &&
            ' — IELTS Task 2 requires at least 250 words; shorter essays lose Task Response marks'}
        </p>

        {turnsExhausted && (
          <p className="mt-2 text-xs text-destructive">
            You have used all {MAX_TURNS} synthesis turns for this session.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={onGetSynthesis}
            disabled={loading || turnsExhausted || !draft.trim()}
            size="sm"
          >
            {loading ? 'Analysing...' : `Get Synthesis (${turns}/${MAX_TURNS})`}
          </Button>
          <Button onClick={onReloadStructure} variant="outline" size="sm" disabled={loading}>
            Reset to approved structure
          </Button>
        </div>
      </div>

      {feedback && <FinalReport draft={draft} sections={sections} feedback={feedback} />}
    </div>
  );
}
