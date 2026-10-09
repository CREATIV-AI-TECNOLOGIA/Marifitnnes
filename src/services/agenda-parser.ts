import type { AgendaWeek, ImportDraft, ProgramFrequency } from '../types';

const REST = 'Descanso';
export const SHEFLOW_REST = 'Descanso / SheFlow';
const CODE = /^[A-D]\d?$/;
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

function plain(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR');
}

function cleanLine(value: string) {
  if (/licensed\s+to/i.test(value)) return '';
  return value
    .replace(/(?<!\S)(?:\p{L}\s+){5,}\p{L}(?=\s|$|[|.,])/giu, run => run.replace(/\s+/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

function frequencyFrom(lines: string[]) {
  const frequencies = [...plain(lines.join(' ')).matchAll(/\b([2-7])\s*X\s*(?:(?:NA|POR)\s*)?SEMANA/g)]
    .map(match => Number(match[1]));
  const unique = [...new Set(frequencies)];
  return unique.length === 1 ? unique[0] : null;
}

function scheduleCells(line: string) {
  const body = plain(line)
    .replace(/^\s*(?:SEMANA|SEM)\s*0?\d{1,2}(?:\s*(?:A|ATE)\s*\d{1,2})?\s*/i, '')
    .replace(/^\s*EXERCICIO\s*/i, '');
  const tokens = body.match(/\b(?:[A-D]\d?|DESCANSO|ESCOLHER|OU|SHEFLOW)\b/gi) ?? [];
  const cells: string[] = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index].toUpperCase();
    if (token === 'OU') continue;
    if (CODE.test(token)) {
      if (tokens[index + 1]?.toUpperCase() === 'OU' && CODE.test(tokens[index + 2]?.toUpperCase() ?? '')) {
        cells.push(`${token}/${tokens[index + 2].toUpperCase()}`);
        index += 2;
      } else cells.push(token);
    } else if (token === 'DESCANSO') {
      const sheFlowRest = tokens[index + 1]?.toUpperCase() === 'SHEFLOW';
      cells.push(sheFlowRest ? SHEFLOW_REST : REST);
      if (sheFlowRest) index++;
    } else if (token === 'SHEFLOW') continue;
    else if (token === 'ESCOLHER') cells.push('Escolher treino');
  }
  return cells;
}

function weekRows(lines: string[]) {
  const rows: AgendaWeek[] = [];
  for (const line of lines) {
    const match = plain(line).match(/^\s*SEMANA\s*0?(\d{1,2})\b(.*)$/i);
    if (!match) continue;
    const days = scheduleCells(match[2]);
    if (days.length === 7) rows.push({ week: Number(match[1]), days });
  }
  return rows.sort((a, b) => a.week - b.week);
}

function staticSchedule(lines: string[]) {
  return lines.map(scheduleCells).find(cells => cells.length === 7) ?? [];
}

function expandRows(rows: AgendaWeek[], cycleWeeks: number) {
  if (!rows.length) return [];
  return Array.from({ length: cycleWeeks }, (_, index) => {
    const source = rows[index % rows.length];
    return { week: index + 1, days: [...source.days] };
  });
}

function workoutLabels(lines: string[]) {
  const labels: Record<string, string> = {};
  for (let index = 0; index < lines.length; index++) {
    const match = cleanLine(lines[index]).match(/^([A-D])\s*[-–:]\s*(.{2,90})$/i);
    if (!match) continue;
    const code = match[1].toUpperCase();
    let label = match[2].replace(/\s+/g, ' ').trim();
    const next = cleanLine(lines[index + 1] ?? '');
    if (next && !/^[A-D]\s*[-–:]/i.test(next) && !/^(?:SHE|SEMANA|FREQUENCIA|AGENDA)\b/i.test(plain(next)) && label.length < 40) {
      label = `${label} ${next}`;
    }
    labels[code] = label.replace(/[.\s]+$/, '');
  }
  return labels;
}

function homeFrequencies(pages: string[][], cycleWeeks: number) {
  const result: ProgramFrequency[] = [];
  const schedulePages = pages.map(lines => ({ lines, frequency: frequencyFrom(lines) }))
    .filter((item): item is { lines: string[]; frequency: number } => item.frequency !== null);

  for (const { lines, frequency } of schedulePages) {
    const text = plain(lines.join(' '));
    if (frequency === 6) {
      const base = staticSchedule(lines);
      const alternates = new Map<number, [string, string]>();
      for (const line of lines) {
        const match = plain(line).match(/SEMANA\s*0?(\d)\s*[-–]\s*SEXTA\s*([A-D])\s*\/\s*SABADO\s*([A-D])/i);
        if (match) alternates.set(Number(match[1]), [match[2], match[3]]);
      }
      if (base.length === 7 && alternates.size === cycleWeeks) {
        const weeks = [...alternates.entries()].sort(([a], [b]) => a - b).map(([week, [friday, saturday]]) => ({
          week,
          days: [...base.slice(0, 4), friday, saturday, base[6]],
        }));
        result.push({ frequency, weeks, note: 'Sexta e sábado alternam conforme a semana indicada no PDF.' });
      }
      continue;
    }

    if (frequency === 5) {
      const fullBase = staticSchedule(lines);
      const exerciseLine = lines.find(line => /^\s*EXERCICIO\b/i.test(plain(line)));
      const core = exerciseLine ? scheduleCells(exerciseLine) : [];
      const repeatSection = text.split('ALTERNATIVA SEMANAL')[1] ?? '';
      const repeatCodes = [...new Set(repeatSection.match(/\b[A-D]\b/g) ?? [])];
      const base = fullBase.length === 7
        ? fullBase
        : core.length === 5 && /ESCOLHER[\s\S]*REPETIR/.test(text)
          ? [...core, 'Escolher treino', REST]
          : [];
      if (base.length === 7 && repeatCodes.length) {
        const weeks = Array.from({ length: cycleWeeks }, (_, index) => ({
          week: index + 1,
          days: [...base.slice(0, 5), repeatCodes[index % repeatCodes.length], base[6]],
        }));
        result.push({ frequency, weeks, note: `O sábado repete A, B, C e D nesta sequência; quando ela termina, recomeça.` });
      }
      continue;
    }

    if (frequency === 4) {
      const days = staticSchedule(lines);
      if (days.length === 7) result.push({ frequency, weeks: expandRows([{ week: 1, days }], cycleWeeks) });
      continue;
    }

    if (frequency === 3) {
      const rows = weekRows(lines);
      if (rows.length) {
        result.push({ frequency, weeks: expandRows(rows, cycleWeeks), note: 'O PDF informa uma rotação de quatro semanas; ela reinicia na quinta semana.' });
      }
      continue;
    }

    const rows = weekRows(lines);
    if (rows.length) result.push({ frequency, weeks: expandRows(rows, cycleWeeks) });
    else {
      const days = staticSchedule(lines);
      if (days.length === 7) result.push({ frequency, weeks: expandRows([{ week: 1, days }], cycleWeeks) });
    }
  }
  return result;
}

function gymFrequencies(pages: string[][], cycleWeeks: number) {
  const result: ProgramFrequency[] = [];
  for (const lines of pages) {
    const frequency = frequencyFrom(lines);
    if (!frequency) continue;
    const rows = weekRows(lines);
    if (rows.length) result.push({ frequency, weeks: expandRows(rows, cycleWeeks) });
  }
  return result;
}

function allCodes(frequencies: ProgramFrequency[], labels: Record<string, string>) {
  const codes = new Set(Object.keys(labels));
  for (const frequency of frequencies) {
    for (const week of frequency.weeks) {
      for (const day of week.days) {
        for (const code of day.split('/')) if (CODE.test(code)) codes.add(code);
      }
    }
  }
  return [...codes].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
}

export function parseTrainingAgenda(fileName: string, sourcePages: string[]): ImportDraft {
  const pages = sourcePages.map(page => page.split(/\r?\n/).map(cleanLine).filter(Boolean));
  const fullText = pages.flat().join('\n');
  if (!fullText.trim()) throw new Error('PDF_SEM_TEXTO');

  const normalized = plain(fullText);
  const isHome = /SHE\s*HOME|TREINOS? EM CASA/.test(normalized);
  const isGym = /SHE\s*PRO|TREINO NA ACADEMIA|TREINOS? NA ACADEMIA/.test(normalized);
  const cycleMatch = normalized.match(/CICLOS?\s+(?:ESTRUTURADOS?\s+)?DE\s+(\d{1,2})\s+SEMANAS?/)
    ?? normalized.match(/CICLO\s+ESTRUTURADO\s*(\d{1,2})\s*SEMANAS?/);
  const cycleWeeks = cycleMatch ? Number(cycleMatch[1]) : 0;
  if (!cycleWeeks || cycleWeeks > 16) throw new Error('AGENDA_NAO_RECONHECIDA');

  const labels = workoutLabels(pages.flat());
  const frequencies = (isHome
    ? homeFrequencies(pages, cycleWeeks)
    : gymFrequencies(pages, cycleWeeks)).sort((a, b) => a.frequency - b.frequency);
  if (!frequencies.length) throw new Error('AGENDA_NAO_RECONHECIDA');

  const name = isHome
    ? 'Treinos em casa'
    : isGym
      ? 'Hipertrofia na academia'
      : fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();

  return {
    name,
    focus: isHome ? 'Treinos em casa' : isGym ? 'Hipertrofia na academia' : 'Agenda de treino',
    description: isHome
      ? 'Agenda semanal para treinos em casa, com rotação de exercícios.'
      : isGym
        ? 'Agenda semanal de hipertrofia para treinos na academia.'
        : 'Agenda semanal importada de um PDF.',
    sourceFile: fileName,
    cycleWeeks,
    frequencies,
    workoutCodes: allCodes(frequencies, labels),
    workoutLabels: labels,
  };
}

export function weekdayNames() {
  return DAYS;
}
