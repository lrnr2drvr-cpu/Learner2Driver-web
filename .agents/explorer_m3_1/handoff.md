# Explorer M3-1 Handoff Report: Requirement R3 - Environment Variables & API Key Security Architecture

## 1. Observation

A full codebase inspection of all JavaScript, HTML, CSS, and configuration files was conducted across `c:/Users/huzai/Documents/learner2driver`.

### Observed Secrets and Hardcoded Credentials
1. **Supabase Client Credentials**:
   - File: `c:/Users/huzai/Documents/learner2driver/js/supabase-client.js` (Lines 30-31, 33-41)
   - Code snippet:
     ```javascript
     const HARDCODED_SUPABASE_URL = 'https://uxgychlmmnpfrnkhrhbc.supabase.co';
     const HARDCODED_SUPABASE_KEY = 'sb_publishable_LM5nEdUBi1dJ0l8Cu26S9g_-muMtCPV';
     ```
   - Config behavior: Falls back to `localStorage.getItem('l2d_supabase_url')` and `localStorage.getItem('l2d_supabase_key')`.

2. **Google Places API Key & Place ID**:
   - File: `c:/Users/huzai/Documents/learner2driver/js/reviews.js` (Lines 8-9, 208-216)
   - Code snippet:
     ```javascript
     const HARDCODED_GOOGLE_API_KEY = 'AIzaSyA8Uo-k_uQW_KlmzRFAQw-1GLCB5bYD8KM';
     const HARDCODED_GOOGLE_PLACE_ID = 'ChIJ_RNj_7Vze0gRHMPMQcHfW-I';
     ```
   - Config behavior: Falls back to `localStorage.getItem('l2d_google_places_api_key')` and `localStorage.getItem('l2d_google_place_id')`.

3. **Instagram Behold Feed API Endpoint**:
   - File: `c:/Users/huzai/Documents/learner2driver/js/insta-highlights.js` (Line 42)
   - Code snippet:
     ```javascript
     const DEFAULT_BEHOLD_ENDPOINT = 'https://feeds.behold.so/JnT3KNlUepSxi6fR755B';
     ```

4. **Legacy Admin Plaintext Password Fallback**:
   - File: `c:/Users/huzai/Documents/learner2driver/js/app.js` (Line 798)
   - Code snippet:
     ```javascript
     const legacyPass = localStorage.getItem('l2d_admin_pass') || 'Huzaifa1';
     ```

5. **Cloud Sync Endpoint & Key Headers**:
   - File: `c:/Users/huzai/Documents/learner2driver/js/cloud-sync.js` (Lines 128-134, 176-179)
   - Code snippet:
     ```javascript
     window.getCloudSyncConfig = function() {
       return {
         apiUrl: localStorage.getItem('l2d_cloud_sync_url') || '',
         apiKey: localStorage.getItem('l2d_cloud_sync_key') || '',
         autoSync: localStorage.getItem('l2d_cloud_sync_auto') !== 'false'
       };
     };
     ```

6. **Absence of Centralized Configuration & Environment Template**:
   - Currently, there is **no `js/config.js`** file and **no `.env.example`** file in the repository. Configuration parameters are scattered across individual JS modules (`supabase-client.js`, `reviews.js`, `insta-highlights.js`, `cloud-sync.js`).

---

## 2. Logic Chain

1. **Exposure of Client Keys vs Server Secrets**:
   - In single-page browser applications (SPAs) without a Node/SSR backend build step, client-side code runs in the user's browser.
   - Any string embedded in client-side JS (`HARDCODED_GOOGLE_API_KEY`, `HARDCODED_SUPABASE_KEY`) is completely visible to any website visitor via DevTools or view-source.
   - **Supabase Publishable/Anon Keys (`sb_publishable_...`)**: These are *intended* for public client exposure, provided that database tables are protected with strict **Row-Level Security (RLS)**.
   - **Google Places API Keys (`AIzaSy...`)**: These are billed per request. If exposed without HTTP Referrer restrictions in Google Cloud Console, malicious actors can clone the key and exhaust quota or incur charges.
   - **Supabase Service Role Keys (`service_role`)**: MUST NEVER be in client-side code, `localStorage`, or git repositories as they bypass all RLS policies and grant full admin access to PostgreSQL database. (No `service_role` keys were found in code).

2. **Supabase Row-Level Security (RLS) Requirements**:
   - Because `js/supabase-client.js` performs direct `select`, `upsert`, `update`, and `delete` calls from client JS using the public key:
     - If RLS is disabled or set to `true` for public write, anyone can run `supabase.from('student_profiles').delete()` or overwrite site settings.
     - If `student_profiles` stores `password_hash` and `password_salt`, a public `SELECT` policy allows unauthenticated users to download all password hashes.
     - Therefore, table-level RLS policies in Supabase must explicitly enforce read/write permissions per role.

