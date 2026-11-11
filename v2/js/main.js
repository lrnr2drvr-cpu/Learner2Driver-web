import { loadContent } from './content.js';
import { initBooking, refreshBooking } from './booking.js';
import { initRoutes } from './routes.js';
import { initReviews } from './reviews.js';
import { initInstagram } from './instagram.js';
import { initReveal, initNav, initHotspots, initQuiz } from './ui.js';

// Everything that works without the network first.
initReveal();
initNav();
initBooking();
initQuiz();

// Then the live data. Each part fails on its own without affecting the rest.
loadContent().then((settings) => {
  refreshBooking();
  initReviews(settings.google_reviews_config);
});
initRoutes();
initHotspots();
initInstagram();
