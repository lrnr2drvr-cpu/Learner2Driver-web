# 5-Component Handoff Report: Requirement R2 - Database & Data Integrity Verification

## 1. Observation

Direct code inspection of `js/supabase-client.js`, `js/cloud-sync.js`, `js/app.js`, `js/course-player.js`, `js/reviews.js`, and `js/course-data.js` revealed the following exact lines and behaviors:

### A. Supabase Client Data Models (`js/supabase-client.js`)
1. **`site_settings` table**:
   - `syncSiteTextToSupabase` (lines 87-101): Upserts `{ key: editableKey, value: htmlContent, updated_at: ... }`.
   - `fetchSiteTextFromSupabase` (lines 103-199): Parses stringified JSON values for `fleet_hotspots_json`, `course_curriculum_json`, `l2d_student_progress_json`, `custom_reviews_json`, and `custom_site_images_json`.
2. **`student_profiles` table**:
   - `syncStudentToSupabase` (lines 204-282): Upserts `{ username, instructor, transmission, password_hash, password_salt, completed_lessons, updated_at }`. Falls back to updating `site_settings` key `l2d_student_progress_json` (line 268).
   - `fetchStudentsFromSupabase` (lines 284-327): Pulls `student_profiles`. Map result converts `password_hash` to `passwordHash` and `completed_lessons` to `completed`.
3. **`preston_routes` table**:
   - `syncRouteToSupabase` (lines 343-367): Upserts `{ spot_id, title, location, tip, lat, lng, updated_at }`.
4. **`fleet_hotspots` table**:
   - `syncHotspotsToSupabase` (lines 398-442): Dual-syncs to `site_settings` (`fleet_hotspots_json`) and `fleet_hotspots` (`vehicle_id`, `hotspots`).
5. **`student_reviews` table**:
   - `syncReviewToSupabase` (lines 478-503): Upserts `{ review_id, name, pass_type, vehicle_tag, rating, quote, date, photo_url, updated_at }`.

### B. Cloud Sync & Offline Caching (`js/cloud-sync.js`)
1. **Offline Queueing**: `pushLocalDataToCloud` (lines 153-220) checks `navigator.onLine`. If offline, sets `l2d_cloud_pending_sync` = `'true'` and `l2d_cloud_pending_time`.
2. **Storage Key List**: `STORAGE_KEYS` array (lines 9-18) includes:
   `'l2d_custom_site_text'`, `'l2d_site_content'`, `'l2d_custom_hotspots'`, `'l2d_fleet_hotspots'`, `'l2d_custom_routes'`, `'l2d_custom_reviews'`, `'l2d_lms_state'`, `'l2d_custom_course_data'`.

### C. Local Storage Keys Audit (across all 12 domains)
1. `l2d_custom_site_text`: Read/written in `app.js` (lines 546, 677), `supabase-client.js` (line 738), `cloud-sync.js`.
2. `l2d_custom_site_images`: Read/written in `supabase-client.js` (lines 189, 731).
3. `l2d_custom_hotspots`: Read/written alongside `l2d_fleet_hotspots` in `app.js` (line 600) and `supabase-client.js` (line 118, 818).
4. `l2d_custom_routes`: Read/written in `app.js` (line 633) and `supabase-client.js` (line 804).
5. `l2d_custom_reviews`: Read/written in `reviews.js` (line 277, 290) and `supabase-client.js` (line 181, 826).
6. `l2d_custom_modules` (Domain name): Stored locally under key `l2d_custom_course_data` in `course-data.js` (line 197) and `supabase-client.js` (line 123).
7. `l2d_students_progress` (Domain name): Stored locally under key `l2d_student_progress` (singular `student`) in `course-player.js` (line 174, 228) and `supabase-client.js` (line 135, 797). `cloud-sync.js` also has legacy key `'l2d_lms_state'`.
8. `l2d_current_student`: Read/written in `course-player.js` (line 167, 224).
9. `l2d_admin_session`: Split into `l2d_is_admin`, `l2d_admin_user`, `l2d_admin_editing_mode` in `app.js` (lines 358-368) and `course-player.js` (line 191).
10. `l2d_admin_password_hash`: Saved as `l2d_admin_password_hash` and `l2d_admin_password_salt` in `course-player.js` (lines 66-67). Legacy key `l2d_admin_pass` is migrated and removed.
11. `l2d_theme_mode` (Domain name): Stored under key `l2d_theme` in `app.js` (line 54, 67).
12. `l2d_insta_api_endpoint`: Read/written in `supabase-client.js` (line 159, 706) and `course-player.js` (line 1551).

