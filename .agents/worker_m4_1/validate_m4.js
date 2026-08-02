const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const courseHtml = fs.readFileSync('course.html', 'utf8');

const requiredIndexIds = [
  'mapPickerModalBackdrop',
  'mapPickerModalTitle',
  'modalPickerLeafletMap',
  'mapPickerLatDisplay',
  'mapPickerLngDisplay',
  'reviewFilters',
  'adminAddReviewBtn',
  'reviewModalBackdrop',
  'reviewModalTitle',
  'reviewStudentName',
  'reviewCarTag',
  'reviewInstructor',
  'reviewRating',
  'reviewDate',
  'reviewAvatarUrl',
  'reviewText',
  'instaFeedGrid'
];

const requiredCourseIds = [
  'adminTabReviews',
  'adminPanelReviews',
  'reviewModalBackdrop'
];

console.log('--- INDEX.HTML ELEMENT ID CHECK ---');
let missingIndex = 0;
requiredIndexIds.forEach(id => {
  if (indexHtml.includes(`id="${id}"`)) {
    console.log(`[✓] id="${id}"`);
  } else {
    console.error(`[✗] id="${id}" MISSING`);
    missingIndex++;
  }
});

console.log('\n--- COURSE.HTML ELEMENT ID CHECK ---');
let missingCourse = 0;
requiredCourseIds.forEach(id => {
  if (courseHtml.includes(`id="${id}"`)) {
    console.log(`[✓] id="${id}"`);
  } else {
    console.error(`[✗] id="${id}" MISSING`);
    missingCourse++;
  }
});

if (missingIndex === 0 && missingCourse === 0) {
  console.log('\n✅ ALL REQUIRED DOM ELEMENTS PRESENT!');
} else {
  console.error('\n❌ MISSING ELEMENTS DETECTED!');
  process.exit(1);
}
