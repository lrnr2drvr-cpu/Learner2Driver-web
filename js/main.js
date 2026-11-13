import { loadContent } from './content.js';
import { initBooking, refreshBooking } from './booking.js';
import { initHero } from './hero.js';
import { initRoutes } from './routes.js';
import { initReviews } from './reviews.js';
import { initInstagram } from './instagram.js';
import { initReveal, initNav, initDock, initHotspots, initQuiz, initHubSpot } from './ui.js';
import { initAccount } from './account.js';

// Everything that works without the network first.
initReveal();
initNav();
initDock();
initBooking();
initHero();
initQuiz();

// Then the live data. Each part fails on its own without affecting the rest.
loadContent().then((settings) => {
  refreshBooking();
  initReviews(settings.google_reviews_config, settings.google_cache);
  initInstagram(settings.v2_instagram_feed);
  initHubSpot(settings.hubspot_portal_id);
});
initRoutes();
initHotspots();

// The instructor's sign-in and, once signed in, click-to-edit.
initAccount();
