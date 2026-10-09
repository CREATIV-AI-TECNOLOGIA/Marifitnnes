import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterAll, expect, it, vi } from 'vitest';
import { studioExercises, studioWorkouts } from '../../data/studio-catalog';
import { useAppStore } from '../../stores/use-app-store';
import SessionPage from './SessionPage';

vi.hoisted(() => vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} }));
afterAll(() => vi.unstubAllGlobals());
vi.mock('../../stores/use-app-store', async importOriginal => {
  const actual = await importOriginal<typeof import('../../stores/use-app-store')>();
  const store = actual.useAppStore;
  return { ...actual, useAppStore: Object.assign(
    (selector: (state: ReturnType<typeof store.getState>) => unknown) => selector(store.getState()), store,
  ) };
});

it('usa as orientações do PDF importado quando outra ficha também se chama A1', () => {
  const workout = { ...studioWorkouts[1], id: 'outro-a1', programId: 'outro-programa', sourceId: 'outro-pdf',
    preparation: 'Preparação exclusiva do outro PDF.', notes: 'Orientação exclusiva do outro PDF.' };
  useAppStore.setState({ workouts: [workout], exercises: structuredClone(studioExercises), activeSession: null, history: [] });
  const id = useAppStore.getState().startSession(workout.id);
  const html = renderToStaticMarkup(<MemoryRouter initialEntries={[`/app/session/${id}`]}>
    <Routes><Route path="/app/session/:id" element={<SessionPage />} /></Routes>
  </MemoryRouter>);
  expect(html).toContain(workout.preparation);
  expect(html).toContain(workout.notes);
  expect(html).not.toContain('Lógica do ciclo');
});
