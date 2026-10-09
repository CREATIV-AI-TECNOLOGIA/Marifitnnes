import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { studioExercises, studioWorkouts } from '../../data/studio-catalog';
import { useAppStore } from '../../stores/use-app-store';
import WorkoutDetailPage from './WorkoutDetailPage';

vi.hoisted(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
});
afterAll(() => vi.unstubAllGlobals());

// Renderização no servidor usa o estado inicial do Zustand; aqui a tela recebe a sessão do cenário.
vi.mock('../../stores/use-app-store', async importOriginal => {
  const actual = await importOriginal<typeof import('../../stores/use-app-store')>();
  const store = actual.useAppStore;
  return { ...actual, useAppStore: Object.assign(
    (selector: (state: ReturnType<typeof store.getState>) => unknown) => selector(store.getState()), store,
  ) };
});

function renderA1() {
  return renderToStaticMarkup(<MemoryRouter initialEntries={['/app/workouts/studio-pro-a1']}>
    <Routes><Route path="/app/workouts/:id" element={<WorkoutDetailPage />} /></Routes>
  </MemoryRouter>);
}

describe('retomar a ficha em andamento', () => {
  beforeEach(() => useAppStore.setState({
    exercises: structuredClone(studioExercises), workouts: structuredClone(studioWorkouts),
    activeSession: null, history: [],
  }));

  it('mostra iniciar quando não existe sessão', () => {
    expect(renderA1()).toContain('Iniciar treino');
    expect(renderA1()).not.toContain('Continuar treino');
    expect(renderA1()).toContain('Organizar treino');
    expect(renderA1()).toContain('Renomear');
  });

  it('renomeia a ficha e a sessão ativa sem alterar o código original', () => {
    const original = studioWorkouts.find(item => item.id === 'studio-pro-a1')!;
    useAppStore.setState(state => ({ workouts: [...state.workouts, { ...original, id: 'cycle-a1', cycleId: 'cycle' }] }));
    useAppStore.getState().startSession('cycle-a1');

    useAppStore.getState().renameWorkout(original.id, '  Treino de pernas  ');
    const state = useAppStore.getState();
    expect(state.workouts.filter(item => item.programId === original.programId && item.programCode === original.programCode)
      .every(item => item.name === 'Treino de pernas')).toBe(true);
    expect(state.activeSession?.workoutName).toBe('Treino de pernas');
    expect(state.workouts.find(item => item.id === original.id)?.programCode).toBe('A1');
    expect(renderA1()).toContain('Treino de pernas');

    useAppStore.getState().renameWorkout(original.id, '   ');
    expect(useAppStore.getState().workouts.find(item => item.id === original.id)?.name).toBe('Treino de pernas');
    useAppStore.getState().renameWorkout(original.id, original.programCode!);
    expect(useAppStore.getState().workouts.find(item => item.id === original.id)?.name).toBe('A1');
  });

  it.each(['studio-pro-a1', 'cycle-a1'])('retoma o A1 iniciado por %s sem perder séries', id => {
    const original = studioWorkouts.find(item => item.id === 'studio-pro-a1')!;
    if (id !== original.id) useAppStore.setState(state => ({ workouts: [...state.workouts, { ...original, id, cycleId: 'cycle' }] }));
    const sessionId = useAppStore.getState().startSession(id);
    const exerciseId = original.exerciseIds[0];
    useAppStore.getState().updateSet(exerciseId, 0, { completed: true, weight: 12, performedReps: 15 });
    const active = structuredClone(useAppStore.getState().activeSession);
    expect(renderA1()).toContain('Continuar treino');
    expect(renderA1()).not.toContain('Iniciar treino');
    expect(useAppStore.getState().startSession(original.id)).toBe(sessionId);
    expect(useAppStore.getState().activeSession).toEqual(active);
  });

  it('não retoma outro programa mesmo com nome A1', () => {
    const original = studioWorkouts.find(item => item.id === 'studio-pro-a1')!;
    useAppStore.setState(state => ({ workouts: [...state.workouts, { ...original, id: 'different-a1', programId: 'other-program', sourceId: 'other-source' }] }));
    useAppStore.getState().startSession('different-a1');
    const active = useAppStore.getState().activeSession;
    expect(renderA1()).toContain('Iniciar treino');
    expect(useAppStore.getState().startSession(original.id)).toBe('');
    expect(useAppStore.getState().activeSession).toBe(active);
  });
});
