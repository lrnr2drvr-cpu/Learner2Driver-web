/**
 * ==========================================================================
 * LEARNER2DRIVER - GOOGLE REVIEWS & DYNAMIC CRUD ENGINE (reviews.js)
 * Verified Preston Student Testimonials Carousel, Grid & Admin CRUD
 * ==========================================================================
 */

const HARDCODED_GOOGLE_API_KEY = (window.L2D_CONFIG && typeof window.L2D_CONFIG.getGoogleApiKey === 'function') 
  ? window.L2D_CONFIG.getGoogleApiKey() 
  : (window.L2D_ENV && window.L2D_ENV.GOOGLE_PLACES_API_KEY ? window.L2D_ENV.GOOGLE_PLACES_API_KEY : '');
const HARDCODED_GOOGLE_PLACE_ID = (window.L2D_CONFIG && typeof window.L2D_CONFIG.getGooglePlaceId === 'function') 
  ? window.L2D_CONFIG.getGooglePlaceId() 
  : (window.L2D_ENV && window.L2D_ENV.GOOGLE_PLACE_ID ? window.L2D_ENV.GOOGLE_PLACE_ID : 'ChIJ_RNj_7Vze0gRHMPMQcHfW-I');

// No built-in reviews. Every review shown comes from the Google Business profile.
const DEFAULT_REVIEWS = [];

// Reviews pulled from Google have ids that start with "g-" followed by Google's own
// reference. "g-live-" was a hardcoded list and is not shown.
function isGoogleReview(rev) {
  const id = String(rev && rev.id !== undefined && rev.id !== null ? rev.id : '');
  return id.startsWith('g-') && !id.startsWith('g-live-');
}

let currentReviewFilter = 'all';
let reviewsDisplayLimit = 6;

function loadMoreReviews() {
  reviewsDisplayLimit += 6;
  renderReviews(currentReviewFilter);
}

function showAllReviews() {
  const reviews = loadReviewsFromStorage();
  reviewsDisplayLimit = reviews.length;
  renderReviews(currentReviewFilter);
}



async function fetchGoogleBusinessReviews() {
  try {
    const apiKey = localStorage.getItem('l2d_google_places_api_key') || HARDCODED_GOOGLE_API_KEY;
    const placeId = localStorage.getItem('l2d_google_place_id') || HARDCODED_GOOGLE_PLACE_ID;
    if (!apiKey || !placeId || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY') return;

    // Call Places API (New) endpoint with CORS proxy fallback
    const rawTarget = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId.trim())}?fields=reviews,rating,userRatingCount&key=${encodeURIComponent(apiKey.trim())}`;
    const proxyEndpoint = `https://api.allorigins.win/raw?url=${encodeURIComponent(rawTarget)}`;

    let response = null;
    try {
      response = await fetch(proxyEndpoint);
    } catch(e) {
      try {
        response = await fetch(rawTarget);
      } catch(err) {}
    }

    if (!response || !response.ok) return;
    const data = await response.json();

    // Store Google's own figures only; never fall back to a made-up count or rating.
    const userRatingsTotal = data?.userRatingCount || data?.result?.user_ratings_total;
    const ratingVal = data?.rating || data?.result?.rating;

    if (userRatingsTotal) localStorage.setItem('l2d_google_reviews_total', String(userRatingsTotal));
    if (ratingVal) localStorage.setItem('l2d_google_reviews_rating', String(ratingVal));

    const fetchedReviews = data?.reviews || data?.result?.reviews;
    if (Array.isArray(fetchedReviews) && fetchedReviews.length > 0) {
      const gReviews = fetchedReviews.map((g, idx) => {
        const authorName = g.authorAttribution?.displayName || g.author_name || 'Google Reviewer';
        const photoUrl = g.authorAttribution?.photoUri || g.profile_photo_url || '';
        const reviewText = g.text?.text || g.text || g.originalText?.text || '';
        const timeDesc = g.relativePublishTimeDescription || g.relative_time_description || 'Recently';

        return {
          id: `g-${g.name || g.time || idx}`,
          author: authorName,
          rating: g.rating || 5,
          date: timeDesc,
          tag: 'Verified Google Business Review',
          text: reviewText,
          instructor: 'Farhan & Binish',
          avatarUrl: photoUrl
        };
      });

      // SociableKit Accumulator Pattern: Merge API reviews into local & Supabase store without wiping previous ones
      const localReviews = loadReviewsFromStorage();
      const mergedMap = {};
      localReviews.forEach(r => {
        const key = r.id || `${r.author}-${(r.text||'').substring(0, 25)}`;
        mergedMap[key] = r;
      });
      gReviews.forEach(r => {
        const key = r.id || `${r.author}-${(r.text||'').substring(0, 25)}`;
        mergedMap[key] = r;
      });
      const merged = Object.values(mergedMap);
      // Visitors keep the merged list in their own browser; only the instructor's session writes it to the cloud.
      const isAdminSession = localStorage.getItem('l2d_is_admin') === 'true';
      saveReviewsToStorage(merged, { syncToCloud: isAdminSession });
    }
  } catch(e) {
    console.warn('Error polling Google Business Profile Reviews:', e);
  }
}

