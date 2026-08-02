/**
 * ==========================================================================
 * LEARNER2DRIVER - HUBSOFT STUDENT & LESSON TRACKER (js/hubsoft-tracker.js)
 * Built-in DVSA Competency Tracking, Lesson Hours Logger & Readiness Engine
 * ==========================================================================
 */

(function() {
  'use strict';

  // Standard DVSA Syllabus Competencies
  const DVSA_COMPETENCIES = [
    { id: 'cockpit', name: '1. Cockpit & Safety Checks', category: 'Basics' },
    { id: 'moving', name: '2. Moving Off & Stopping', category: 'Control' },
    { id: 'clutch', name: '3. Clutch Control & Hill Starts', category: 'Control' },
    { id: 'junctions', name: '4. Emerging & Turning at Junctions', category: 'Junctions' },
    { id: 'roundabouts', name: '5. Preston Roundabouts (e.g., A59 / Ringway)', category: 'Junctions' },
    { id: 'bay_park', name: '6. Reverse Bay & Forward Bay Park', category: 'Maneuvers' },
    { id: 'parallel_park', name: '7. Parallel Parking (Roadside)', category: 'Maneuvers' },
    { id: 'pull_right', name: '8. Pull Up on Right & Reverse', category: 'Maneuvers' },
    { id: 'emergency_stop', name: '9. Prompt Stop / Emergency Stop', category: 'Safety' },
    { id: 'dual_carriageway', name: '10. Dual Carriageway (Chain Caul Way)', category: 'High Speed' },
    { id: 'independent', name: '11. Independent Driving & SatNav', category: 'Test Prep' },
    { id: 'mock_test', name: '12. Preston DVSA Mock Practical Test', category: 'Test Prep' }
  ];

  let trackerState = {
    students: {}
  };

  window.HUBSOFT_DVSA_COMPETENCIES = DVSA_COMPETENCIES;

  document.addEventListener('DOMContentLoaded', () => {
    initHubsoftTracker();
  });

  function initHubsoftTracker() {
    loadHubsoftDataFromStorage();
    renderHubsoftUI();
  }

  function loadHubsoftDataFromStorage() {
    try {
      const saved = localStorage.getItem('l2d_hubsoft_tracker_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          trackerState.students = parsed;
        }
      }
    } catch(e) {}

    // Ensure default student profiles exist
    const defaultStudents = ['Farhan Hussaini', 'Ayesha Patel', 'Liam O\'Connor', 'Binish Moazzam'];
    defaultStudents.forEach(name => {
      if (!trackerState.students[name]) {
        trackerState.students[name] = {
          name,
          instructor: 'Farhan Hussaini',
          hoursLogged: 12,
          targetTestDate: '2026-09-15',
          competencies: {
            cockpit: 3, // 1=Introduced, 2=Practiced, 3=Test Standard
            moving: 3,
            clutch: 3,
            junctions: 2,
            roundabouts: 2,
            bay_park: 2,
            parallel_park: 1,
            pull_right: 2,
            emergency_stop: 3,
            dual_carriageway: 2,
            independent: 1,
            mock_test: 1
          }
        };
      }
    });
  }

  function saveHubsoftDataToStorage() {
    try {
      const payload = JSON.stringify(trackerState.students);
      localStorage.setItem('l2d_hubsoft_tracker_data', payload);
      if (typeof window.syncSiteTextToSupabase === 'function') {
        window.syncSiteTextToSupabase('hubsoft_tracker_json', payload);
      }
    } catch(e) {}
  }

  function calculateReadinessScore(studentObj) {
    if (!studentObj || !studentObj.competencies) return 0;
    const totalPossible = DVSA_COMPETENCIES.length * 3;
    let earned = 0;
    DVSA_COMPETENCIES.forEach(comp => {
      earned += (studentObj.competencies[comp.id] || 0);
    });
    return Math.round((earned / totalPossible) * 100);
  }

  function renderHubsoftUI() {
    renderHubsoftStudentCard();
    renderHubsoftAdminTable();
  }

  function renderHubsoftStudentCard() {
    const container = document.getElementById('hubsoftStudentTrackerBox');
    if (!container) return;

    const currentStudentName = localStorage.getItem('l2d_current_student') || 'Ayesha Patel';
    const student = trackerState.students[currentStudentName] || trackerState.students['Ayesha Patel'];
    if (!student) return;

    const readiness = calculateReadinessScore(student);
    let statusBadge = 'badge-primary';
    let statusText = 'On Track for Test Day';
    if (readiness >= 85) { statusBadge = 'badge-accent'; statusText = 'DVSA Test Ready! 🏆'; }
    else if (readiness < 50) { statusBadge = 'badge-warning'; statusText = 'Initial Training Phase'; }

    let competenciesHTML = DVSA_COMPETENCIES.map(comp => {
      const lvl = (student.competencies && student.competencies[comp.id]) || 0;
      let label = 'Not Started';
      let colorClass = 'style="color: var(--text-muted);"';
      if (lvl === 1) { label = 'Introduced 🟡'; colorClass = 'style="color: var(--color-amber); font-weight: 700;"'; }
      if (lvl === 2) { label = 'Practiced 🔵'; colorClass = 'style="color: #2563EB; font-weight: 700;"'; }
      if (lvl === 3) { label = 'Test Standard ✅'; colorClass = 'style="color: var(--color-green); font-weight: 800;"'; }

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.88rem;">
          <span style="font-weight: 600; color: var(--text-main);">${comp.name}</span>
          <span ${colorClass}>${label}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="glass-card" style="padding: 2rem; border-radius: var(--radius-lg); border: 2px solid var(--color-green); background: var(--bg-surface); margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
          <div>
            <span class="badge ${statusBadge} mb-1">Hubsoft DVSA Progress Tracker</span>
            <h3 style="margin: 0; font-size: 1.35rem; color: var(--text-main); font-weight: 800;">
              ${student.name}'s Driver Readiness Score
            </h3>
            <span style="font-size: 0.85rem; color: var(--text-light);">Instructor: ${student.instructor || 'Farhan Hussaini'} • Logged: ${student.hoursLogged || 12} Hours</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 2.2rem; font-weight: 800; color: var(--color-green); line-height: 1;">
              ${readiness}%
            </div>
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">${statusText}</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="width: 100%; height: 10px; background: var(--bg-body); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
          <div style="width: ${readiness}%; height: 100%; background: linear-gradient(90deg, var(--color-green, #10B981), #059669); transition: width 0.6s ease;"></div>
        </div>

        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.85rem; color: var(--text-main);">DVSA Test Syllabus Competency Breakdown:</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.65rem;">
          ${competenciesHTML}
        </div>
      </div>
    `;
  }

  function renderHubsoftAdminTable() {
    const container = document.getElementById('hubsoftAdminTrackerBox');
    if (!container) return;

    const studentKeys = Object.keys(trackerState.students);
    let rowsHTML = studentKeys.map(key => {
      const st = trackerState.students[key];
      const readiness = calculateReadinessScore(st);
      return `
        <tr>
          <td><strong>${st.name}</strong></td>
          <td>${st.instructor || 'Farhan Hussaini'}</td>
          <td>
            <input type="number" value="${st.hoursLogged || 0}" min="0" max="200" style="width: 70px; padding: 0.35rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-main);" onchange="updateHubsoftHours('${key}', this.value)"> hrs
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 80px; height: 8px; background: var(--bg-body); border-radius: var(--radius-full); overflow: hidden;">
                <div style="width: ${readiness}%; height: 100%; background: var(--color-green);"></div>
              </div>
              <strong style="color: var(--color-green); font-size: 0.88rem;">${readiness}%</strong>
            </div>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="openHubsoftStudentModal('${key}')" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
              Update DVSA Matrix 📋
            </button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="glass-card" style="padding: 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); background: var(--bg-surface); margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <span class="badge badge-primary mb-1">Hubsoft CRM Tracker</span>
            <h3 style="margin: 0; font-size: 1.25rem;">Hubsoft Student Competency & Hours Logger</h3>
          </div>
          <button class="btn btn-primary btn-sm" onclick="addNewHubsoftStudentPrompt()">
            + Register New Student
          </button>
        </div>

        <div style="overflow-x: auto;">
          <table class="student-progress-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: var(--bg-body); text-align: left;">
                <th style="padding: 0.75rem;">Student Name</th>
                <th style="padding: 0.75rem;">Instructor</th>
                <th style="padding: 0.75rem;">Logged Hours</th>
                <th style="padding: 0.75rem;">DVSA Readiness</th>
                <th style="padding: 0.75rem;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  window.updateHubsoftHours = function(studentKey, val) {
    if (trackerState.students[studentKey]) {
      trackerState.students[studentKey].hoursLogged = parseInt(val, 10) || 0;
      saveHubsoftDataToStorage();
      renderHubsoftUI();
    }
  };

  window.addNewHubsoftStudentPrompt = function() {
    const name = prompt('Enter new student full name:');
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (!trackerState.students[cleanName]) {
      trackerState.students[cleanName] = {
        name: cleanName,
        instructor: 'Farhan Hussaini',
        hoursLogged: 0,
        competencies: {}
      };
      saveHubsoftDataToStorage();
      renderHubsoftUI();
      if (typeof window.showToast === 'function') window.showToast(`Added student ${cleanName} to Hubsoft Tracker!`);
    }
  };

  window.openHubsoftStudentModal = function(studentKey) {
    const st = trackerState.students[studentKey];
    if (!st) return;

    let itemsHTML = DVSA_COMPETENCIES.map(comp => {
      const currentVal = (st.competencies && st.competencies[comp.id]) || 0;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
          <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">${comp.name}</span>
          <select style="padding: 0.3rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-main);" onchange="updateStudentCompetency('${studentKey}', '${comp.id}', this.value)">
            <option value="0" ${currentVal === 0 ? 'selected' : ''}>0. Not Started</option>
            <option value="1" ${currentVal === 1 ? 'selected' : ''}>1. Introduced 🟡</option>
            <option value="2" ${currentVal === 2 ? 'selected' : ''}>2. Practiced 🔵</option>
            <option value="3" ${currentVal === 3 ? 'selected' : ''}>3. Test Standard ✅</option>
          </select>
        </div>
      `;
    }).join('');

    const modalHTML = `
      <div id="hubsoftModalBackdrop" class="student-portal-gate" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 10000; background: rgba(15,23,42,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <div class="glass-card" style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-lg); max-width: 600px; width: 100%; max-height: 85vh; overflow-y: auto; border: 2px solid var(--color-green);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0; font-size: 1.25rem;">Hubsoft DVSA Matrix — ${st.name}</h3>
            <button onclick="closeHubsoftModal()" class="btn btn-secondary btn-sm">✕ Close</button>
          </div>
          <div style="margin-bottom: 1rem;">
            ${itemsHTML}
          </div>
          <button onclick="closeHubsoftModal()" class="btn btn-primary" style="width: 100%;">Save & Return</button>
        </div>
      </div>
    `;

    const oldModal = document.getElementById('hubsoftModalBackdrop');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  };

  window.updateStudentCompetency = function(studentKey, compId, val) {
    if (trackerState.students[studentKey]) {
      if (!trackerState.students[studentKey].competencies) {
        trackerState.students[studentKey].competencies = {};
      }
      trackerState.students[studentKey].competencies[compId] = parseInt(val, 10) || 0;
      saveHubsoftDataToStorage();
      renderHubsoftUI();
    }
  };

  window.closeHubsoftModal = function() {
    const modal = document.getElementById('hubsoftModalBackdrop');
    if (modal) modal.remove();
  };

  window.renderHubsoftUI = renderHubsoftUI;
  window.saveHubsoftDataToStorage = saveHubsoftDataToStorage;
})();
