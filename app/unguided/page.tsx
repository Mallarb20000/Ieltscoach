'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EssayAnalysis } from '@/components/unguided/EssayAnalysis';
import { SaveReportStatus, type SaveState } from '@/components/shared/SaveReportStatus';
import { saveReport } from '@/lib/reports';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { useUser } from '@/lib/auth/use-user';
import type { FullEssayFeedback } from '@/lib/llm/adapter';

const MIN_ESSAY_WORDS = 250;

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export default function UnguidedPage() {
  const [prompt, setPrompt] = useState('');
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullEssayFeedback | null>(null);
  const { user } = useUser();
  const [saveState, setSaveState] = useState<SaveState | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  const words = wordCount(essay);
  const tooShort = words > 0 && words < MIN_ESSAY_WORDS;
  const canSubmit = prompt.trim().length >= 10 && words >= MIN_ESSAY_WORDS && !loading;

  async function persistReport(feedback: FullEssayFeedback, essayText: string) {
    if (!isSupabaseConfigured()) return;
    if (!user) {
      setSaveState('guest');
      return;
    }
    setSaveState('saving');
    try {
      const saved = await saveReport(
        {
          mode: 'unguided',
          topic: prompt.trim(),
          essay: essayText,
          wordCount: wordCount(essayText),
          bands: feedback.bands,
          feedback,
        },
        savedReportId
      );
      if (saved) {
        setSavedReportId(saved.id);
        setSaveState('saved');
      }
    } catch (err) {
      console.error('Save report error:', err);
      setSaveState('error');
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/unguided/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Flaky connections are common for our users — fail to a retry banner, never hang
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({ prompt: prompt.trim(), essay }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if ((res.status === 429 || res.status === 400) && body.error) {
          setError(body.error);
          return;
        }
        throw new Error(body.error ?? 'Unknown error');
      }

      const { data } = (await res.json()) as { data: { feedback: FullEssayFeedback } };
      setResult(data.feedback);
      void persistReport(data.feedback, essay);
    } catch (err) {
      console.error('Analyze error:', err);
      setError(
        'Could not analyze your essay. Check your internet connection and try again — your essay is safe.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <div className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Unguided mode
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Full Essay Analysis</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Paste a complete IELTS Writing Task 2 essay to get band score estimates and
            paragraph-by-paragraph feedback.
          </p>
        </div>

        <div className="animate-rise rise-1 rounded-xl border bg-card p-6 shadow-sm">
          <label className="mb-1 block text-sm font-medium">Task 2 question</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Some people believe that universities should focus on providing academic knowledge, while others argue they should prepare students for the working world. Discuss both views and give your own opinion."
            className="min-h-[80px] text-sm"
            disabled={loading}
          />

          <div className="mt-4 mb-1 flex items-baseline justify-between">
            <label className="block text-sm font-medium">Your essay</label>
            <span
              className={`text-xs ${tooShort ? 'font-medium text-amber-600' : 'text-muted-foreground'}`}
            >
              {words} words (minimum {MIN_ESSAY_WORDS})
            </span>
          </div>
          <Textarea
            value={essay}
            onChange={(e) => {
              setEssay(e.target.value);
              setResult(null);
              setSaveState(null);
            }}
            placeholder="Paste or type your full essay here..."
            className="min-h-[260px] font-serif text-[15px] leading-7"
            disabled={loading}
          />

          {tooShort && (
            <p className="mt-2 text-xs text-amber-600">
              Essays under {MIN_ESSAY_WORDS} words are penalised in IELTS and cannot be analyzed
              here. Add {MIN_ESSAY_WORDS - words} more words.
            </p>
          )}

          <Button className="mt-4" onClick={handleAnalyze} disabled={!canSubmit}>
            {loading ? 'Analyzing...' : 'Analyze Essay'}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm">
            <p className="text-red-900">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        )}

        {result && saveState && (
          <SaveReportStatus
            state={saveState}
            onRetry={() => result && persistReport(result, essay)}
          />
        )}

        {result && <EssayAnalysis result={result} />}
      </div>
    </div>
  );
}
