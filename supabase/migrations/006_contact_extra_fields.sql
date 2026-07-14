-- Run this in the Supabase SQL Editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- Adds a second address, a second phone number, and an email to contacts.

alter table public.providers add column if not exists address_2 text not null default '';
alter table public.providers add column if not exists phone_2 text not null default '';
alter table public.providers add column if not exists email text not null default '';
