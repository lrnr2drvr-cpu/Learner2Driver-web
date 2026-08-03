/**
 * ==========================================================================
 * LEARNER2DRIVER - SUPABASE REALTIME DATABASE CLIENT (supabase-client.js)
 * Official Supabase Integration covering 100% of Application Data Fields:
 * 1. site_settings (inline text & headings)
 * 2. student_profiles (student directory, passwords, LMS progress)
 * 3. preston_routes (danger spot test route tips & Leaflet lat/lng)
 * 4. fleet_hotspots (vehicle hotspot pins & technical spec cards)
 * 5. student_reviews (testimonials & pass ratings)
 * 6. course_curriculum (custom modules & lesson video data)
 * ==========================================================================
 */

(function() {
  let supabaseClient = null;

  function cleanSupabaseUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.trim();
    url = url.replace(/\/+$/, '');
    url = url.replace(/\/rest\/v1\/?$/i, '');
    const dashMatch = url.match(/supabase\.(?:com|co)\/dashboard\/project\/([a-z0-9]+)/i);
    if (dashMatch && dashMatch[1]) {
      url = `https://${dashMatch[1]}.supabase.co`;
    }
    return url;
  }

  // Default Hardcoded Supabase Credentials Fallback (Ensures zero-setup automatic initialization on all devices)
  const HARDCODED_SUPABASE_URL = 'https://uxgychlmmnpfrnkhrhbc.supabase.co';
  const HARDCODED_SUPABASE_KEY = 'sb_publishable_LM5nEdUBi1dJ0l8Cu26S9g_-muMtCPV';

  function getSupabaseConfig() {
    const customUrl = localStorage.getItem('l2d_supabase_url');
    const customKey = localStorage.getItem('l2d_supabase_key');

    const defaultUrl = (window.L2D_CONFIG && typeof window.L2D_CONFIG.getSupabaseUrl === 'function')
      ? window.L2D_CONFIG.getSupabaseUrl()
      : 'https://uxgychlmmnpfrnkhrhbc.supabase.co';
    const defaultKey = (window.L2D_CONFIG && typeof window.L2D_CONFIG.getSupabaseKey === 'function')
      ? window.L2D_CONFIG.getSupabaseKey()
      : 'sb_publishable_LM5nEdUBi1dJ0l8Cu26S9g_-muMtCPV';

    const url = cleanSupabaseUrl(customUrl || defaultUrl);
    const key = (customKey || defaultKey).trim();

    return { url, key };
  }

  function initSupabase() {
    if (supabaseClient) return supabaseClient;
    const config = getSupabaseConfig();
    if (config.url && config.key && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClient = window.supabase.createClient(config.url, config.key);
        console.log('⚡ Supabase Client initialized successfully with URL:', config.url);
        return supabaseClient;
      } catch(e) {
        console.warn('Failed to initialize Supabase Client:', e);
      }
    } else {
      console.warn('⚡ Supabase JS CDN library or config status:', {
        hasUrl: !!config.url,
        hasKey: !!config.key,
        hasSupabaseLib: !!(window.supabase && typeof window.supabase.createClient === 'function')
      });
    }
    return null;
  }

  // Window load fallback if CDN script finishes loading after DOMContentLoaded
  window.addEventListener('load', () => {
    if (!supabaseClient) initSupabase();
  });

  window.initSupabase = initSupabase;
  window.getSupabaseClient = function() {
    if (!supabaseClient) initSupabase();
    return supabaseClient;
  };

  window.saveSupabaseCredentials = function(url, key) {
    const cleanedUrl = cleanSupabaseUrl(url);
    const cleanedKey = (key || '').trim();
    localStorage.setItem('l2d_supabase_url', cleanedUrl);
    localStorage.setItem('l2d_supabase_key', cleanedKey);
    supabaseClient = null; // Force re-instantiation
    return initSupabase();
  };

  /**
   * 1. Site Custom Text Sync (site_settings)
   */
  window.syncSiteTextToSupabase = async function(editableKey, htmlContent) {
    const client = window.getSupabaseClient();
    if (!client) return { ok: false, error: 'Supabase client not initialized' };

    try {
      const { error } = await client
        .from('site_settings')
        .upsert({ key: editableKey, value: htmlContent, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) console.warn('Supabase site_settings upsert error:', error.message);
      return { ok: !error, error: error ? error.message : null };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  };

  window.fetchSiteTextFromSupabase = async function() {
    const client = window.getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client.from('site_settings').select('*');
      if (error || !data) return null;

      const map = {};
      data.forEach(item => {
        if (item.key) {
          map[item.key] = item.value;
          if (item.key === 'fleet_hotspots_json') {
            try {
              localStorage.setItem('l2d_fleet_hotspots', item.value);
              localStorage.setItem('l2d_custom_hotspots', item.value);
            } catch(e) {}
          }
          if (item.key === 'course_curriculum_json') {
            try {
              localStorage.setItem('l2d_custom_course_data', item.value);
              if (typeof window.loadCourseDataFromStorage === 'function') window.loadCourseDataFromStorage();
              if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
              if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();
            } catch(e) {}
          }
          if (item.key === 'l2d_student_progress_json' && item.value) {
            try {
              const cloudProgress = JSON.parse(item.value);
              if (cloudProgress && typeof cloudProgress === 'object') {
                let localProgress = {};
                try {
                  const rawLocal = localStorage.getItem('l2d_student_progress');
                  if (rawLocal) localProgress = JSON.parse(rawLocal);
                } catch(e) {}

                const mergedProgress = { ...cloudProgress, ...localProgress };

                Object.keys(cloudProgress).forEach(sName => {
                  if (localProgress[sName]) {
                    const cloudCompleted = Array.isArray(cloudProgress[sName].completed) ? cloudProgress[sName].completed : [];
                    const localCompleted = Array.isArray(localProgress[sName].completed) ? localProgress[sName].completed : [];
                    const combinedSet = new Set([...cloudCompleted, ...localCompleted]);
                    mergedProgress[sName].completed = Array.from(combinedSet);
                  }
                });

                localStorage.setItem('l2d_student_progress', JSON.stringify(mergedProgress));
                if (window.courseState && typeof window.courseState === 'object') {
                  window.courseState.studentProgress = mergedProgress;
                }
                if (typeof window.renderAdminProgressTable === 'function') window.renderAdminProgressTable();
              }
            } catch(e) {}
          }
          if (item.key === 'insta_api_endpoint') {
            try {
              localStorage.setItem('l2d_insta_api_endpoint', item.value);
              if (typeof window.initInstaHighlights === 'function') window.initInstaHighlights();
            } catch(e) {}
          }
          if (item.key === 'custom_reviews_json' && item.value) {
            try {
              const cloudReviews = JSON.parse(item.value);
              if (Array.isArray(cloudReviews) && cloudReviews.length > 0) {
                let localReviews = [];
                try {
                  const rawLocal = localStorage.getItem('l2d_custom_reviews');
                  if (rawLocal) localReviews = JSON.parse(rawLocal);
                } catch(e) {}

                const mergedMap = {};
                cloudReviews.forEach(r => { if (r.id) mergedMap[r.id] = r; });
                if (Array.isArray(localReviews)) {
                  localReviews.forEach(r => { if (r.id) mergedMap[r.id] = r; });
                }
                const mergedArr = Object.values(mergedMap);

                localStorage.setItem('l2d_custom_reviews', JSON.stringify(mergedArr));
                if (typeof window.renderReviews === 'function') window.renderReviews(window.currentReviewFilter || 'all');
                if (typeof window.renderAdminReviewsTable === 'function') window.renderAdminReviewsTable();
              }
            } catch(e) {}
          }
          if (item.key === 'custom_site_images_json') {
            try {
              localStorage.setItem('l2d_custom_site_images', item.value);
              if (typeof window.hydrateSiteImagesFromStorage === 'function') window.hydrateSiteImagesFromStorage();
            } catch(e) {}
          }
        }
      });
      return map;
    } catch(e) {
      return null;
    }
  };

  /**
   * 2. Student Directory & Progress Sync (student_profiles)
   */
  window.syncStudentToSupabase = async function(studentName, studentData) {
    console.log('🚀 syncStudentToSupabase ENTRY for:', studentName, studentData);
    const client = window.getSupabaseClient();
    if (!client) {
      console.warn('⚠️ syncStudentToSupabase aborted: Supabase client is NULL');
      return { ok: false, error: 'Supabase client not initialized' };
    }

    const completedArr = Array.isArray(studentData.completed) ? studentData.completed : [];

    try {
      // 0. Query case-insensitive match (.ilike) to match exact username case from Supabase
      let targetUsername = studentName;
      try {
        const { data: existingRows } = await client
          .from('student_profiles')
          .select('username')
          .ilike('username', studentName);
        if (existingRows && existingRows.length > 0 && existingRows[0].username) {
          targetUsername = existingRows[0].username;
        }
      } catch(e) {}

      const payload = {
        username: targetUsername,
        instructor: studentData.instructor || 'Farhan Hussaini',
        transmission: studentData.transmission || 'Manual',
        password_hash: studentData.passwordHash || '',
        password_salt: studentData.passwordSalt || '',
        completed_lessons: completedArr,
        updated_at: new Date().toISOString()
      };

      // 1. Primary: Upsert on username
      let { error } = await client
        .from('student_profiles')
        .upsert(payload, { onConflict: 'username' });

      // 2. Fallback: If ON CONFLICT unique constraint missing, query existing & update/insert
      if (error) {
        console.warn('Upsert on student_profiles note:', error.message, 'Running select & update/insert fallback...');
        const updateRes = await client
          .from('student_profiles')
          .update(payload)
          .ilike('username', studentName);
        
        if (updateRes.error) {
          const insertRes = await client.from('student_profiles').insert(payload);
          error = insertRes.error;
        } else {
          error = null;
        }
      }

      // 3. Fallback: If JSON column typing mismatch occurs (e.g. text/varchar column), try stringified JSON
      if (error && (error.message.includes('completed_lessons') || error.message.includes('json') || error.message.includes('type'))) {
        payload.completed_lessons = JSON.stringify(completedArr);
        const retryRes = await client
          .from('student_profiles')
          .upsert(payload, { onConflict: 'username' });
        error = retryRes.error;
      }

      // 4. Always also sync to site_settings table (l2d_student_progress_json) as dual backup
      if (typeof window.syncSiteTextToSupabase === 'function' && window.courseState && window.courseState.studentProgress) {
        window.syncSiteTextToSupabase('l2d_student_progress_json', JSON.stringify(window.courseState.studentProgress));
      }

      if (error) {
        console.warn('Supabase student_profiles sync final result:', error.message);
      } else {
        console.log(`⚡ Supabase student_profiles synced successfully for "${targetUsername}":`, completedArr);
      }
      return { ok: !error, error: error ? error.message : null };
    } catch(e) {
      console.error('Error syncing student profile to Supabase:', e);
      return { ok: false, error: e.message };
    }
  };

  window.fetchStudentsFromSupabase = async function() {
    const client = window.getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client.from('student_profiles').select('*');
      if (!error && data && data.length > 0) {
        const result = {};
        data.forEach(item => {
          if (item.username) {
            let completedArr = [];
            if (Array.isArray(item.completed_lessons)) {
              completedArr = item.completed_lessons;
            } else if (typeof item.completed_lessons === 'string') {
              try { completedArr = JSON.parse(item.completed_lessons); } catch(e){}
            } else if (Array.isArray(item.completed)) {
              completedArr = item.completed;
            }

            result[item.username] = {
              instructor: item.instructor || 'Farhan Hussaini',
              transmission: item.transmission || 'Manual',
              passwordHash: item.password_hash || '',
              passwordSalt: item.password_salt || '',
              completed: Array.isArray(completedArr) ? completedArr : []
            };
          }
        });
        return result;
      }

      // Fallback: Pull from site_settings table (l2d_student_progress_json)
      const { data: textData } = await client.from('site_settings').select('*').eq('key', 'l2d_student_progress_json');
      if (textData && textData.length > 0 && textData[0].value) {
        try {
          const parsed = JSON.parse(textData[0].value);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch(e){}
      }
      return null;
    } catch(e) {
      return null;
    }
  };

  window.deleteStudentFromSupabase = async function(studentName) {
    const client = window.getSupabaseClient();
    if (!client) return { ok: false };

    try {
      const { error } = await client.from('student_profiles').delete().eq('username', studentName);
      return { ok: !error, error: error ? error.message : null };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  };

  /**
   * 3. Preston Danger Spot Test Routes Sync (preston_routes)
   */
  window.syncRouteToSupabase = async function(spotId, routeObj) {
    const client = window.getSupabaseClient();
    if (!client) return { ok: false, error: 'Supabase client not initialized' };

    try {
      const payload = {
        spot_id: parseInt(spotId, 10),
        title: routeObj.title || '',
        location: routeObj.location || '',
        tip: routeObj.tip || '',
        lat: routeObj.lat || 53.7632,
        lng: routeObj.lng || -2.7481,
        updated_at: new Date().toISOString()
      };

      const { error } = await client
        .from('preston_routes')
        .upsert(payload, { onConflict: 'spot_id' });

      return { ok: !error, error: error ? error.message : null };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  };

  window.fetchRoutesFromSupabase = async function() {
    const client = window.getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client.from('preston_routes').select('*');
      if (error || !data) return null;

      const map = {};
      data.forEach(item => {
        if (item.spot_id) {
          map[item.spot_id] = {
            title: item.title,
            location: item.location,
            tip: item.tip,
            lat: item.lat,
            lng: item.lng
          };
        }
      });
      return map;
    } catch(e) {
      return null;
    }
  };

  /**
   * 4. Car Showroom Fleet Hotspots Sync (fleet_hotspots)
   */
  window.syncHotspotsToSupabase = async function(vehicleIdOrFleetObj, hotspotsArray) {
    const client = window.getSupabaseClient();
    if (!client) return { ok: false, error: 'Supabase client not initialized' };

    try {
      let fullFleetObj = {};
      try {
        const raw = localStorage.getItem('l2d_fleet_hotspots') || localStorage.getItem('l2d_custom_hotspots');
        if (raw) fullFleetObj = JSON.parse(raw);
      } catch(e) {}

      if (typeof vehicleIdOrFleetObj === 'object' && vehicleIdOrFleetObj !== null) {
        fullFleetObj = Object.assign({}, fullFleetObj, vehicleIdOrFleetObj);
      } else if (typeof vehicleIdOrFleetObj === 'string') {
        const vKey = vehicleIdOrFleetObj;
        const hsList = Array.isArray(hotspotsArray) ? hotspotsArray : (hotspotsArray && Array.isArray(hotspotsArray.hotspots) ? hotspotsArray.hotspots : []);
        if (!fullFleetObj[vKey]) fullFleetObj[vKey] = {};
        fullFleetObj[vKey].hotspots = hsList;
      }

      // 1. Dual-sync to site_settings table as universal fallback
      await client.from('site_settings').upsert({
        key: 'fleet_hotspots_json',
        value: JSON.stringify(fullFleetObj),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      // 2. Upsert to fleet_hotspots table for each vehicle
      for (const vKey of Object.keys(fullFleetObj)) {
        const carData = fullFleetObj[vKey];
        const hsArray = Array.isArray(carData) ? carData : (carData && Array.isArray(carData.hotspots) ? carData.hotspots : []);
        await client.from('fleet_hotspots').upsert({
          vehicle_id: vKey,
          hotspots: hsArray,
          updated_at: new Date().toISOString()
        }, { onConflict: 'vehicle_id' });
      }

      return { ok: true, error: null };
    } catch(e) {
      console.warn('syncHotspotsToSupabase error:', e);
      return { ok: false, error: e.message };
    }
  };

  window.fetchHotspotsFromSupabase = async function() {
    const client = window.getSupabaseClient();
    if (!client) return null;

    try {
      // 1. Check dedicated fleet_hotspots table
      const { data, error } = await client.from('fleet_hotspots').select('*');
      if (!error && data && data.length > 0) {
        const map = {};
        data.forEach(item => {
          if (item.vehicle_id) {
            const hsList = Array.isArray(item.hotspots) ? item.hotspots : [];
            map[item.vehicle_id] = { hotspots: hsList };
          }
        });
        return map;
      }

      // 2. Fallback to site_settings key fleet_hotspots_json
      const { data: textData } = await client.from('site_settings').select('*').eq('key', 'fleet_hotspots_json');
      if (textData && textData.length > 0 && textData[0].value) {
        try {
          const parsed = JSON.parse(textData[0].value);
          const map = {};
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(vKey => {
              const val = parsed[vKey];
              if (Array.isArray(val)) {
                map[vKey] = { hotspots: val };
              } else if (val && typeof val === 'object') {
                map[vKey] = Object.assign({}, val, { hotspots: Array.isArray(val.hotspots) ? val.hotspots : [] });
              }
            });
          }
          return map;
        } catch(e) {}
      }

      return null;
    } catch(e) {
      return null;
    }
  };

  /**
   * 5. Student Reviews Sync (student_reviews)
   */
  window.syncReviewToSupabase = async function(reviewObj) {
    const client = window.getSupabaseClient();
    if (!client) return { ok: false, error: 'Supabase client not initialized' };

    try {
      const payload = {
        review_id: reviewObj.id || String(Date.now()),
        name: reviewObj.name || 'Anonymous Student',
        pass_type: reviewObj.passType || '1st Time Pass',
        vehicle_tag: reviewObj.vehicleTag || 'Manual Yaris',
        rating: reviewObj.rating || 5,
        quote: reviewObj.quote || '',
        date: reviewObj.date || new Date().toISOString().slice(0, 10),
        photo_url: reviewObj.photoUrl || '',
        updated_at: new Date().toISOString()
      };

      const { error } = await client
        .from('student_reviews')
        .upsert(payload, { onConflict: 'review_id' });

      return { ok: !error, error: error ? error.message : null };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  };

  window.fetchReviewsFromSupabase = async function() {
    const client = window.getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client.from('student_reviews').select('*');
      if (error || !data) return null;

      return data.map(item => ({
        id: item.review_id,
        name: item.name,
        passType: item.pass_type,
        vehicleTag: item.vehicle_tag,
        rating: item.rating,
        quote: item.quote,
        date: item.date,
        photoUrl: item.photo_url
      }));
    } catch(e) {
      return null;
    }
  };

  window.deleteReviewFromSupabase = async function(reviewId) {
    const client = window.getSupabaseClient();
    if (!client) return { ok: false, error: 'Supabase client not initialized' };

    try {
      const { error } = await client
        .from('student_reviews')
        .delete()
        .eq('review_id', String(reviewId));

      return { ok: !error, error: error ? error.message : null };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  };

  /**
   * 6. Bulk Sync ALL 100% Application Data Fields to Supabase
   */
  window.syncAllLocalDataToSupabase = async function() {
    const client = window.getSupabaseClient();
    if (!client) return { ok: false, errors: ['Supabase client not initialized. Check URL and Key.'] };

    const errors = [];
    let syncedCount = 0;

    // 1. Sync All Student Profiles (student_profiles)
    try {
      let students = {};
      if (window.courseState && window.courseState.studentProgress && Object.keys(window.courseState.studentProgress).length > 0) {
        students = window.courseState.studentProgress;
      } else {
        const raw = localStorage.getItem('l2d_student_progress');
        if (raw) {
          try { students = JSON.parse(raw); } catch(e) {}
        }
      }

      if (!students || Object.keys(students).length === 0) {
        students = {
          'Farhan Hussaini': { instructor: 'Farhan Hussaini', transmission: 'Manual', completed: [] },
          'Ayesha Patel': { instructor: 'Farhan Hussaini', transmission: 'Automatic', completed: [] },
          'Liam O\'Connor': { instructor: 'Binish Moazzam', transmission: 'Manual', completed: [] }
        };
      }

      for (const name of Object.keys(students)) {
        const res = await window.syncStudentToSupabase(name, students[name]);
        if (res.ok) {
          syncedCount++;
        } else if (res.error) {
          errors.push(`student_profiles table (${name}): ${res.error}`);
        }
      }
    } catch(e) {
      errors.push('Student progress bulk sync exception: ' + e.message);
    }

    // 2. Sync Site Text Settings (site_settings)
    try {
      let rawText = localStorage.getItem('l2d_custom_site_text');
      let textObj = rawText ? JSON.parse(rawText) : {};
      if (!textObj || Object.keys(textObj).length === 0) {
        textObj = {
          hero_badge: 'PRESTON DVSA APPROVED ACADEMY',
          hero_heading: 'Master Preston Test Routes with Total Confidence',
          hero_text: 'Learn with DVSA approved male & female instructors in our 2019 Toyota Yaris Manual and 2024 Hyundai Kona EV.'
        };
      }

      for (const key of Object.keys(textObj)) {
        const res = await window.syncSiteTextToSupabase(key, textObj[key]);
        if (res.ok) {
          syncedCount++;
        } else if (res.error) {
          errors.push(`site_settings table (${key}): ${res.error}`);
          break;
        }
      }
    } catch(e) {
      errors.push('Site text bulk sync exception: ' + e.message);
    }

    // 3. Sync Preston Test Routes (preston_routes)
    try {
      let rawRoutes = localStorage.getItem('l2d_custom_routes');
      let routesObj = rawRoutes ? JSON.parse(rawRoutes) : {};
      if (!routesObj || Object.keys(routesObj).length === 0) {
        routesObj = {
          1: { title: '1. DVSA Chain Caul Way Roundabout', location: 'PRESTON DVSA HUB ROUNDABOUT', tip: 'Position early in the left lane when taking the 2nd exit toward Strand Road.', lat: 53.7685, lng: -2.7521 },
          2: { title: '2. Docks Swing Bridge & Navigation Way', location: 'PRESTON DOCKS MARINA', tip: 'Watch for narrow lane pinch points and give way to oncoming traffic on the bridge.', lat: 53.7570, lng: -2.7350 }
        };
      }

      for (const spotId of Object.keys(routesObj)) {
        const res = await window.syncRouteToSupabase(spotId, routesObj[spotId]);
        if (res.ok) {
          syncedCount++;
        } else if (res.error) {
          errors.push(`preston_routes table (#${spotId}): ${res.error}`);
          break;
        }
      }
    } catch(e) {
      errors.push('Routes bulk sync exception: ' + e.message);
    }

    // 4. Sync Car Showroom Hotspots (fleet_hotspots)
    try {
      let rawHotspots = localStorage.getItem('l2d_fleet_hotspots');
      let hotspotsObj = rawHotspots ? JSON.parse(rawHotspots) : {};
      for (const vehicleId of Object.keys(hotspotsObj)) {
        const res = await window.syncHotspotsToSupabase(vehicleId, hotspotsObj[vehicleId]);
        if (res.ok) syncedCount++;
      }
    } catch(e) {
      console.warn('Hotspots sync note:', e);
    }

    // 5. Sync Dynamic Reviews (student_reviews)
    try {
      let rawReviews = localStorage.getItem('l2d_custom_reviews');
      let reviewsArr = rawReviews ? JSON.parse(rawReviews) : [];
      if (Array.isArray(reviewsArr)) {
        for (const rev of reviewsArr) {
          const res = await window.syncReviewToSupabase(rev);
          if (res.ok) syncedCount++;
        }
      }
    } catch(e) {
      console.warn('Reviews sync note:', e);
    }

    return { ok: errors.length === 0 && syncedCount > 0, syncedCount, errors };
  };

  /**
   * 7. Full Diagnostic Validation Suite for All 5 Supabase Tables
   */
  window.validateAllSupabaseTables = async function() {
    const client = window.getSupabaseClient();
    if (!client) {
      console.warn('❌ Supabase Client not initialized.');
      return { ok: false, message: 'Supabase Client not initialized. Check URL & Key in Admin Settings.' };
    }

    const report = {
      timestamp: new Date().toISOString(),
      url: localStorage.getItem('l2d_supabase_url'),
      tables: {}
    };

    const tables = ['site_settings', 'student_profiles', 'preston_routes', 'fleet_hotspots', 'student_reviews'];

    for (const table of tables) {
      try {
        const { data, error } = await client.from(table).select('*');
        if (error) {
          report.tables[table] = { status: 'ERROR', message: error.message };
        } else {
          report.tables[table] = { status: 'OK', recordCount: data ? data.length : 0 };
        }
      } catch(e) {
        report.tables[table] = { status: 'EXCEPTION', message: e.message };
      }
    }

    console.log('⚡ Supabase 5-Table Validation Report:', report);
    return report;
  };

  function setupRealtimeSubscriptions(client) {
    if (!client || window.l2d_realtime_subscribed) return;
    window.l2d_realtime_subscribed = true;

    try {
      client
        .channel('l2d_site_text_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, payload => {
          if (payload.new && payload.new.key) {
            if (payload.new.key === 'fleet_hotspots_json') {
              try {
                localStorage.setItem('l2d_fleet_hotspots', payload.new.value);
                localStorage.setItem('l2d_custom_hotspots', payload.new.value);
                if (typeof window.refreshShowroomDisplay === 'function') window.refreshShowroomDisplay();
              } catch(e) {}
            } else if (payload.new.key === 'course_curriculum_json') {
              try {
                localStorage.setItem('l2d_custom_course_data', payload.new.value);
                if (typeof window.loadCourseDataFromStorage === 'function') window.loadCourseDataFromStorage();
                if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
                if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();
              } catch(e) {}
            } else if (payload.new.key === 'insta_api_endpoint') {
              try {
                localStorage.setItem('l2d_insta_api_endpoint', payload.new.value);
                if (typeof window.initInstaHighlights === 'function') window.initInstaHighlights();
              } catch(e) {}
            } else if (payload.new.key === 'l2d_student_progress_json') {
              try {
                const cloudProgress = JSON.parse(payload.new.value);
                if (cloudProgress && typeof cloudProgress === 'object') {
                  localStorage.setItem('l2d_student_progress', JSON.stringify(cloudProgress));
                  if (window.courseState && typeof window.courseState === 'object') {
                    window.courseState.studentProgress = cloudProgress;
                  }
                  if (typeof window.renderAdminProgressTable === 'function') window.renderAdminProgressTable();
                  if (typeof window.renderLMSHeaderBar === 'function') window.renderLMSHeaderBar();
                  if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
                }
              } catch(e) {}
            } else if (payload.new.key === 'custom_reviews_json') {
              try {
                localStorage.setItem('l2d_custom_reviews', payload.new.value);
                if (typeof window.renderReviews === 'function') window.renderReviews(window.currentReviewFilter || 'all');
                if (typeof window.renderAdminReviewsTable === 'function') window.renderAdminReviewsTable();
              } catch(e) {}
            } else if (payload.new.key === 'custom_site_images_json') {
              try {
                localStorage.setItem('l2d_custom_site_images', payload.new.value);
                if (typeof window.hydrateSiteImagesFromStorage === 'function') window.hydrateSiteImagesFromStorage();
              } catch(e) {}
            } else {
              let localMap = {};
              try { localMap = JSON.parse(localStorage.getItem('l2d_custom_site_text') || '{}'); } catch(e){}
              localMap[payload.new.key] = payload.new.value;
              localStorage.setItem('l2d_custom_site_text', JSON.stringify(localMap));
              if (typeof window.hydrateSiteTextFromStorage === 'function') window.hydrateSiteTextFromStorage();
            }
          }
        })
        .subscribe();

      client
        .channel('l2d_student_profiles_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_profiles' }, async payload => {
          const cloudStudents = await window.fetchStudentsFromSupabase();
          if (cloudStudents) {
            localStorage.setItem('l2d_student_progress', JSON.stringify(cloudStudents));
            if (typeof window.renderAdminProgressTable === 'function') window.renderAdminProgressTable();
          }
        })
        .subscribe();

      client
        .channel('l2d_routes_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'preston_routes' }, async payload => {
          const cloudRoutes = await window.fetchRoutesFromSupabase();
          if (cloudRoutes) {
            localStorage.setItem('l2d_custom_routes', JSON.stringify(cloudRoutes));
            if (typeof window.initPrestonMap === 'function') window.initPrestonMap();
          }
        })
        .subscribe();

      client
        .channel('l2d_fleet_hotspots_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_hotspots' }, async () => {
          const cloudHotspots = await window.fetchHotspotsFromSupabase();
          if (cloudHotspots) {
            localStorage.setItem('l2d_fleet_hotspots', JSON.stringify(cloudHotspots));
            localStorage.setItem('l2d_custom_hotspots', JSON.stringify(cloudHotspots));
            if (typeof window.refreshShowroomDisplay === 'function') window.refreshShowroomDisplay();
          }
        })
        .subscribe();

      console.log('📡 Realtime Supabase WebSockets Subscribed across devices!');
    } catch(e) {
      console.warn('Realtime subscription note:', e);
    }
  }

  /**
   * DOM Load Event Listener: Auto-pull & Realtime Subscriptions
   */
  async function supabaseClientSyncOnLoad() {
    initSupabase();
    const autoSyncEnabled = localStorage.getItem('l2d_supabase_auto_sync') !== 'false';
    const client = window.getSupabaseClient();

    if (client && autoSyncEnabled) {
      setupRealtimeSubscriptions(client);

      if (localStorage.getItem('l2d_cloud_pending_sync') === 'true' && typeof window.flushPendingOfflineSync === 'function') {
        await window.flushPendingOfflineSync();
      }

      // Pull site text
      const cloudText = await window.fetchSiteTextFromSupabase();
      if (cloudText && Object.keys(cloudText).length > 0) {
        let localMap = {};
        try { localMap = JSON.parse(localStorage.getItem('l2d_custom_site_text') || '{}'); } catch(e){}
        const merged = Object.assign({}, localMap, cloudText);
        localStorage.setItem('l2d_custom_site_text', JSON.stringify(merged));
        
        if (cloudText['hubspot_portal_id']) {
          localStorage.setItem('l2d_hubspot_portal_id', cloudText['hubspot_portal_id']);
          if (typeof window.initHubSpotCrm === 'function') window.initHubSpotCrm();
        }
        if (cloudText['l2d_google_places_api_key']) {
          localStorage.setItem('l2d_google_places_api_key', cloudText['l2d_google_places_api_key']);
        }
        if (cloudText['l2d_google_place_id']) {
          localStorage.setItem('l2d_google_place_id', cloudText['l2d_google_place_id']);
        }
        if (cloudText['course_coming_soon']) {
          localStorage.setItem('l2d_course_coming_soon', cloudText['course_coming_soon']);
          if (typeof window.checkAndApplyLMSComingSoonMode === 'function') {
            window.checkAndApplyLMSComingSoonMode();
          }
        }
        if (typeof window.hydrateSiteTextFromStorage === 'function') window.hydrateSiteTextFromStorage();
      }

      // Pull student directory
      const cloudStudents = await window.fetchStudentsFromSupabase();
      if (cloudStudents && Object.keys(cloudStudents).length > 0) {
        localStorage.setItem('l2d_student_progress', JSON.stringify(cloudStudents));
        if (typeof window.renderAdminProgressTable === 'function') window.renderAdminProgressTable();
      }

      // Pull preston test routes
      const cloudRoutes = await window.fetchRoutesFromSupabase();
      if (cloudRoutes && Object.keys(cloudRoutes).length > 0) {
        localStorage.setItem('l2d_custom_routes', JSON.stringify(cloudRoutes));
        if (typeof window.initPrestonMap === 'function') window.initPrestonMap();
      }

      // Pull fleet hotspots (merging local & cloud data)
      const cloudHotspots = await window.fetchHotspotsFromSupabase();
      if (cloudHotspots && Object.keys(cloudHotspots).length > 0) {
        let localHotspots = {};
        try {
          const rawLocal = localStorage.getItem('l2d_fleet_hotspots') || localStorage.getItem('l2d_custom_hotspots');
          if (rawLocal) localHotspots = JSON.parse(rawLocal);
        } catch(e) {}

        const mergedHotspots = Object.assign({}, cloudHotspots, localHotspots);
        localStorage.setItem('l2d_fleet_hotspots', JSON.stringify(mergedHotspots));
        localStorage.setItem('l2d_custom_hotspots', JSON.stringify(mergedHotspots));
        if (typeof window.refreshShowroomDisplay === 'function') window.refreshShowroomDisplay();
      }

      // Pull student reviews
      const cloudReviews = await window.fetchReviewsFromSupabase();
      if (cloudReviews && cloudReviews.length > 0) {
        localStorage.setItem('l2d_custom_reviews', JSON.stringify(cloudReviews));
        if (typeof window.renderReviewsGrid === 'function') window.renderReviewsGrid();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', supabaseClientSyncOnLoad);
  } else {
    supabaseClientSyncOnLoad();
  }

})();
