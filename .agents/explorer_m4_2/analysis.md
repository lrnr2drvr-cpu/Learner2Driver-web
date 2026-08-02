# Dynamic Reviews CRUD & Custom Vehicle Filter Pills — Exploration & Technical Analysis Report

**Author:** M4 Explorer 2 (Dynamic Reviews CRUD Specialist)  
**Date:** 2026-08-01  
**Target Subsystem:** Dynamic Reviews Engine, Vehicle Filter Pills, Admin Hub Reviews CRUD, LocalStorage Persistence  

---

## 1. Executive Summary

This report presents a thorough technical analysis and implementation blueprint for **Dynamic Reviews CRUD & Custom Vehicle Filter Pills** in the Learner2Driver Preston Driving School web application.

### Key Objectives:
1. **Dynamic Filter Pill Generation (`#reviewFilters` / `.review-filter-pill`)**: Replace hardcoded HTML filter buttons in `index.html` with dynamically rendered filter pills computed directly from the active review dataset (default reviews merged with `l2d_custom_reviews` in `localStorage`). Unique vehicle model tags (e.g. `Manual Yaris`, `Auto Kona EV`, `1st Time Passes`, etc.) automatically generate pill buttons with active/inactive state toggling.
2. **Admin Reviews CRUD Engine**: Provide full Create, Read, Update, and Delete (CRUD) capabilities for student reviews. Enable administrators to add/edit/delete reviews both via a modal dialog on `index.html` (when Admin Edit Mode is active) and via a dedicated `💬 Reviews CRUD` tab in the Admin Hub on `course.html`.
3. **`l2d_custom_reviews` Persistence & Real-Time Sync**: Persist all custom and modified review items into `localStorage.getItem('l2d_custom_reviews')`. Changes instantly update card rendering (`.review-card`), filter pill counts, and broadcast updates across tabs via `window.dispatchEvent(new Event('storage'))`.
4. **Enhanced Review Card UI**: Enhance `.review-card` elements with student avatars (with default fallback initials/icons), star rating display (1-5 stars), instructor tags, pass date badges, and inline Admin edit/delete controls when in Admin mode.

---

## 2. Codebase Baseline Analysis

### 2.1 Existing Review Engine (`js/reviews.js`)
- **Current State**: Contains a hardcoded constant `GOOGLE_REVIEWS` array with 6 initial items.
- **Filtering**: Uses a static function `renderReviews(filter)` checking rigid strings (`'1st'`, `'manual'`, `'auto'`).
- **Pill Generation**: None. Filter buttons are hardcoded in `index.html`.
- **CRUD Operations**: None existing. No localStorage read/write for custom reviews.

### 2.2 Section Structure (`index.html`)
- **Location**: Lines 392–413 (`<section id="reviews">`).
- **Current Filters**: Hardcoded HTML `<button class="review-filter-btn">`.
- **Grid Container**: `<div id="reviewsGridBox" class="grid-3">`.
- **Missing Elements**: Dynamic filter container (`#reviewFilters`), Admin "+ Add Student Review" trigger, Review Modal Backdrop markup (`#reviewModalBackdrop`).

### 2.3 Admin Hub & Session Persistence (`course.html` & `js/course-player.js`)
- **Admin State**: Tracked by `localStorage.getItem('l2d_is_admin') === 'true'` and `window.L2D_EDIT_MODE`.
- **Admin Top Bar**: Managed by `initAdminTopBar()` in `js/app.js`.
- **Admin Hub Container**: Contains 3 tabs (`adminTabStudents`, `adminTabContentEditor`, `adminTabSiteSettings`). Needs 4th tab: `adminTabReviews` (`💬 Student Reviews CRUD`).

### 2.4 Styling System (`styles/widgets.css` & `styles/components.css`)
- **Existing Classes**: `.review-filter-btn`, `.glass-card`, `.badge`, `.modal-backdrop`, `.modal-window`.
- **Required Additions**: `.review-filter-pill`, `.review-card`, `.review-card-avatar`, `.review-rating-stars`, `.review-admin-actions`, `.star-rating-input`.

---

## 3. Architecture & Data Schema

### 3.1 Data Model Specification (`Review` Object)

