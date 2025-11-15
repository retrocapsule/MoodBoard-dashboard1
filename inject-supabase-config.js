#!/usr/bin/env node
/**
 * Build script to inject Supabase config from environment variables into HTML files
 * Run this before deploying to Vercel, or set it as a build command
 * 
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx NEXT_PUBLIC_SUPABASE_ANON_KEY=yyy node inject-supabase-config.js
 * 
 * Or in Vercel, add as build command:
 *   NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY node inject-supabase-config.js
 */

const fs = require('fs');
const path = require('path');

// Get environment variables (Vercel uses NEXT_PUBLIC_ prefix, but we'll check both)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase environment variables not found.');
    console.warn('   Using local config from supabase-config.js');
    console.warn('   For production, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(0); // Don't fail, just use local config
}

console.log('✓ Injecting Supabase config from environment variables...');

// Create the config JavaScript
const configJs = `// Supabase Configuration (injected from environment variables)
// This file is auto-generated during build

const SUPABASE_CONFIG = {
    url: ${JSON.stringify(supabaseUrl)},
    anonKey: ${JSON.stringify(supabaseAnonKey)},
};

// Check if configured
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    console.warn('Supabase not configured. Please set up environment variables.');
}
`;

// Write the config file
const configPath = path.join(__dirname, 'supabase-config.js');
fs.writeFileSync(configPath, configJs, 'utf8');

console.log('✓ Created supabase-config.js with environment variables');
console.log(`✓ Supabase URL: ${supabaseUrl.substring(0, 30)}...`);

