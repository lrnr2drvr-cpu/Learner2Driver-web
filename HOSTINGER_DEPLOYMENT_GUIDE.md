# Hostinger Deployment & Hosting Setup Guide for Learner2Driver

This guide covers step-by-step instructions for deploying and configuring the **Learner2Driver** driving school web platform (`learner2driver.net`) on Hostinger Shared Web Hosting / Cloud Hosting.

---

## 1. Overview & Architecture

Learner2Driver is a high-performance, purely static HTML5, CSS3, and JavaScript web application.
- **Frontend Stack**: Native HTML, CSS, Vanilla JS (No Node.js build process required on server).
- **Backend / Database**: Supabase (PostgreSQL, Realtime WebSockets, RLS Policies).
- **Storage / State**: Client-side `localStorage` with real-time bidirectional Supabase sync.
- **Hosting Provider**: Hostinger (hPanel).

---

## 2. Static File Upload to Hostinger (hPanel)

### Method A: hPanel File Manager
1. Log into your **Hostinger Account** -> **hPanel**.
2. Navigate to **Websites** -> select `learner2driver.net` -> **File Manager** (`public_html`).
3. Delete any default `default.php` or `index.php` placeholder files in `public_html`.
4. Upload all project root files and directories directly into `public_html`:
   - `index.html`
   - `course.html`
   - `css/` directory
   - `js/` directory (`config.js`, `supabase-client.js`, `app.js`, `reviews.js`, `widgets.js`, etc.)
   - `img/` directory
   - `.htaccess` (see section 4)

### Method B: FTP / SFTP Upload
1. In hPanel, go to **Files** -> **FTP Accounts**.
2. Note your **FTP Host, Username, Port (21 or 22)** and password.
3. Open an FTP client (FileZilla or Cyberduck).
4. Upload the workspace contents directly into `/domains/learner2driver.net/public_html/`.

---

## 3. Custom Domain & DNS Configuration (Hostinger / Registrar)

Ensure your domain `learner2driver.net` points correctly to Hostinger's edge servers.

### A-Records & CNAME Settings
In your DNS Zone Editor (Hostinger hPanel -> **DNS / Nameservers** or your domain registrar):

| Type | Name / Host | Value / Target | TTL | Description |
|------|-------------|----------------|-----|-------------|
| **A** | `@` | `YOUR_HOSTINGER_SERVER_IP` | 14400 | Points domain root to Hostinger server IP |
| **CNAME** | `www` | `learner2driver.net.` | 14400 | Alias www subdomain to main domain |

---

## 4. SSL / HTTPS Enforcement & `.htaccess`

Hostinger provides free Let's Encrypt SSL certificates.

1. In hPanel, go to **Security** -> **SSL** and click **Install SSL** for `learner2driver.net`.
2. Enable **Force HTTPS** toggle in hPanel.
3. Create or update `.htaccess` in your `public_html` root with the following optimization directives:

```htaccess
# Force HTTPS & WWW/Non-WWW Standardization
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Enable Gzip / Brotli Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching Headers
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 5. Supabase CORS Origin Configuration

To allow your static web application on `learner2driver.net` to query Supabase REST APIs and open Realtime WebSocket connections:

1. Log into your **Supabase Dashboard** (`https://supabase.com/dashboard`).
2. Select your project (`uxgychlmmnpfrnkhrhbc`).
3. Navigate to **Project Settings** -> **API**.
4. Scroll down to **CORS Settings** -> **Additional Allowed Origins**.
5. Add the following entries:
   - `https://learner2driver.net`
   - `https://www.learner2driver.net`
   - `http://localhost:5500` (for local development)
6. Save settings.

---

## 6. Google Places API Referrer Restriction

To protect your Google Places API Key from unauthorized usage while remaining functional on client browsers:

1. Log into **Google Cloud Console** (`https://console.cloud.google.com/`).
2. Go to **APIs & Services** -> **Credentials**.
3. Select your Google Places API key (`AIzaSyA8Uo...`).
4. Under **Application Restrictions**, select **Websites**.
5. Under **Website Restrictions**, click **Add an Item** and add:
   - `https://learner2driver.net/*`
   - `https://www.learner2driver.net/*`
   - `http://localhost/*`
6. Under **API Restrictions**, select **Restrict Key** and choose **Places API (New)**.
7. Click **Save**.

---

## 7. Supabase Database Migration & Row Level Security (RLS) DDL

To replicate or initialize the production Supabase database schema and RLS policies, execute the following SQL DDL statements in the **Supabase SQL Editor**:

```sql
-- 1. Create site_settings table (JSON store for site text & config)
CREATE TABLE IF NOT EXISTS public.site_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create student_reviews table
CREATE TABLE IF NOT EXISTS public.student_reviews (
  review_id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  date_description TEXT,
  tag_badge TEXT,
  review_text TEXT NOT NULL,
  instructor_name TEXT DEFAULT 'Farhan Hussaini',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create preston_routes table
CREATE TABLE IF NOT EXISTS public.preston_routes (
  spot_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  location_name TEXT NOT NULL,
  insider_tip TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create fleet_hotspots table
CREATE TABLE IF NOT EXISTS public.fleet_hotspots (
  car_key TEXT NOT NULL,
  hotspot_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pos_x DOUBLE PRECISION NOT NULL,
  pos_y DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (car_key, hotspot_id)
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preston_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_hotspots ENABLE ROW LEVEL SECURITY;

-- 6. Create Anonymous Public Access Policies (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow public read access on site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on site_settings" ON public.site_settings FOR ALL USING (true);

CREATE POLICY "Allow public read access on student_reviews" ON public.student_reviews FOR SELECT USING (true);
CREATE POLICY "Allow public write access on student_reviews" ON public.student_reviews FOR ALL USING (true);

CREATE POLICY "Allow public read access on preston_routes" ON public.preston_routes FOR SELECT USING (true);
CREATE POLICY "Allow public write access on preston_routes" ON public.preston_routes FOR ALL USING (true);

CREATE POLICY "Allow public read access on fleet_hotspots" ON public.fleet_hotspots FOR SELECT USING (true);
CREATE POLICY "Allow public write access on fleet_hotspots" ON public.fleet_hotspots FOR ALL USING (true);
```

---

## 8. Automated GitHub Actions CI/CD Deployment Workflow

You can set up automatic deployment to Hostinger every time changes are pushed to your GitHub `main` branch via FTP/SFTP.

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy Learner2Driver to Hostinger

on:
  push:
    branches:
      - main

jobs:
  web-deploy:
    name: Deploy Static Website via FTP
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: FTP Deploy to Hostinger
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: ${{ secrets.HOSTINGER_FTP_SERVER }}
        username: ${{ secrets.HOSTINGER_FTP_USERNAME }}
        password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
        server-dir: /public_html/
        exclude: |
          **/.git**
          **/.git*/**
          .agents/**
          PROJECT.md
```

### Configuring GitHub Secrets
1. Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Add the following repository secrets:
   - `HOSTINGER_FTP_SERVER`: Your FTP server hostname (e.g. `ftp.learner2driver.net`).
   - `HOSTINGER_FTP_USERNAME`: Your Hostinger FTP username.
   - `HOSTINGER_FTP_PASSWORD`: Your Hostinger FTP password.

---
*Guide maintained for Learner2Driver Preston.*
