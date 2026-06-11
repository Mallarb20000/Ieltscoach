'use client';

import { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { StageFeedback } from '@/lib/llm/adapter';

const MAX_TURNS = 3;

interface Props {
  stageLabel: string;
  stageNumber: number;
  totalStages: number;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  onGetFeedback: () => void;
  onApprove: () => void;
  onContinueAnyway: () => void;
  feedback: StageFeedback | null | undefined;
  loading: boolean;
  turns: number;
  targetWordCount?: { min: number; max: number };
}

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export function StageEditor({
  stageLabel,
  stageNumber,
  totalStages,
  hint,
  value,
  onChange,
  onGetFeedback,
  onApprove,
  onContinueAnyway,
  feedback,
  loading,
  turns,
  targetWordCount,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const count = wordCount(value);
  const turnsExhausted = turns >= MAX_TURNS;
  const outsideTarget =
    targetWordCount != null &&
    count > 0 &&
    (count < targetWordCount.min || count > targetWordCount.max);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const canApprove =
    feedback != null && (feedback.rating === 'strong' || feedback.rating === 'okay');
  const showContinueAnyway = feedback?.rating === 'needs_improvement';

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Stage {stageNumber} of {totalStages}
          </span>
          <h2 className="mt-0.5 font-display text-xl font-semibold">{stageLabel}</h2>
        </div>
        <span
          className={`text-xs ${outsideTarget ? 'font-medium text-amber-600' : 'text-muted-foreground'}`}
        >
          {count} words
          {targetWordCount && ` (target ${targetWordCount.min}–${targetWordCount.max})`}
        </span>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{hint}</p>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write here..."
        className="min-h-[88px] resize-none overflow-hidden font-serif text-[15px] leading-7"
        disabled={loading}
      />

      {turnsExhausted && (
        <p className="mt-2 text-xs text-destructive">
          You have used all {MAX_TURNS} feedback turns for this stage. Approve, override, or revise
          without feedback.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={onGetFeedback}
          disabled={loading || turnsExhausted || value.trim() === ''}
          size="sm"
        >
          {loading ? 'Getting feedback...' : `Get Feedback (${turns}/${MAX_TURNS})`}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onApprove}
          disabled={!canApprove}
        >
          Approve &amp; Continue
        </Button>

        {showContinueAnyway && (
          <Button variant="outline" size="sm" onClick={onContinueAnyway}>
            Continue Anyway
          </Button>
        )}
      </div>
    </div>
  );
}
