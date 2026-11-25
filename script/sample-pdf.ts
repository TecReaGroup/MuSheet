const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const STAVES_PER_PAGE = 9;
const STAFF_LINE_GAP = 7;
const STAFF_GAP = 70;

export interface SamplePdfContent {
  title: string;
  subtitle: string;
  pageCount: number;
}

// Helvetica in a bare PDF only covers WinAnsi, so sample text must stay ASCII.
function escapePdfText(text: string) {
  return text.replace(/[\\()]/g, match => `\\${match}`);
}

function textLine(size: number, x: number, y: number, text: string) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function staffLines(top: number) {
  const lines: string[] = [];
  for (let line = 0; line < 5; line += 1) {
    const y = top - line * STAFF_LINE_GAP;
    lines.push(`${MARGIN} ${y} m ${PAGE_WIDTH - MARGIN} ${y} l S`);
  }
  return lines;
}

function pageContent(content: SamplePdfContent, pageNumber: number) {
  const staffTop = PAGE_HEIGHT - 150;
  return [
    textLine(22, MARGIN, PAGE_HEIGHT - 80, content.title),
    textLine(12, MARGIN, PAGE_HEIGHT - 102, content.subtitle),
    textLine(10, PAGE_WIDTH - MARGIN - 50, 36, `${pageNumber} / ${content.pageCount}`),
    '0.6 w',
    ...Array.from({ length: STAVES_PER_PAGE }, (_, staff) => staffLines(staffTop - staff * STAFF_GAP)).flat(),
  ].join('\n');
}

/** Builds a small valid PDF of blank staves, so seeded scores render like real sheet music. */
export function buildSamplePdf(content: SamplePdfContent): Buffer {
  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  // Objects 1-3 are the catalog, the page tree and the font; pages follow as (page, stream) pairs.
  for (let page = 1; page <= content.pageCount; page += 1) {
    const pageId = 2 + page * 2;
    const stream = pageContent(content, page);
    pageObjectIds.push(pageId);
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
    objects[pageId + 1] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`;
  }
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${content.pageCount} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = Buffer.byteLength(body, 'latin1');
    body += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(body, 'latin1');
  const xrefEntries = offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  body += `xref\n0 ${objects.length}\n0000000000 65535 f \n${xrefEntries}`;
  body += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body, 'latin1');
}
