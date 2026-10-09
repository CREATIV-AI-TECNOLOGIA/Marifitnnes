import { describe, expect, it } from 'vitest';
import { parseTrainingAgenda } from './agenda-parser';

const homePages = [
  'O She Move trabalha com ciclos estruturados de 6 semanas.',
  `SEM 1 A 5 A B C D A ou C B ou D Descanso /
SheFlow
SHE AGENDASHE HOME - Treinos em Casa 6X NA SEMANAUm descanso na semana
S e m a n a  2  –  S e x t a  C  /   S á b a d o   D
S e m a n a  1  –  S e x t a  A  /  S á b a d o   B
S e m a n a  4  –  S e x t a  C  /   S á b a d o   D
S e m a n a  6  –  S e x t a  C  /   S á b a d o   D
S e m a n a  3  –  S e x t a  A  /  S á b a d o   B
S e m a n a  5  –  S e x t a  A  /  S á b a d o   B`,
  `Exercício A B C Descanso D
Escolher o
treino que
deseja
repetir.
Descanso /
SheFlow
5X NA SEMANAdois descansos na semana
Alternativa semanal:
Revezar o treino de sábado, onde na
semana 1 se repete o A, depois, B, depois,
C e depois D.`,
  'Exercício A B Descanso C D Descanso Descanso / SheFlow\n4X NA SEMANAEXEMPLO: SEG - TER - QUI - SEX',
  `SEMANA 1 A Descanso B Descanso C Descanso Descanso /
SheFlow
SEMANA 2 D Descanso A Descanso B Descanso Descanso /
SheFlow
SEMANA 3 C Descanso D Descanso A Descanso Descanso /
SheFlow
SEMANA 4 B Descanso C Descanso D Descanso Descanso /
SheFlow
3X NA SEMANAExemplo: Seg – Qua – Sex`,
];

const gymPages = [
  'Ciclos estruturados de 6 semanas. SHE PRO HIPERTROFIA Academia.',
  `Semana 01 A1 B2 C1 B3 A2 C2 Descanso / SheFlow
Semana 02 A2 B1 C2 B2 A1 C2 Descanso / SheFlow
Semana 03 C1 B3 A1 B1 C2 A2 Descanso / SheFlow
Semana 04 A1 B2 C2 B3 A2 B1 Descanso / SheFlow
Semana 05 A2 B3 C1 B2 A1 C2 Descanso / SheFlow
Semana 06 A1 B1 C1 B2 A2 C2 Descanso / SheFlow
SHE PRO HIPERTROFIA 6X NA SEMANA`,
  `Semana 01 A1 B2 C1 B3 A2 Descanso Descanso / SheFlow
Semana 02 A2 B1 C2 B2 A1 Descanso Descanso / SheFlow
Semana 03 C1 B3 A1 B1 C2 Descanso Descanso / SheFlow
Semana 04 A1 B2 C2 B3 A2 Descanso Descanso / SheFlow
Semana 05 A2 B1 C1 B2 C2 Descanso Descanso / SheFlow
Semana 06 A1 B1 C1 B3 A2 Descanso Descanso / SheFlow
SHE PRO HIPERTROFIA 5X NA SEMANA`,
  `Semana 01 A1 B2 Descanso C1 B3 Descanso / SheFlow Descanso
Semana 02 A2 B1 Descanso C2 B2 Descanso / SheFlow Descanso
Semana 03 C1 B3 Descanso A1 B1 Descanso / SheFlow Descanso
Semana 04 A2 B2 Descanso C2 B3 Descanso / SheFlow Descanso
Semana 05 A1 B1 Descanso C1 B2 Descanso / SheFlow Descanso
Semana 06 A2 B1 Descanso C2 B3 Descanso / SheFlow Descanso
SHE PRO HIPERTROFIA 4X NA SEMANA`,
  `Semana 01 A2 Descanso B1 Descanso / SheFlow C2 Descanso Descanso / SheFlow
Semana 02 C1 Descanso B1 Descanso / SheFlow A1 Descanso Descanso / SheFlow
Semana 03 A1 Descanso B1 Descanso / SheFlow C2 Descanso Descanso / SheFlow
Semana 04 C2 Descanso B1 Descanso / SheFlow A2 Descanso Descanso / SheFlow
Semana 05 A2 Descanso B1 Descanso / SheFlow C1 Descanso Descanso / SheFlow
Semana 06 A1 Descanso B1 Descanso / SheFlow C2 Descanso Descanso / SheFlow
SHE PRO HIPERTROFIA 3X NA SEMANA`,
];

describe('parseTrainingAgenda', () => {
  it('lê as quatro frequências da agenda de treinos em casa', () => {
    const program = parseTrainingAgenda('agenda-home.pdf', homePages);
    expect(program.cycleWeeks).toBe(6);
    expect(program.frequencies.map(item => item.frequency)).toEqual([3, 4, 5, 6]);
    expect(program.frequencies.every(item => item.weeks.length === 6)).toBe(true);
    const five = program.frequencies.find(item => item.frequency === 5)!;
    expect(five.weeks.map(item => item.days[5])).toEqual(['A', 'B', 'C', 'D', 'A', 'B']);
    const six = program.frequencies.find(item => item.frequency === 6)!;
    expect(six.weeks.map(item => item.days[4])).toEqual(['A', 'C', 'A', 'C', 'A', 'C']);
    const three = program.frequencies.find(item => item.frequency === 3)!;
    expect(three.weeks[4].days).toEqual(three.weeks[0].days);
  });

  it('preserva os seis quadros de cada frequência da academia', () => {
    const program = parseTrainingAgenda('agenda-pro.pdf', gymPages);
    expect(program.name).toBe('Hipertrofia na academia');
    expect(program.frequencies.map(item => item.frequency)).toEqual([3, 4, 5, 6]);
    expect(program.frequencies.every(item => item.weeks.length === 6)).toBe(true);
    expect(program.frequencies.find(item => item.frequency === 6)?.weeks[0].days).toEqual(['A1', 'B2', 'C1', 'B3', 'A2', 'C2', 'Descanso / SheFlow']);
    expect(program.frequencies.find(item => item.frequency === 5)?.weeks[0].days).toEqual(['A1', 'B2', 'C1', 'B3', 'A2', 'Descanso', 'Descanso / SheFlow']);
    expect(program.frequencies.find(item => item.frequency === 4)?.weeks[0].days).toEqual(['A1', 'B2', 'Descanso', 'C1', 'B3', 'Descanso / SheFlow', 'Descanso']);
    expect(program.frequencies.find(item => item.frequency === 3)?.weeks[0].days).toEqual(['A2', 'Descanso', 'B1', 'Descanso / SheFlow', 'C2', 'Descanso', 'Descanso / SheFlow']);
    expect(program.workoutCodes).toEqual(['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2']);
  });

  it('recusa PDFs que não contêm frequências semanais reconhecidas', () => {
    expect(() => parseTrainingAgenda('outro.pdf', ['Apenas texto sem agenda semanal'])).toThrow('AGENDA_NAO_RECONHECIDA');
  });
});
