-- Run this once in the Supabase SQL Editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null default '',
  specialty text not null default '',
  location text not null default '',
  phone text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.providers enable row level security;

create policy "Users can view their own providers"
  on public.providers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own providers"
  on public.providers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own providers"
  on public.providers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own providers"
  on public.providers for delete
  using (auth.uid() = user_id);

-- Keep updated_at current on every edit
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger providers_set_updated_at
  before update on public.providers
  for each row
  execute function public.set_updated_at();
