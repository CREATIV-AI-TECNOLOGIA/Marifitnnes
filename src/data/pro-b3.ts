import type { Exercise, Workout } from '../types';

const programId = 'she-pro-hipertrofia-academia';
const common = { group: 'upper' as const, previousWeights: [], previousReps: [], best: 0, technique: '' };
const exercise = (id: string, name: string, block: Exercise['block'], sourcePage: number,
  targets: string[], rest: number, restLabel: string, cadence: string, instructions: string,
  videoId?: string, extra: Partial<Exercise> = {}): Exercise => ({
  ...common, id: `studio-pro-b3-${id}`, name, block, sourcePage, targets, rest, restLabel,
  cadence, instructions, videoId, ...extra,
});
const repeat = (target: string, count: number) => Array(count).fill(target) as string[];

export const b3Exercises: Exercise[] = [
  exercise('mobilidade', 'Mobilidade ativa de ombros e coluna torácica', 'Mobilidade', 3,
    ['3–5 min'], 0, 'Não informado no PDF', '', '1 série de 3 a 5 minutos.', 'nBxY52i1oAQ',
    { measurementLabel: 'Duração (s)', secondaryMovement: { name: 'Segunda demonstração', targets: [], videoUrl: 'https://youtu.be/-R3AvHQqU-M' } }),
  exercise('flexao-lateral', 'Flexão de braços + elevação lateral leve', 'Ativação', 4,
    repeat('10–12', 2), 60, '60 s após o combo', '', 'Execute os dois movimentos conjugados.', 'G1d5-nzjrJ4',
    { secondaryMovement: { name: 'Elevação lateral leve', targets: repeat('10–12', 2), videoUrl: 'https://youtu.be/BaT1F278TbU' } }),
  exercise('canoa-prancha', 'Abdominal canoa + prancha encostando nos ombros', 'Ativação', 4,
    repeat('10–12', 2), 60, '60 s após o combo', '', 'Execute os dois movimentos conjugados.', 'YlqRZnoQVEQ',
    { secondaryMovement: { name: 'Prancha encostando nos ombros', targets: repeat('10–12', 2), videoUrl: 'https://youtu.be/tizIygZRLTw' } }),
  exercise('supino-45', 'Supino 45 com barra ou halteres', 'Treino principal', 5,
    repeat('6–8', 4), 90, '1 min a 1 min e meio', 'Descer em 3 s; subir em 1–2 s.',
    'A ideia é carregar o máximo de carga dentro dessa zona de repetição.', 'M7YtAb5dDFk'),
  exercise('desenvolvimento', 'Desenvolvimento de ombros (halteres ou máquina)', 'Treino principal', 5,
    repeat('6–8', 3), 90, '1 min a 1 min e meio', 'Descer em 3 s; subir em 1–2 s.', '', 'g9ER5_TOSrU'),
  exercise('triceps-corda', 'Tríceps corda', 'Treino principal', 5,
    [...repeat('8–10', 3), 'Até a falha; buscar 15–16 reps com menos peso'], 90, '1 min a 1 min e meio',
    'Descer em 2 s; subir em 2 s.', 'A quarta série é mais leve, até a falha.', 'uyZ4etN1gD8'),
  exercise('triceps-testa', 'Tríceps testa', 'Treino principal', 6,
    repeat('6–8', 3), 90, '1 min a 1 min e meio', 'Empurrar em 1 s; controlar a volta em 3 s.',
    'Aumentar as cargas; usar a maior carga possível para essa zona de repetição.', 'SCZ4VPS5lLM'),
  exercise('elevacao-frontal', 'Elevação frontal no banco', 'Treino principal', 6,
    repeat('6–8', 3), 90, '1 min a 1 min e meio', 'Subir em 2 s; descer em 3 s.',
    'Aumentar as cargas; usar a maior carga possível para essa zona de repetição.', 'mBWWOaMuDWM'),
  exercise('soldadinho', 'Soldadinho', 'Treino principal', 6,
    repeat('20', 3), 60, '40–60 s', '', '', '88eFMHx2wNY'),
];

export const proB3: Workout = {
  id: 'studio-pro-b3', name: 'B3', programId, programCode: 'B3', sourceId: 'she-pro-b3',
  subtitle: 'SHE PRO · Peito + Tríceps + Ombros + Abdome · Intermediário / Avançado',
  exerciseIds: b3Exercises.map(item => item.id),
};
