# MoodBoard - Product Details Gallery

A beautiful, dark-themed gallery application for browsing product detail page variants and individual strain pages.

## Features

- **Main Landing Page**: Browse different app sections
- **Product Details Gallery**: Masonry-style gallery with 2-column mobile layout
- **Fullscreen View**: Click any thumbnail to view pages in fullscreen
- **View Tracking**: Pages you've viewed are marked with a checkmark
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Theme**: Clean, modern dark interface

## Structure

- `index.html` - Main landing page with app sections
- `product-details.html` - Gallery page for product details
- `product details/` - Folder containing all page variants
  - Product detail page variants
  - Individual strain page variants

## Usage

1. Open `index.html` in a web browser
2. Click on "Product Details" to view the gallery
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

