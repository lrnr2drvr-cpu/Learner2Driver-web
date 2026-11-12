-- ==========================================================================
-- LEARNER2DRIVER - TIDY UP AFTER THE NEW SITE IS LIVE
--
-- Run this ONLY after the rebuilt site has replaced the old one and you are
-- happy with it. It removes data that only the old site used. It cannot be
-- undone, so the old site would lose its saved photos and curriculum.
--
-- What it removes:
--   * site_settings rows the old site kept in public view:
--       custom_site_images_json   about 1 MB of photos stored as text
--       course_curriculum_json    the lessons (now private, in course_content)
--       custom_reviews_json       the old review list
--       l2d_student_progress_json the old public copy of the student list
--   * student_profiles: the old student table (demo accounts only)
--   * student_reviews:  the old review table (25 unusable rows)
--
-- What it keeps: every other site_settings row (the old wording, harmless),
-- google_reviews_config, all v2_ rows, preston_routes and fleet_hotspots.
--
-- Run it in: Supabase dashboard > SQL Editor. Safe to run more than once.
-- ==========================================================================

begin;

-- The lessons must already be in their private table before the public copy goes.
do $$
begin
  if not exists (select 1 from public.course_content where id = 1) then
    raise exception 'Run 003_students_course_and_photos.sql first: the private course table is empty.';
  end if;
end $$;

delete from public.site_settings
where key in ('custom_site_images_json', 'course_curriculum_json', 'custom_reviews_json', 'l2d_student_progress_json');

drop table if exists public.student_profiles;
drop table if exists public.student_reviews;

commit;