```typescript
interface Review {
  id: string | number;       // Unique timestamp or ID string (e.g. "rev_1770000000000")
  author: string;            // Student Full Name (e.g. "Ayesha Patel")
  rating: number;            // 1 to 5 (Integer rating)
  date: string;              // Pass Date / Badge (e.g. "2 weeks ago", "Passed 15/07/2026")
  tag: string;               // Vehicle Model & Category Tag (e.g. "1st Time Pass • Manual Yaris")
  text: string;              // Detailed Review Text
  instructor: string;        // Instructor Name (e.g. "Farhan Hussaini", "Binish Moazzam", "Farhan & Binish")
  avatarUrl?: string;        // Optional URL for student photo
  isDefault?: boolean;       // Flag indicating seed default dataset
}
```

### 3.2 LocalStorage Storage Schema (`l2d_custom_reviews`)
- **Key Name**: `l2d_custom_reviews`
- **Read Logic**:
  1. Retrieve `localStorage.getItem('l2d_custom_reviews')`.
  2. If present and non-empty, parse JSON array.
  3. If absent or null, seed with `DEFAULT_REVIEWS` and save to `l2d_custom_reviews`.
- **Write Logic**:
  1. Save JSON stringified array to `localStorage.setItem('l2d_custom_reviews', JSON.stringify(reviews))`.
  2. Trigger UI re-render on active page.
  3. Dispatch `storage` event for multi-tab synchronization.

---

## 4. Dynamic Filter Pill Generation Engine

### 4.1 Tag Extraction & Category Normalization Algorithm
Reviews contain single or multi-part tags (e.g., `"1st Time Pass • Manual Yaris"` or `"Auto Kona EV"`).
The pill generator processes all active reviews to extract unique filter bubbles:

1. **Primary Filter**: Always includes `All Reviews (${totalCount})` with `data-filter="all"`.
2. **Parsed Category Pills**: Splits each review's `tag` string by bullet (`•`), comma (`,`), or slash (`/`).
3. **Unique Collection**: Maps individual trimmed tag tokens into a set:
   - Example extracted pills: `🏆 1st Time Passes`, `🕹️ Manual Yaris`, `⚡ Auto Kona EV`, `Female Tuition`, `Refresher`, etc.
4. **Dynamic Count Matching**: Counts how many reviews match each filter pill token.
5. **Rendering & Toggling**: Generates HTML pills into `#reviewFilters`. Clicking a pill toggles `.active` / `.inactive` styling and filters the review grid immediately.

### 4.2 Code Logic Flow:
```javascript
function extractUniqueReviewFilters(reviews) {
  const filterMap = new Map();
  filterMap.set('all', { label: `All Reviews (${reviews.length})`, filterKey: 'all', count: reviews.length });

  reviews.forEach(rev => {
    const rawTag = rev.tag || '';
    const parts = rawTag.split(/•|,|\//).map(s => s.trim()).filter(Boolean);
    parts.forEach(part => {
      const key = part.toLowerCase();
      if (!filterMap.has(key)) {
        filterMap.set(key, { label: part, filterKey: part, count: 1 });
      } else {
        filterMap.get(key).count++;
      }
    });
  });

  return Array.from(filterMap.values());
}
```

---

## 5. Admin Reviews CRUD UI & Modal Architecture

### 5.1 Admin Operations Overview

| Operation | Access Point 1 (Landing Page) | Access Point 2 (Admin Hub) |
|---|---|---|
| **Create** | "+ Add Student Review 💬" button on `#reviews` when Edit Mode ON | "+ Add New Review 💬" button on `adminTabReviews` panel |
| **Read** | Rendered `.review-card` items in `#reviewsGridBox` | Directory table listing in Admin Hub `adminPanelReviews` |
| **Update** | ✏️ Edit button on individual `.review-card` | Edit button on directory table row |
| **Delete** | 🗑️ Delete button on individual `.review-card` | Remove button on directory table row with confirm prompt |

