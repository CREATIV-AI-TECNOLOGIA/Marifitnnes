import type { Exercise, ProgramFrequency, TrainingProgram } from '../types';
import { SHEFLOW_REST } from '../services/agenda-parser';

const rest = 'Descanso';
const sheFlowRest = SHEFLOW_REST;
const weeks = (rows: string[][]): ProgramFrequency['weeks'] => rows.map((days, index) => ({ week: index + 1, days }));

function exercise(
  id: string,
  name: string,
  block: Exercise['block'],
  targets: string[],
  restBySet: number[],
  cadence: string,
  instructions: string,
  technique = '',
): Exercise {
  return {
    id, name, group: 'lower', block, targets, previousWeights: [], previousReps: [], best: 0,
    cadence, rest: restBySet[0] ?? 0, restBySet, instructions, technique,
  };
}

const a1: Exercise[] = [
  exercise(
    'elevacao-pelvica-halter', 'Elevação pélvica com halter no colchonete', 'Ativação',
    ['12–15 passos', '12–15 passos'], [30, 30], 'Movimento controlado, mantendo tensão constante no elástico.',
    'Alinhe o calcanhar com o joelho e ative glúteos e core.',
    'O título do exercício cita halter, mas a instrução cita elástico. Confirme o implemento correto com a responsável pela ficha.',
  ),
  exercise(
    'agachamento-livre-pausa-ativacao', 'Agachamento livre completo com pausa', 'Ativação',
    ['10', '10'], [30, 30], 'Desça em 3 s, segure 2 s no fundo e suba em 1–2 s.',
    'Sem carga ou com carga leve. Priorize controle, postura e amplitude.',
  ),
  exercise(
    'agachamento-livre', 'Agachamento livre', 'Treino principal',
    ['6–8', '6–8', '6–8'], [60, 60, 80], 'Desça em 3 s e suba em 1–2 s.',
    'A ficha indica carga alta. Ao atingir 8 repetições nas 3 séries com boa execução, aumente a carga gradualmente. Descanso por série: 60 s; 60–80 s; 80–100 s.',
  ),
  exercise(
    'stiff-barra-halteres', 'Stiff com barra ou halteres', 'Treino principal',
    ['8–10', '8–10', '8–10'], [60, 60, 60], 'Desça em 3 s e suba em 1–2 s.',
    'Mantenha a coluna neutra durante o movimento e desça até onde conseguir manter o controle. Descanso indicado: 60–90 s entre séries.',
  ),
  exercise(
    'agachamento-sumo', 'Agachamento sumo', 'Treino principal',
    ['10–12', '10–12', '10–12'], [60, 60, 60], 'Desça em 3 s e suba em 1–2 s.',
    'Busque bastante amplitude e segure o peso nas mãos. Se usar um step, certifique-se de que o peso passe abaixo dele. Descanso indicado: 60–90 s.',
  ),
  exercise(
    'recuo-smith', 'Recuo no Smith', 'Treino principal',
    ['10 por perna', '8 por perna', '6 por perna'], [60, 60, 60], 'Desça em 3 s e suba em 1–2 s.',
    'A ficha informa 2–3 séries e apresenta três séries de 10, 8 e 6 repetições por perna. Incline levemente o tronco em diagonal. Prefira o Smith; se estiver ocupado, a ficha permite usar halteres. Descanse de 1 a 3 min, conforme a recuperação.',
  ),
  exercise(
    'cadeira-extensora', 'Cadeira extensora', 'Treino principal',
    ['12', '10', '8', '5 pesadas + pausa de 10 s + 10 leves'], [60, 60, 60, 60], 'Suba em 2 s e desça em 3 s.',
    'São 4 séries. Na última, faça 5 repetições pesadas, pause 10 s e faça mais 10 repetições leves. Registre 15 no campo de repetições da última série. Evite trancos e controle toda a volta do movimento. Descanso indicado: 1–3 min.',
  ),
  exercise(
    'mesa-flexora', 'Mesa flexora', 'Treino principal',
    ['10–12', '10–12', '10–12', 'Não informada no PDF'], [60, 60, 60, 60], 'Suba em 2 s e desça em 3 s.',
    'A ficha indica 4 séries, mas só detalha as repetições das 3 primeiras. Confirme a quarta com a responsável. Evite trancos e controle toda a volta do movimento. Descanso indicado: 1–3 min.',
  ),
  exercise(
    'panturrilha-leg-press', 'Panturrilha no leg press', 'Treino principal',
    ['12–15', '12–15', '12–15'], [90, 90, 90], 'Suba em 2 s, segure 1 s no topo e desça em 3 s.',
    'Use amplitude máxima com controle. O descanso indicado é de até 1 min e 30 s.',
  ),
];

