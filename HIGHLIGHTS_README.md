# Story Highlights Feature

Instagram-style story highlights for Ramani's Cafe customer menu.

## Overview

This feature allows you to create highlight categories (like Instagram profile highlights) and upload stories with images and captions. Customers will see circular highlight icons at the top of the menu page, and clicking them opens an Instagram-style story viewer with auto-advancing carousel.

## Features

- ✅ Instagram-style circular highlight icons with gradient borders
- ✅ Full-screen story viewer with progress bars
- ✅ Auto-advancing stories (configurable duration, default 5 seconds)
- ✅ Manual navigation (previous/next arrows)
- ✅ Pause/resume by clicking
- ✅ Bilingual support (English & Gujarati)
- ✅ Active/inactive toggle for visibility control
- ✅ Automatic cover image from first story
- ✅ Supabase Storage integration for images

## Database Schema

### `highlight_categories` table
- `id` - UUID primary key
- `name` - English category name
- `gujarati_name` - Gujarati category name (optional)
- `cover_image_url` - Cover image URL (auto-set from first story if empty)
- `display_order` - Order of appearance (lower = earlier)
- `is_active` - Show/hide toggle
- `created_at` / `updated_at` - Timestamps

### `highlight_stories` table
- `id` - UUID primary key
- `category_id` - Foreign key to highlight_categories
- `image_url` - Story image URL (from Supabase Storage)
- `caption` - English caption (optional)
- `gujarati_caption` - Gujarati caption (optional)
- `display_order` - Order within category (lower = earlier)
- `duration` - Display duration in milliseconds (default 5000)
- `created_at` / `updated_at` - Timestamps

### `story-highlights` storage bucket
- Public read access
- Authenticated write/delete access
- Stores all story images

## CLI Usage

All highlight management is done through the CLI tool at `scripts/highlights-cli.ts`.

### Basic Commands

```bash
# Show available commands
npx tsx scripts/highlights-cli.ts

# Initialize database (only needed first time)
npx tsx scripts/highlights-cli.ts setup

# Create a new highlight category
npx tsx scripts/highlights-cli.ts create-category

# Add a story to a category
npx tsx scripts/highlights-cli.ts add-story

# List all categories and stories
npx tsx scripts/highlights-cli.ts list

# Delete a specific story
npx tsx scripts/highlights-cli.ts delete-story

# Delete a category and all its stories
npx tsx scripts/highlights-cli.ts delete-category

# Toggle category active/inactive status
npx tsx scripts/highlights-cli.ts toggle-category

# Preview in browser
npx tsx scripts/highlights-cli.ts preview
```

## Step-by-Step Guide

### 1. Create Your First Highlight Category

```bash
npx tsx scripts/highlights-cli.ts create-category
```

Example interaction:
```
English name: New Menu Items
Gujarati name: નવી મેનુ વસ્તુઓ
Display order (number, lower shows first): 1
Cover image URL (optional, press enter to skip): [press enter]

✓ Category created successfully!
ID: abc123-def456-...
Name: New Menu Items
```

### 2. Add Stories to Your Category

```bash
npx tsx scripts/highlights-cli.ts add-story
```

Example interaction:
```
Available categories:
1. New Menu Items (નવી મેનુ વસ્તુઓ)
   ID: abc123-def456-...

Enter category ID: abc123-def456-...
Image file path (absolute or relative): /Users/you/Desktop/new-pizza.jpg
Caption (English): Try our new Margherita Pizza!
Caption (Gujarati): અમારું નવું માર્ગરિટા પિઝા અજમાવો!
Display order: 1
Duration in seconds (default 5): 7

Uploading image...
✓ Image uploaded: https://...supabase.co/storage/v1/object/public/story-highlights/...
✓ Story added successfully!
ID: xyz789-...
✓ Set as category cover image
```

### 3. View Your Highlights

```bash
npx tsx scripts/highlights-cli.ts list
```

Output:
```
=== All Highlight Categories and Stories ===

📁 New Menu Items (નવી મેનુ વસ્તુઓ)
   ID: abc123-def456-...
   Status: ✓ Active
   Order: 1
   Stories: 1
      1. Try our new Margherita Pizza!
         ID: xyz789-...
         Image: https://...
         Order: 1
```

### 4. Manage Highlights

**Toggle visibility:**
```bash
npx tsx scripts/highlights-cli.ts toggle-category
# Enter category ID when prompted
```

**Delete a story:**
```bash
npx tsx scripts/highlights-cli.ts delete-story
# Enter story ID when prompted
```

**Delete entire category:**
```bash
npx tsx scripts/highlights-cli.ts delete-category
# Enter category ID and confirm with "yes"
```

## Best Practices

