-- ==========================================================================
-- LEARNER2DRIVER - STUDENT LOGINS, PRIVATE COURSE, AND PHOTO STORAGE
-- For the rebuilt site (v2). Safe to run more than once. If it reports an
-- error, nothing is changed.
--
-- What this sets up:
--   * students: real accounts, created by the instructor. Passwords are
--     stored hashed (bcrypt) and are never sent to a browser.
--   * Students sign in through database functions. They can only read the
--     course and change their own progress. Nobody can list students or read
--     the course without signing in.
--   * course_content: the modules and lessons, private. Seeded from the
--     curriculum the current site already has.
--   * A storage bucket ("site") for photographs the instructor replaces on
--     the page. Anyone can view them; only an instructor can upload.
--
-- Needs 001_lock_down.sql to have been run first (it defines is_admin()).
-- Run it in: Supabase dashboard > SQL Editor.
-- ==========================================================================

begin;

create extension if not exists pgcrypto with schema extensions;

-- 1. Tables ---------------------------------------------------------------

create table if not exists public.students (
  id            uuid primary key default gen_random_uuid(),
  username      text not null,
  password_hash text not null,
  instructor    text not null default '',
  transmission  text not null default 'Manual' check (transmission in ('Manual', 'Automatic')),
  created_at    timestamptz not null default now()
);
create unique index if not exists students_username_key on public.students (lower(username));

create table if not exists public.student_sessions (
  token      uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create table if not exists public.lesson_progress (
  student_id   uuid not null references public.students (id) on delete cascade,
  lesson_id    text not null,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

create table if not exists public.course_content (
  id         int primary key default 1 check (id = 1),
  modules    jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Start the private course from the curriculum the current site already has.
insert into public.course_content (id, modules)
select 1, value::jsonb from public.site_settings where key = 'course_curriculum_json'
on conflict (id) do nothing;

-- 2. Who can touch the tables directly --------------------------------------
-- Visitors: nothing. Instructors: read students (never the password hash) and
-- progress, delete students, and edit the course. Everything else goes
-- through the functions below.

alter table public.students         enable row level security;
alter table public.student_sessions enable row level security;
alter table public.lesson_progress  enable row level security;
alter table public.course_content   enable row level security;

revoke all on public.students, public.student_sessions, public.lesson_progress, public.course_content from anon, authenticated;
grant select (id, username, instructor, transmission, created_at) on public.students to authenticated;
grant select on public.lesson_progress to authenticated;
grant select, insert, update on public.course_content to authenticated;

drop policy if exists "instructor reads students" on public.students;
create policy "instructor reads students" on public.students
  for select to authenticated using (public.is_admin());

drop policy if exists "instructor reads progress" on public.lesson_progress;
create policy "instructor reads progress" on public.lesson_progress
  for select to authenticated using (public.is_admin());

drop policy if exists "instructor edits course" on public.course_content;
create policy "instructor edits course" on public.course_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 3. What a student can do ---------------------------------------------------

create or replace function public.student_sign_in(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.students;
  t uuid;
begin
  select * into s from public.students where lower(username) = lower(trim(p_username));
  if not found or s.password_hash <> extensions.crypt(p_password, s.password_hash) then
    perform pg_sleep(0.4); -- slows down guessing
    return null;
  end if;
  delete from public.student_sessions where student_id = s.id and expires_at < now();
  insert into public.student_sessions (student_id) values (s.id) returning token into t;
  return json_build_object('token', t, 'username', s.username, 'transmission', s.transmission, 'instructor', s.instructor);
end;
$$;

create or replace function public.student_course(p_token uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'student', json_build_object('username', s.username, 'transmission', s.transmission, 'instructor', s.instructor),
    'modules', coalesce((select c.modules from public.course_content c where c.id = 1), '[]'::jsonb),
    'completed', coalesce((select json_agg(p.lesson_id) from public.lesson_progress p where p.student_id = s.id), '[]'::json)
  )
  from public.student_sessions x
  join public.students s on s.id = x.student_id
  where x.token = p_token and x.expires_at > now();
$$;

create or replace function public.student_set_lesson(p_token uuid, p_lesson text, p_done boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  sid uuid;
begin
  select student_id into sid from public.student_sessions where token = p_token and expires_at > now();
  if sid is null or p_lesson is null or length(p_lesson) > 80 then
    return false;
  end if;
  if p_done then
    insert into public.lesson_progress (student_id, lesson_id) values (sid, p_lesson)
    on conflict (student_id, lesson_id) do nothing;
  else
    delete from public.lesson_progress where student_id = sid and lesson_id = p_lesson;
  end if;
  return true;
end;
$$;

create or replace function public.student_sign_out(p_token uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with gone as (delete from public.student_sessions where token = p_token returning 1)
  select exists (select 1 from gone);
$$;

-- 4. What an instructor can do ------------------------------------------------

-- Creates a student, or updates one with the same username. Leave the
-- password empty to keep an existing student's password.
create or replace function public.admin_save_student(p_username text, p_password text, p_instructor text, p_transmission text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  sid uuid;
  name text := trim(coalesce(p_username, ''));
begin
  if not public.is_admin() then
    raise exception 'Only an instructor can do this.' using errcode = '42501';
  end if;
  if length(name) < 2 or length(name) > 40 then
    raise exception 'The username must be 2 to 40 characters.';
  end if;
  if p_transmission not in ('Manual', 'Automatic') then
    raise exception 'Choose Manual or Automatic.';
  end if;

  select id into sid from public.students where lower(username) = lower(name);

  if sid is null then
    if coalesce(length(p_password), 0) < 8 then
      raise exception 'A new student needs a password of at least 8 characters.';
    end if;
    insert into public.students (username, password_hash, instructor, transmission)
    values (name, extensions.crypt(p_password, extensions.gen_salt('bf', 10)), coalesce(p_instructor, ''), p_transmission)
    returning id into sid;
  else
    update public.students
       set username = name, instructor = coalesce(p_instructor, ''), transmission = p_transmission
     where id = sid;
    if coalesce(p_password, '') <> '' then
      if length(p_password) < 8 then
        raise exception 'The password must be at least 8 characters.';
      end if;
      update public.students set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 10)) where id = sid;
      delete from public.student_sessions where student_id = sid; -- a new password signs the student out everywhere
    end if;
  end if;
  return sid;
end;
$$;

create or replace function public.admin_delete_student(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an instructor can do this.' using errcode = '42501';
  end if;
  delete from public.students where id = p_id;
  return found;
end;
$$;

revoke all on function public.student_sign_in(text, text), public.student_course(uuid),
  public.student_set_lesson(uuid, text, boolean), public.student_sign_out(uuid),
  public.admin_save_student(text, text, text, text), public.admin_delete_student(uuid) from public;
grant execute on function public.student_sign_in(text, text), public.student_course(uuid),
  public.student_set_lesson(uuid, text, boolean), public.student_sign_out(uuid) to anon, authenticated;
grant execute on function public.admin_save_student(text, text, text, text), public.admin_delete_student(uuid) to authenticated;

-- 5. Photo storage -----------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site', 'site', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "site photos: instructor writes" on storage.objects;
create policy "site photos: instructor writes" on storage.objects
  for all to authenticated
  using (bucket_id = 'site' and public.is_admin())
  with check (bucket_id = 'site' and public.is_admin());

commit;