---

## 2. Logic Chain

1. **Schema Mismatch & Desynchronization**:
   - In `reviews.js`, `saveReviewsToStorage()` syncs review data to Supabase `site_settings` under key `custom_reviews_json` via `window.syncSiteTextToSupabase()`, but fails to call `syncReviewToSupabase()`. As a result, the structured table `student_reviews` is NOT updated during review modal CRUD operations, causing table data drift between `site_settings` and `student_reviews`.
2. **Race Condition & Destructive Overwrites on Page Load**:
   - In `supabase-client.js` (lines 795-798, 804, 826), `DOMContentLoaded` auto-pulls `cloudStudents`, `cloudRoutes`, `cloudReviews`, and blindly performs `localStorage.setItem()` without comparing timestamps or checking `l2d_cloud_pending_sync`.
   - If an offline edit was made and stored locally, opening a new tab while online causes `DOMContentLoaded` to fetch older Supabase data and replace local storage *before* any pending offline changes can be pushed.
3. **Key Name Inconsistencies**:
   - There are subtle naming gaps between specification domains and codebase keys:
     - `l2d_students_progress` (plural in task) vs `l2d_student_progress` (singular in code).
     - `l2d_custom_modules` (in task) vs `l2d_custom_course_data` (in code).
     - `l2d_theme_mode` (in task) vs `l2d_theme` (in code).
     - `l2d_custom_site_text` vs `l2d_site_content` dual key split in `app.js`.

---

## 3. Caveats

- **Network Mode Restriction**: Investigation was conducted via static code analysis in CODE_ONLY mode without executing live HTTP network traffic to external Supabase instances.
- **Backend Schema Constraints**: RLS (Row Level Security) rules on Supabase tables were not checked via SQL admin console, assuming standard public client read/write policies.

---

## 4. Conclusion & Recommendations

### Actionable Fix Recommendations

1. **Review CRUD Supabase Sync**:
   Update `reviews.js` (`saveReviewsToStorage`, `saveReviewFromModal`, `deleteReview`) to call `window.syncReviewToSupabase(reviewObj)` for individual review inserts/updates and implement a `deleteReviewFromSupabase(reviewId)` helper.
2. **Prevent Destructive Auto-Pull Overwrites**:
   In `supabase-client.js` `DOMContentLoaded`, check `localStorage.getItem('l2d_cloud_pending_sync') === 'true'`. If pending sync is true, run `flushPendingOfflineSync()` first before pulling cloud data. Additionally, perform deep merge or timestamp checks before overwriting local arrays/objects.
3. **Unify Dual Storage Keys**:
   In `app.js`, merge `l2d_site_content` into `l2d_custom_site_text` so text hydration and inline editing use a single authoritative key namespace.
4. **Key Compatibility Aliases**:
   Add backward-compatibility fallbacks in `cloud-sync.js` and storage helpers for key variants (`l2d_student_progress` / `l2d_students_progress`, `l2d_custom_course_data` / `l2d_custom_modules`, `l2d_theme` / `l2d_theme_mode`).

---

## 5. Verification Method

To verify these findings and proposed fixes:
1. Inspect `js/supabase-client.js` lines 103-199 and 776-830 to verify auto-pull logic.
2. Inspect `js/reviews.js` line 288 to verify `saveReviewsToStorage` only calls `syncSiteTextToSupabase('custom_reviews_json', payload)` and not `syncReviewToSupabase`.
3. Inspect `js/app.js` lines 53-70 to confirm `l2d_theme` key name usage.
4. Inspect `js/course-player.js` lines 165-218 to confirm `l2d_student_progress` key name usage.
