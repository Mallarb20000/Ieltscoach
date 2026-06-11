'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { FullEssayFeedback, Finding } from '@/lib/llm/adapter';

const MIN_ESSAY_WORDS = 250;

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

const criterionLabels: Record<Finding['rubricCriterion'], string> = {
  TR: 'Task Response',
  CC: 'Coherence & Cohesion',
  LR: 'Lexical Resource',
  GRA: 'Grammatical Range',
};

export default function UnguidedPage() {
  const [prompt, setPrompt] = useState('');
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullEssayFeedback | null>(null);

  const words = wordCount(essay);
  const tooShort = words > 0 && words < MIN_ESSAY_WORDS;
  const canSubmit = prompt.trim().length >= 10 && words >= MIN_ESSAY_WORDS && !loading;

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
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Unknown error');
      }

      const { data } = (await res.json()) as { data: { feedback: FullEssayFeedback } };
      setResult(data.feedback);
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

        {result && <AnalysisResult result={result} />}
      </div>
    </div>
  );
}

function AnalysisResult({ result }: { result: FullEssayFeedback }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="animate-rise rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-semibold">Band Score Estimates</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['TR', 'CC', 'LR', 'GRA'] as const).map((criterion) => (
            <div key={criterion} className="rounded-lg border p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground">{criterion}</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {result.bands[criterion].toFixed(1)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-primary p-4 text-center text-primary-foreground">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">
            Overall Estimate
          </p>
          <p className="mt-1 font-display text-4xl font-semibold">
            {result.bands.overall.toFixed(1)}
          </p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          These are AI estimates only — not official IELTS scores. Verify with a qualified
          examiner.
        </p>
      </div>

      {result.topImprovements.length > 0 && (
        <div className="animate-rise rise-1 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-3 font-display text-lg font-semibold">Top Improvements</h2>
          <ol className="flex flex-col gap-2">
            {result.topImprovements.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {i + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="animate-rise rise-2 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-semibold">Paragraph Feedback</h2>
        <div className="flex flex-col gap-6">
          {result.paragraphFeedback.map((pf, i) => (
            <div key={i}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                Paragraph {i + 1}
              </p>
              <p className="mb-2.5 rounded-md border-l-2 border-l-primary/30 bg-muted/40 p-3 font-serif text-sm leading-7">
                {pf.paragraph}
              </p>
              {pf.findings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No issues found.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {pf.findings.map((f, j) => (
                    <div
                      key={j}
                      className={`rounded-md border border-l-2 bg-muted/30 p-3 text-sm ${
                        f.severity === 'major' ? 'border-l-destructive/50' : 'border-l-primary/30'
                      }`}
                    >
                      <p className="mb-1 font-serif italic text-muted-foreground">
                        "{f.evidenceQuote}"
                      </p>
                      <p className="font-medium">{f.issue}</p>
                      <p className="mt-0.5 text-muted-foreground">{f.suggestion}</p>
                      <div className="mt-2 flex gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {criterionLabels[f.rubricCriterion]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${f.severity === 'major' ? 'border-red-300 text-red-700' : 'border-gray-300'}`}
                        >
                          {f.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Verify any statistics or claims in suggestions before applying them.
        </p>
      </div>
    </div>
  );
}
