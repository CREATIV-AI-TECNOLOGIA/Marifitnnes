import startCImage from '../assets/studio/start-c.jpg';
import proA1Image from '../assets/studio/pro-a1.jpg';
import starterProgram from './starter-program';
import type { Exercise, Workout } from '../types';
import { b2Exercises, c1Exercises, proB2, proC1 } from './pro-c1-b2';
import { b3Exercises, proB3 } from './pro-b3';

function exercise(
  id: string,
  name: string,
  block: Exercise['block'],
  targets: string[],
  rest: number,
  cadence: string,
  instructions: string,
  options: Partial<Pick<Exercise, 'group' | 'setCountRange' | 'restLabel' | 'measurementLabel' | 'secondaryMovement'>> = {},
): Exercise {
  const { group = 'lower', ...metadata } = options;
  return {
    id,
    name,
    group,
    block,
    targets,
    previousWeights: [],
    previousReps: [],
    best: 0,
    cadence,
    rest,
    restBySet: targets.map(() => rest),
    instructions,
    technique: '',
    ...metadata,
  };

startCExercises.forEach((item, index) => { item.sourcePage = [4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7][index]; });
}

const startCExercises: Exercise[] = [
  exercise('studio-start-c-elevacao-pelvica-solo', 'Elevação pélvica no solo', 'Ativação', ['12–15', '12–15'], 30,
    'Suba em 2 s, segure 1 s e desça em 3 s.', 'Mantenha os pés bem apoiados.'),
  exercise('studio-start-c-abdominal-infra', 'Abdominal infra no solo', 'Ativação', ['10–12', '10–12'], 30,
    'Suba em 2 s e desça em 3 s.', 'Mantenha a lombar apoiada no solo.', { group: 'upper' }),
  exercise('studio-start-c-prancha-dinamica', 'Prancha dinâmica com flexão de quadril (plank leg crunch)', 'Ativação', ['8–10 por perna', '8–10 por perna'], 30,
    'Faça o movimento com controle.', 'Mantenha o quadril estável e o abdômen ativo.', { group: 'upper' }),
  exercise('studio-start-c-leg-horizontal-unilateral', 'Leg horizontal unilateral', 'Treino principal', ['8–10 por perna', '8–10 por perna', '8–10 por perna'], 60,
    'Desça em 3 s e suba em 1–2 s.', 'Leve o joelho em direção ao peito.', { group: 'lower' }),
  exercise('studio-start-c-thruster', 'Agachamento + desenvolvimento (thruster)', 'Treino principal', ['10–12', '10–12', '10–12'], 60,
    'Desça no agachamento em 3 s; suba e desenvolva em 2 s.', 'Faça o movimento de forma fluida e contínua.', { group: 'lower' }),
  exercise('studio-start-c-agachamento-sumo', 'Agachamento sumô com halter', 'Treino principal', ['12', '12', '12'], 60,
    'Puxe em 2 s e desça em 3 s.', 'Evite usar impulso do tronco.', { group: 'lower' }),
  exercise('studio-start-c-pull-down', 'Pull Down', 'Treino principal', ['12', '12', '12'], 45,
    'Suba em 2 s e desça em 3 s.', 'Use uma carga leve e mantenha o movimento sob controle.', { group: 'upper', setCountRange: { min: 2, max: 3 } }),
  exercise('studio-start-c-leg-45', 'Leg 45', 'Treino principal', ['12–15', '12–15', '12–15'], 45,
    'Suba em 2 s, segure 1 s no topo e desça em 3 s.', 'Use a amplitude completa com controle.', { group: 'lower', restLabel: '45–60 s' }),
  exercise('studio-start-c-cadeira-adutora', 'Cadeira adutora', 'Treino principal', ['12–15', '12–15', '12–15'], 45,
    'Feche em 2 s e abra em 3 s.', 'Faça o movimento de forma curta e controlada.', { group: 'lower', setCountRange: { min: 2, max: 3 } }),
  exercise('studio-start-c-gluteo-quatro-apoios', 'Glúteo quatro apoios com caneleira', 'Treino principal', ['12–15 por perna', '12–15 por perna', '12–15 por perna'], 45,
    'Suba em 2 s e desça em 3 s.', 'Evite arquear a lombar.', { group: 'lower' }),
  exercise('studio-start-c-pullover-abdominal-supra', 'Pullover com halter + abdominal supra', 'Treino principal', ['10–12', '10–12', '10–12'], 60,
    'Faça os dois movimentos de forma controlada.', 'Exercício conjugado: faça 10–12 repetições de pullover e, sem descanso, 12–15 de abdominal supra. Descanse 60 s após completar os dois movimentos.', {
      group: 'upper',
      secondaryMovement: { name: 'Abdominal supra', targets: ['12–15', '12–15', '12–15'] },
    }),
  exercise('studio-start-c-prancha-lateral', 'Prancha lateral', 'Treino principal', ['30–45 s', '30–45 s', '30–45 s'], 30,
    '', 'Mantenha o corpo alinhado e faça dos dois lados.', { group: 'upper', setCountRange: { min: 2, max: 3 }, restLabel: '30–45 s', measurementLabel: 'Duração (s)' }),
];

