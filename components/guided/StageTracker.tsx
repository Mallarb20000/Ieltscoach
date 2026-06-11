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

function StateIcon({ state }: { state: StageState }) {
  switch (state) {
    case 'approved':
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          &#10003;
        </span>
      );
    case 'warned_pass':
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-600 ring-1 ring-amber-300">
          !
        </span>
      );
    case 'in_progress':
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-card ring-2 ring-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        </span>
      );
    case 'locked':
      return <span className="h-5 w-5 rounded-full bg-card ring-1 ring-border" />;
  }
}

export function StageTracker({
  stages,
  currentStageId,
  onStageClick,
  canSynthesize,
  onSynthesize,
}: Props) {
  const doneCount = stages.filter(
    (s) => s.state === 'approved' || s.state === 'warned_pass'
  ).length;
  const progress = Math.round((doneCount / stages.length) * 100);

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Progress
          </p>
          <span className="font-display text-xs font-semibold text-primary">
            {doneCount}/{stages.length}
          </span>
        </div>
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="relative flex flex-col">
          <span
            aria-hidden
            className="absolute bottom-4 left-[1.125rem] top-4 w-px bg-border"
          />
          {stages.map((s) => {
            const isClickable = s.state === 'approved' || s.state === 'warned_pass';
            const isCurrent = s.id === currentStageId;
            return (
              <li key={s.id}>
                <button
                  onClick={() => isClickable && onStageClick(s.id)}
                  disabled={!isClickable}
                  className={[
                    'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-200',
                    isCurrent ? 'bg-accent font-medium text-accent-foreground' : '',
                    isClickable ? 'cursor-pointer hover:bg-secondary' : 'cursor-default',
                    s.state === 'locked' ? 'text-muted-foreground/70' : '',
                  ].join(' ')}
                >
                  <span className="relative z-10 flex shrink-0 items-center justify-center">
                    <StateIcon state={s.state} />
                  </span>
                  <span className="truncate">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <Button
        onClick={onSynthesize}
        disabled={!canSynthesize}
        size="sm"
        className="mt-6 w-full"
      >
        Final Synthesis
      </Button>
    </div>
  );
}
