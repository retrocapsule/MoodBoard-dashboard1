# Quick Start Guide - Supabase Integration

## What Changed?

Your MoodBoard app now uses **Supabase** for:
- ✅ **User Authentication** - Users must enter name/email before accessing
- ✅ **Feedback Storage** - All ratings, thumbs, and notes are saved to Supabase with user tracking
- ✅ **Data Sync** - Sections and gallery items are stored in Supabase
- ✅ **Fallback Mode** - Still works locally if Supabase isn't configured

## Setup Steps (5 minutes)

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com) and sign up/login
- Click "New Project"
- Fill in project details and wait 2-3 minutes for setup

### 2. Run Database Schema
- In Supabase, go to **SQL Editor** → **New Query**
- Copy entire contents of `supabase-schema.sql`
- Click **Run** (or Cmd/Ctrl + Enter)

### 3. Get API Keys
- Go to **Settings** → **API**
- Copy:
  - **Project URL** (e.g., `https://xxxxx.supabase.co`)
  - **anon public** key (long string starting with `eyJ...`)

### 4. Configure Frontend
- Edit `supabase-config.js`:
  ```javascript
  const SUPABASE_CONFIG = {
      url: 'YOUR_PROJECT_URL_HERE',
      anonKey: 'YOUR_ANON_KEY_HERE',
  };
  ```

### 5. Configure Sync Script
- Create `supabase-config.env` file:
  ```
  SUPABASE_URL=your_project_url_here
  SUPABASE_SERVICE_KEY=your_service_role_key_here
  ```
- Get **service_role** key from **Settings** → **API** (keep this secret!)

### 6. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 7. Sync Your Data
```bash
python3 sync-to-supabase.py
```

This scans your `Sections/` folder and uploads everything to Supabase.

### 8. Test It!
- Open `index.html` in your browser
- You should see a login modal asking for name/email
- Enter your info and continue
- Everything should work as before, but now with Supabase!

## Going Forward

**When you add new sections or pages:**
```bash
python3 sync-to-supabase.py
```

That's it! The script automatically:
- Detects new sections
- Adds new gallery items
- Updates existing records
- Removes deleted items

## Fallback Mode

If Supabase isn't configured, the app falls back to:
- Local `manifest-loader.js` files (run `generate-manifests.py`)
- localStorage for feedback (no user tracking)

## Troubleshooting

**"Supabase not configured" warning:**
- Check that `supabase-config.js` has correct values
- Make sure file exists and is in project root

**"Error fetching from Supabase":**
- Check browser console for detailed error
- Verify your anon key is correct
- Make sure you ran the SQL schema

**Sync script fails:**
- Check `supabase-config.env` exists and has correct values
- Verify service_role key (not anon key!)
- Make sure you installed dependencies: `pip install -r requirements.txt`

## What's Different for Users?

1. **First Visit**: Users see a login modal asking for name/email
2. **Feedback**: All feedback is now tied to their user account
3. **Same Experience**: Everything else works exactly the same!

## Security Notes

- ✅ **anon key** is safe to use in frontend (public)
- ❌ **service_role key** is ONLY for sync script, never expose it
- ✅ RLS policies protect your data
- ✅ Each user's feedback is private to them

