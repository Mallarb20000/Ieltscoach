'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { useUser } from '@/lib/auth/use-user';

const LINKS = [
  { href: '/guided', label: 'Guided Mode' },
  { href: '/unguided', label: 'Full Analysis' },
];

function initialsOf(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

function UserMenu() {
  const router = useRouter();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/login"
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="hidden rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:block"
        >
          Sign up free
        </Link>
      </div>
    );
  }

  const displayName =
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name
      : '';

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-2 ring-primary/20 transition-shadow hover:ring-primary/40"
      >
        {initialsOf(displayName, user.email ?? '')}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-56 rounded-lg border bg-popover p-1.5 shadow-lg">
          <div className="border-b px-2.5 pb-2 pt-1">
            {displayName && <p className="text-sm font-medium">{displayName}</p>}
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-secondary"
          >
            My dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const links = LINKS;

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border/70 bg-background/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5">
        <Link href="/" className="group flex items-baseline gap-1.5">
          <span className="font-display text-lg font-semibold tracking-tight">
            Writing Coach
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary transition-transform group-hover:scale-125" />
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {links.map((link) => {
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
            {user && (
              <Link
                href="/dashboard"
                className={`hidden rounded-md px-3 py-1.5 text-sm transition-colors sm:block ${
                  pathname.startsWith('/dashboard')
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>
          {isSupabaseConfigured() && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