const startC: Workout = {
  id: 'studio-start-c',
  name: 'C',
  subtitle: 'SHE START · Full Body · Iniciante',
  programId: 'she-start-treino-na-academia',
  programCode: 'C',
  sourceId: 'she-start-c',
  exerciseIds: startCExercises.map(item => item.id),
  preparation: 'Mobilidade global (quadril, coluna e ombros): faça 1–2 voltas durante 5–8 minutos, com movimentos lentos e contínuos, preparando o corpo para o treino.',
  notes: 'Priorize a execução correta e use uma carga que permita controle total. Siga a ordem proposta, os vídeos e as instruções de cada exercício. Consulte o módulo Cronograma de Treinos do material para a divisão conforme seu objetivo. O material do START recomenda completar com alongamentos ou cardio dos módulos Extra, descansar pelo menos 1 dia e não repetir este treino em dias consecutivos.',
};

const proA1Mobility: Exercise = exercise('studio-pro-a1-mobilidade', 'Mobilidade ativa de quadril, joelho e tornozelo', 'Mobilidade', ['3–5 min'], 0,
  '', '1 série de 3 a 5 minutos. Faça com amplitude progressiva e controle do movimento para preparar as articulações.',
  { measurementLabel: 'Duração (s)', restLabel: 'Não informado no PDF' });
proA1Mobility.sourcePage = 5;
proA1Mobility.videoId = 'n1Bqn5BP6Dc';

const proA1Exercises = [proA1Mobility, ...(starterProgram.exerciseTemplates?.A1 ?? []).map(item => ({
  ...item,
  id: `studio-pro-a1-${item.id}`,
  targets: [...item.targets],
  previousWeights: [...item.previousWeights],
  previousReps: [...item.previousReps],
  restBySet: item.restBySet ? [...item.restBySet] : undefined,
}))];

const proA1: Workout = {
  id: 'studio-pro-a1',
  name: 'A1',
  subtitle: 'SHE PRO · Inferiores completo · Intermediário / Avançado',
  programId: starterProgram.id,
  programCode: 'A1',
  sourceId: 'she-pro-a1',
  exerciseIds: proA1Exercises.map(item => item.id),
};

export const studioWorkouts = [startC, proA1, proC1, proB2, proB3];
export const studioExercises = [...startCExercises, ...proA1Exercises, ...c1Exercises, ...b2Exercises, ...b3Exercises];

export const studioCatalog = [
  ...[proC1, proB2, proB3].map(workout => ({
    workout, image: proA1Image, imageAlt: 'Mulher em roupa esportiva em uma academia', imagePosition: 'center 32%',
    program: 'SHE PRO', level: 'HIPERTROFIA', focus: workout === proC1 ? 'Glúteos e posterior' : workout === proB2 ? 'Costas + Bíceps + Abdome' : 'Peito + Tríceps + Ombros + Abdome',
    exerciseCount: `${workout.exerciseIds.length} exercícios`,
  })),
  {
    workout: startC,
    image: startCImage,
    imageAlt: 'Homem em roupa esportiva preta em uma academia',
    imagePosition: 'center 10%',
    program: 'SHE START',
    level: 'INICIANTE',
    focus: 'Full Body',
    exerciseCount: '12 exercícios',
  },
  {
    workout: proA1,
    image: proA1Image,
    imageAlt: 'Mulher em roupa esportiva executando levantamento com barra em uma academia',
    imagePosition: 'center 32%',
    program: 'SHE PRO',
    level: 'HIPERTROFIA',
    focus: 'Inferiores completo',
    exerciseCount: '9 exercícios',
  },
];