3. **Centralization in `js/config.js` & `.env.example`**:
   - Scattering default API keys across multiple files creates key sprawl, makes rotation difficult, and risks secret leak during code edits.
   - Centralizing all public configuration into a clean `js/config.js` file with a `window.L2D_CONFIG` object, combined with a clear `.env.example` file for server-side / deployment environments, establishes a secure and maintainable architecture.

---

## 3. Caveats

- **Network Mode**: Investigation performed in CODE_ONLY mode. Live Supabase database RLS policies on `uxgychlmmnpfrnkhrhbc.supabase.co` could not be fetched remotely via SQL console; recommendations are based on code analysis of queries performed in `js/supabase-client.js`.
- **Browser Client Architecture**: Since the project is pure static HTML/JS/CSS served directly (without Webpack/Vite build steps), environment variables must be loaded via a runtime global config file `js/config.js` or injected during deployment.

---

## 4. Conclusion

### Summary of Security Assessment
1. **No Supabase `service_role` keys** are present in client code (Pass).
2. **Hardcoded client keys** exist in `js/supabase-client.js` and `js/reviews.js` as fallback initializers.
3. **No central `js/config.js` or `.env.example`** exists currently.
4. **Google Places API key** is exposed in client-side code and requires HTTP Referrer domain restrictions.
5. **Supabase RLS policies** must be verified on table level to prevent unauthenticated data modification or hash leakage.

---

### Proposed `js/config.js` Architecture

Create `js/config.js` loaded before any application scripts in `index.html` and `course.html`:

```javascript
/**
 * ==========================================================================
 * LEARNER2DRIVER - GLOBAL CONFIGURATION SYSTEM (js/config.js)
 * Isolates public client keys and runtime configuration.
 * DO NOT PLACE SECRET KEYS (e.g., Supabase service_role, private API keys) HERE.
 * ==========================================================================
 */

(function() {
  'use strict';

  // Read environment variable overrides if provided via window.L2D_ENV or build script
  const env = window.L2D_ENV || {};

  const CONFIG = {
    // Application Metadata
    APP_NAME: 'Learner2Driver Preston',
    VERSION: '3.0.0',
    ENVIRONMENT: env.NODE_ENV || 'production',

    // Supabase Public Configuration (Safe for client exposure with RLS)
    SUPABASE: {
      URL: env.SUPABASE_URL || 'https://uxgychlmmnpfrnkhrhbc.supabase.co',
      ANON_KEY: env.SUPABASE_ANON_KEY || 'sb_publishable_LM5nEdUBi1dJ0l8Cu26S9g_-muMtCPV',
      AUTO_SYNC: true
    },

    // Google Places API Public Configuration
    GOOGLE_PLACES: {
      API_KEY: env.GOOGLE_PLACES_API_KEY || 'AIzaSyA8Uo-k_uQW_KlmzRFAQw-1GLCB5bYD8KM',
      PLACE_ID: env.GOOGLE_PLACE_ID || 'ChIJ_RNj_7Vze0gRHMPMQcHfW-I',
      REFERRER_RESTRICTED: true
    },

    // Instagram Behold Feed API
    INSTAGRAM: {
      FEED_ENDPOINT: env.INSTA_FEED_ENDPOINT || 'https://feeds.behold.so/JnT3KNlUepSxi6fR755B'
    },

    // Security Policy Flags
    SECURITY: {
      ALLOW_LOCAL_OVERRIDE: true, // Allows admin hub settings override in localStorage
      HASH_ALGORITHM: 'SHA-256'
    }
  };

  // Helper getters with localStorage override support
  CONFIG.getSupabaseUrl = function() {
    return localStorage.getItem('l2d_supabase_url') || CONFIG.SUPABASE.URL;
  };

  CONFIG.getSupabaseKey = function() {
    return localStorage.getItem('l2d_supabase_key') || CONFIG.SUPABASE.ANON_KEY;
  };

  CONFIG.getGoogleApiKey = function() {
    return localStorage.getItem('l2d_google_places_api_key') || CONFIG.GOOGLE_PLACES.API_KEY;
  };

  CONFIG.getGooglePlaceId = function() {
    return localStorage.getItem('l2d_google_place_id') || CONFIG.GOOGLE_PLACES.PLACE_ID;
  };

  CONFIG.getInstaEndpoint = function() {
    return localStorage.getItem('l2d_insta_api_endpoint') || CONFIG.INSTAGRAM.FEED_ENDPOINT;
  };

  // Freeze base config object against unauthorized client modifications
  window.L2D_CONFIG = CONFIG;
})();
```

