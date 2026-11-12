# Learner2Driver

The website for Learner2Driver, a driving school in Preston: a homepage that ends in a
WhatsApp booking message, and a video course for current students.

Plain HTML, CSS and JavaScript modules. There is no build step. Data and sign-in are on Supabase.

## What is where

| Path | What it is |
| --- | --- |
| `index.html` | The homepage |
| `course.html` | The video course: student sign-in, the lessons, and the instructor's desk |
| `css/tokens.css` | Colours, type and spacing. Change the look here |
| `css/base.css`, `css/site.css` | Base rules, then every page style |
| `js/main.js` | Starts the homepage. Each feature is its own file beside it |
| `js/course.js`, `js/desk.js` | The course page for students, and for the instructor |
| `js/auth.js`, `js/edit.js` | Instructor sign-in and click-to-edit |
| `img/` | The built-in photographs |
| `supabase/` | Database scripts, run by hand in the Supabase SQL Editor, in number order |
| `PRODUCT.md` | Who the site is for and what it has to do |

## How the content works

- The wording in the HTML is the default. When the instructor signs in (footer, "Instructor
  sign-in") every outlined piece of text can be clicked and changed. Edits are saved in the
  `site_settings` table under names starting `v2_`, as plain text, and replace the default.
- Route spots, tips and map pins are in `preston_routes`. Car hotspots are in `fleet_hotspots`.
- Replaced photographs go to the `site` storage bucket.
- The Google rating, review count and reviews are read live from Google. Instagram posts are
  read live from the feed. Nothing in those sections is written by hand.
- Students, their progress and the lessons are private tables. Students reach them only
  through the database functions in `supabase/003_students_course_and_photos.sql`.

Visitors can read the public content. Only a signed-in instructor can change anything; the
database enforces this (row-level security), not the page.

## Running it locally

The pages use JavaScript modules, which browsers will not load from a file. Serve the folder:

```
python -m http.server 8770
```

then open `http://127.0.0.1:8770/`.

## Deploying

Hostinger redeploys the site from the `main` branch on GitHub about a minute after a push.
Everything in the repository is published, so `.htaccess` blocks the files that are not part
of the site (`.md`, `.sql`, `supabase/`, tool folders).

`HOSTINGER_DEPLOYMENT_GUIDE.md` covers the domain, SSL and hosting setup. Its notes on file
layout describe the previous version of the site.
