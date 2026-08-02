# Learner2Driver Preston Web Platform

Learner2Driver is a driving school web platform and student LMS designed for Preston DVSA driving instruction. Built with native HTML5, CSS3, JavaScript, and Supabase.

## Features

- **Multi-Step Booking Concierge**: Interactive booking workflow for selecting instructors, vehicles, and lesson packages.
- **Student LMS Video Hub**: Structured DVSA curriculum player with lesson progress tracking and automated YouTube duration fetching.
- **Interactive Preston Test Routes Map**: Leaflet.js interactive map highlighting test route danger spots and insider tips.
- **Instructor Admin Portal**: Authentication system for inline text editing, student progress management, and review moderation.
- **Supabase Cloud Synchronization**: Bidirectional real-time database synchronization with offline fallback storage.

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Database & Sync**: Supabase (PostgreSQL, Realtime, Row-Level Security)
- **Mapping**: Leaflet.js
- **Media**: YouTube IFrame Player API

## Environment Configuration

Configuration settings are managed in `js/config.js` or via `window.L2D_CONFIG`:

```javascript
window.L2D_CONFIG = {
  getSupabaseUrl: () => 'YOUR_SUPABASE_URL',
  getSupabaseKey: () => 'YOUR_SUPABASE_ANON_KEY'
};
```

Refer to `.env.example` for environment variable templates.

## Deployment

Refer to `HOSTINGER_DEPLOYMENT_GUIDE.md` for complete deployment instructions, including web server setup, SSL configuration, Supabase CORS, and GitHub Actions CI/CD automation.

## License

All rights reserved © 2026 Learner2Driver Academy Preston.
