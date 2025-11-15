// Supabase Configuration
// This file is auto-generated during build from environment variables
// For local development, it uses the values below
// For production (Vercel), it's regenerated with environment variables during build

const SUPABASE_CONFIG = {
    url: 'https://ciiontrvijjplyjnefyx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpaW9udHJ2aWpqcGx5am5lZnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjc3NzUsImV4cCI6MjA3ODgwMzc3NX0.jPMxr0s_cpDJG1SJP6b6OZDgwuP_ml8xjr46vtgOikE',
};

// Check if configured
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    console.warn('Supabase not configured. Please set up supabase-config.js or Vercel environment variables');
}