function loadReviewsFromStorage() {
  try {
    const data = localStorage.getItem('l2d_custom_reviews');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter(r => r && r.author && r.author !== 'undefined' && isGoogleReview(r));
        if (valid.length > 0) {
          return valid;
        }
      }
    }
  } catch(e) {}
  return [...DEFAULT_REVIEWS];
}

function saveReviewsToStorage(reviews, options) {
  const syncToCloud = !options || options.syncToCloud !== false;
  try {
    const payload = JSON.stringify(reviews);
    localStorage.setItem('l2d_custom_reviews', payload);
    if (syncToCloud && typeof window.syncSiteTextToSupabase === 'function') {
      window.syncSiteTextToSupabase('custom_reviews_json', payload);
    }
    if (syncToCloud && navigator.onLine && typeof window.syncReviewToSupabase === 'function' && Array.isArray(reviews)) {
      reviews.forEach(rev => window.syncReviewToSupabase(rev));
    }
    if (typeof window.renderReviews === 'function') {
      window.renderReviews(window.currentReviewFilter || 'all');
    }
    if (typeof window.renderAdminReviewsTable === 'function') {
      window.renderAdminReviewsTable();
    }
    window.dispatchEvent(new Event('storage'));
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchGoogleBusinessReviews();
  initReviewsGrid();
});

function initReviewsGrid() {
  const container = document.getElementById('reviewsGridBox');
  if (!container) return;

  renderReviews(currentReviewFilter);
}

function renderReviewFilterPills() {
  const wrapper = document.getElementById('reviewFilters');
  if (!wrapper) return;

  const reviews = loadReviewsFromStorage();
  const googleTotal = parseInt(localStorage.getItem('l2d_google_reviews_total') || '0', 10);
  const totalCount = Math.max(reviews.length, googleTotal);

  let firstTimeCount = 0;
  let manualCount = 0;
  let autoCount = 0;

  reviews.forEach(rev => {
    const tagLower = (rev.tag || '').toLowerCase();
    if (tagLower.includes('1st time') || tagLower.includes('1st')) firstTimeCount++;
    if (tagLower.includes('manual') || tagLower.includes('yaris')) manualCount++;
    if (tagLower.includes('auto') || tagLower.includes('kona')) autoCount++;
  });

  const categories = [
    { id: 'all', label: '<span data-editable-key="rev_cat_all">🌟 All 81+ Google Reviews</span>', count: totalCount },
    { id: '1st', label: '<span data-editable-key="rev_cat_1st">🏆 1st Time Passes</span>', count: firstTimeCount },
    { id: 'manual', label: '<span data-editable-key="rev_cat_manual">🕹️ Manual Yaris</span>', count: manualCount },
    { id: 'auto', label: '<span data-editable-key="rev_cat_auto">⚡ Automatic Kona EV</span>', count: autoCount }
  ];

  // Category pills only appear when there are reviews in them.
  wrapper.innerHTML = categories.filter(cat => cat.id === 'all' || cat.count > 0).map(cat => `
    <button class="review-filter-pill ${currentReviewFilter === cat.id ? 'active' : ''}" data-filter="${cat.id}" onclick="if(event && event.target && event.target.hasAttribute('contenteditable')) return; filterReviews('${cat.id}', this)">
      ${cat.label} <span class="pill-count">${cat.count}</span>
    </button>
  `).join('');
}

