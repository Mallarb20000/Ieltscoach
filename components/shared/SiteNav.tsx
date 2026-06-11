'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/guided', label: 'Guided Mode' },
  { href: '/unguided', label: 'Full Analysis' },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5">
        <Link href="/" className="group flex items-baseline gap-1.5">
          <span className="font-display text-lg font-semibold tracking-tight">
            Writing Coach
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary transition-transform group-hover:scale-125" />
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
