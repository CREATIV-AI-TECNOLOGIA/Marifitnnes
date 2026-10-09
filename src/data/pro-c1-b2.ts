import type { Exercise, Workout } from '../types';

const programId = 'she-pro-hipertrofia-academia';
function entry(code: string, id: string, name: string, page: number, videoId: string, block: Exercise['block'],
  targets: string[], rest: number, restLabel: string, cadence: string, instructions: string,
  extra: Partial<Exercise> = {}): Exercise {
  return { id: `studio-pro-${code}-${id}`, name, group: code === 'c1' ? 'lower' : 'upper', block,
    targets, rest, restLabel, restBySet: targets.map(() => rest), cadence, instructions, technique: '',
    previousWeights: [], previousReps: [], best: 0, sourcePage: page, videoId, ...extra };
}
const repeat = (value: string, count: number) => Array<string>(count).fill(value);
const lowerCadence = 'Desça em 3 s e suba em 1–2 s.';
const combo = 'Ativação conjugada: face pull, dead bug e prancha; 2 voltas, com aproximadamente 45 s de descanso após o combo.';

export const c1Exercises: Exercise[] = [
  entry('c1', 'mobilidade', 'Mobilidade ativa de quadril, lombar e posteriores', 3, 'n1Bqn5BP6Dc', 'Mobilidade', ['5–8 min'], 0, 'Não informado no PDF', '',
    'Faça 1 série de 5–8 minutos. Foco em abertura de quadril, inclinação pélvica e alongamento dinâmico dos posteriores.', { measurementLabel: 'Duração (s)' }),
  entry('c1', 'clamshell', 'Clamshell', 4, 'wbGKOqDIojQ', 'Ativação', repeat('12–15 de cada lado', 2), 30, '30 s entre as pernas',
    'Faça lento para ativar e aquecer bem a musculatura.', 'Ative e traga conexão mente-músculo.'),
  entry('c1', 'bom-dia', 'Bom dia', 4, 'FamM7UjsNJ4', 'Ativação', repeat('15–20', 2), 40, '40–60 s entre séries',
    'Desça em 3 s e suba em 2 s.', 'Prepare o padrão de hinge para o treino principal.'),
  entry('c1', 'terra-sumo', 'Levantamento terra sumô', 5, 'N8DE5R8U3os', 'Treino principal', repeat('6–8', 4), 90, '90–180 s entre séries', lowerCadence,
    'O PDF indica cargas altas. Treino com ênfase em carga, execução e progressão de força. Busque uma carga desafiadora para a zona de repetição.'),
  entry('c1', 'bulgaro', 'Afundo búlgaro com halteres', 5, '9jzTWQDfvQY', 'Treino principal', ['8–10', '6–8', '8'], 90,
    '~60 s entre pernas; 90–120 s ao final da série', lowerCadence, 'Amplitude confortável e controle total. Aumente a carga com o passar das séries.'),
  entry('c1', 'stiff', 'Stiff unilateral', 6, 'rIQcJL8N_i4', 'Treino principal', repeat('8–10 por perna', 3), 60,
    '60–120 s; descansar também entre as pernas', lowerCadence,
    'Experimente primeiro a forma 1; sentindo segurança, passe para a forma 2. Vídeo da forma 2 no PDF: https://youtube.com/shorts/xFS9A3PHV0A'),
  entry('c1', 'extensao-quadril', 'Extensão de quadril com perna semiflexionada e tronco deitado', 6, 'wCJJv_YOkIY', 'Treino principal', repeat('8–10 por perna', 3), 60,
    '60 s entre pernas', 'Suba em 2 s, segure 1 s e desça em 3 s.', 'Mantenha o joelho semiflexionado, sem movimentá-lo. Suba a perna e o calcanhar para cima.'),
  entry('c1', 'flexora', 'Cadeira flexora', 7, '9bXfoRHgPzw', 'Treino principal', [...repeat('5 pesadas + 10 leves', 3), 'Não informada no PDF'], 60,
    '60–120 s entre séries', 'Empurre para baixo em 2 s e segure a volta.',
    'Controle total do movimento, com tronco reto. Faça 5 repetições pesadas, diminua a carga e execute mais 10. O PDF descreve essa dinâmica 3 vezes, mas o volume indica 4 séries; a quarta não foi preenchida. Confirme a divergência com a responsável.',
    { technique: 'Redução de carga após 5 repetições pesadas, seguida de 10 leves. O PDF não indica pausa entre as duas cargas.' }),
  entry('c1', 'abdutora', 'Cadeira abdutora', 7, 'qrvPELxf7zw', 'Treino principal', ['10', '10', '8', '8'], 60,
    '60–120 s entre séries', 'Abra em 2 s e feche em 3 s.',
    'Tronco mais reto; pode desencostar levemente do banco, mas não incline para frente. O PDF descreve 2 séries de 10 + 2 séries de 8 mais pesadas, embora o volume indique 3 séries. As quatro séries descritas foram preservadas; confirme a divergência com a responsável.'),
];

