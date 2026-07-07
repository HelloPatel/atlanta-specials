/*
 * Floor-plan import helpers.
 *
 * Users upload their own venue floor plans (photos, screenshots grabbed online,
 * or venue PDFs). We normalize everything to a downscaled JPEG data URL so it:
 *   - renders instantly as a tracing underlay on the seating canvas, and
 *   - stays comfortably under Firestore's ~1MB document limit when persisted.
 */

const MAX_DIMENSION = 1800; // px — plenty for tracing, keeps data URLs small
const JPEG_QUALITY = 0.72;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = src;
  });
}

// Downscale an <img> onto a canvas and export a compact JPEG data URL.
function canvasFromImage(img, maxDim = MAX_DIMENSION, quality = JPEG_QUALITY) {
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  // White backdrop so transparent PNGs don't turn black as JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, 0, 0, cw, ch);
  return { dataUrl: canvas.toDataURL('image/jpeg', quality), width: cw, height: ch };
}

async function compressImageFile(file) {
  const raw = await readFileAsDataURL(file);
  const img = await loadImage(raw);
  return canvasFromImage(img);
}

// Render the first page of a PDF to a downscaled JPEG using pdf.js (lazy-loaded).
async function pdfFirstPageToImage(file) {
  const pdfjs = await import('pdfjs-dist');
  // Use a same-origin worker bundled by Vite (avoids CDN/version mismatches).
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(1);

  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2.5, MAX_DIMENSION / Math.max(baseViewport.width, baseViewport.height));
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  return {
    dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY),
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Load any supported floor-plan file (PNG/JPG/WEBP/GIF or PDF) into a compact
 * JPEG data URL ready to use as a canvas underlay.
 * @returns {Promise<{ dataUrl: string, width: number, height: number }>}
 */
export async function loadFloorPlan(file) {
  if (!file) throw new Error('No file provided');
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (isPdf) return pdfFirstPageToImage(file);
  return compressImageFile(file);
}

export const FLOOR_PLAN_ACCEPT = 'image/*,application/pdf,.pdf';
