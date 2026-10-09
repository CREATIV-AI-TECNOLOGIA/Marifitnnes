import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { describe, expect, it } from 'vitest';
import { verifiedSources, preparePdfImport, sanitizeSourceText } from '../src/services/pdf-content';
import { pageLines } from '../src/services/pdf-text';
import { probeWorkoutTable } from './pdf-layout-probe';
import type { PdfSource } from '../src/types';

const corpusDirectory = process.env.PDF_AUDIT_DIR;
const outputDirectory = resolve('outputs/pdf-import-audit');

function numbers(value: string) { return value.match(/\d+/g)?.map(Number) ?? []; }
function cellNumbers(value: string) {
  return numbers(value.replace(/\b\d{1,2}\s*[ªº]?\s*s[eé]ries?\s*:/giu, '')
    .replace(/1\s*minuto\s*e\s*meio/gi, '90').replace(/\bum\s+minuto\b/gi, '1 minuto'));
}
function seriesCells(value: string) {
  return value.split(/\b\d{1,2}\s*[ªº]?\s*s[eé]ries?\s*:/giu).slice(1).map(numbers);
}

describe.skipIf(!corpusDirectory)('auditoria reversa com os bytes dos PDFs originais', () => {
  it.each(verifiedSources.map(source => [source.name, source] as const))('extrai e confere %s', async (_, reviewed) => {
    const currentNames: Record<string, string> = { 'she-start-c': 'She start C.pdf', 'she-pro-agenda': 'Agenda she.pdf' };
    const bytes = await readFile(join(corpusDirectory!, reviewed.name)).catch(error => {
      if (error.code !== 'ENOENT' || !currentNames[reviewed.id]) throw error;
      return readFile(join(corpusDirectory!, currentNames[reviewed.id]));
    });
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
    try {
      const document = await task.promise;
      const source: PdfSource = { id: sha256, name: reviewed.name, sha256, kind: 'workout', pageCount: document.numPages, pages: [] };
      const tables = [];
      let pagesWithoutText = 0;
      for (let number = 1; number <= document.numPages; number++) {
        const page = await document.getPage(number);
        const content = await page.getTextContent();
        const annotations = await page.getAnnotations();
        const text = sanitizeSourceText(pageLines(content.items).join('\n'));
        if (!text) pagesWithoutText++;
        source.pages.push({ number, text, links: [...new Set(annotations.flatMap(annotation =>
          typeof annotation.url === 'string' && /^https?:\/\//i.test(annotation.url) ? [annotation.url] : []))] });
        tables.push(...probeWorkoutTable(number, content.items));
        page.cleanup();
      }
      if (reviewed.id === 'she-pro-a1') expect(report.structuralFindings.some(finding => finding.exercise === 'Mesa Flexora' && finding.issue.startsWith('4 séries declaradas, 3 descritas'))).toBe(true);
      expect(sha256).toBe(reviewed.sha256);
      const draft = preparePdfImport(source);
      // All original hyperlink annotations must survive, including mobility videos.
      expect(source.pages.map(page => page.links)).toEqual(reviewed.pages.map(page => page.links));
      const changedEdition = { ...source, sha256: 'same-text-different-file' };
      expect(() => preparePdfImport(changedEdition)).toThrow('FORMATO_NAO_SUPORTADO');

      const report = {
        source: reviewed.name, pages: document.numPages, pagesWithoutText,
        exactReviewedFile: sha256 === reviewed.sha256,
        currentImporter: { exercises: draft.exercises.length, agendaCells: draft.agenda?.frequencies.flatMap(frequency => frequency.weeks.flatMap(week => week.days)).length ?? 0,
          changedEditionAccepted: false, warnings: draft.warnings },
        independentGeometryProbe: { exerciseRows: tables.length, completeCellRows: tables.filter(row => row.name && row.volume && row.repetitions && row.cadence && row.rest && row.instructions).length, rows: tables },
        structuralFindings: tables.flatMap(row => {
          const findings: { page: number; exercise: string; issue: string }[] = [];
          const minimum = Number(row.volume.match(/^\d+/)?.[0]);
          const indices = [...row.repetitions.matchAll(/\b(\d{1,2})\s*[ªº]?\s*s[eé]ries?\s*:/giu)].map(match => Number(match[1]));
          if (indices.length && indices.length < minimum) findings.push({ page: row.page, exercise: row.name,
            issue: `${minimum} séries declaradas, ${indices.length} descritas; não completar as ausentes.` });
          if (!row.cadence) findings.push({ page: row.page, exercise: row.name, issue: 'Célula de cadência vazia no PDF.' });
          if (/rest\s*pause/i.test(row.repetitions)) findings.push({ page: row.page, exercise: row.name, issue: 'Série com rest-pause; preservar a descrição completa.' });
          if (/conjugado/i.test(row.name)) findings.push({ page: row.page, exercise: row.name, issue: 'Dois movimentos na mesma série; preservar as duas metas.' });
          return findings;
        }),
      };
      await mkdir(outputDirectory, { recursive: true });
      await writeFile(join(outputDirectory, `${reviewed.id}.json`), JSON.stringify(report, null, 2), 'utf8');
      console.info(JSON.stringify({ source: reviewed.name, pages: report.pages, textPages: report.pages - pagesWithoutText,
        exerciseRows: tables.length, completeCellRows: report.independentGeometryProbe.completeCellRows, agendaCells: report.currentImporter.agendaCells }));
      if (draft.workout) {
        expect(tables).toHaveLength(draft.exercises.length);
        expect(tables.map(row => row.page)).toEqual(draft.exercises.map(exercise => exercise.sourcePage));
        expect(tables.every(row => row.name && row.volume && row.repetitions && row.rest && row.instructions)).toBe(true);
        expect(tables.every(row => !/Carga:|Série\s+\d\s*-\s*Carga/i.test(row.instructions))).toBe(true);
        for (const [index, row] of tables.entries()) {
          const exercise = draft.exercises[index];
          const volume = numbers(row.volume);
          expect(exercise.setCountRange ? [exercise.setCountRange.min, exercise.setCountRange.max] : [exercise.targets.length], row.name).toEqual(volume);
          const reps = seriesCells(row.repetitions);
          if (reps.length) expect(exercise.targets.slice(0, reps.length).map(numbers), `${row.name}: repetições`).toEqual(reps);
          else {
            expect(numbers(exercise.targets[0]), `${row.name}: primeiro movimento`).toEqual(cellNumbers(row.repetitions).slice(0, 2));
            expect(numbers(exercise.secondaryMovement!.targets[0]), `${row.name}: segundo movimento`).toEqual(cellNumbers(row.repetitions).slice(2));
          }
          expect(numbers(exercise.cadence), `${row.name}: cadência`).toEqual(numbers(row.cadence));
          const rests = seriesCells(row.rest);
          const labels = exercise.targets.map((_, setIndex) => exercise.restLabelsBySet?.[setIndex] ?? exercise.restLabel ?? String(exercise.restBySet?.[setIndex] ?? exercise.rest));
          if (rests.length) expect(labels.slice(0, rests.length).map(numbers), `${row.name}: descansos por série`).toEqual(rests);
          else expect(numbers(labels[0]), `${row.name}: descanso`).toEqual(cellNumbers(row.rest));
          const page = source.pages.find(item => item.number === exercise.sourcePage)!;
          expect(page.links.some(link => link.includes(exercise.videoId!)), `${row.name}: vídeo na página original`).toBe(true);
        }
      }
    } finally { await task.destroy(); }
  }, 30000);
});