### 5.2 Review Modal Dialog (`#reviewModalBackdrop`)
Fields configured in modal:
1. `reviewModalId` (Hidden input for Edit vs Create mode)
2. `reviewModalAuthor` (Student Name input, required)
3. `reviewModalTag` (Car Model Tag select or custom text input, e.g. `Manual Yaris`, `Auto Kona EV`, `1st Time Pass • Manual Yaris`)
4. `reviewModalInstructor` (Select: `Farhan Hussaini`, `Binish Moazzam`, `Farhan & Binish`)
5. `reviewModalRating` (Select or star rating: 1, 2, 3, 4, 5 stars)
6. `reviewModalDate` (Pass Date / Badge text, e.g. `2 weeks ago` or `Passed 15/07/2026`)
7. `reviewModalAvatar` (Avatar Image URL input with fallback)
8. `reviewModalText` (Textarea for review testimonial)

---

## 6. File-by-File Detailed Changes & Proposed Code

### 6.1 `js/reviews.js` (Complete Refactored Module)
Replaces hardcoded static script with full storage-backed dataset, dynamic filter pill generator, card renderer, and modal controller.

```javascript
/**
 * LEARNER2DRIVER - REVIEWS ENGINE & ADMIN CRUD (js/reviews.js)
 * Dynamic Review Filter Pills, LocalStorage Persistence & Admin Modal CRUD
 */

const DEFAULT_REVIEWS = [
  {
    id: 1,
    author: 'Ayesha Patel',
    rating: 5,
    date: '2 weeks ago',
    tag: '1st Time Pass • Manual Yaris',
    text: 'Farhan is an incredible driving instructor! Passed 1st time with ZERO faults at the Preston DVSA test centre. He explained all the tricky roundabouts around Chain Caul Way so clearly.',
    instructor: 'Farhan Hussaini',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop'
  },
  {
    id: 2,
    author: 'Dimitri Papachristos',
    rating: 5,
    date: '1 month ago',
    tag: '1st Time Pass • Manual Yaris',
    text: 'Best driving academy in Preston! Farhan was super patient with my clutch control on hill starts. Would 100% recommend to anyone wanting to pass quickly and safely.',
    instructor: 'Farhan Hussaini',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop'
  },
  {
    id: 3,
    author: 'Laeeqah Patel',
    rating: 5,
    date: '1 month ago',
    tag: '1st Time Pass • Auto Kona EV',
    text: 'Binish is such a calm and empowering female instructor! Learning in the electric Kona EV was amazing—no stalling and the cameras made reversing a breeze. Thank you Binish!',
    instructor: 'Binish Moazzam',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop'
  },
  {
    id: 4,
    author: 'Liam O\'Connor',
    rating: 5,
    date: '2 months ago',
    tag: '10-Hr Block • Auto Kona EV',
    text: 'Did the 10-Hour block discount course in the automatic Kona EV. Passed first time! Both Farhan and Binish run a genuinely professional academy.',
    instructor: 'Farhan & Binish',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop'
  },
  {
    id: 5,
    author: 'Zayn Ahmed',
    rating: 5,
    date: '3 months ago',
    tag: 'Manual Yaris • Refresher',
    text: 'Farhan helped me rebuild my driving confidence after failing with another school years ago. His mock practical tests are exactly like the real DVSA exam.',
    instructor: 'Farhan Hussaini',
    avatarUrl: ''
  },
  {
    id: 6,
    author: 'Sophie Turner',
    rating: 5,
    date: '3 months ago',
    tag: 'Female Tuition • Manual Yaris',
    text: 'Binish is so encouraging! She broke down parallel parking into simple reference points that work every single time. 5 stars!',
    instructor: 'Binish Moazzam',
    avatarUrl: ''
  }
];

let currentReviewFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initReviewsGrid();
  injectReviewModalMarkup();
});

window.loadReviewsFromStorage = function() {
  try {
    const raw = localStorage.getItem('l2d_custom_reviews');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading reviews from storage:', e);
  }
  // Initialize default seed dataset
  saveReviewsToStorage(DEFAULT_REVIEWS);
  return DEFAULT_REVIEWS;
};

window.saveReviewsToStorage = function(reviews) {
  try {
    localStorage.setItem('l2d_custom_reviews', JSON.stringify(reviews));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error saving reviews to storage:', e);
  }
};

function initReviewsGrid() {
  renderReviewFilters();
  renderReviews(currentReviewFilter);
}

window.renderReviewFilters = function() {
  const container = document.getElementById('reviewFilters');
  if (!container) return;

  const reviews = loadReviewsFromStorage();
  const filterMap = new Map();
  filterMap.set('all', { label: `All Reviews (${reviews.length})`, filterKey: 'all', count: reviews.length });

  reviews.forEach(rev => {
    const rawTag = rev.tag || '';
    const parts = rawTag.split(/•|,|\//).map(s => s.trim()).filter(Boolean);
    parts.forEach(part => {
      const key = part.toLowerCase();
      if (!filterMap.has(key)) {
        filterMap.set(key, { label: part, filterKey: part, count: 1 });
      } else {
        filterMap.get(key).count++;
      }
    });
  });

  const filters = Array.from(filterMap.values());

  container.innerHTML = filters.map(f => {
    const isActive = currentReviewFilter.toLowerCase() === f.filterKey.toLowerCase();
    let icon = '';
    if (f.filterKey === 'all') icon = '✨ ';
    else if (f.filterKey.toLowerCase().includes('manual') || f.filterKey.toLowerCase().includes('yaris')) icon = '🕹️ ';
    else if (f.filterKey.toLowerCase().includes('auto') || f.filterKey.toLowerCase().includes('kona')) icon = '⚡ ';
    else if (f.filterKey.toLowerCase().includes('1st')) icon = '🏆 ';

    return `
      <button class="review-filter-pill ${isActive ? 'active' : ''}" 
              data-filter="${f.filterKey}" 
              onclick="filterReviews('${f.filterKey}', this)">
        ${icon}${f.label} (${f.count})
      </button>
    `;
  }).join('');
};

window.renderReviews = function(filter) {
  currentReviewFilter = filter || 'all';
  const container = document.getElementById('reviewsGridBox');
  if (!container) return;

  const reviews = loadReviewsFromStorage();
  const filterLower = currentReviewFilter.toLowerCase();

  const filtered = reviews.filter(rev => {
    if (filterLower === 'all') return true;
    const tagLower = (rev.tag || '').toLowerCase();
    return tagLower.includes(filterLower);
  });

  const isAdminMode = localStorage.getItem('l2d_is_admin') === 'true' || window.L2D_EDIT_MODE;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-light);">
        <p style="font-size: 1.1rem;">No student reviews match the selected filter pill.</p>
        <button class="btn btn-secondary btn-sm mt-2" onclick="filterReviews('all')">Show All Reviews</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(rev => {
    const stars = '★'.repeat(rev.rating || 5) + '☆'.repeat(5 - (rev.rating || 5));
    const initial = (rev.author || 'S').charAt(0).toUpperCase();

    const avatarHtml = rev.avatarUrl 
      ? `<img src="${rev.avatarUrl}" alt="${rev.author}" class="review-card-avatar-img">`
      : `<div class="review-card-avatar-fallback">${initial}</div>`;

    const adminControlsHtml = isAdminMode ? `
      <div class="review-admin-controls" style="display:flex; gap:0.4rem; margin-top:0.75rem; border-top:1px dashed var(--border-color); padding-top:0.75rem;">
        <button class="btn btn-secondary btn-sm" onclick="openReviewModal('${rev.id}')" style="padding:2px 8px; font-size:0.75rem;">✏️ Edit</button>
        <button class="btn btn-accent btn-sm" onclick="deleteReview('${rev.id}')" style="padding:2px 8px; font-size:0.75rem; background:var(--color-red); color:#fff;">🗑️ Delete</button>
      </div>
    ` : '';

    return `
      <div class="glass-card review-card" style="padding: 1.75rem; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              ${avatarHtml}
              <div>
                <strong style="color: var(--text-main); font-size: 1.05rem; display: block;">${rev.author}</strong>
                <div style="font-size: 0.78rem; color: var(--text-light);">${rev.date} • Instructor: ${rev.instructor}</div>
              </div>
            </div>
            <div style="color: #F57C00; font-size: 1rem; font-weight: 700; white-space: nowrap;">
              ${stars}
            </div>
          </div>
          <p style="color: var(--text-main); font-size: 0.92rem; font-style: italic; margin-bottom: 1rem; line-height: 1.6;">
            "${rev.text}"
          </p>
        </div>
        <div>
          <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span class="badge badge-primary" style="font-size: 0.72rem;">${rev.tag}</span>
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--color-green);">✓ Verified Google Review</span>
          </div>
          ${adminControlsHtml}
        </div>
      </div>
    `;
  }).join('');
};

window.filterReviews = function(filterType, btnElem) {
  currentReviewFilter = filterType;
  renderReviewFilters();
  renderReviews(currentReviewFilter);
};

// Admin CRUD Operations
window.deleteReview = function(reviewId) {
  if (!confirm('Are you sure you want to permanently delete this student review?')) return;
  let reviews = loadReviewsFromStorage();
  reviews = reviews.filter(r => String(r.id) !== String(reviewId));
  saveReviewsToStorage(reviews);
  initReviewsGrid();
  if (typeof window.renderAdminReviewsTable === 'function') {
    window.renderAdminReviewsTable();
  }
  if (typeof window.showToast === 'function') {
    window.showToast('Student review deleted 🗑️');
  }
};

window.openReviewModal = function(reviewId) {
  const modal = document.getElementById('reviewModalBackdrop');
  if (!modal) return;

  const titleEl = document.getElementById('reviewModalTitleHeader');
  const idEl = document.getElementById('reviewModalId');
  const authorEl = document.getElementById('reviewModalAuthor');
  const tagEl = document.getElementById('reviewModalTag');
  const instEl = document.getElementById('reviewModalInstructor');
  const ratingEl = document.getElementById('reviewModalRating');
  const dateEl = document.getElementById('reviewModalDate');
  const avatarEl = document.getElementById('reviewModalAvatar');
  const textEl = document.getElementById('reviewModalText');

  if (reviewId) {
    const reviews = loadReviewsFromStorage();
    const rev = reviews.find(r => String(r.id) === String(reviewId));
    if (rev) {
      if (titleEl) titleEl.textContent = 'Edit Student Review';
      if (idEl) idEl.value = rev.id;
      if (authorEl) authorEl.value = rev.author || '';
      if (tagEl) tagEl.value = rev.tag || 'Manual Yaris';
      if (instEl) instEl.value = rev.instructor || 'Farhan Hussaini';
      if (ratingEl) ratingEl.value = rev.rating || 5;
      if (dateEl) dateEl.value = rev.date || 'Recently';
      if (avatarEl) avatarEl.value = rev.avatarUrl || '';
      if (textEl) textEl.value = rev.text || '';
    }
  } else {
    if (titleEl) titleEl.textContent = 'Add New Student Review';
    if (idEl) idEl.value = '';
    if (authorEl) authorEl.value = '';
    if (tagEl) tagEl.value = '1st Time Pass • Manual Yaris';
    if (instEl) instEl.value = 'Farhan Hussaini';
    if (ratingEl) ratingEl.value = '5';
    if (dateEl) dateEl.value = 'Just now';
    if (avatarEl) avatarEl.value = '';
    if (textEl) textEl.value = '';
  }

  modal.style.display = 'flex';
  if (authorEl) authorEl.focus();
};

window.closeReviewModal = function() {
  const modal = document.getElementById('reviewModalBackdrop');
  if (modal) modal.style.display = 'none';
};

window.saveReviewModal = function() {
  const id = document.getElementById('reviewModalId')?.value;
  const author = document.getElementById('reviewModalAuthor')?.value.trim();
  const tag = document.getElementById('reviewModalTag')?.value.trim();
  const instructor = document.getElementById('reviewModalInstructor')?.value || 'Farhan Hussaini';
  const rating = parseInt(document.getElementById('reviewModalRating')?.value || '5', 10);
  const date = document.getElementById('reviewModalDate')?.value.trim() || 'Recently';
  const avatarUrl = document.getElementById('reviewModalAvatar')?.value.trim() || '';
  const text = document.getElementById('reviewModalText')?.value.trim();

  if (!author || !text) {
    alert('Please enter both student name and review text.');
    return;
  }

  let reviews = loadReviewsFromStorage();

  if (id) {
    // Update existing
    const idx = reviews.findIndex(r => String(r.id) === String(id));
    if (idx > -1) {
      reviews[idx] = { ...reviews[idx], author, tag, instructor, rating, date, avatarUrl, text };
    }
  } else {
    // Create new
    const newReview = {
      id: 'rev_' + Date.now(),
      author,
      tag,
      instructor,
      rating,
      date,
      avatarUrl,
      text
    };
    reviews.unshift(newReview);
  }

  saveReviewsToStorage(reviews);
  closeReviewModal();
  initReviewsGrid();
  if (typeof window.renderAdminReviewsTable === 'function') {
    window.renderAdminReviewsTable();
  }
  if (typeof window.showToast === 'function') {
    window.showToast('Student review saved! 💾');
  }
};

function injectReviewModalMarkup() {
  if (document.getElementById('reviewModalBackdrop')) return;
  const modalDiv = document.createElement('div');
  modalDiv.id = 'reviewModalBackdrop';
  modalDiv.className = 'student-portal-gate';
  modalDiv.style.display = 'none';
  modalDiv.innerHTML = `
    <div class="student-portal-card" style="max-width: 580px;">
      <div style="margin-bottom: 1.25rem;">
        <span class="badge badge-primary mb-1">Reviews Manager</span>
        <h2 id="reviewModalTitleHeader" style="margin: 0;">Add New Student Review</h2>
      </div>

      <div style="text-align: left; margin-bottom: 1.5rem;">
        <input type="hidden" id="reviewModalId" value="">

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">Student Name:</label>
            <input type="text" id="reviewModalAuthor" class="portal-input" placeholder="e.g. Sarah Jenkins" required>
          </div>
          <div>
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">Rating (1-5 Stars):</label>
            <select id="reviewModalRating" class="portal-input">
              <option value="5">★★★★★ (5 Stars)</option>
              <option value="4">★★★★☆ (4 Stars)</option>
              <option value="3">★★★☆☆ (3 Stars)</option>
              <option value="2">★★☆☆☆ (2 Stars)</option>
              <option value="1">★☆☆☆☆ (1 Star)</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">Car Model / Tag:</label>
            <input type="text" id="reviewModalTag" class="portal-input" placeholder="e.g. 1st Time Pass • Manual Yaris" required>
          </div>
          <div>
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">Assigned Instructor:</label>
            <select id="reviewModalInstructor" class="portal-input">
              <option value="Farhan Hussaini">Farhan Hussaini</option>
              <option value="Binish Moazzam">Binish Moazzam</option>
              <option value="Farhan & Binish">Farhan & Binish</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">Pass Date / Badge:</label>
            <input type="text" id="reviewModalDate" class="portal-input" placeholder="e.g. 2 weeks ago or Passed 15/07/2026">
          </div>
          <div>
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">Student Avatar URL (Optional):</label>
            <input type="text" id="reviewModalAvatar" class="portal-input" placeholder="https://...">
          </div>
        </div>

        <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">Review Testimonial Text:</label>
        <textarea id="reviewModalText" class="portal-input" style="height: 100px; resize: vertical; margin-bottom: 0;" placeholder="Enter detailed student review..."></textarea>
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary w-full" onclick="closeReviewModal()">Cancel</button>
        <button class="btn btn-primary w-full" onclick="saveReviewModal()">Save Review 💬</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);
}
```

---

### 6.2 `index.html` (#reviews Section Update)
Update `#reviews` in `index.html` to host dynamic `#reviewFilters` and Admin triggers:

