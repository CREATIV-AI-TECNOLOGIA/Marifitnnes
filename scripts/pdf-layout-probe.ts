import { pageLines } from '../src/services/pdf-text';

interface PositionedText { str: string; width: number; transform: number[]; }
export interface ProbedRow {
  page: number; name: string; volume: string; repetitions: string; cadence: string; rest: string; instructions: string;
}

function plain(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

/** Audit experiment only: reads table cells; does not infer an exercise prescription. */
export function probeWorkoutTable(page: number, rawItems: unknown[]): ProbedRow[] {
  const items = rawItems.filter((item): item is PositionedText => !!item && typeof item === 'object'
    && 'str' in item && 'transform' in item && 'width' in item && typeof item.str === 'string'
    && Array.isArray(item.transform) && item.transform.length >= 6 && typeof item.width === 'number');
  const headings = ['exercicio', 'series / repeticoes', 'cadencia', 'descanso', 'instrucoes'];
  const headers = headings.map(heading => items.find(item => plain(item.str.trim()) === heading));
  if (!headers[1] && headers[0] && headers[2]) {
    const split = items.filter(item => /^(?:series\s*\/|repeticoes)$/.test(plain(item.str.trim()))
      && Math.abs(item.transform[5] - headers[0]!.transform[5]) < 70
      && item.transform[4] > headers[0]!.transform[4] && item.transform[4] < headers[2]!.transform[4]);
    if (split.length === 2) {
      const x = Math.min(...split.map(item => item.transform[4]));
      const right = Math.max(...split.map(item => item.transform[4] + item.width));
      headers[1] = { str: 'Séries / Repetições', width: right - x,
        transform: [1, 0, 0, 1, x, Math.min(...split.map(item => item.transform[5]))] };
    }
  }
  if (headers.some(item => !item)) return [];
  const centers = headers.map(item => item!.transform[4] + item!.width / 2);
  if (centers.some((value, index) => index > 0 && value <= centers[index - 1])) return [];
  const boundaries = centers.slice(1).map((value, index) => (value + centers[index]) / 2);
  const weights = items.find(item => /^anote suas(?: cargas)?$/.test(plain(item.str.trim()))
    && item.transform[4] > centers[4] && Math.abs(item.transform[5] - headers[4]!.transform[5]) < 70);
  if (weights) boundaries.push((centers[4] + weights.transform[4] + weights.width / 2) / 2);
  const top = Math.min(...headers.map(item => item!.transform[5])) - 10;
  const body = items.filter(item => item.transform[5] < top);
  const names = body.filter(item => item.transform[4] < boundaries[0]);
  const volumes = names.filter(item => /^volume\s*:/i.test(item.str.trim())).sort((a, b) => b.transform[5] - a.transform[5]);
  const groups = volumes.map((volume, index) => {
    const previousY = index ? volumes[index - 1].transform[5] : top;
    const label = names.filter(item => item.transform[5] < previousY && item.transform[5] >= volume.transform[5] - 3);
    const text = pageLines(label).join(' ');
    return { y: volume.transform[5], top: Math.max(...label.map(item => item.transform[5])),
      name: text.replace(/\bVolume\s*:[\s\S]*$/i, '').trim() };
  });
  return groups.map((group, index) => {
    const upper = index ? (groups[index - 1].y + group.top) / 2 : top;
    const lower = groups[index + 1] ? (group.y + groups[index + 1].top) / 2 : 55;
    const row = body.filter(item => item.transform[5] < upper && item.transform[5] >= lower);
    const cells = headings.map((_, column) => pageLines(row.filter(item => {
      const x = item.transform[4];
      return x >= (column ? boundaries[column - 1] : 0) && x < (boundaries[column] ?? Infinity);
    })).join('\n'));
    return { page, name: group.name, volume: cells[0].match(/Volume\s*:\s*([^\n]+)/i)?.[1] ?? '',
      repetitions: cells[1], cadence: cells[2], rest: cells[3], instructions: cells[4] };
  });
}
