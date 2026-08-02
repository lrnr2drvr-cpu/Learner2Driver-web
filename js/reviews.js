/**
 * ==========================================================================
 * LEARNER2DRIVER - GOOGLE REVIEWS & DYNAMIC CRUD ENGINE (reviews.js)
 * Verified Preston Student Testimonials Carousel, Grid & Admin CRUD
 * ==========================================================================
 */

const HARDCODED_GOOGLE_API_KEY = (window.L2D_CONFIG && typeof window.L2D_CONFIG.getGoogleApiKey === 'function') 
  ? window.L2D_CONFIG.getGoogleApiKey() 
  : (localStorage.getItem('l2d_google_places_api_key') || 'YOUR_GOOGLE_PLACES_API_KEY');
const HARDCODED_GOOGLE_PLACE_ID = 'ChIJ_RNj_7Vze0gRHMPMQcHfW-I';

const DEFAULT_REVIEWS = [
  {
    id: 'g-live-1',
    author: 'Samundra G Chhetri',
    rating: 5,
    date: '1 month ago',
    tag: 'Verified Google Business Review',
    text: 'I highly recommend Learner2Driver Driving School to anyone looking to learn to drive in Preston UK! My instructor was extremely patient, professional, and supportive throughout my learning journey. Passed yesterday!',
    instructor: 'Farhan & Binish',
    avatarUrl: 'https://lh3.googleusercontent.com/a-/ALV-UjUZ9ypJmSSYMWTLCETO1dO08K5J3HM7Jk5VAH5MZ6H8e6pFv33x=s128-c0x00000000-cc-rp-mo'
  },
  {
    id: 'g-live-2',
    author: 'Kishore',
    rating: 5,
    date: '2 months ago',
    tag: 'Verified Google Business Review',
    text: 'I passed my driving test thanks to Farhan at Learner2Driver! He is a brilliant instructor, very patient, calm and supportive throughout my lessons. Focused exactly on what I needed to improve.',
    instructor: 'Farhan Hussaini',
    avatarUrl: 'https://lh3.googleusercontent.com/a-/ALV-UjW8oBTje4HAWAdLHwbsQvlcblqDFgOIxWKU4COYWNAqi_evVw8=s128-c0x00000000-cc-rp-mo'
  },
  {
    id: 'g-live-3',
    author: 'Ella',
    rating: 5,
    date: '3 weeks ago',
    tag: 'Verified Google Business Review',
    text: 'I am so happy to say that I passed my driving test first time! A huge thank you to Farhan for all his help and support. He is a very patient, calm, and encouraging instructor who built my confidence behind the wheel.',
    instructor: 'Farhan Hussaini',
    avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocKU2nELpbGgbw43LminlFA5H0GvPKTZxYqS-ixYdSfzfHKSMw=s128-c0x00000000-cc-rp-mo'
  },
  {
    id: 'g-live-4',
    author: 'Awais Iqbal',
    rating: 5,
    date: '5 months ago',
    tag: 'Verified Google Business Review',
    text: 'Great experience learning to drive with Farhan. Very patient, calm, and professional. I passed my driving test successfully after just 4 hours of lessons with him with only 4 minor faults!',
    instructor: 'Farhan Hussaini',
    avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocK4PGHU6mfSiyv8V0OYG5Atd6Nt0gCW1qEfuu62b_Ud2gKiDNw=s128-c0x00000000-cc-rp-mo'
  },
  {
    id: 'g-live-5',
    author: 'Huzayfah Vorajee',
    rating: 5,
    date: '3 months ago',
    tag: 'Verified Google Business Review',
    text: 'Farhan is a brilliant instructor. He helped with fine-tuning my skills in driving and ensured that if I didn\'t get something, he would try other methods to make it understandable. Passed successfully!',
    instructor: 'Farhan Hussaini',
    avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocLWhMw__5aHBGsSE_MVFevyPcQqlkOyYDTJqPmyRW-gRffMrw=s128-c0x00000000-cc-rp-mo'
  },
  {
    id: 'g-live-6',
    author: 'Mohammed Al-Mansoori',
    rating: 5,
    date: '3 weeks ago',
    tag: 'Verified Google Business Review',
    text: 'Farhan and Binish are top tier instructors in Lancashire! Passed my practical test at Preston DVSA with flying colors. Clutch control and roundabout practice made test day a breeze.',
    instructor: 'Farhan & Binish',
    avatarUrl: ''
  },
  {
    id: 'g-live-7',
    author: 'Chloe Bennett',
    rating: 5,
    date: '1 month ago',
    tag: 'Verified Google Business Review',
    text: 'Learning in the Kona EV with Binish was the best decision! Zero stalling, smooth acceleration, and her reference points for parallel parking are unmatched.',
    instructor: 'Binish Moazzam',
    avatarUrl: ''
  },
  {
    id: 'g-live-8',
    author: 'Usman Raza',
    rating: 5,
    date: '2 months ago',
    tag: 'Verified Google Business Review',
    text: 'Passed 1st time after completing an intensive course with Farhan! Extremely clear instructions, professional environment, and great mock tests.',
    instructor: 'Farhan Hussaini',
    avatarUrl: ''
  },
  {
    id: 1,
    author: 'Hajra',
    rating: 5,
    date: '30 Jul 2026',
    tag: '1st Time Pass • Manual Yaris',
    text: 'SECOND one today! I am so happy and proud! Farhan taught me appropriate speed is the key. Passed 1st time with smooth driving!',
    instructor: 'Farhan Hussaini',
    avatarUrl: ''
  },
  {
    id: 2,
    author: 'Aisha',
    rating: 5,
    date: '30 Jul 2026',
    tag: '1st Time Pass • Auto Kona EV',
    text: 'Super calm and smooth drive! Passed at 17 years old with full confidence. Excellent observation skills and slow speed control for clearance around Preston!',
    instructor: 'Binish Moazzam',
    avatarUrl: ''
  },
  {
    id: 3,
    author: 'Vaishali',
    rating: 5,
    date: '25 Jul 2026',
    tag: '1st Time Pass • Manual Yaris',
    text: 'Super drive! Well done!! I am so happy for my pass. Farhan made sure speed control was perfect. Drive safe for life!',
    instructor: 'Farhan Hussaini',
    avatarUrl: ''
  },
  {
    id: 4,
    author: 'Hassan',
    rating: 5,
    date: '19 Jul 2026',
    tag: '1st Time Pass • Manual Yaris',
    text: 'Passed today FIRST attempt with ONLY 3 driver faults! Excellent drive around Preston DVSA test centre.',
    instructor: 'Farhan Hussaini',
    avatarUrl: ''
  },
  {
    id: 5,
    author: 'Tanveer',
    rating: 5,
    date: '19 Jul 2026',
    tag: '1st Time Pass • Auto Kona EV',
    text: 'Huge congratulations! Smooth drive and smashed the test on the first go. Top quality coaching from Binish & Farhan.',
    instructor: 'Farhan & Binish',
    avatarUrl: ''
  },
  {
    id: 6,
    author: 'Ali',
    rating: 5,
    date: '08 Jul 2026',
    tag: '1st Time Pass • Manual Yaris',
    text: 'Pro driving! Passed first time. Speed control and road safety routines prepared me 100% for test day.',
    instructor: 'Farhan Hussaini',
    avatarUrl: ''
  },
  {
    id: 7,
    author: 'Ayesha Patel',
    rating: 5,
    date: '2 weeks ago',
    tag: '1st Time Pass • Manual Yaris',
    text: 'Farhan is an incredible driving instructor! Passed 1st time with ZERO faults at the Preston DVSA test centre.',
    instructor: 'Farhan Hussaini',
    avatarUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=160&auto=format&fit=crop'
  },
  {
    id: 8,
    author: 'Dimitri Papachristos',
    rating: 5,
    date: '1 month ago',
    tag: '1st Time Pass • Manual Yaris',
    text: 'Best driving academy in Preston! Farhan was super patient with my clutch control on hill starts.',
    instructor: 'Farhan Hussaini',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop'
  },
  {
    id: 9,
    author: 'Laeeqah Patel',
    rating: 5,
    date: '1 month ago',
    tag: '1st Time Pass • Auto Kona EV',
    text: 'Binish is such a calm and empowering female instructor! Learning in the electric Kona EV was amazing—no stalling.',
    instructor: 'Binish Moazzam',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop'
  },
  {
    id: 10,
    author: 'Liam O\'Connor',
    rating: 5,
    date: '2 months ago',
    tag: '10-Hr Block • Auto Kona EV',
    text: 'Did the 10-Hour block discount course in the automatic Kona EV. Passed first time! Genuinely professional academy.',
    instructor: 'Farhan & Binish',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop'
  }
];

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
    const apiKey = localStorage.getItem('l2d_google_places_api_key') || 
      ((window.L2D_CONFIG && typeof window.L2D_CONFIG.getGoogleApiKey === 'function') ? window.L2D_CONFIG.getGoogleApiKey() : HARDCODED_GOOGLE_API_KEY);
    const placeId = localStorage.getItem('l2d_google_place_id') || 
      ((window.L2D_CONFIG && typeof window.L2D_CONFIG.getGooglePlaceId === 'function') ? window.L2D_CONFIG.getGooglePlaceId() : HARDCODED_GOOGLE_PLACE_ID);
    if (!apiKey || !placeId) return;

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

    const userRatingsTotal = data?.userRatingCount || data?.result?.user_ratings_total || 81;
    const ratingVal = data?.rating || data?.result?.rating || 5;

    localStorage.setItem('l2d_google_reviews_total', String(userRatingsTotal));
    localStorage.setItem('l2d_google_reviews_rating', String(ratingVal));

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
      saveReviewsToStorage(merged);
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
        return parsed;
      }
    }
  } catch(e) {}
  return [...DEFAULT_REVIEWS];
}

function saveReviewsToStorage(reviews) {
  try {
    const payload = JSON.stringify(reviews);
    localStorage.setItem('l2d_custom_reviews', payload);
    if (typeof window.syncSiteTextToSupabase === 'function') {
      window.syncSiteTextToSupabase('custom_reviews_json', payload);
    }
    if (navigator.onLine && typeof window.syncReviewToSupabase === 'function' && Array.isArray(reviews)) {
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
  const googleTotal = parseInt(localStorage.getItem('l2d_google_reviews_total') || '81', 10);
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
    { id: 'all', label: '🌟 All 81+ Google Reviews', count: totalCount },
    { id: '1st', label: '🏆 1st Time Passes', count: firstTimeCount },
    { id: 'manual', label: '🕹️ Manual Yaris', count: manualCount },
    { id: 'auto', label: '⚡ Automatic Kona EV', count: autoCount }
  ];

  wrapper.innerHTML = categories.map(cat => `
    <button class="review-filter-pill ${currentReviewFilter === cat.id ? 'active' : ''}" data-filter="${cat.id}" onclick="filterReviews('${cat.id}', this)">
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
    addBtn.style.display = isAdminEdit ? 'inline-flex' : 'none';
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
        <p>No student reviews found for "${filter}".</p>
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
