import sources from '../data/verified-pdf-sources.json';
import telegramSources from '../data/telegram-pdf-sources.json';
import starterProgram from '../data/starter-program';
import { studioExercises, studioWorkouts } from '../data/studio-catalog';
import type { PdfImportDraft, PdfSource } from '../types';
import { parseTrainingAgenda } from './agenda-parser';

export const verifiedSources = [...sources, ...telegramSources] as PdfSource[];

export const a1SourceWarnings = [
  'Página 6: elevação pélvica cita halter, elástico e 12–15 passos. Os termos originais foram preservados; confirme com a responsável.',
  'Página 9: mesa flexora indica 4 séries e descreve apenas 3. As repetições da quarta não foram preenchidas.',
  'Páginas 3 e 11: o documento apresenta 6 semanas, mas descreve a lógica de 5. Nenhuma orientação da sexta semana foi inventada.',
];

/** Only reviewed editions can use a verified mapping. A filename is never proof of content. */
export function preparePdfImport(source: PdfSource): PdfImportDraft {
  const verified = verifiedSources.find(item => item.sha256 === source.sha256);
  if (!verified) throw new Error('FORMATO_NAO_SUPORTADO');
  if (source.pageCount !== verified.pageCount || source.pages.length !== source.pageCount
    || source.pages.some((page, index) => page.number !== index + 1 || !page.text.trim())) {
    throw new Error('LEITURA_INCOMPLETA');
  }
  const canonical = (text: string) => text.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (source.pages.some((page, index) => canonical(page.text) !== canonical(verified.pages[index].text))) {
    throw new Error('LEITURA_INCOMPLETA');
  }
  const normalizedSource = { ...source, id: verified.id, kind: verified.kind };
  if (verified.kind === 'agenda') {
    const parsed = parseTrainingAgenda(source.name, source.pages.map(page => page.text));
    if (parsed.cycleWeeks !== 6 || parsed.frequencies.length !== 4
      || parsed.frequencies.some(frequency => frequency.weeks.length !== 6
        || frequency.weeks.some((week, index) => week.week !== index + 1 || week.days.length !== 7))) {
      throw new Error('LEITURA_INCOMPLETA');
    }
    // Compare every cell with the reviewed table, not only the first week.
    if (JSON.stringify(parsed.frequencies.map(item => item.weeks))
      !== JSON.stringify(starterProgram.frequencies.map(item => item.weeks))) throw new Error('LEITURA_INCOMPLETA');
    return {
      source: normalizedSource, warnings: [], exercises: [],
      agenda: { ...parsed, id: starterProgram.id, cycleWeeks: 6, sourceId: verified.id },
    };
  }
  const workout = studioWorkouts.find(item => item.sourceId === verified.id);
  if (!workout) throw new Error('FORMATO_NAO_SUPORTADO');
  const exercises = workout.exerciseIds.map(id => studioExercises.find(item => item.id === id));
  if (exercises.some(item => !item)) throw new Error('LEITURA_INCOMPLETA');
  return structuredClone({
    source: normalizedSource,
    workout,
    exercises: exercises as PdfImportDraft['exercises'],
    warnings: verified.id === 'she-pro-a1' ? a1SourceWarnings : [],
  });
}

export function sanitizeSourceText(text: string) {
  return text.split(/\r?\n/).filter(line => !/^\s*licensed\s+to\b/i.test(line)).join('\n').trim();
}
