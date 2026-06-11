import { FeedbackPanel } from '@/components/guided/FeedbackPanel';
import type { StageFeedback } from '@/lib/llm/adapter';

export interface ReportSection {
  id: string;
  label: string;
  text: string;
}

interface Props {
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

export function FinalReport({ draft, sections, feedback }: Props) {
  const segments = segmentDraft(draft, sections);
  const matchedIds = new Set(
    segments.filter((s) => s.section !== null).map((s) => s.section!.id)
  );

  return (
    <div className="flex flex-col gap-5">
      {feedback.bands && (
        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Band Score Estimates</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['TR', 'CC', 'LR', 'GRA'] as const).map((criterion) => (
              <div key={criterion} className="rounded-md border p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">{criterion}</p>
                <p className="mt-1 text-2xl font-bold">{feedback.bands![criterion].toFixed(1)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-accent p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">Overall Estimate</p>
            <p className="mt-1 text-3xl font-bold">{feedback.bands.overall.toFixed(1)}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            These are AI estimates only — not official IELTS scores. Verify with a qualified
            examiner.
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-card p-5">
        <h3 className="mb-1 text-sm font-semibold">Your Essay</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Highlights show your approved structure. Unhighlighted text is detail you added during
          final editing.
        </p>
        <div className="flex flex-col gap-5 sm:flex-row">
          <p className="flex-1 whitespace-pre-wrap text-sm leading-7">
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
        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Top Improvements</h3>
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
