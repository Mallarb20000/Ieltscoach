'use client';

import { FeedbackPanel } from '@/components/guided/FeedbackPanel';
import { Button } from '@/components/ui/button';
import type { StageFeedback } from '@/lib/llm/adapter';

export interface ReportSection {
  id: string;
  label: string;
  text: string;
}

interface Props {
  topic: string;
  draft: string;
  sections: ReportSection[];
  feedback: StageFeedback;
}

const SECTION_COLORS: Record<string, { highlight: string; swatch: string }> = {
  hook: { highlight: 'bg-amber-100/70', swatch: 'bg-amber-300' },
  bridge: { highlight: 'bg-orange-100/70', swatch: 'bg-orange-300' },
  thesis: { highlight: 'bg-rose-100/70', swatch: 'bg-rose-300' },
  'topic-sentence-1': { highlight: 'bg-sky-200/60', swatch: 'bg-sky-400' },
  'body-paragraph-1': { highlight: 'bg-sky-100/60', swatch: 'bg-sky-300' },
  'topic-sentence-2': { highlight: 'bg-emerald-200/60', swatch: 'bg-emerald-400' },
  'body-paragraph-2': { highlight: 'bg-emerald-100/60', swatch: 'bg-emerald-300' },
  'topic-sentence-3': { highlight: 'bg-violet-200/60', swatch: 'bg-violet-400' },
  'body-paragraph-3': { highlight: 'bg-violet-100/60', swatch: 'bg-violet-300' },
  conclusion: { highlight: 'bg-stone-200/70', swatch: 'bg-stone-400' },
};

interface Segment {
  text: string;
  section: ReportSection | null;
}

// Turnitin-style matching: each approved section is located verbatim in the
// final draft and highlighted; text the student added while editing stays
// neutral. A section the student rewrote in the draft simply will not match.
function segmentDraft(draft: string, sections: ReportSection[]): Segment[] {
  let segments: Segment[] = [{ text: draft, section: null }];

  for (const section of sections) {
    const needle = section.text.trim();
    if (needle === '') continue;

    const next: Segment[] = [];
    let matched = false;
    for (const seg of segments) {
      if (seg.section !== null || matched) {
        next.push(seg);
        continue;
      }
      const idx = seg.text.indexOf(needle);
      if (idx === -1) {
        next.push(seg);
        continue;
      }
      matched = true;
      if (idx > 0) next.push({ text: seg.text.slice(0, idx), section: null });
      next.push({ text: needle, section });
      const rest = seg.text.slice(idx + needle.length);
      if (rest !== '') next.push({ text: rest, section: null });
    }
    segments = next;
  }

  return segments;
}

export function FinalReport({ topic, draft, sections, feedback }: Props) {
  const segments = segmentDraft(draft, sections);
  const matchedIds = new Set(
    segments.filter((s) => s.section !== null).map((s) => s.section!.id)
  );

  return (
    <div data-final-report className="flex flex-col gap-5">
      <div className="hidden border-b pb-4 print:block">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-2xl font-semibold">Final Report</p>
          <p className="text-xs text-muted-foreground">
            IELTS Writing Coach &middot;{' '}
            {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Task 2 question
        </p>
        <p className="mt-1 font-serif text-sm leading-6">{topic}</p>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <h3 className="font-display text-lg font-semibold">Final Report</h3>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          Download PDF
        </Button>
      </div>
      {feedback.bands && (
        <div className="animate-rise rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-0 print:p-0 print:shadow-none">
          <h3 className="mb-4 font-display text-lg font-semibold">Band Score Estimates</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['TR', 'CC', 'LR', 'GRA'] as const).map((criterion) => (
              <div key={criterion} className="rounded-lg border p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">{criterion}</p>
                <p className="mt-1 font-display text-2xl font-semibold">
                  {feedback.bands![criterion].toFixed(1)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-primary p-4 text-center text-primary-foreground">
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">
              Overall Estimate
            </p>
            <p className="mt-1 font-display text-4xl font-semibold">
              {feedback.bands.overall.toFixed(1)}
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            These are AI estimates only — not official IELTS scores. Verify with a qualified
            examiner.
          </p>
        </div>
      )}

      <div className="animate-rise rise-1 rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-0 print:p-0 print:shadow-none">
        <h3 className="mb-1 font-display text-lg font-semibold">Your Essay</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Highlights show your approved structure. Unhighlighted text is detail you added during
          final editing.
        </p>
        <div className="flex flex-col gap-5 sm:flex-row">
          <p className="flex-1 whitespace-pre-wrap font-serif text-[15px] leading-8">
            {segments.map((seg, i) =>
              seg.section ? (
                <span
                  key={i}
                  title={seg.section.label}
                  className={`rounded-sm px-0.5 ${SECTION_COLORS[seg.section.id]?.highlight ?? ''}`}
                >
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </p>
          <ul className="w-full shrink-0 sm:w-44">
            {sections
              .filter((s) => s.text.trim() !== '')
              .map((s) => {
                const matched = matchedIds.has(s.id);
                return (
                  <li
                    key={s.id}
                    className={`flex items-center gap-2 py-1 text-xs ${matched ? '' : 'text-muted-foreground/60'}`}
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm ${SECTION_COLORS[s.id]?.swatch ?? 'bg-gray-300'} ${matched ? '' : 'opacity-40'}`}
                    />
                    <span>
                      {s.label}
                      {!matched && ' (edited)'}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {feedback.topImprovements && feedback.topImprovements.length > 0 && (
        <div className="animate-rise rise-2 rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-0 print:p-0 print:shadow-none">
          <h3 className="mb-3 font-display text-lg font-semibold">Top Improvements</h3>
          <ol className="flex flex-col gap-2">
            {feedback.topImprovements.map((tip, i) => (
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

      <FeedbackPanel feedback={feedback} userText={draft} />
    </div>
  );
}
