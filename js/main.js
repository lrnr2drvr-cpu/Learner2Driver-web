import { loadContent } from './content.js';
import { initBooking, refreshBooking } from './booking.js';
import { initHero } from './hero.js';
import { initReveal, initNav, initDock, initHotspots, initQuiz, initHubSpot } from './ui.js';

// The page's own safety net (in the HTML) shows everything plainly if this file never
// runs. It has run, so that is called off; if it had already fired, the entrances are skipped.
clearTimeout(window.l2dWait);
if (window.l2dWentPlain) {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.remove('reveal'));
  document.documentElement.classList.add('js');
}

// The parts below load on their own, so if one fails to arrive (a dropped connection,
// a content blocker) only that part is missing.
const part = (file, run) => import(file).then(run).catch(() => {});

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
  part('./reviews.js', (m) => m.initReviews(settings.google_reviews_config, settings.google_cache));
  part('./instagram.js', (m) => m.initInstagram(settings.v2_instagram_feed));
  initHubSpot(settings.hubspot_portal_id);
});
part('./routes.js', (m) => m.initRoutes());
initHotspots();

// The instructor's sign-in and, once signed in, click-to-edit.
part('./account.js', (m) => m.initAccount());
