'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  topic: string;
  canEdit: boolean;
  onEdit: () => void;
}

export function TopicHeader({ topic, canEdit, onEdit }: Props) {
  return (
    <div className="sticky top-0 z-10 border-b bg-background px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            IELTS Writing Task 2 Prompt
          </p>
          <p className="mt-1 text-sm leading-snug">{topic}</p>
        </div>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0">
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