### Image Guidelines
- **Format:** JPG or PNG
- **Size:** Recommended 1080x1920px (9:16 aspect ratio for best mobile viewing)
- **File size:** Keep under 2MB for fast loading
- **Content:** Ensure images are clear and text is readable on mobile

### Category Organization
- **Display order:** Use increments of 10 (10, 20, 30...) to allow easy reordering
- **Naming:** Keep names short (2-3 words) as they appear under circles
- **Active status:** Use toggle instead of deleting to preserve content

### Story Duration
- **Default (5s):** Good for image-only stories
- **Longer (7-10s):** Better for images with text captions
- **Shorter (3s):** Quick announcements or simple images

### Bilingual Content
- **Always provide both languages** for consistent user experience
- **Keep translations accurate** - use native speakers when possible
- **Caption length:** Keep captions concise (1-2 sentences max)

## Example Workflows

### Workflow 1: Weekly Special Announcement

```bash
# 1. Create category
npx tsx scripts/highlights-cli.ts create-category
# Name: This Week's Special
# Gujarati: આ અઠવાડિયાની વિશેષ
# Order: 5

# 2. Add stories for each special
npx tsx scripts/highlights-cli.ts add-story
# Upload image of Monday special with caption
# Repeat for Tuesday, Wednesday, etc.

# 3. Next week, delete old category and create new one
npx tsx scripts/highlights-cli.ts delete-category
```

### Workflow 2: Permanent "Popular Items" Highlight

```bash
# 1. Create category
npx tsx scripts/highlights-cli.ts create-category
# Name: Popular Items
# Gujarati: લોકપ્રિય વસ્તુઓ
# Order: 1

# 2. Add 5-8 stories of bestsellers
npx tsx scripts/highlights-cli.ts add-story
# Add each popular item

# 3. Leave active permanently
# Update occasionally by adding/removing stories
```

## Customer Experience

When customers scan the QR code and view the menu:

1. **Highlight circles** appear at the top of the menu page
2. **Gradient border** (Instagram-style) indicates they're clickable
3. **Category name** shows below each circle
4. **Clicking** opens full-screen story viewer
5. **Progress bars** at top show story position
6. **Auto-advance** moves to next story after duration
7. **Navigation arrows** allow manual control
8. **Tap/click** pauses/resumes playback
9. **Close button** exits viewer
10. **Bilingual** - shows Gujarati if language is set to Gujarati

## Technical Details

### Component Architecture

```
app/menu/page.tsx
  ├─ HighlightCircles (horizontal scrollable circles)
  └─ StoryViewer (fullscreen modal viewer)

components/
  ├─ HighlightCircles.tsx - Fetches & displays categories
  └─ StoryViewer.tsx - Displays stories with carousel

scripts/
  └─ highlights-cli.ts - Admin CLI tool

supabase/migrations/
  ├─ 20250807000001_create_story_highlights.sql - Tables
  └─ 20250807000002_create_story_highlights_storage.sql - Storage bucket
```

### Storage Structure

```
story-highlights/ (Supabase Storage bucket)
  ├─ 1704672000000_image1.jpg
  ├─ 1704672100000_image2.png
  └─ ...
```

Files are named: `{timestamp}_{original_filename}`

## Troubleshooting

### Issue: Tables don't exist

**Solution:**
```bash
npx tsx scripts/highlights-cli.ts setup
# Copy and run the SQL in Supabase SQL Editor
```

### Issue: Images not uploading

**Check:**
1. Supabase storage bucket `story-highlights` exists
2. Storage policies are set correctly (public read, authenticated write)
3. Image file path is correct and file exists
4. File is a valid image format (JPG, PNG)

### Issue: Highlights not showing on menu

**Check:**
1. Category `is_active` is true (use `toggle-category` to enable)
2. Category has at least one story
3. Story has valid `image_url`
4. Run `list` command to verify data

### Issue: Wrong language showing

The components automatically detect language from `LanguageContext`. Ensure:
1. Language toggle in admin works
2. Both `gujarati_name` and `gujarati_caption` are filled in database

## Future Enhancements (Ideas)

- 📱 Admin web interface for managing highlights (instead of CLI)
- 📊 Analytics: track which highlights are viewed most
- ⏰ Scheduled highlights (auto-activate/deactivate based on date)
- 🎨 Custom gradient colors per category
- 📹 Video support in addition to images
- 🔗 Deep linking to specific menu items from stories
- 👆 Swipe gestures for navigation on mobile

## Support

For issues or questions:
1. Check this README first
2. Run `npx tsx scripts/highlights-cli.ts list` to verify data
3. Check browser console for errors
4. Verify Supabase tables and storage exist

---

**Happy highlighting! 🎉**
