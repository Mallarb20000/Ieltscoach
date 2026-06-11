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
      return <span className="text-green-600">&#10003;</span>;
    case 'warned_pass':
      return <span className="text-yellow-500">&#9888;</span>;
    case 'in_progress':
      return (
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
      );
    case 'locked':
      return <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300" />;
  }
}

export function StageTracker({
  stages,
  currentStageId,
  onStageClick,
  canSynthesize,
  onSynthesize,
}: Props) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Progress
        </p>
        <ol className="flex flex-col gap-1.5">
          {stages.map((s, i) => {
            const isClickable = s.state === 'approved' || s.state === 'warned_pass';
            const isCurrent = s.id === currentStageId;
            return (
              <li key={s.id}>
                <button
                  onClick={() => isClickable && onStageClick(s.id)}
                  disabled={!isClickable}
                  className={[
                    'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    isCurrent ? 'bg-accent font-medium' : '',
                    isClickable ? 'hover:bg-accent cursor-pointer' : 'cursor-default',
                    s.state === 'locked' ? 'text-muted-foreground' : '',
                  ].join(' ')}
                >
                  <span className="flex w-4 items-center justify-center">
                    <StateIcon state={s.state} />
                  </span>
                  <span className="text-xs text-muted-foreground">{i + 1}.</span>
                  <span>{s.label}</span>
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