function renderReviews(filter) {
  if (currentReviewFilter !== filter) {
    reviewsDisplayLimit = 6;
  }
  currentReviewFilter = filter || 'all';
  const container = document.getElementById('reviewsGridBox');

  // Render pills if container exists
  renderReviewFilterPills();

  if (!container) return;

  const reviews = loadReviewsFromStorage();
  const isAdminEdit = window.L2D_EDIT_MODE || document.body.classList.contains('admin-edit-mode');

  const addBtn = document.getElementById('adminAddReviewBtn');
  if (addBtn) {
    // Reviews come from Google only, so there is nothing to add by hand.
    addBtn.style.display = 'none';
  }

  const filtered = reviews.filter(rev => {
    if (!filter || filter === 'all') return true;
    const lowerTag = (rev.tag || '').toLowerCase();
    const lowerFilter = filter.toLowerCase();
    if (lowerFilter === '1st') return lowerTag.includes('1st time') || lowerTag.includes('1st');
    if (lowerFilter === 'manual') return lowerTag.includes('manual');
    if (lowerFilter === 'auto') return lowerTag.includes('auto') || lowerTag.includes('kona');
    return lowerTag.includes(lowerFilter);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-light);">
        <p>Our reviews are on Google. <a href="https://search.google.com/local/reviews?placeid=${encodeURIComponent(HARDCODED_GOOGLE_PLACE_ID)}" target="_blank" rel="noopener noreferrer">Read them there</a>.</p>
      </div>
    `;
    return;
  }

  const visible = filtered.slice(0, reviewsDisplayLimit);

  const cardsHtml = visible.map(rev => {
    const stars = '★'.repeat(rev.rating || 5) + '☆'.repeat(5 - (rev.rating || 5));
    const avatar = `<div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--color-green, #10B981), var(--color-blue, #3B82F6)); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0; box-shadow: var(--shadow-sm);">${(rev.author || 'S').charAt(0).toUpperCase()}</div>`;

    return `
      <div class="glass-card review-card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);">
        ${isAdminEdit ? `
          <button class="btn btn-sm btn-danger" onclick="deleteReview('${rev.id}')" style="position: absolute; top: 12px; right: 12px; z-index: 10; padding: 0.2rem 0.5rem; font-size: 0.75rem;">🗑️ Delete</button>
        ` : ''}
        <div>
          <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1rem;">
            ${avatar}
            <div>
              <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0;">${rev.author}</h4>
              <span style="font-size: 0.78rem; color: var(--text-light);">${rev.date || 'Verified Learner'}</span>
            </div>
          </div>
          <div style="color: #F59E0B; font-size: 1.1rem; margin-bottom: 0.65rem;">${stars}</div>
          <span class="badge badge-primary" style="margin-bottom: 0.85rem; font-size: 0.75rem;">${rev.tag || 'Verified Pass'}</span>
          <p style="font-size: 0.92rem; color: var(--text-main); line-height: 1.65; margin: 0;">
            "${rev.text}"
          </p>
        </div>
        <div style="margin-top: 1.25rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-light);">
          <span>Instructor: <strong style="color: var(--text-main);">${rev.instructor || 'Farhan & Binish'}</strong></span>
          <span style="color: #4285F4; font-weight: 600;">✓ Verified Google Review ↗</span>
        </div>
      </div>
    `;
  }).join('');

  const googleMapsUrl = `https://search.google.com/local/reviews?placeid=ChIJ_RNj_7Vze0gRHMPMQcHfW-I`;
  const totalGoogleCount = localStorage.getItem('l2d_google_reviews_total') || '81';
  const hasMore = filtered.length > reviewsDisplayLimit;

  const loadMoreCta = `
    <div style="grid-column: 1 / -1; text-align: center; margin-top: 2rem; padding: 1.5rem; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-lg);">
      <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Showing ${visible.length} of ${filtered.length} Student Reviews (${totalGoogleCount}+ Total on Google Profile) 🌟</h4>
      <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
        ${hasMore ? `
          <button id="loadMoreReviewsBtn" onclick="loadMoreReviews()" class="btn btn-primary" style="padding: 0.75rem 1.75rem; font-size: 0.95rem; font-weight: 700; background: linear-gradient(135deg, var(--color-green, #10B981), #059669); border: none; cursor: pointer;">
            👇 Load More Reviews (${filtered.length - visible.length} Remaining)
          </button>
          <button id="showAllReviewsBtn" onclick="showAllReviews()" class="btn btn-secondary" style="padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 700; cursor: pointer;">
            ⚡ Show All On Page (${filtered.length})
          </button>
        ` : ''}
        <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 0.75rem 1.75rem; font-size: 0.95rem; font-weight: 700; background: linear-gradient(135deg, #4285F4, #34A853); border: none; display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none;">
          Read All ${totalGoogleCount}+ Reviews on Google Maps ↗
        </a>
      </div>
    </div>
  `;

  container.innerHTML = cardsHtml + loadMoreCta;
}

window.filterReviews = function(filterType, btnElem) {
  currentReviewFilter = filterType;
  renderReviews(filterType);
};

/**
 * Reviews CRUD Modal Functions
 */