export const b2Exercises: Exercise[] = [
  entry('b2', 'mobilidade', 'Mobilidade ativa de ombros, escápulas e coluna torácica', 3, 'nBxY52i1oAQ', 'Mobilidade', ['3–5 min'], 0,
    'Não informado no PDF', '', 'Faça 1 série de 3–5 minutos. O PDF também escreve “3 a 5 horas minutos”, divergindo da indicação em minutos. Segunda demonstração original: https://youtu.be/-R3AvHQqU-M', { measurementLabel: 'Duração (s)' }),
  entry('b2', 'face-pull', 'Face pull', 4, 'ObpMd1P9IoE', 'Ativação', repeat('10–12', 2), 0, '~45 s após o combo',
    'Lenta, segure a volta.', `Carga leve, foco em postura e ativação escapular. ${combo}`),
  entry('b2', 'dead-bug', 'Dead bug', 4, 'vnrB4XqYlho', 'Ativação', repeat('20', 2), 0, '~45 s após o combo',
    'Sem cadência controlada.', `Estabilidade de core antes do treino principal. ${combo}`),
  entry('b2', 'prancha', 'Prancha isométrica', 4, 'y8lz-qbRXgc', 'Ativação', repeat('40 s', 2), 45, '~45 s após o combo',
    '', `Estabilidade de core antes do treino principal. ${combo}`, { measurementLabel: 'Duração (s)' }),
  entry('b2', 'puxada', 'Puxada na frente (pegada aberta ou média)', 5, 'Ta7Rg1b0bUM', 'Treino principal', [...repeat('6–8', 3), 'Não informada no PDF'], 90,
    '90–150 s', 'Puxe em 2 s e suba em 3 s.', 'O PDF orienta carga máxima possível para essa zona de repetição. O volume indica 4 séries, mas a coluna de repetições descreve 3. A quarta não foi preenchida; confirme com a responsável.'),
  entry('b2', 'serrote', 'Serrote com halter', 5, 'yHYgXBQp0qM', 'Treino principal', repeat('8–10 por braço', 3), 40,
    '40–60 s entre braços', 'Puxe em 2 s e desça em 3 s.', 'Evite rotação do tronco. Controle total do movimento.'),
  entry('b2', 'infra-suspenso', 'Abdominal infra suspenso', 5, 'U63XdWh0Kl4', 'Treino principal', repeat('10–12', 3), 0,
    'Não informado no PDF', 'Desça a perna em 3 s e suba em 1 s.', 'Mantenha quadril estável e abdômen ativo, sem muito balanço. A coluna de descanso contém uma orientação de postura, sem informar duração.'),
  entry('b2', 'remada', 'Remada curvada', 6, 'tDakeF7wRQc', 'Treino principal', ['8–10', '8–10', '6–8', '6–8'], 90,
    '90 s entre séries', 'Suba em 2 s e desça em 3 s.', 'Aumente a carga na terceira série e diminua as repetições. O PDF descreve 2 séries de 8–10 + 2 séries de 6–8, mas o volume indica 3 séries. As quatro séries descritas foram preservadas; confirme a divergência com a responsável.'),
  entry('b2', 'rosca', 'Rosca direta barra W', 6, 'T-xIPp7gRww', 'Treino principal', repeat('6–8', 3), 60,
    '60–90 s entre séries', 'Suba em 2 s e desça em 3 s.', 'Coloque uma carga desafiadora para essa zona de repetição.'),
  entry('b2', 'infra-solo', 'Abdominal infra solo', 6, 'Q_mn14gBVR0', 'Treino principal', repeat('12–15', 3), 0,
    'Não informado no PDF', 'Segure a descida em 2 s.', 'Coloque uma caneleira leve nas pernas. Mantenha quadril estável e abdômen ativo. O PDF não informa duração do descanso.'),
  entry('b2', 'martelo', 'Bíceps martelo alternado com halteres', 7, '22AD4MDFPWg', 'Treino principal', repeat('8–10', 3), 60,
    '60 s', '', 'Execute com halteres, de forma livre, um de cada vez.'),
  entry('b2', 'palofe', 'Palofe', 7, 'FypGAEo9uZo', 'Treino principal', repeat('8–10 de cada lado', 3), 60,
    '60 s', '', 'O PDF orienta colocar carga no abdome lateral e executar um giro de tronco com potência. Nome e vídeo originais preservados; confira a execução com a responsável caso não correspondam ao movimento esperado.'),
  entry('b2', 'giro-russo', 'Giro russo', 7, 'vq1FICbQC4Q', 'Treino principal', repeat('20', 3), 60,
    '60 s', '', 'Segure um halter ou anilha; para intensificar, pode tirar os pés do chão e sustentá-los no alto.'),
];