```html
  <!-- GOOGLE REVIEWS SECTION -->
  <section id="reviews">
    <div class="container">
      <div class="text-center mb-4">
        <span class="badge badge-primary mb-1">Verified Testimonials</span>
        <h2 data-editable-key="reviews_section_title">What Our Preston Students Say</h2>
        <p style="max-width: 600px; margin: 0 auto;">Read genuine feedback from learners who mastered the roads with Farhan and Binish.</p>

        <!-- Admin Add Review Trigger Button (Visible in Admin Edit Mode) -->
        <div id="adminReviewTriggerBox" style="margin-top: 1rem;">
          <button class="btn btn-primary btn-sm admin-only-inline-btn" onclick="openReviewModal()">+ Add New Student Review 💬</button>
        </div>

        <!-- Dynamically Generated Review Vehicle Filter Pills -->
        <div id="reviewFilters" class="review-filter-container mt-3">
          <!-- Injected via js/reviews.js -->
        </div>
      </div>

      <div id="reviewsGridBox" class="grid-3">
        <!-- Injected via js/reviews.js -->
      </div>
    </div>
  </section>
```

---

### 6.3 `course.html` & `js/course-player.js` (Admin Hub Reviews Tab Integration)

Add 4th tab button into `course.html`'s `.admin-nav-bar`:
```html
<button id="adminTabReviews" class="admin-tab-btn" role="tab" aria-selected="false" aria-controls="adminPanelReviews" tabindex="-1" onclick="switchAdminTab('reviews')">
  💬 Reviews CRUD Directory
</button>
```

