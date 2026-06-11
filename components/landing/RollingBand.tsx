'use client';

import { useState, type ReactNode } from 'react';

const DIGITS = [4, 5, 6, 7, 8, 9];
const REST_OFFSET = `translateY(-${(DIGITS.indexOf(7) / DIGITS.length) * 100}%)`;

export function RollingBand({ children }: { children?: ReactNode }) {
  const [rolling, setRolling] = useState(false);

  const trigger = () => {
    if (rolling) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setRolling(true);
  };

  return (
    <span
      className="relative inline-block cursor-default italic text-primary"
      onPointerEnter={trigger}
    >
      Band{' '}
      <span className="relative inline-block">
        <span aria-hidden className="invisible">
          7
        </span>
        <span className="sr-only">7</span>
        {/* Clip box is wider than the glyph so the italic overhang is not cut off */}
        <span aria-hidden className="absolute -left-[0.18em] -right-[0.18em] inset-y-0 overflow-hidden">
          <span
            className={`block text-center will-change-transform ${rolling ? 'animate-band-roll' : ''}`}
            style={{ transform: REST_OFFSET }}
            onAnimationEnd={() => setRolling(false)}
          >
            {DIGITS.map((digit) => (
              <span key={digit} className="block">
                {digit}
              </span>
            ))}
          </span>
        </span>
      </span>
      +.
      {children}
    </span>
  );
}
