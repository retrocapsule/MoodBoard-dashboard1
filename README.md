# MoodBoard - Product Details Gallery

A beautiful, dark-themed gallery application for browsing product detail page variants and individual strain pages.

## Features

- **Main Landing Page**: Automatically displays all sections from the `Sections` folder
- **Dynamic Gallery**: Each section automatically generates a gallery from its folder contents
- **Fullscreen View**: Click any thumbnail to view pages in fullscreen
- **View Tracking**: Pages you've viewed are marked with a checkmark (per section)
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Theme**: Clean, modern dark interface
- **Masonry Layout**: 2-column mobile layout with natural image heights

## Project Structure

```
├── index.html              # Main landing page (auto-loads sections from sections.json)
├── gallery.html            # Dynamic gallery page (works for any section)
├── sections.json           # Section definitions (auto-updated)
├── generate-manifests.py   # Script to generate manifest.json for each section
├── update-sections.py     # Script to update sections.json with new folders
├── Sections/               # All section folders go here
│   ├── Product Gallery/
│   │   ├── manifest.json  # Auto-generated list of items
│   │   └── [item folders]/
│   │       ├── code.html
│   │       └── screen.png
│   └── product details/
│       ├── manifest.json
│       └── [item folders]/
│           ├── code.html
│           └── screen.png
└── SunBurst2.webp         # Logo
```

## Supabase Integration

This app uses Supabase for data storage and user tracking. See `SUPABASE_SETUP.md` for complete setup instructions.

**Quick Setup:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor
3. Copy `supabase-config.example.js` to `supabase-config.js` and add your credentials
4. Run `python3 sync-to-supabase.py` to upload your local data

## Adding New Sections

1. **Create a new folder** in the `Sections/` directory
2. **Add your page folders** - Each should contain:
   - `code.html` - The HTML page
   - `screen.png` (or `.jpg`, `.jpeg`, `.webp`) - The thumbnail image
3. **Sync to Supabase**:
   ```bash
   python3 sync-to-supabase.py  # Scans Sections/ and syncs to Supabase
   ```
4. **Refresh the page** - Your new section will appear on the main index!

**Note:** The sync script automatically:
- Detects new sections and items
- Updates existing records
- Removes deleted items
- Maintains display order

**Fallback Mode:** If Supabase is not configured, the app falls back to local `manifest-loader.js` files (run `generate-manifests.py` for local mode).

## Usage

1. Open `index.html` in a web browser
2. Click on any section to view its gallery
3. Click any thumbnail to view the full page
4. Use the back button to return to the gallery or main page

## Local Development

For best results, use a local web server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx serve

# Then open: http://localhost:8000
```

## Technologies

- HTML5
- Tailwind CSS
- Vanilla JavaScript
- Material Icons

## Scripts

- `generate-manifests.py` - Scans all section folders and creates/updates manifest.json files
- `update-sections.py` - Scans Sections folder and updates sections.json with new sections

Run both scripts whenever you add new folders or pages to keep everything in sync!
