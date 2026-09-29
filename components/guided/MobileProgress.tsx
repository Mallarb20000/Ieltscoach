'use client';

import { Button } from '@/components/ui/button';
import type { StageId } from '@/lib/llm/adapter';
import type { StageState } from '@/types/stages';

interface StageEntry {
  id: StageId;
  label: string;
  state: StageState;
}

interface Props {
  stages: StageEntry[];
  currentStageId: StageId;
  onStageClick: (id: StageId) => void;
  canSynthesize: boolean;
  onSynthesize: () => void;
}

export function MobileProgress({
  stages,
  currentStageId,
  onStageClick,
  canSynthesize,
  onSynthesize,
}: Props) {
  const currentIndex = stages.findIndex((s) => s.id === currentStageId);
  const currentLabel = stages[currentIndex]?.label ?? 'Final Synthesis';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">
          <span className="text-muted-foreground">
            {currentIndex >= 0 ? `${currentIndex + 1}/${stages.length} · ` : ''}
          </span>
          {currentLabel}
        </p>
        <div className="mt-1.5 flex items-center gap-1">
          {stages.map((s) => {
            const done = s.state === 'approved' || s.state === 'warned_pass';
            const isCurrent = s.id === currentStageId;
            const isClickable =
              !isCurrent && (s.state !== 'locked' || (s.id === 'synthesis' && canSynthesize));
            return (
              <button
                key={s.id}
                aria-label={s.label}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => isClickable && onStageClick(s.id)}
                disabled={!isClickable}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isCurrent
                    ? 'bg-primary/40 ring-1 ring-primary'
                    : done
                      ? s.state === 'warned_pass'
                        ? 'bg-amber-400'
                        : 'bg-primary'
                      : s.state === 'in_progress'
                        ? 'bg-primary/30'
                        : 'bg-secondary'
                }`}
              />
            );
          })}
        </div>
      </div>
      <Button size="sm" onClick={onSynthesize} disabled={!canSynthesize} className="shrink-0">
        Synthesis
      </Button>
    </div>
  );
}
