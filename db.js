const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://uxgychlmmnpfrnkhrhbc.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_LM5nEdUBi1dJ0l8Cu26S9g_-muMtCPV'
);

// Test connection by querying site_settings table
async function testConnection() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Supabase connection error:', error.message);
  } else {
    console.log('Supabase connected successfully. Rows:', data.length);
  }
}

testConnection();

module.exports = supabase;
