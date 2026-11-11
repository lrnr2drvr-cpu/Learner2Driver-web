-- ==========================================================================
-- LEARNER2DRIVER - REMOVE PLACEHOLDER REVIEWS FROM THE DATABASE
--
-- The website now shows only reviews pulled from Google, whatever is stored.
-- This script removes the leftover placeholder data so it is not sitting in
-- the public database either.
--
--   * student_reviews: 25 rows saved in the wrong shape ("Anonymous Student",
--     no text). The site no longer reads this table. All rows are deleted.
--   * site_settings / custom_reviews_json: keeps only the reviews that came
--     from Google (ids starting "g-", except the hardcoded "g-live-" ones).
--
-- Run it in: Supabase dashboard > SQL Editor. It is safe to run more than once.
-- If it reports an error, nothing is changed.
-- ==========================================================================

begin;

delete from public.student_reviews;

update public.site_settings
set value = coalesce(
      (select jsonb_agg(review)
         from jsonb_array_elements(value::jsonb) as review
        where review->>'id' like 'g-%'
          and review->>'id' not like 'g-live-%')::text,
      '[]'),
    updated_at = now()
where key = 'custom_reviews_json';

commit;
