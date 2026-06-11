'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setDeleting(true);
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (error) {
      console.error('Delete report error:', error.message);
      setDeleting(false);
      setConfirming(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete permanently'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={deleting}>
          Keep
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
      Delete report
    </Button>
  );
}
