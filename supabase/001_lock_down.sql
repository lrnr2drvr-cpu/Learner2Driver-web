-- ==========================================================================
-- LEARNER2DRIVER - DATABASE LOCK-DOWN
--
-- What this does:
--   * Visitors can still READ the public site content (text, routes, car hotspots, reviews).
--   * Only a signed-in instructor can CHANGE anything.
--   * The student table is private: only a signed-in instructor can read or change it.
--   * The old public copy of the student list (with password hashes) is deleted.
--
-- Before running:
--   1. Supabase dashboard > Authentication > Users > Add user.
--      Enter the instructor's email and a strong password, and tick "Auto Confirm User".
--   2. Put that same email in the line marked EDIT THIS below.
--   3. Deploy the website code that goes with this script first. The old code
--      cannot save edits once this has run.
--
-- Run it in: Supabase dashboard > SQL Editor. It is safe to run more than once.
-- ==========================================================================

begin;

-- 1. The list of instructor accounts. Nobody can read or change it through the website.
create table if not exists public.admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 2. Register the instructor.                         EDIT THIS  vvvvvvvvvvvvvvvvvvvvvvvvvvv
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('instructor@example.com')
on conflict (user_id) do nothing;

-- Stop here (and undo everything) if no instructor is registered, so the site
-- is never left with nobody able to edit it.
do $$
begin
  if not exists (select 1 from public.admins) then
    raise exception 'No instructor account found. Create the user under Authentication > Users, put its email in this script, and run it again.';
  end if;
end $$;

-- 3. Remove whatever access rules exist today and switch row-level security on.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array['site_settings', 'student_profiles', 'preston_routes', 'fleet_hotspots', 'student_reviews']
  loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- 4. Public content: anyone reads, only the instructor writes.
create policy "public read" on public.site_settings
  for select to anon, authenticated
  using (key <> 'l2d_student_progress_json' or public.is_admin());
create policy "instructor write" on public.site_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.preston_routes
  for select to anon, authenticated using (true);
create policy "instructor write" on public.preston_routes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.fleet_hotspots
  for select to anon, authenticated using (true);
create policy "instructor write" on public.fleet_hotspots
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.student_reviews
  for select to anon, authenticated using (true);
create policy "instructor write" on public.student_reviews
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 5. Students: private. Only the instructor reads or writes.
create policy "instructor only" on public.student_profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 6. Delete the public copy of the student list, which included password hashes.
delete from public.site_settings where key = 'l2d_student_progress_json';

commit;
