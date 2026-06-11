-- Run this in the Supabase SQL editor (or `supabase db push`) after creating
-- the project. Creates user profiles, saved reports, and row-level security.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  target_band numeric(2, 1) check (target_band between 4 and 9),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('guided', 'unguided')),
  topic text not null,
  essay text not null,
  word_count integer not null default 0,
  band_overall numeric(2, 1),
  bands jsonb,
  feedback jsonb not null,
  sections jsonb,
  created_at timestamptz not null default now()
);

create index reports_user_created_idx on public.reports (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.reports enable row level security;

-- RLS policies filter rows, but the roles still need table privileges
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.reports to authenticated;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = user_id);
create policy "Users can insert own reports"
  on public.reports for insert with check (auth.uid() = user_id);
create policy "Users can update own reports"
  on public.reports for update using (auth.uid() = user_id);
create policy "Users can delete own reports"
  on public.reports for delete using (auth.uid() = user_id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
