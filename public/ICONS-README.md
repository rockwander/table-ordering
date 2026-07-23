# Notification Icons Required

To enable full push notification support with proper icons, you need to generate the following icon files:

## Required Files

Place these PNG files in the `/public` directory:

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`
- `badge-72x72.png` (monochrome version for notification badge)

## Quick Generation

### Option 1: Use Online Generator (Recommended)

1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your logo (512x512 recommended, PNG format)
3. Click "Generate"
4. Download the icons
5. Copy all PNG files to `/public` directory

### Option 2: Use ImageMagick (if installed)

Run the provided script:
```bash
./scripts/generate-notification-icons.sh
```

### Option 3: Manual Creation

Create a 512x512 PNG logo and use any image editor to resize it to all the required sizes.

## Icon Requirements

- **Format**: PNG
- **Background**: Should match your brand colors
- **Content**: Restaurant logo or "RC" initials
- **Maskable**: Icons should have padding (safe zone)
- **Badge**: Should be monochrome/simple for notification badge

## Current Status

⚠️ Icons not yet generated - notifications will use browser defaults

The app will work without custom icons, but for a professional appearance, please generate and add them before production deployment.
