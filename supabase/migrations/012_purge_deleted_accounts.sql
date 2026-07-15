-- Run this in the Supabase SQL Editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- Accounts are only recoverable for 30 days after deletion (see
-- 011_account_deletion.sql). This schedules a nightly job that permanently
-- deletes any account past that window -- removing the auth.users row
-- cascades to erase all of that user's contacts, tracked items, notes, and
-- settings automatically (every table's user_id FK is `on delete cascade`).
-- After this runs, recovery is no longer possible.

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'purge-deleted-accounts',
  '0 3 * * *', -- daily at 03:00 UTC
  $$
  delete from auth.users
  where id in (
    select user_id from public.user_settings
    where deleted_at is not null and deleted_at < now() - interval '30 days'
  );
  $$
);

-- To check what the job has done, or troubleshoot it, run:
--   select * from cron.job_run_details order by start_time desc limit 20;
