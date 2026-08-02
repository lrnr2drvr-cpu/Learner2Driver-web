/**
 * ==========================================================================
 * LEARNER2DRIVER - CLOUD SYNC & OFFLINE CACHING ENGINE (cloud-sync.js)
 * 1-Click JSON Backup Export/Import, Offline Caching Queue & Reconnect Auto-Sync
 * ==========================================================================
 */

(function() {
  const STORAGE_KEYS = [
    'l2d_custom_site_text',
    'l2d_site_content',
    'l2d_custom_hotspots',
    'l2d_fleet_hotspots',
    'l2d_custom_routes',
    'l2d_custom_reviews',
    'l2d_lms_state',
    'l2d_custom_course_data'
  ];

  /**
   * Package all local database items into a unified JSON backup object
   */
  window.exportAllSiteDataJSON = function() {
    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      app: 'Learner2Driver Preston',
      data: {}
    };

    STORAGE_KEYS.forEach(key => {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) {
          backup.data[key] = JSON.parse(val);
        }
      } catch(e) {
        backup.data[key] = localStorage.getItem(key);
      }
    });

    return backup;
  };

  /**
   * Download full site database as a .json backup file
   */
  window.downloadSiteBackupFile = function() {
    try {
      const backup = window.exportAllSiteDataJSON();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learner2driver_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (typeof window.showToast === 'function') {
        window.showToast('Downloaded full site backup (.json) 🎉');
      }
    } catch(e) {
      console.error('Error exporting site backup file:', e);
      alert('Failed to generate backup file: ' + e.message);
    }
  };

  /**
   * Import & Restore site database from a JSON backup object
   */
  window.restoreSiteDataFromJSON = function(backupObject) {
    if (!backupObject || typeof backupObject !== 'object' || !backupObject.data) {
      throw new Error('Invalid backup file format.');
    }

    const dataObj = backupObject.data;
    Object.keys(dataObj).forEach(key => {
      const val = dataObj[key];
      if (typeof val === 'object') {
        localStorage.setItem(key, JSON.stringify(val));
      } else {
        localStorage.setItem(key, String(val));
      }
    });

    // Re-hydrate UI across pages
    if (typeof window.hydrateSiteTextFromStorage === 'function') window.hydrateSiteTextFromStorage();
    if (typeof window.refreshShowroomDisplay === 'function') window.refreshShowroomDisplay();
    if (typeof window.initPrestonMap === 'function') window.initPrestonMap();
    if (typeof window.renderReviewsGrid === 'function') window.renderReviewsGrid();
    if (typeof window.renderAdminProgressTable === 'function') window.renderAdminProgressTable();
    if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();

    if (typeof window.showToast === 'function') {
      window.showToast('Site database successfully restored from JSON backup! 🔄');
    }
  };

  /**
   * Trigger file picker to import .json backup
   */
  window.importSiteBackupFile = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const json = JSON.parse(e.target.result);
        window.restoreSiteDataFromJSON(json);
        alert('Site data imported successfully! Page will now refresh to apply all updates.');
        window.location.reload();
      } catch(err) {
        alert('Error importing JSON backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  /**
   * Cloud Sync Push & Pull Logic
   */
  window.getCloudSyncConfig = function() {
    return {
      apiUrl: localStorage.getItem('l2d_cloud_sync_url') || '',
      apiKey: localStorage.getItem('l2d_cloud_sync_key') || '',
      autoSync: localStorage.getItem('l2d_cloud_sync_auto') !== 'false'
    };
  };

  window.saveCloudSyncConfig = function(apiUrl, apiKey, autoSync = true) {
    localStorage.setItem('l2d_cloud_sync_url', apiUrl.trim());
    localStorage.setItem('l2d_cloud_sync_key', apiKey.trim());
    localStorage.setItem('l2d_cloud_sync_auto', autoSync ? 'true' : 'false');
  };

  function updateCloudSyncBadge(statusText, colorVar) {
    const badge = document.getElementById('cloudSyncStatusBadge');
    if (badge) {
      badge.innerHTML = statusText;
      if (colorVar) badge.style.color = colorVar;
    }
  }

  /**
   * Push local database to Cloud API Endpoint with Offline Caching Queue
   */
  window.pushLocalDataToCloud = async function(showToasts = false) {
    const config = window.getCloudSyncConfig();
    if (!config.apiUrl) {
      if (showToasts) alert('No Cloud Sync Endpoint URL configured in Admin Hub Settings.');
      return false;
    }

    // Check if network is offline before attempting network request
    if (!navigator.onLine) {
      localStorage.setItem('l2d_cloud_pending_sync', 'true');
      localStorage.setItem('l2d_cloud_pending_time', new Date().toISOString());
      updateCloudSyncBadge('🟡 Offline Mode — Changes Cached Locally (Auto-Syncing When Online)', 'var(--color-amber, #F59E0B)');
      if (showToasts && typeof window.showToast === 'function') {
        window.showToast('Network Offline: Changes cached locally and queued for auto-sync 📦');
      }
      return false;
    }

    try {
      const backup = window.exportAllSiteDataJSON();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (config.apiKey) {
        headers['X-Master-Key'] = config.apiKey;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout guard

      const response = await fetch(config.apiUrl, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(backup),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Cloud API responded with status ${response.status}`);
      }

      // Success: Clear pending offline queue
      localStorage.removeItem('l2d_cloud_pending_sync');
      localStorage.removeItem('l2d_cloud_pending_time');
      localStorage.setItem('l2d_cloud_last_synced', new Date().toISOString());

      updateCloudSyncBadge('🟢 Cloud Sync Connected & Live!', 'var(--color-green)');

      if (showToasts && typeof window.showToast === 'function') {
        window.showToast('Successfully synced database to Cloud! ☁️');
      }
      return true;
    } catch(err) {
      console.warn('Cloud Sync Push failed or interrupted:', err);
      // Cache pending sync state on network failure
      localStorage.setItem('l2d_cloud_pending_sync', 'true');
      localStorage.setItem('l2d_cloud_pending_time', new Date().toISOString());
      updateCloudSyncBadge('🟡 Sync Retrying — Changes Cached Locally 📦', 'var(--color-amber, #F59E0B)');

      if (showToasts) {
        alert('Network or Cloud Sync interrupted. Your changes have been cached locally and will auto-sync when connection is restored!');
      }
      return false;
    }
  };

  /**
   * Pull latest database from Cloud API Endpoint
   */
  window.pullCloudDataToLocal = async function(showToasts = false) {
    const config = window.getCloudSyncConfig();
    if (!config.apiUrl) return false;
    if (!navigator.onLine) return false;

    try {
      const headers = {};
      if (config.apiKey) {
        headers['X-Master-Key'] = config.apiKey;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(config.apiUrl, {
        method: 'GET',
        headers: headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Cloud API responded with status ${response.status}`);
      }

      const cloudBackup = await response.json();
      const actualData = cloudBackup.record ? cloudBackup.record : cloudBackup;
      
      if (actualData && actualData.data) {
        window.restoreSiteDataFromJSON(actualData);
        localStorage.setItem('l2d_cloud_last_synced', new Date().toISOString());
        updateCloudSyncBadge('🟢 Cloud Sync Connected & Live!', 'var(--color-green)');
        if (showToasts && typeof window.showToast === 'function') {
          window.showToast('Pulled latest database from Cloud! ☁️');
        }
        return true;
      }
      return false;
    } catch(err) {
      console.warn('Cloud Sync Pull failed:', err);
      if (showToasts) alert('Cloud Sync Pull error: ' + err.message);
      return false;
    }
  };

  /**
   * Automatic Reconnect & Heartbeat Sync Listener
   */
  window.flushPendingOfflineSync = async function() {
    if (localStorage.getItem('l2d_cloud_pending_sync') === 'true' && navigator.onLine) {
      const success = await window.pushLocalDataToCloud(false);
      if (success) {
        if (typeof window.showToast === 'function') {
          window.showToast('📶 Connection Restored: Offline pending changes synced to Cloud! ☁️');
        }
      }
    }
  };

  // Listen to browser network online event
  window.addEventListener('online', () => {
    console.log('Network status: ONLINE. Flushing pending cloud sync queue...');
    window.flushPendingOfflineSync();
  });

  window.addEventListener('offline', () => {
    console.log('Network status: OFFLINE. Local edits will be cached.');
    updateCloudSyncBadge('🟡 Network Offline — Changes Cached Locally', 'var(--color-amber, #F59E0B)');
  });

  // Periodic 20-second heartbeat check for pending sync items
  setInterval(() => {
    if (localStorage.getItem('l2d_cloud_pending_sync') === 'true' && navigator.onLine) {
      window.flushPendingOfflineSync();
    }
  }, 20000);

  // Automatically check & pull cloud state on page load
  document.addEventListener('DOMContentLoaded', () => {
    const config = window.getCloudSyncConfig();
    if (config.apiUrl && config.autoSync) {
      if (localStorage.getItem('l2d_cloud_pending_sync') === 'true' && navigator.onLine) {
        window.flushPendingOfflineSync();
      } else {
        window.pullCloudDataToLocal(false);
      }
    }
  });

})();
