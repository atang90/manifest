-- Run this in the Supabase SQL Editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- Freeform tags (label + color) on Contacts and Tracked Items.
-- No shared tag table -- each item's tags are its own list, matching how
-- the "Other" credential field already works.

alter table public.providers add column if not exists tags jsonb not null default '[]'::jsonb;
alter table public.tracked_items add column if not exists tags jsonb not null default '[]'::jsonb;
