import QRCode from 'qrcode';
import { Table } from '@/types';

interface QRSheetOptions {
  qrsPerPage?: number;
  a4Width?: number;
  a4Height?: number;
  dpi?: number;
}

const DEFAULT_OPTIONS: Required<QRSheetOptions> = {
  qrsPerPage: 8,
  a4Width: 2480,  // A4 width at 300 DPI (210mm)
  a4Height: 3508, // A4 height at 300 DPI (297mm)
  dpi: 300,
};

/**
 * Generates print-ready A4 PNG sheets with QR codes
 * Layout: 2 columns x 4 rows = 8 QRs per page
 */
export async function generateQRSheets(
  tables: Table[],
  baseUrl: string,
  options: QRSheetOptions = {}
): Promise<string[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const sheets: string[] = [];

  // Split tables into pages (8 per page)
  const pages: Table[][] = [];
  for (let i = 0; i < tables.length; i += opts.qrsPerPage) {
    pages.push(tables.slice(i, i + opts.qrsPerPage));
  }

  // Generate each page
  for (const pageTables of pages) {
    const sheetDataUrl = await generateSingleSheet(pageTables, baseUrl, opts);
    sheets.push(sheetDataUrl);
  }

  return sheets;
}

async function generateSingleSheet(
  tables: Table[],
  baseUrl: string,
  opts: Required<QRSheetOptions>
): Promise<string> {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = opts.a4Width;
  canvas.height = opts.a4Height;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Layout configuration
  const cols = 2;
  const rows = 4;
  const padding = 100; // Padding from edges
  const spacing = 60;  // Spacing between QR codes

  // Calculate cell dimensions
  const availableWidth = opts.a4Width - (padding * 2) - (spacing * (cols - 1));
  const availableHeight = opts.a4Height - (padding * 2) - (spacing * (rows - 1));
  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;

  // QR code size (leave room for text below)
  const qrSize = Math.min(cellWidth * 0.8, cellHeight * 0.6);
  const textHeight = cellHeight * 0.3;

  // Generate and place each QR code
  for (let i = 0; i < tables.length && i < opts.qrsPerPage; i++) {
    const table = tables[i];
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Calculate position
    const x = padding + (col * (cellWidth + spacing));
    const y = padding + (row * (cellHeight + spacing));

    // Generate QR code
    const menuUrl = `${baseUrl}/menu?table=${table.table_number}`;
    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
      width: qrSize,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Load and draw QR image
    const qrImage = await loadImage(qrDataUrl);
    const qrX = x + (cellWidth - qrSize) / 2;
    const qrY = y;
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Draw table number
    const tableLabel = table.table_number === 'counter'
      ? 'Counter'
      : `Table ${table.table_number}`;

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    const textY = qrY + qrSize + 60;
    ctx.fillText(tableLabel, x + cellWidth / 2, textY);

    // Draw instruction text
    ctx.font = '32px Arial';
    ctx.fillStyle = '#555555';
    const instructionY = textY + 50;
    ctx.fillText('Scan this QR to place an order', x + cellWidth / 2, instructionY);

    // Draw border around cell (optional, for cutting guide)
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(x, y, cellWidth, cellHeight);
    ctx.setLineDash([]);
  }

  // Add page footer
  ctx.fillStyle = '#999999';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Cut along dotted lines and laminate each QR code',
    opts.a4Width / 2,
    opts.a4Height - 40
  );

  return canvas.toDataURL('image/png');
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Download a single sheet or multiple sheets as ZIP
 */
export function downloadQRSheet(dataUrl: string, filename: string = 'qr-sheet.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Download all sheets individually
 */
export function downloadAllSheets(sheets: string[]) {
  sheets.forEach((sheet, index) => {
    const filename = `qr-sheet-page-${index + 1}.png`;
    setTimeout(() => {
      downloadQRSheet(sheet, filename);
    }, index * 500); // Stagger downloads to avoid browser blocking
  });
}