const restLabels = ['30 s', '30–45 s', '', '60–90 s', '60–90 s', '1–3 min', '1–3 min', '1–3 min', 'até 90 s'];
a1.forEach((item, index) => {
  item.restLabel = restLabels[index] || undefined;
  item.sourcePage = [6, 6, 7, 7, 8, 8, 9, 9, 10][index];
});
a1[1].restBySet = [30, 30];
a1[2].restLabelsBySet = ['60 s', '60–80 s', '80–100 s'];
a1[5].setCountRange = { min: 2, max: 3 };
a1[0].measurementLabel = 'Passos';

const starterProgram: TrainingProgram = {
  id: 'she-pro-hipertrofia-academia',
  name: 'Hipertrofia na academia',
  focus: 'Hipertrofia na academia',
  description: 'Agenda Pro de academia com frequências de 3 a 6 dias por semana. A ficha A1 de inferiores já está cadastrada.',
  sourceFile: 'ebook_cb91cd01-f751-4c92-88bf-3a75a864f769.pdf',
  sourceId: 'she-pro-agenda',
  cycleWeeks: 6,
  workoutCodes: ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2'],
  workoutLabels: { A1: 'Inferiores completo', A2: 'Treino A2', B1: 'Treino B1', B2: 'Treino B2', B3: 'Treino B3', C1: 'Treino C1', C2: 'Treino C2' },
  exerciseTemplates: { A1: a1 },
  frequencies: [
    { frequency: 3, weeks: weeks([
      ['A2', rest, 'B1', sheFlowRest, 'C2', rest, sheFlowRest],
      ['C1', rest, 'B1', sheFlowRest, 'A1', rest, sheFlowRest],
      ['A1', rest, 'B1', sheFlowRest, 'C2', rest, sheFlowRest],
      ['C2', rest, 'B1', sheFlowRest, 'A2', rest, sheFlowRest],
      ['A2', rest, 'B1', sheFlowRest, 'C1', rest, sheFlowRest],
      ['A1', rest, 'B1', sheFlowRest, 'C2', rest, sheFlowRest],
    ]) },
    { frequency: 4, weeks: weeks([
      ['A1', 'B2', rest, 'C1', 'B3', sheFlowRest, rest],
      ['A2', 'B1', rest, 'C2', 'B2', sheFlowRest, rest],
      ['C1', 'B3', rest, 'A1', 'B1', sheFlowRest, rest],
      ['A2', 'B2', rest, 'C2', 'B3', sheFlowRest, rest],
      ['A1', 'B1', rest, 'C1', 'B2', sheFlowRest, rest],
      ['A2', 'B1', rest, 'C2', 'B3', sheFlowRest, rest],
    ]) },
    { frequency: 5, weeks: weeks([
      ['A1', 'B2', 'C1', 'B3', 'A2', rest, sheFlowRest],
      ['A2', 'B1', 'C2', 'B2', 'A1', rest, sheFlowRest],
      ['C1', 'B3', 'A1', 'B1', 'C2', rest, sheFlowRest],
      ['A1', 'B2', 'C2', 'B3', 'A2', rest, sheFlowRest],
      ['A2', 'B1', 'C1', 'B2', 'C2', rest, sheFlowRest],
      ['A1', 'B1', 'C1', 'B3', 'A2', rest, sheFlowRest],
    ]) },
    { frequency: 6, weeks: weeks([
      ['A1', 'B2', 'C1', 'B3', 'A2', 'C2', sheFlowRest],
      ['A2', 'B1', 'C1', 'B2', 'A1', 'C2', sheFlowRest],
      ['C1', 'B3', 'A1', 'B1', 'C2', 'A2', sheFlowRest],
      ['A1', 'B2', 'C2', 'B3', 'A2', 'B1', sheFlowRest],
      ['A2', 'B3', 'C1', 'B2', 'A1', 'C2', sheFlowRest],
      ['A1', 'B1', 'C1', 'B2', 'A2', 'C2', sheFlowRest],
    ]) },
  ],
};

export default starterProgram;
