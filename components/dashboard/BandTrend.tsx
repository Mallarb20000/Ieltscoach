interface Point {
  band: number;
  date: string;
}

interface Props {
  points: Point[];
}

const W = 560;
const H = 180;
const PAD = { top: 16, right: 16, bottom: 28, left: 34 };
const MIN_BAND = 4;
const MAX_BAND = 9;

function x(i: number, count: number): number {
  if (count === 1) return PAD.left + (W - PAD.left - PAD.right) / 2;
  return PAD.left + (i / (count - 1)) * (W - PAD.left - PAD.right);
}

function y(band: number): number {
  const clamped = Math.min(MAX_BAND, Math.max(MIN_BAND, band));
  const t = (clamped - MIN_BAND) / (MAX_BAND - MIN_BAND);
  return H - PAD.bottom - t * (H - PAD.top - PAD.bottom);
}

export function BandTrend({ points }: Props) {
  if (points.length === 0) return null;

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i, points.length).toFixed(1)} ${y(p.band).toFixed(1)}`)
    .join(' ');

  const gridBands = [4, 5, 6, 7, 8, 9];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Overall band score over time"
      className="w-full"
    >
      {gridBands.map((b) => (
        <g key={b}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(b)}
            y2={y(b)}
            className={b === 7 ? 'stroke-primary/30' : 'stroke-border'}
            strokeWidth="1"
            strokeDasharray={b === 7 ? '4 3' : undefined}
          />
          <text
            x={PAD.left - 8}
            y={y(b) + 3.5}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            {b}.0
          </text>
        </g>
      ))}

      <path d={path} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={x(i, points.length)}
            cy={y(p.band)}
            r="4.5"
            className="fill-card stroke-primary"
            strokeWidth="2.5"
          />
          <title>{`${p.band.toFixed(1)} — ${p.date}`}</title>
        </g>
      ))}

      {points.length > 1 && (
        <>
          <text
            x={x(0, points.length)}
            y={H - 8}
            textAnchor="start"
            className="fill-muted-foreground text-[10px]"
          >
            {points[0].date}
          </text>
          <text
            x={x(points.length - 1, points.length)}
            y={H - 8}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            {points[points.length - 1].date}
          </text>
        </>
      )}
    </svg>
  );
}