Add tab panel container in `course.html`:
```html
<!-- 4. Reviews CRUD Directory Panel -->
<div id="adminPanelReviews" class="admin-tab-panel" role="tabpanel" aria-labelledby="adminTabReviews" hidden style="display: none;">
  <!-- Injected via renderAdminReviewsTable() in js/course-player.js -->
</div>
```

In `js/course-player.js`, add support for `switchAdminTab('reviews')` and `renderAdminReviewsTable()`:

```javascript
window.renderAdminReviewsTable = function() {
  const panel = document.getElementById('adminPanelReviews');
  if (!panel) return;

  const reviews = (typeof window.loadReviewsFromStorage === 'function') ? window.loadReviewsFromStorage() : [];

  const rowsHtml = reviews.map(rev => {
    const stars = '★'.repeat(rev.rating || 5) + '☆'.repeat(5 - (rev.rating || 5));
    return `
      <tr>
        <td><strong>👤 ${rev.author}</strong></td>
        <td><span class="badge badge-primary">${rev.tag}</span></td>
        <td><span class="badge badge-secondary">${rev.instructor}</span></td>
        <td><strong style="color: #F57C00;">${stars} (${rev.rating}/5)</strong></td>
        <td><span style="font-size: 0.85rem; color: var(--text-light);">${rev.date}</span></td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${rev.text}"</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-secondary btn-sm" onclick="openReviewModal('${rev.id}')" style="padding: 3px 8px; font-size: 0.75rem;">Edit</button>
            <button class="btn btn-accent btn-sm" onclick="deleteReview('${rev.id}')" style="padding: 3px 8px; font-size: 0.75rem; background: var(--color-red); color: #fff;">Remove</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  panel.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h3 style="margin: 0;">Student Reviews Directory & Management</h3>
          <p style="margin: 0; font-size: 0.88rem; color: var(--text-light);">Add, edit, or remove student pass testimonials and rating badges.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openReviewModal()">+ Add New Student Review 💬</button>
      </div>

      <div style="overflow-x: auto;">
        <table class="student-progress-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Car Model / Tag</th>
              <th>Instructor</th>
              <th>Rating</th>
              <th>Date</th>
              <th>Testimonial Text</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align: center; color: var(--text-light);">No reviews found. Click "+ Add New Student Review" to create one.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
};
```

---

### 6.4 `styles/widgets.css` & `styles/components.css` (CSS Extensions)

```css
/* Dynamic Review Filter Container & Pills */
.review-filter-container {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}

