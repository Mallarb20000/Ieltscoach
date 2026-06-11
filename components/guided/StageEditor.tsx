'use client';

import { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { StageFeedback } from '@/lib/llm/adapter';

const MAX_TURNS = 8;

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
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const count = wordCount(value);
  const turnsExhausted = turns >= MAX_TURNS;

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
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <span className="text-xs text-muted-foreground">
            Stage {stageNumber} of {totalStages}
          </span>
          <h2 className="text-base font-semibold">{stageLabel}</h2>
        </div>
        <span className="text-xs text-muted-foreground">{count} words</span>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{hint}</p>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write here..."
        className="min-h-[80px] resize-none overflow-hidden text-sm"
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
