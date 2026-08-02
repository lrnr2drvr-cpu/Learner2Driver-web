const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/huzai/Documents/learner2driver';
const jsDir = path.join(rootDir, 'js');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).map(f => path.join(jsDir, f));
const htmlFiles = [path.join(rootDir, 'index.html'), path.join(rootDir, 'course.html')];
const allFiles = [...jsFiles, ...htmlFiles];

console.log('=== ANTI-CHEATING & INTEGRITY FORENSIC SCAN ===');

let flaggedCount = 0;

allFiles.forEach(file => {
  const relPath = path.relative(rootDir, file);
  const content = fs.readFileSync(file, 'utf8');

  // Check 1: Hardcoded 64-char SHA256 hex string literals
  const hex64Regex = /['"][a-fA-F0-9]{64}['"]/g;
  const hexMatches = content.match(hex64Regex);
  if (hexMatches) {
    console.log(`[FLAG] Hardcoded SHA-256 hex literal found in ${relPath}:`, hexMatches);
    flaggedCount++;
  }

  // Check 2: Facade implementation in authentication or hashing
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/function\s+(authenticate|verifyPassword|hashPassword)/i.test(line) && /return\s+(true|false|'|")/i.test(line)) {
      console.log(`[FLAG] Potential facade function at ${relPath}:${idx + 1}: ${line.trim()}`);
      flaggedCount++;
    }
  });

  // Check 3: Public plain-text password hints in HTML UI
  if (file.endsWith('.html')) {
    const plainTextPassRegex = /(Huzaifa1|admin123|password123)/gi;
    const matches = content.match(plainTextPassRegex);
    if (matches) {
      console.log(`[FLAG] Plain-text password exposed in HTML ${relPath}:`, matches);
      flaggedCount++;
    }
  }

  // Check 4: Bypass flags or hardcoded mock pass return statements
  lines.forEach((line, idx) => {
    if (/test_pass|mock_pass|bypass_auth|always_true/i.test(line)) {
      console.log(`[FLAG] Suspicious bypass keyword at ${relPath}:${idx + 1}: ${line.trim()}`);
      flaggedCount++;
    }
  });
});

console.log(`\nTotal Integrity Flags: ${flaggedCount}`);
