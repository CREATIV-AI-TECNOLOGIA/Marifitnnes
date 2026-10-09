import { describe, expect, it, vi } from 'vitest';
import { studioExercises, studioWorkouts } from './studio-catalog';
import { addReadyWorkouts } from './ready-workouts';
import starterProgram from './starter-program';
import { exerciseSchema } from '../services/cloud-schema';
import { useAppStore } from '../stores/use-app-store';

vi.hoisted(() => vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} }));

describe('C1 e B2 prontos', () => {
  it.each([['C1', 9], ['B2', 13]] as const)('disponibiliza %s completo sem importar', (code, count) => {
    const workout = studioWorkouts.find(item => item.programCode === code)!;
    expect(workout).toBeDefined();
    expect(workout.exerciseIds).toHaveLength(count);
    const exercises = workout.exerciseIds.map(id => studioExercises.find(item => item.id === id)!);
    expect(exercises.every(item => exerciseSchema.safeParse(item).success && !!item.videoId && !!item.sourcePage)).toBe(true);
  });
  it('preserva divergências, descansos ausentes e vídeos da linha correta', () => {
    const find = (id: string) => studioExercises.find(item => item.id === id)!;
    expect(find('studio-pro-c1-flexora').targets.at(-1)).toBe('Não informada no PDF');
    expect(find('studio-pro-b2-puxada').targets.at(-1)).toBe('Não informada no PDF');
    expect(find('studio-pro-b2-remada').videoId).toBe('tDakeF7wRQc');
    expect(find('studio-pro-b2-rosca').videoId).toBe('T-xIPp7gRww');
    expect(find('studio-pro-b2-infra-suspenso').rest).toBe(0);
    expect(find('studio-pro-b2-prancha').measurementLabel).toBe('Duração (s)');
  });
  it('adiciona apenas o necessário e preenche a agenda sem substituir fichas pessoais', () => {
    const own = { ...studioWorkouts[0], id: 'pessoal', name: 'Meu treino' };
    const empty = { ...own, id: 'ciclo-c1', name: 'C1', programId: starterProgram.id, programCode: 'C1', cycleId: 'ciclo', exerciseIds: [] };
    const state = { workouts: [own, empty], exercises: [], programs: [starterProgram], activeSession: null };
    const next = addReadyWorkouts(state);
    expect(next.workouts[0]).toBe(own);
    expect(next.workouts.find(item => item.id === empty.id)?.exerciseIds).toHaveLength(9);
    expect(next.programs[0].exerciseTemplates?.B2).toHaveLength(13);
    expect(addReadyWorkouts(next)).toBe(next);
    const edited = { ...next, workouts: next.workouts.map(item => item.id === empty.id ? { ...item, exerciseIds: ['pessoal'] } : item) };
    expect(addReadyWorkouts(edited).workouts.find(item => item.id === empty.id)?.exerciseIds).toEqual(['pessoal']);
  });
  it.each([['C1', 9], ['B2', 13]] as const)('inicia %s e preserva uma sessão aberta ao atualizar a biblioteca', (code, count) => {
    const initial = { ...useAppStore.getInitialState(), workouts: [], exercises: [], programs: [] };
    useAppStore.setState(addReadyWorkouts(initial));
    const workout = useAppStore.getState().workouts.find(item => item.programCode === code)!;
    expect(useAppStore.getState().startSession(workout.id)).toBeTruthy();
    const state = useAppStore.getState();
    expect(state.activeSession?.exercises).toHaveLength(count);
    expect(addReadyWorkouts(state).activeSession).toBe(state.activeSession);
  });
});
