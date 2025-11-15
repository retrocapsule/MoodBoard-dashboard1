# Vercel Deployment Setup

This guide will help you deploy your MoodBoard app to Vercel with Supabase integration.

## Step 1: Set Up Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### For Production:
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://ciiontrvijjplyjnefyx.supabase.co`
- **Environment**: Production, Preview, Development

- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpaW9udHJ2aWpqcGx5am5lZnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjc3NzUsImV4cCI6MjA3ODgwMzc3NX0.jPMxr0s_cpDJG1SJP6b6OZDgwuP_ml8xjr46vtgOikE`
- **Environment**: Production, Preview, Development

### Alternative (if NEXT_PUBLIC_ prefix doesn't work):
- **Name**: `SUPABASE_URL`
- **Value**: `https://ciiontrvijjplyjnefyx.supabase.co`
- **Environment**: Production, Preview, Development

- **Name**: `SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpaW9udHJ2aWpqcGx5am5lZnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjc3NzUsImV4cCI6MjA3ODgwMzc3NX0.jPMxr0s_cpDJG1SJP6b6OZDgwuP_ml8xjr46vtgOikE`
- **Environment**: Production, Preview, Development

## Step 2: Configure Vercel Build Settings

1. Go to your Vercel project → **Settings** → **General**
2. Find **Build & Development Settings**
3. Set **Build Command** to: `node inject-supabase-config.js`
4. Set **Output Directory** to: `.` (current directory)
5. Set **Install Command** to: (leave empty, no dependencies needed)

This will run the build script that injects your environment variables into `supabase-config.js` before deployment.

## Step 3: Deploy

1. Push your code to GitHub
2. Vercel will automatically detect the changes
3. The build will use the environment variables you set
4. Your app should now connect to Supabase!

## Troubleshooting

**"Supabase not configured" in production:**
- Check that environment variables are set in Vercel
- Make sure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding environment variables

**Data not loading:**
- Check browser console for errors
- Verify Supabase URL and anon key are correct
- Make sure you've run `sync-to-supabase.py` to upload your data

**CORS errors:**
- Make sure your Supabase project allows requests from your Vercel domain
- Check Supabase dashboard → Settings → API → CORS settings

