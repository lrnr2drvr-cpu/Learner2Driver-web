const fs = require('fs');
const path = require('path');

const envConfig = `
// Auto-generated during build by scripts/generate-env.js
window.L2D_ENV = {
  GOOGLE_PLACES_API_KEY: "${process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyA8Uo-k_uQW_KlmzRFAQw-1GLCB5bYD8KM'}",
  GOOGLE_PLACE_ID: "${process.env.GOOGLE_PLACE_ID || 'ChIJ_RNj_7Vze0gRHMPMQcHfW-I'}",
  SUPABASE_URL: "${process.env.SUPABASE_URL || 'https://uxgychlmmnpfrnkhrhbc.supabase.co'}",
  SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY || 'sb_publishable_LM5nEdUBi1dJ0l8Cu26S9g_-muMtCPV'}"
};
`;


const destPath = path.join(__dirname, '../js/env-config.js');
fs.writeFileSync(destPath, envConfig);
console.log('✅ Environment variables successfully injected into js/env-config.js');
