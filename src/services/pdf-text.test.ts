import { describe, expect, it } from 'vitest';
import { pageLines } from './pdf-text';

const item = (str: string, x: number, y: number) => ({ str, transform: [1, 0, 0, 1, x, y] });

describe('linhas de tabelas PDF com tamanhos de fonte diferentes', () => {
  it('mantém o descanso na mesma linha dos códigos apesar do deslocamento de 3,75 pontos', () => {
    expect(pageLines([
      item('Descanso / SheFlow', 1132, 500.26),
      item('B2', 457, 496.51),
      item('Semana 01', 86, 496.51),
      item('A1', 322, 496.51),
      item('Semana 02', 86, 406.53),
      item('Descanso / SheFlow', 1135, 410.28),
    ])).toEqual(['Semana 01 A1 B2 Descanso / SheFlow', 'Semana 02 Descanso / SheFlow']);
  });

  it('ignora objetos inválidos e não mistura linhas consecutivas', () => {
    expect(pageLines([null, {}, item(' ', 0, 0), item('primeira', 0, 100), item('segunda', 0, 80)])).toEqual(['primeira', 'segunda']);
  });
});
