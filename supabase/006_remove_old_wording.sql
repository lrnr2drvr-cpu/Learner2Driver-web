-- OPTIONAL. Removes the old site's leftover wording from site_settings (about 150 rows of
-- headings, labels and bios the new site never reads, plus a test row). It keeps everything
-- the new site uses: your edits (names starting v2_), the Google reviews settings and saved
-- figures, and the HubSpot portal ID.
--
-- This deletes data and cannot be undone. Run it in the Supabase SQL Editor only if you are
-- sure you will not go back to the old site.

begin;

delete from public.site_settings
where key not like 'v2\_%' escape '\'
  and key not in ('google_reviews_config', 'google_cache', 'hubspot_portal_id');

commit;