const general = 'Técnicas avançadas apenas onde indicado. Mantenha cadências e tempos de descanso e progrida a carga ao longo das semanas. Atente-se às instruções e aos vídeos de cada exercício. Descanse pelo menos 1 dia antes de repetir o treino e não o realize em dias seguidos. Consulte o módulo Cronograma de Treinos para organizar a divisão. Se seu nível não for compatível, comece pelo iniciante.';
export const proC1: Workout = {
  id: 'studio-pro-c1', name: 'C1', programId, programCode: 'C1', sourceId: 'she-pro-c1',
  subtitle: 'SHE PRO · Glúteos e posterior · Intermediário / Avançado',
  exerciseIds: c1Exercises.map(item => item.id),
  preparation: 'Mobilidade ativa de quadril, lombar e posteriores: 1 série de 5–8 minutos, incluída na ficha.',
  notes: `${general} Ênfase máxima em glúteos e posterior, priorizando padrões dominantes de quadril. O PDF indica ciclo de 5 semanas na página 2 e 6 semanas na página 8; confirme a duração com a responsável. As divergências de séries na cadeira flexora e abdutora estão sinalizadas nos exercícios.`,
};
export const proB2: Workout = {
  id: 'studio-pro-b2', name: 'B2', programId, programCode: 'B2', sourceId: 'she-pro-b2',
  subtitle: 'SHE PRO · Costas + Bíceps + Abdome · Intermediário / Avançado',
  exerciseIds: b2Exercises.map(item => item.id),
  preparation: 'Mobilidade ativa de ombros, escápulas e coluna torácica: 1 série de 3–5 minutos, incluída na ficha. Ativação conjugada em 2 voltas: face pull, dead bug e prancha; ~45 s após o combo.',
  notes: `${general} Ênfase em costas e bíceps. A capa diz C2; a página 2 identifica B2, usado neste cadastro. A ficha indica ciclo de 5 semanas; a agenda Pro existente tem 6 semanas. Confirme com a responsável. As divergências de séries na puxada e remada estão sinalizadas nos exercícios.`,
};
