import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { preparePdfImport, sanitizeSourceText, verifiedSources } from './pdf-content';
import type { SourcePage } from '../types';

GlobalWorkerOptions.workerSrc = workerUrl;

interface PositionedText { x: number; y: number; value: string; }

function isTextItem(item: unknown): item is { str: string; transform: number[] } {
  return !!item && typeof item === 'object' && 'str' in item && 'transform' in item
    && typeof item.str === 'string' && Array.isArray(item.transform);
}

function pageLines(items: unknown[]) {
  const rows: { y: number; items: PositionedText[] }[] = [];
  for (const item of items) {
    if (!isTextItem(item) || !item.str.trim()) continue;
    const point = { x: item.transform[4], y: item.transform[5], value: item.str };
    let row = rows.find(candidate => Math.abs(candidate.y - point.y) < 2.5);
    if (!row) {
      row = { y: point.y, items: [] };
      rows.push(row);
    }
    row.items.push(point);
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map(row => row.items.sort((a, b) => a.x - b.x).map(item => item.value).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export async function processPdf(file: File, onProgress: (read: number, total: number) => void) {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    throw new Error('ARQUIVO_INVALIDO');
  }
  if (file.size > 20 * 1024 * 1024) throw new Error('ARQUIVO_GRANDE');

  const bytes = await file.arrayBuffer();
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error('ARQUIVO_INVALIDO');
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  const verified = verifiedSources.find(source => source.sha256 === sha256);
  if (verified) {
    onProgress(verified.pageCount, verified.pageCount);
    return preparePdfImport({ ...verified, name: file.name });
  }
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
  });

  try {
    const document = await task.promise;
    if (document.numPages > 40) throw new Error('PDF_MUITAS_PAGINAS');
    const pages: SourcePage[] = [];
    onProgress(0, document.numPages);
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const annotations = await page.getAnnotations();
      pages.push({
        number: pageNumber,
        text: sanitizeSourceText(pageLines(content.items).join('\n')),
        links: [...new Set(annotations.flatMap(annotation => {
          const url: unknown = annotation.url;
          return typeof url === 'string' && /^https?:\/\//i.test(url) ? [url] : [];
        }))],
      });
      page.cleanup();
      onProgress(pageNumber, document.numPages);
    }
    if (pages.every(page => !page.text.trim())) throw new Error('PDF_SEM_TEXTO');
    return preparePdfImport({ id: sha256, name: file.name, kind: 'workout', sha256, pageCount: document.numPages, pages });
  } finally {
    await task.destroy();
  }
}