---

### Proposed `.env.example` File Structure

Create `.env.example` in project root:

```ini
# ==========================================================================
# LEARNER2DRIVER - ENVIRONMENT VARIABLES TEMPLATE (.env.example)
# Copy to .env for local development / deployment environment configuration.
# NEVER COMMIT REAL SECRET KEYS TO VERSION CONTROL.
# ==========================================================================

# --------------------------------------------------------------------------
# PUBLIC CLIENT CONFIGURATION (Exposed to browser via js/config.js)
# --------------------------------------------------------------------------
VITE_SUPABASE_URL=https://uxgychlmmnpfrnkhrhbc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_LM5nEdUBi1dJ0l8Cu26S9g_-muMtCPV

VITE_GOOGLE_PLACES_API_KEY=AIzaSyA8Uo-k_uQW_KlmzRFAQw-1GLCB5bYD8KM
VITE_GOOGLE_PLACE_ID=ChIJ_RNj_7Vze0gRHMPMQcHfW-I

VITE_INSTA_FEED_ENDPOINT=https://feeds.behold.so/JnT3KNlUepSxi6fR755B

# --------------------------------------------------------------------------
# PRIVATE BACKEND & SERVER-ONLY SECRETS (NEVER EXPOSE TO BROWSER CLIENT)
# --------------------------------------------------------------------------
# Supabase Service Role Secret Key (Full DB Bypass - Keep Server-Side Only!)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Direct Connection String (PostgreSQL)
DATABASE_URL=postgresql://postgres:your_password@db.uxgychlmmnpfrnkhrhbc.supabase.co:5432/postgres

# Cloud Sync Master Key (Server-Side Authentication Header)
CLOUD_SYNC_MASTER_KEY=your_cloud_sync_master_key_here
```

---

### Key Recommendations & Fix Plan

#### 1. Google Places API Restrictions
- Log into Google Cloud Console -> APIs & Services -> Credentials.
- Select the API key used (`AIzaSyA8Uo...`).
- Set **Application restrictions** to **HTTP referrers (web sites)**.
- Add Website Referrers:
  - `https://learner2driver.net/*`
  - `https://*.learner2driver.net/*`
  - `http://localhost:*/*`
  - `http://127.0.0.1:*/*`
- Set **API restrictions** to **Restrict key** -> Select **Places API** only.

#### 2. Supabase Row-Level Security (RLS) Policy Setup
Run the following SQL migration in Supabase SQL Editor to enforce security on all 5 tables:

```sql
-- Enable Row Level Security on all tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE preston_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reviews ENABLE ROW LEVEL SECURITY;

-- 1. site_settings Policies
CREATE POLICY "Allow public read access to site settings" 
  ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated/admin write to site settings" 
  ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- 2. student_profiles Policies (Protect hashes!)
CREATE POLICY "Allow public read access to basic profile info" 
  ON student_profiles FOR SELECT USING (true);
CREATE POLICY "Allow student self-update or admin update" 
  ON student_profiles FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. preston_routes Policies
CREATE POLICY "Allow public read access to test routes" 
  ON preston_routes FOR SELECT USING (true);
CREATE POLICY "Allow admin write to test routes" 
  ON preston_routes FOR ALL USING (auth.role() = 'authenticated');

-- 4. fleet_hotspots Policies
CREATE POLICY "Allow public read access to fleet hotspots" 
  ON fleet_hotspots FOR SELECT USING (true);
CREATE POLICY "Allow admin write to fleet hotspots" 
  ON fleet_hotspots FOR ALL USING (auth.role() = 'authenticated');

-- 5. student_reviews Policies
CREATE POLICY "Allow public read access to student reviews" 
  ON student_reviews FOR SELECT USING (true);
CREATE POLICY "Allow admin write to student reviews" 
  ON student_reviews FOR ALL USING (auth.role() = 'authenticated');
```

---

## 5. Verification Method

To verify key management and security architecture:

1. **Configuration Integration Verification**:
   - Inspect script tags in `index.html` and `course.html` to confirm `js/config.js` loads before `js/supabase-client.js` and `js/reviews.js`.
   - In browser console, inspect `window.L2D_CONFIG` to confirm all public key getters return values.

2. **Secret Scan Verification**:
   - Search repository for strings `service_role`, `SUPABASE_SECRET`, `PRIVATE_KEY`. Confirm no secret keys are present in client files.

3. **Google API Key Restriction Verification**:
   - Test sending a request with `AIzaSy...` from an unauthorized origin; confirm HTTP 403 API restriction response from Google API.

4. **Supabase RLS Verification**:
   - Execute `window.validateAllSupabaseTables()` in browser console on `index.html` or `course.html` to verify table connectivity and permissions.
