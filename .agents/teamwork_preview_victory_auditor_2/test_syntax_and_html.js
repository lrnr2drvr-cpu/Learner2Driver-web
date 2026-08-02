const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = 'c:/Users/huzai/Documents/learner2driver';
const jsDir = path.join(rootDir, 'js');

console.log('=== TEST 1: JAVASCRIPT SYNTAX CHECK ===');

const jsFiles = [
  'app.js',
  'booking-concierge.js',
  'course-data.js',
  'course-player.js',
  'image-cropper.js',
  'insta-highlights.js',
  'reviews.js',
  'showroom.js',
  'widgets.js'
];

let jsErrors = 0;

jsFiles.forEach(file => {
  const filePath = path.join(jsDir, file);
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    new vm.Script(code, { filename: file });
    console.log(`  ✓ ${file}: Valid Syntax`);
  } catch (err) {
    console.error(`  ✗ ${file}: SYNTAX ERROR!`, err.message);
    jsErrors++;
  }
});

console.log('\n=== TEST 2: HTML SYNTAX & STRUCTURE CHECK ===');

const htmlFiles = ['index.html', 'course.html'];
let htmlErrors = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check doctype
  if (!/<!DOCTYPE\s+html>/i.test(content)) {
    console.error(`  ✗ ${file}: Missing <!DOCTYPE html>`);
    htmlErrors++;
  } else {
    console.log(`  ✓ ${file}: DOCTYPE valid`);
  }

  // Check basic closing tags
  const tags = ['html', 'head', 'body'];
  tags.forEach(tag => {
    const openCount = (content.match(new RegExp(`<${tag}[\\s>]`, 'gi')) || []).length;
    const closeCount = (content.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (openCount !== closeCount) {
      console.error(`  ✗ ${file}: Mismatched <${tag}> tags (Open: ${openCount}, Close: ${closeCount})`);
      htmlErrors++;
    } else {
      console.log(`  ✓ ${file}: <${tag}> tags balanced`);
    }
  });

  // Check script tags src references exist on disk
  const scriptSrcRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptSrcRegex.exec(content)) !== null) {
    const src = match[1];
    if (!src.startsWith('http') && !src.startsWith('//')) {
      const scriptPath = path.join(rootDir, src.replace(/\//g, path.sep));
      if (!fs.existsSync(scriptPath)) {
        console.error(`  ✗ ${file}: Script file missing on disk: ${src}`);
        htmlErrors++;
      } else {
        console.log(`  ✓ ${file}: Local script referenced exists: ${src}`);
      }
    }
  }

  // Check stylesheet link references exist on disk
  const cssHrefRegex = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
  while ((match = cssHrefRegex.exec(content)) !== null) {
    const href = match[1];
    if (!href.startsWith('http') && !href.startsWith('//')) {
      const cssPath = path.join(rootDir, href.replace(/\//g, path.sep));
      if (!fs.existsSync(cssPath)) {
        console.error(`  ✗ ${file}: Stylesheet file missing on disk: ${href}`);
        htmlErrors++;
      } else {
        console.log(`  ✓ ${file}: Local stylesheet referenced exists: ${href}`);
      }
    }
  }
});

console.log(`\nSyntax & HTML Test Results: JS Errors=${jsErrors}, HTML Errors=${htmlErrors}`);
