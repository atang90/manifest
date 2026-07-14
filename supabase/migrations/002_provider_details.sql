-- Run this in the Supabase SQL Editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- Adds more granular fields to the providers table.

alter table public.providers
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists credentials text[] not null default '{}',
  add column if not exists hospital text not null default '',
  add column if not exists role text not null default '',
  add column if not exists fax text not null default '';

-- "location" now means a physical address specifically
alter table public.providers rename column location to address;

-- name is replaced by first_name / last_name
alter table public.providers drop column if exists name;
