-- Run this in the Supabase SQL Editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- Adds Tracked Items: recurring things with flexible, category-specific
-- details (medications, subscriptions, supplies, memberships, etc.)

create table if not exists public.tracked_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  category text not null default '',
  item_name text not null default '',
  details jsonb not null default '[]',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tracked_items enable row level security;

create policy "Users can view their own tracked items"
  on public.tracked_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tracked items"
  on public.tracked_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tracked items"
  on public.tracked_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tracked items"
  on public.tracked_items for delete
  using (auth.uid() = user_id);

create trigger tracked_items_set_updated_at
  before update on public.tracked_items
  for each row
  execute function public.set_updated_at();