window.openReviewModal = function(reviewId) {
  const modal = document.getElementById('reviewModalBackdrop');
  if (!modal) return;

  const idEl = document.getElementById('reviewModalId');
  const nameEl = document.getElementById('reviewStudentName');
  const tagEl = document.getElementById('reviewCarTag');
  const instEl = document.getElementById('reviewInstructor');
  const rateEl = document.getElementById('reviewRating');
  const dateEl = document.getElementById('reviewDate');
  const avatarEl = document.getElementById('reviewAvatarUrl');
  const textEl = document.getElementById('reviewText');
  const titleEl = document.getElementById('reviewModalTitle');

  if (reviewId) {
    const reviews = loadReviewsFromStorage();
    const rev = reviews.find(r => r.id === reviewId);
    if (!rev) return;

    if (titleEl) titleEl.textContent = 'Edit Student Review 💬';
    if (idEl) idEl.value = rev.id;
    if (nameEl) nameEl.value = rev.author || '';
    if (tagEl) tagEl.value = rev.tag || '';
    if (instEl) instEl.value = rev.instructor || 'Farhan Hussaini';
    if (rateEl) rateEl.value = rev.rating || 5;
    if (dateEl) dateEl.value = rev.date || '';
    if (avatarEl) avatarEl.value = rev.avatarUrl || '';
    if (textEl) textEl.value = rev.text || '';
  } else {
    if (titleEl) titleEl.textContent = 'Add New Student Review 💬';
    if (idEl) idEl.value = '';
    if (nameEl) nameEl.value = '';
    if (tagEl) tagEl.value = '1st Time Pass • Manual Yaris';
    if (instEl) instEl.value = 'Farhan Hussaini';
    if (rateEl) rateEl.value = 5;
    if (dateEl) dateEl.value = 'Recently';
    if (avatarEl) avatarEl.value = '';
    if (textEl) textEl.value = '';
  }

  modal.classList.add('active');
  if (nameEl) nameEl.focus();
};

window.closeReviewModal = function() {
  const modal = document.getElementById('reviewModalBackdrop');
  if (modal) modal.classList.remove('active');
};

window.saveReviewFromModal = function() {
  const idVal = document.getElementById('reviewModalId')?.value;
  const nameVal = document.getElementById('reviewStudentName')?.value.trim();
  const tagVal = document.getElementById('reviewCarTag')?.value.trim() || 'Manual Yaris';
  const instVal = document.getElementById('reviewInstructor')?.value || 'Farhan Hussaini';
  const rateVal = parseInt(document.getElementById('reviewRating')?.value || 5, 10);
  const dateVal = document.getElementById('reviewDate')?.value.trim() || 'Recently';
  const avatarVal = document.getElementById('reviewAvatarUrl')?.value.trim() || '';
  const textVal = document.getElementById('reviewText')?.value.trim();

  if (!nameVal || !textVal) {
    alert('Please enter student name and testimonial text.');
    return;
  }

  const reviews = loadReviewsFromStorage();
  let targetReview = null;

  if (idVal) {
    const revId = isNaN(Number(idVal)) ? idVal : parseInt(idVal, 10);
    const existing = reviews.find(r => r.id === revId || r.id === idVal);
    if (existing) {
      existing.author = nameVal;
      existing.tag = tagVal;
      existing.instructor = instVal;
      existing.rating = rateVal;
      existing.date = dateVal;
      existing.avatarUrl = avatarVal;
      existing.text = textVal;
      targetReview = existing;
    }
  } else {
    const newRev = {
      id: Date.now(),
      author: nameVal,
      tag: tagVal,
      instructor: instVal,
      rating: rateVal,
      date: dateVal,
      avatarUrl: avatarVal,
      text: textVal
    };
    reviews.unshift(newRev);
    targetReview = newRev;
  }

  saveReviewsToStorage(reviews);

  if (navigator.onLine && targetReview && typeof window.syncReviewToSupabase === 'function') {
    window.syncReviewToSupabase(targetReview);
  }

  closeReviewModal();
  renderReviews(currentReviewFilter);

  if (typeof window.renderAdminReviewsTable === 'function') {
    window.renderAdminReviewsTable();
  }

  if (typeof showToast === 'function') {
    showToast('Saved Student Review! 💬');
  }
};

window.deleteReview = function(reviewId) {
  if (!confirm('Are you sure you want to permanently delete this student review?')) return;

  let reviews = loadReviewsFromStorage();
  reviews = reviews.filter(r => r.id !== reviewId);
  saveReviewsToStorage(reviews);

  if (navigator.onLine && typeof window.deleteReviewFromSupabase === 'function') {
    window.deleteReviewFromSupabase(reviewId);
  }

  renderReviews(currentReviewFilter);

  if (typeof window.renderAdminReviewsTable === 'function') {
    window.renderAdminReviewsTable();
  }

  if (typeof showToast === 'function') {
    showToast('Deleted Student Review.');
  }
};

window.loadReviewsFromStorage = loadReviewsFromStorage;
window.saveReviewsToStorage = saveReviewsToStorage;
window.renderReviews = renderReviews;
window.renderReviewFilterPills = renderReviewFilterPills;
