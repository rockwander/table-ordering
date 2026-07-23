# Print-Ready QR Code Sheets - Usage Guide

## Overview

The print sheet feature generates professional, print-ready A4 PNG files containing QR codes for all your tables. These sheets are designed to be printed, cut, and laminated for placement on physical tables.

## Features

- **A4 Size**: Optimized for standard A4 paper (210mm × 297mm)
- **High Resolution**: 300 DPI for professional print quality
- **8 QRs per Page**: 2 columns × 4 rows layout with optimal spacing
- **Complete Information**: Each QR includes:
  - QR code (scannable)
  - Table number/name ("Counter", "Table 1", "Table VIP-A", etc.)
  - Instruction text: "Scan this QR to place an order"
- **Cutting Guides**: Dotted lines show where to cut
- **Multiple Pages**: Automatically creates multiple sheets if you have more than 8 tables

## How to Use

### 1. Generate Print Sheet

1. Go to **Admin → Tables & QR Codes**
2. Click the green **"Download Print Sheet"** button
3. Wait for generation (may take a few seconds)
4. PNG files will download automatically:
   - `qr-sheet-page-1.png`
   - `qr-sheet-page-2.png` (if needed)
   - etc.

### 2. Print

1. Open the downloaded PNG files
2. Print on A4 paper (210mm × 297mm)
3. Recommended settings:
   - **Paper size**: A4 (210mm × 297mm)
   - **Print quality**: High / Best
   - **Color**: Color (for orange QR codes)
   - **Scale**: 100% (do not fit to page)

### 3. Cut and Laminate

1. Cut along the dotted lines
2. Each QR code section should be approximately:
   - Width: ~90mm
   - Height: ~75mm
3. Laminate each piece for durability
4. Stick on corresponding tables

## Layout Details

### Page Structure

```
┌─────────────────────────────────────────┐
│            A4 Page (210mm × 297mm)       │
│  ┌──────────┐      ┌──────────┐         │
│  │  QR 1    │      │  QR 2    │         │
│  │ Counter  │      │ Table 1  │         │
│  └──────────┘      └──────────┘         │
│  ┌──────────┐      ┌──────────┐         │
│  │  QR 3    │      │  QR 4    │         │
│  │ Table 2  │      │ Table 3  │         │
│  └──────────┘      └──────────┘         │
│  ┌──────────┐      ┌──────────┐         │
│  │  QR 5    │      │  QR 6    │         │
│  │ Table 4  │      │ Table 5  │         │
│  └──────────┘      └──────────┘         │
│  ┌──────────┐      ┌──────────┐         │
│  │  QR 7    │      │  QR 8    │         │
│  │ Table 6  │      │ Table 7  │         │
│  └──────────┘      └──────────┘         │
│                                          │
│  Cut along dotted lines and laminate    │
└─────────────────────────────────────────┘
```

### Table Ordering

Tables are automatically sorted in the following order:

1. **Counter** (always first)
2. **Numeric tables** (1, 2, 3, ..., 10, 11, etc.) sorted numerically
3. **Alphanumeric tables** (patio-1, VIP-A, VIP-B, etc.) sorted alphabetically

This ensures consistent ordering across all pages.

## Technical Specifications

### Resolution and Size

- **Canvas size**: 2480 × 3508 pixels
- **DPI**: 300 (professional print quality)
- **Physical size**: 210mm × 297mm (A4)
- **File format**: PNG with high-quality compression

### QR Code Details

- **Size**: ~600 × 600 pixels per QR
- **Colors**: Orange (#D4691A) on white background
- **Margin**: 1 module
- **Error correction**: Medium level

### Spacing

- **Edge padding**: 100px (~8mm)
- **Between QRs**: 60px (~5mm)
- **Text spacing**: 50-60px below QR code

## Troubleshooting

### Issue: Blank or missing QRs

**Solution**: Ensure all tables are marked as "Active" in the Tables page. Only active tables are included in the print sheet.

### Issue: Download blocked by browser

**Solution**: Check your browser's download settings. The system may download multiple files if you have more than 8 tables. Allow multiple downloads.

### Issue: QR codes not scanning

**Possible causes**:
1. Printed at wrong scale (not 100%)
2. Low print quality
3. Lamination too thick or reflective
4. Damaged during cutting

**Solution**: Re-print at 100% scale with high quality settings. Use matte lamination instead of glossy.

### Issue: Text appears blurry

**Solution**: Ensure you're printing at 300 DPI. Some printers may need to be set to "High Quality" or "Best" mode.

## Examples

### Example 1: Small Restaurant (5 tables)

**Tables**: counter, 1, 2, 3, 4

**Result**: 1 page with 5 QR codes (3 empty spaces)

### Example 2: Medium Restaurant (12 tables)

**Tables**: counter, 1-10, VIP-A

**Result**: 2 pages
- Page 1: counter, 1, 2, 3, 4, 5, 6, 7
- Page 2: 8, 9, 10, VIP-A

### Example 3: Large Restaurant (20 tables)

**Tables**: counter, 1-15, VIP-A, VIP-B, patio-1, patio-2

**Result**: 3 pages
- Page 1: counter, 1, 2, 3, 4, 5, 6, 7
- Page 2: 8, 9, 10, 11, 12, 13, 14, 15
- Page 3: patio-1, patio-2, VIP-A, VIP-B

## Benefits

✅ **Professional appearance** - High-quality print-ready output
✅ **Time-saving** - Generate all QRs at once
✅ **Consistent layout** - Uniform design across all tables
✅ **Easy to laminate** - Pre-sized for standard lamination pouches
✅ **Cost-effective** - Print at home or local print shop
✅ **Durable** - Laminated QRs last for years

## Recommended Materials

- **Paper**: 200gsm or higher (cardstock)
- **Lamination pouches**: 80-125 micron, matte finish
- **Adhesive**: Double-sided foam tape or mounting squares
- **Printer**: Color inkjet or laser with 300 DPI minimum

## Tips

1. **Print extras**: Print 1-2 extra sheets as backup
2. **Test scan**: After laminating, test each QR code before sticking
3. **Label back**: Write table number on back of laminated piece for easy identification
4. **Storage**: Keep extra QR codes in a folder for replacements
5. **Update regularly**: Re-generate sheets when adding/removing tables

---

**Generated sheets are ready to use immediately!** Simply print, cut, laminate, and stick.