.review-filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 42px;
  padding: 0.55rem 1.15rem;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-sm);
  user-select: none;
}

.review-filter-pill:hover,
.review-filter-pill.active {
  background: var(--color-green);
  color: #FFFFFF;
  border-color: var(--color-green);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

/* Avatar Styling for Review Cards */
.review-card-avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-green);
}

.review-card-avatar-fallback {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(46, 125, 50, 0.15);
  color: var(--color-green);
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-green);
}

.admin-only-inline-btn {
  display: none;
}

body.admin-edit-mode .admin-only-inline-btn,
body.admin-mode-active .admin-only-inline-btn {
  display: inline-flex;
}
```

---

## 7. Verification Protocol & Invalidation Conditions

1. **Verification Command**: Open `index.html` and `course.html` in browser. Inspect `localStorage.getItem('l2d_custom_reviews')`.
2. **Pill Invalidation Test**: Add a review with a new unique tag `"Ford Fiesta Manual"`. Verify that a new pill `"Ford Fiesta Manual (1)"` appears dynamically without manual HTML changes.
3. **CRUD Persistence Test**:
   - Add new review via modal -> check item appears in `.review-card` grid.
   - Edit review text -> verify card text updates immediately.
   - Delete review -> verify card is removed and pill counts refresh.
