#!/bin/bash

# Script to generate placeholder notification icons
# For production, use a proper icon generator like https://www.pwabuilder.com/imageGenerator

echo "Generating placeholder notification icons..."

# Create public directory if it doesn't exist
mkdir -p public

# Create a simple SVG placeholder
cat > public/icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1976d2"/>
  <text x="50%" y="50%" font-size="200" fill="white" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-weight="bold">RC</text>
</svg>
EOF

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate PNG icons..."

    # Generate different sizes
    convert public/icon.svg -resize 72x72 public/icon-72x72.png
    convert public/icon.svg -resize 96x96 public/icon-96x96.png
    convert public/icon.svg -resize 128x128 public/icon-128x128.png
    convert public/icon.svg -resize 144x144 public/icon-144x144.png
    convert public/icon.svg -resize 152x152 public/icon-152x152.png
    convert public/icon.svg -resize 192x192 public/icon-192x192.png
    convert public/icon.svg -resize 384x384 public/icon-384x384.png
    convert public/icon.svg -resize 512x512 public/icon-512x512.png

    # Generate badge (monochrome)
    convert public/icon.svg -resize 72x72 -colorspace Gray public/badge-72x72.png

    echo "✅ Icons generated successfully!"
    echo "📁 Icons saved to public/ directory"
else
    echo "⚠️  ImageMagick not found. Please install it or use an online generator:"
    echo "   - Install: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
    echo "   - Online: https://www.pwabuilder.com/imageGenerator"
    echo ""
    echo "📄 Placeholder SVG created at public/icon.svg"
fi

echo ""
echo "For production, replace these with professional icons from:"
echo "  - https://www.pwabuilder.com/imageGenerator"
echo "  - https://realfavicongenerator.net/"
