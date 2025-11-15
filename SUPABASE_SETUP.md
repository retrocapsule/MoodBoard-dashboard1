# Supabase Setup Guide

This guide will help you set up Supabase for the MoodBoard application.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: MoodBoard (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait for project to initialize (2-3 minutes)

## Step 2: Create Database Tables

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 3: Get Your API Keys

1. Go to **Settings** → **API** (left sidebar)
2. You'll need:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys" → "anon public")
   - **service_role** key (under "Project API keys" → "service_role") - **Keep this secret!**

## Step 4: Configure Frontend

1. Copy `supabase-config.example.js` to `supabase-config.js`:
   ```bash
   cp supabase-config.example.js supabase-config.js
   ```

2. Edit `supabase-config.js` and fill in:
   - `url`: Your Project URL
   - `anonKey`: Your anon public key

## Step 5: Configure Sync Script

1. Create `supabase-config.env` file in the project root:
   ```bash
   SUPABASE_URL=your_project_url_here
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```

2. Install Python dependencies:
   ```bash
   pip install supabase python-dotenv
   ```

3. Add `supabase-config.env` to `.gitignore` (already included)

## Step 6: Initial Sync

Run the sync script to upload your local data to Supabase:

```bash
python3 sync-to-supabase.py
```

This will:
- Scan your `Sections/` folder
- Create sections in Supabase
- Upload all gallery items
- Keep everything in sync

## Step 7: Update Frontend

The frontend will automatically use Supabase once configured. Make sure:
- `supabase-config.js` is properly configured
- You've run the initial sync
- The HTML files include the Supabase client

## Workflow Going Forward

**When you add a new section:**
1. Add folder to `Sections/` directory
2. Run: `python3 sync-to-supabase.py`
3. Refresh the app - new section appears!

**When you add new pages to a section:**
1. Add page folders to the section directory
2. Run: `python3 sync-to-supabase.py`
3. New pages appear in the gallery!

## Troubleshooting

**"Missing Supabase credentials" error:**
- Make sure `supabase-config.env` exists and has correct values
- Check that file is in the project root

**"Table doesn't exist" error:**
- Make sure you ran the SQL schema in Supabase SQL Editor
- Check that all tables were created successfully

**Frontend not loading data:**
- Check browser console for errors
- Verify `supabase-config.js` has correct URL and anon key
- Make sure RLS policies allow public read access

## Security Notes

- ✅ **anon key**: Safe to use in frontend (public)
- ❌ **service_role key**: NEVER expose in frontend, only in sync script
- ✅ RLS policies protect your data while allowing public reads
- ✅ Each user's feedback is tracked separately

