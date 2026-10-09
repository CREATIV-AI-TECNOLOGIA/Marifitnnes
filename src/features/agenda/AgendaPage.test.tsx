import { afterAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AgendaPage, { monthDays } from './AgendaPage';
import { useAppStore } from '../../stores/use-app-store';
import starterProgram from '../../data/starter-program';

vi.hoisted(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
});
afterAll(() => vi.unstubAllGlobals());
vi.mock('../../stores/use-app-store', async importOriginal => {
  const actual = await importOriginal<typeof import('../../stores/use-app-store')>();
  const store = actual.useAppStore;
  return { ...actual, useAppStore: Object.assign(
    (selector: (state: ReturnType<typeof store.getState>) => unknown) => selector(store.getState()), store,
  ) };
});

it('ensina a escolher o objetivo sem oferecer adição na agenda pessoal', () => {
  useAppStore.setState({ programs: [starterProgram], workouts: [], activeAgenda: null });
  const html = renderToStaticMarkup(<MemoryRouter><AgendaPage /></MemoryRouter>);
  expect(html).toContain('Minha agenda');
  expect(html).toContain('Explorar objetivos');
  expect(html).toContain('Sua agenda começa no objetivo');
  expect(html).not.toContain('agenda-frequency-picker');
  expect(html).not.toContain('Adicionar');
});

describe('calendário mensal da agenda', () => {
  it.each([
    ['2026-09-30T12:00:00', 35],
    ['2021-02-10T12:00:00', 28],
    ['2026-03-10T12:00:00', 42],
  ])('exibe apenas as semanas necessárias em %s', (today, days) => {
    const date = new Date(today);
    const calendar = monthDays(date);
    expect(calendar).toHaveLength(days);
    expect(calendar[0].getDay()).toBe(1);
    expect(calendar.at(-1)?.getDay()).toBe(0);
    expect(calendar.filter(day => day.getMonth() === date.getMonth())).toHaveLength(
      new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
    );
  });
});
