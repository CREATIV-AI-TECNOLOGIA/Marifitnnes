import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { parseTrainingAgenda } from './agenda-parser';

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

export async function processPdf(file: File, onProgress: (step: number) => void) {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    throw new Error('ARQUIVO_INVALIDO');
  }
  if (file.size > 20 * 1024 * 1024) throw new Error('ARQUIVO_GRANDE');

  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useSystemFonts: true,
  });

  try {
    const document = await task.promise;
    if (document.numPages > 40) throw new Error('PDF_MUITAS_PAGINAS');
    const pages: string[] = [];
    onProgress(1);
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(pageLines(content.items).join('\n'));
      page.cleanup();
      onProgress(1 + Math.floor(pageNumber / document.numPages * 2));
    }
    onProgress(3);
    const draft = parseTrainingAgenda(file.name, pages);
    onProgress(4);
    return draft;
  } finally {
    await task.destroy();
  }
}
