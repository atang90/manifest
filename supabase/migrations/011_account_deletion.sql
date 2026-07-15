-- Run this in the Supabase SQL Editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- Recoverable "delete my account": deleting sets this flag (checked at
-- sign-in to immediately block app access), rather than actually removing
-- the auth.users row or any data. Recovery is a manual admin action --
-- run the statement at the bottom to restore an account deleted by mistake.

alter table public.user_settings add column if not exists deleted_at timestamptz;

-- To recover an account, find the user's id in Authentication -> Users,
-- then run:
--   update public.user_settings set deleted_at = null where user_id = '<uuid>';
