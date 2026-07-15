-- Run this in the Supabase SQL Editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- A single accent color per row (e.g. mark something as high importance),
-- separate from the freeform multi-tag system -- one value, shown as a
-- colored stripe on the row itself rather than a labeled pill.

alter table public.providers add column if not exists color text not null default '';
alter table public.tracked_items add column if not exists color text not null default '';
alter table public.notes add column if not exists color text not null default '';
