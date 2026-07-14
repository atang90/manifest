-- Run this in the Supabase SQL Editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- Adds city/state/zip for both addresses on a contact.

alter table public.providers add column if not exists address_city text not null default '';
alter table public.providers add column if not exists address_state text not null default '';
alter table public.providers add column if not exists address_zip text not null default '';

alter table public.providers add column if not exists address_2_city text not null default '';
alter table public.providers add column if not exists address_2_state text not null default '';
alter table public.providers add column if not exists address_2_zip text not null default '';
