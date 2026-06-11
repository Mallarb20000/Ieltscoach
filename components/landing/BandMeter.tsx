'use client';

import { useEffect, useRef, useState } from 'react';

const CX = 150;
const CY = 158;
const R = 118;
const MIN_BAND = 4;
const MAX_BAND = 9;
const TARGET = 7;
const TARGET_FRACTION = (TARGET - MIN_BAND) / (MAX_BAND - MIN_BAND);

function point(band: number, radius: number) {
  const angle = Math.PI * (1 - (band - MIN_BAND) / (MAX_BAND - MIN_BAND));
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
}

const TICKS = [4, 5, 6, 7, 8, 9].map((band) => ({
  band,
  inner: point(band, R - 24),
  outer: point(band, R - 13),
  label: point(band, R + 22),
}));

const SEVEN_LABEL = point(TARGET, R + 22);
const ARC_PATH = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

export function BandMeter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const rafRef = useRef(0);
  const [active, setActive] = useState(false);
  const [display, setDisplay] = useState(MIN_BAND);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        io.disconnect();
        setActive(true);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setDisplay(TARGET);
          return;
        }
        const start = performance.now();
        const duration = 1500;
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          // IELTS bands move in halves, so the readout steps 4.0, 4.5, ... 7.0
          setDisplay(Math.round((MIN_BAND + eased * (TARGET - MIN_BAND)) * 2) / 2);
          if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-md select-none">
      <svg aria-hidden viewBox="0 0 300 190" fill="none" className="w-full">
        <path
          d={ARC_PATH}
          pathLength={1}
          className="stroke-border"
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray="0.0001 0.03"
        />
        <path
          d={ARC_PATH}
          pathLength={1}
          className="stroke-primary [transition:stroke-dashoffset_1.5s_cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={active ? 1 - TARGET_FRACTION : 1}
        />
        {TICKS.map(({ band, inner, outer, label }) => (
          <g key={band}>
            <line
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              strokeWidth={band === TARGET ? 2.5 : 1.5}
              className={band === TARGET ? 'stroke-primary' : 'stroke-muted-foreground/40'}
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={band === TARGET ? 15 : 12}
              className={`font-display ${
                band === TARGET ? 'fill-primary font-semibold' : 'fill-muted-foreground'
              }`}
            >
              {band}
            </text>
          </g>
        ))}
        <ellipse
          cx={SEVEN_LABEL.x}
          cy={SEVEN_LABEL.y}
          rx={15}
          ry={11}
          pathLength={1}
          transform={`rotate(-8 ${SEVEN_LABEL.x} ${SEVEN_LABEL.y})`}
          className="stroke-destructive/70 [transition:stroke-dashoffset_0.6s_ease_1.5s] motion-reduce:transition-none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={active ? 0 : 1}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-[8%] text-center">
        <p className="font-display text-5xl font-semibold tabular-nums tracking-tight">
          {display.toFixed(1)}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Estimated band
        </p>
      </div>
    </div>
  );
}
