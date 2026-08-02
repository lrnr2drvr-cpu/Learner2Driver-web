const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');

console.log('=== TEST 3: WEB CRYPTO SHA-256 SECURITY & TRANSMISSION TAILORING ===');

// Setup mock window environment
const storage = {};
const localStorageMock = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const windowMock = {
  crypto: webcrypto,
  localStorage: localStorageMock,
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  console: console
};

const sandbox = {
  window: windowMock,
  crypto: webcrypto,
  localStorage: localStorageMock,
  document: windowMock.document,
  console: console,
  TextEncoder: TextEncoder,
  Uint8Array: Uint8Array,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

vm.createContext(sandbox);

// Load course-data.js and course-player.js
const rootDir = 'c:/Users/huzai/Documents/learner2driver';
const courseDataCode = fs.readFileSync(path.join(rootDir, 'js/course-data.js'), 'utf8');
const coursePlayerCode = fs.readFileSync(path.join(rootDir, 'js/course-player.js'), 'utf8');

vm.runInContext(courseDataCode, sandbox);
vm.runInContext(coursePlayerCode, sandbox);

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 3.1: Salt generation
  const salt = sandbox.window.generateSaltHex(16);
  if (typeof salt === 'string' && salt.length === 32) {
    console.log('  ✓ Test 3.1 PASSED: Salt generation produces 32-hex characters (16 bytes)');
    passed++;
  } else {
    console.error('  ✗ Test 3.1 FAILED: Salt generation failed', salt);
    failed++;
  }

  // Test 3.2: SHA-256 Hashing
  const pass = 'Huzaifa1';
  const hash1 = await sandbox.window.hashPassword(pass, salt);
  if (typeof hash1 === 'string' && hash1.length === 64) {
    console.log('  ✓ Test 3.2 PASSED: SHA-256 produces 64-character hex hash');
    passed++;
  } else {
    console.error('  ✗ Test 3.2 FAILED: SHA-256 hash length incorrect', hash1);
    failed++;
  }

  // Test 3.3: Password Verification (Valid vs Invalid)
  const isValidCorrect = await sandbox.window.verifyPassword('Huzaifa1', salt, hash1);
  const isValidWrong = await sandbox.window.verifyPassword('WrongPass', salt, hash1);
  if (isValidCorrect === true && isValidWrong === false) {
    console.log('  ✓ Test 3.3 PASSED: Password verification correctly accepts valid password and rejects invalid password');
    passed++;
  } else {
    console.error('  ✗ Test 3.3 FAILED: Password verification logic error', { isValidCorrect, isValidWrong });
    failed++;
  }

  // Test 3.4: Legacy Plain-text Migration & Scrubbing
  localStorageMock.setItem('l2d_admin_pass', 'Huzaifa1');
  await sandbox.window.migrateCredentialsToSHA256();
  const storedHash = localStorageMock.getItem('l2d_admin_password_hash');
  const storedSalt = localStorageMock.getItem('l2d_admin_password_salt');
  const legacyPassRemoved = localStorageMock.getItem('l2d_admin_pass');

  if (storedHash && storedHash.length === 64 && storedSalt && legacyPassRemoved === null) {
    console.log('  ✓ Test 3.4 PASSED: Legacy plain-text password migrated to SHA-256 hash and plain-text key purged');
    passed++;
  } else {
    console.error('  ✗ Test 3.4 FAILED: Migration did not purge plain-text or compute hash', { storedHash, storedSalt, legacyPassRemoved });
    failed++;
  }

  // Test 3.5: Student Authentication Flow
  const cs = sandbox.window.courseState;
  cs.studentProgress['Test Student'] = {
    instructor: 'Farhan Hussaini',
    transmission: 'Manual',
    passwordSalt: salt,
    passwordHash: hash1,
    completed: []
  };

  const authSuccess = await sandbox.window.authenticateStudent('Test Student', 'Huzaifa1');
  const authFailPass = await sandbox.window.authenticateStudent('Test Student', 'WrongPassword');
  const authFailUser = await sandbox.window.authenticateStudent('NonExistentStudent', 'Huzaifa1');

  if (authSuccess.success && !authFailPass.success && !authFailUser.success) {
    console.log('  ✓ Test 3.5 PASSED: Student authentication via SHA-256 hash comparison functions correctly');
    passed++;
  } else {
    console.error('  ✗ Test 3.5 FAILED: Student auth logic error', { authSuccess, authFailPass, authFailUser });
    failed++;
  }

  // Test 3.6: Transmission Normalization & LMS Metric Tailoring
  const norm1 = sandbox.window.normalizeTransmission('Manual Tuition');
  const norm2 = sandbox.window.normalizeTransmission('Automatic');
  const norm3 = sandbox.window.normalizeTransmission('All Transmissions');

  if (norm1 === 'Manual' && norm2 === 'Auto' && norm3 === 'All') {
    console.log('  ✓ Test 3.6 PASSED: Transmission normalization correctly resolves Manual/Auto/All');
    passed++;
  } else {
    console.error('  ✗ Test 3.6 FAILED: Transmission normalization error', { norm1, norm2, norm3 });
    failed++;
  }

  // Test 3.7: Student Progress Calculation starts at 0%
  const metricsNew = sandbox.window.calculateStudentProgressMetrics('Test Student');
  if (metricsNew.trackCompleted === 0 && metricsNew.trackPercent === 0 && metricsNew.overallPercent === 0) {
    console.log(`  ✓ Test 3.7 PASSED: New student progress starts cleanly at 0% (${metricsNew.trackCompleted}/${metricsNew.trackTotal})`);
    passed++;
  } else {
    console.error('  ✗ Test 3.7 FAILED: Initial student progress is non-zero', metricsNew);
    failed++;
  }

  console.log(`\nCrypto & Transmission Test Results: Passed=${passed}, Failed=${failed}`);
  if (failed > 0) process.exit(1);
}

runTests();
