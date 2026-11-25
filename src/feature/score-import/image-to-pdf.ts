// iOS Safari refuses canvases above ~16.7M pixels; 4096² stays well inside while keeping notation sharp.
const MAX_IMAGE_EDGE = 4096;
const JPEG_QUALITY = 0.9;
// Portrait A4 in PDF points (1/72 inch).
const A4_PAGE_WIDTH = 595.28;
const A4_PAGE_HEIGHT = 841.89;

interface JpegPage {
  jpeg: Uint8Array;
  width: number;
  height: number;
}

async function encodeImageAsJpeg(file: Blob): Promise<JpegPage> {
  // createImageBitmap applies EXIF orientation by default, so phone photos stay upright.
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    // JPEG has no alpha: transparent PNG areas would otherwise turn black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    const jpeg = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!jpeg) throw new Error('Canvas JPEG encoding failed');
    return { jpeg: new Uint8Array(await jpeg.arrayBuffer()), width, height };
  } finally {
    bitmap.close();
  }
}

/**
 * Builds a PDF with one A4 page per JPEG, the image scaled to fit and centered.
 * DCTDecode embeds the JPEG bytes as-is, so no PDF library is needed.
 * Object layout: 1 Catalog, 2 Pages, then per page i: 3+3i Page, 4+3i Image, 5+3i Content.
 */
function buildPdf(pages: JpegPage[]): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const objectOffsets: number[] = [];
  let length = 0;
  const append = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
    parts.push(bytes);
    length += bytes.length;
  };
  const beginObject = (id: number) => {
    objectOffsets[id] = length;
    append(`${id} 0 obj\n`);
  };
  const pageObjectId = (index: number) => 3 + index * 3;

  // The binary comment marks the file as binary for transfer tools, per PDF spec recommendation.
  append('%PDF-1.4\n%µ¶\n');
  beginObject(1);
  append('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  beginObject(2);
  const kids = pages.map((_, index) => `${pageObjectId(index)} 0 R`).join(' ');
  append(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach(({ jpeg, width, height }, index) => {
    const pageId = pageObjectId(index);
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    const fitScale = Math.min(A4_PAGE_WIDTH / width, A4_PAGE_HEIGHT / height);
    const drawWidth = width * fitScale;
    const drawHeight = height * fitScale;
    const offsetX = (A4_PAGE_WIDTH - drawWidth) / 2;
    const offsetY = (A4_PAGE_HEIGHT - drawHeight) / 2;
    const drawImage = `q ${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${offsetX.toFixed(2)} ${offsetY.toFixed(2)} cm /Im0 Do Q`;

    beginObject(pageId);
    append(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_PAGE_WIDTH} ${A4_PAGE_HEIGHT}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`);
    beginObject(imageId);
    append(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    append(jpeg);
    append('\nendstream\nendobj\n');
    beginObject(contentId);
    append(`<< /Length ${drawImage.length} >>\nstream\n${drawImage}\nendstream\nendobj\n`);
  });

  const xrefOffset = length;
  const objectCount = objectOffsets.length;
  const xrefEntries = objectOffsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  append(`xref\n0 ${objectCount}\n0000000000 65535 f \n${xrefEntries}`);
  append(`trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}

/** Converts browser-decodable images (JPEG, PNG, WebP, ...) into one PDF, one page per image in the given order. */
export async function convertImagesToPdf(images: Blob[]): Promise<Blob> {
  const pages: JpegPage[] = [];
  // Sequential on purpose: decoding several large photos at once can exhaust tablet memory.
  for (const image of images) pages.push(await encodeImageAsJpeg(image));
  return buildPdf(pages);
}
