const fs = require('fs');
const path = require('path');

const envConfig = `
// Auto-generated during build by scripts/generate-env.js
window.L2D_ENV = {
  GOOGLE_PLACES_API_KEY: "${process.env.GOOGLE_PLACES_API_KEY || ''}",
  GOOGLE_PLACE_ID: "${process.env.GOOGLE_PLACE_ID || ''}"
};
`;

const destPath = path.join(__dirname, '../js/env-config.js');
fs.writeFileSync(destPath, envConfig);
console.log('✅ Environment variables successfully injected into js/env-config.js');
