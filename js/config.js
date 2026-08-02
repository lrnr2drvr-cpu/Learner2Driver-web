/**
 * ==========================================================================
 * LEARNER2DRIVER - GLOBAL CONFIGURATION SYSTEM (js/config.js)
 * Isolates public client keys and runtime configuration.
 * DO NOT PLACE SECRET KEYS (e.g., Supabase service_role, private API keys) HERE.
 * ==========================================================================
 */

(function() {
  'use strict';

  // Read environment variable overrides if provided via window.L2D_ENV or build script
  const env = window.L2D_ENV || {};

  const CONFIG = {
    // Application Metadata
    APP_NAME: 'Learner2Driver Preston',
    VERSION: '3.0.0',
    ENVIRONMENT: env.NODE_ENV || 'production',

    // Supabase Public Configuration (Safe for client exposure with RLS)
    SUPABASE: {
      URL: env.SUPABASE_URL || 'https://uxgychlmmnpfrnkhrhbc.supabase.co',
      ANON_KEY: env.SUPABASE_ANON_KEY || 'sb_publishable_LM5nEdUBi1dJ0l8Cu26S9g_-muMtCPV',
      AUTO_SYNC: true
    },

    // Google Places API Public Configuration
    GOOGLE_PLACES: {
      API_KEY: env.GOOGLE_PLACES_API_KEY || 'YOUR_GOOGLE_PLACES_API_KEY',
      PLACE_ID: env.GOOGLE_PLACE_ID || 'ChIJ_RNj_7Vze0gRHMPMQcHfW-I',
      REFERRER_RESTRICTED: true
    },

    // Instagram Behold Feed API
    INSTAGRAM: {
      FEED_ENDPOINT: env.INSTA_FEED_ENDPOINT || 'https://feeds.behold.so/JnT3KNlUepSxi6fR755B'
    },

    // HubSpot CRM Platform Integration (Marketing, Sales, Live Chat, Lead Forms)
    HUBSPOT: {
      PORTAL_ID: env.HUBSPOT_PORTAL_ID || '' // User's HubSpot Hub ID (e.g. 12345678)
    },

    // Security Policy Flags
    SECURITY: {
      ALLOW_LOCAL_OVERRIDE: true, // Allows admin hub settings override in localStorage
      HASH_ALGORITHM: 'SHA-256'
    }
  };

  // Helper getters with localStorage override support
  CONFIG.getSupabaseUrl = function() {
    return localStorage.getItem('l2d_supabase_url') || CONFIG.SUPABASE.URL;
  };

  CONFIG.getSupabaseKey = function() {
    return localStorage.getItem('l2d_supabase_key') || CONFIG.SUPABASE.ANON_KEY;
  };

  CONFIG.getGoogleApiKey = function() {
    return localStorage.getItem('l2d_google_places_api_key') || CONFIG.GOOGLE_PLACES.API_KEY;
  };

  CONFIG.getGooglePlaceId = function() {
    return localStorage.getItem('l2d_google_place_id') || CONFIG.GOOGLE_PLACES.PLACE_ID;
  };

  CONFIG.getInstaEndpoint = function() {
    return localStorage.getItem('l2d_insta_api_endpoint') || CONFIG.INSTAGRAM.FEED_ENDPOINT;
  };

  CONFIG.getHubSpotPortalId = function() {
    return (window.L2D_ENV && window.L2D_ENV.HUBSPOT_PORTAL_ID) || localStorage.getItem('l2d_hubspot_portal_id') || CONFIG.HUBSPOT.PORTAL_ID;
  };

  // Attach to global scope
  window.L2D_CONFIG = CONFIG;
})();
