-- ==========================================================================
-- LEARNER2DRIVER - A RECORD OF EVERY EDIT (optional, recommended)
--
-- The site's own Undo button only remembers changes made since the page was
-- opened. This keeps a permanent record in the database: every time a piece
-- of the new site's wording, a price, the phone number or a photo address is
-- changed or removed, the old and new values are written down with the time
-- and who did it. Nothing is ever lost, and anything can be put back.
--
-- To see recent changes, run in the SQL Editor:
--   select changed_at, key, old_value, new_value
--   from public.site_settings_history order by changed_at desc limit 50;
--
-- To put a value back, copy its old_value into site_settings:
--   update public.site_settings set value = '<old value>' where key = '<key>';
--
-- Needs 001_lock_down.sql first. Safe to run more than once.
-- Run it in: Supabase dashboard > SQL Editor.
-- ==========================================================================

begin;

create table if not exists public.site_settings_history (
  id         bigint generated always as identity primary key,
  key        text not null,
  old_value  text,
  new_value  text,
  changed_at timestamptz not null default now(),
  changed_by uuid
);

alter table public.site_settings_history enable row level security;
revoke all on public.site_settings_history from anon, authenticated;
grant select on public.site_settings_history to authenticated;

drop policy if exists "instructor reads history" on public.site_settings_history;
create policy "instructor reads history" on public.site_settings_history
  for select to authenticated using (public.is_admin());

create or replace function public.record_site_setting_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.site_settings_history (key, old_value, new_value, changed_by)
    values (old.key, old.value, null, (select auth.uid()));
    return old;
  end if;
  if tg_op = 'INSERT' then
    insert into public.site_settings_history (key, old_value, new_value, changed_by)
    values (new.key, null, new.value, (select auth.uid()));
  elsif old.value is distinct from new.value then
    insert into public.site_settings_history (key, old_value, new_value, changed_by)
    values (new.key, old.value, new.value, (select auth.uid()));
  end if;
  return new;
end;
$$;

-- Only the new site's rows (names starting v2_) are recorded.
drop trigger if exists site_settings_history_insert on public.site_settings;
create trigger site_settings_history_insert
  after insert on public.site_settings
  for each row when (new.key like 'v2\_%') execute function public.record_site_setting_change();

drop trigger if exists site_settings_history_update on public.site_settings;
create trigger site_settings_history_update
  after update on public.site_settings
  for each row when (new.key like 'v2\_%') execute function public.record_site_setting_change();

drop trigger if exists site_settings_history_delete on public.site_settings;
create trigger site_settings_history_delete
  after delete on public.site_settings
  for each row when (old.key like 'v2\_%') execute function public.record_site_setting_change();

commit;
