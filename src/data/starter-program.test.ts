import { describe, expect, it } from 'vitest';
import starterProgram from './starter-program';
import { useAppStore } from '../stores/use-app-store';

describe('agenda e ficha pré-carregadas', () => {
  it('mantém as quatro divisões semanais de seis semanas da agenda Pro', () => {
    expect(starterProgram.cycleWeeks).toBe(6);
    expect(starterProgram.frequencies.map(item => item.frequency)).toEqual([3, 4, 5, 6]);
    expect(starterProgram.frequencies.every(item => item.weeks.length === 6 && item.weeks.every(week => week.days.length === 7))).toBe(true);
    expect(starterProgram.frequencies.find(item => item.frequency === 6)?.weeks[0].days)
      .toEqual(['A1', 'B2', 'C1', 'B3', 'A2', 'C2', 'Descanso']);
  });

  it('ativa a escolha semanal e disponibiliza o A1 para consultar e iniciar', () => {
    useAppStore.persist.setOptions({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
    const store = useAppStore.getState();
    expect(store.programs.some(program => program.id === starterProgram.id)).toBe(true);
    const cycleId = store.activateProgram(starterProgram.id, 4);
    expect(cycleId).toBeTruthy();

    const state = useAppStore.getState();
    const workout = state.workouts.find(item => item.cycleId === cycleId && item.programCode === 'A1');
    expect(state.activeAgenda?.frequency).toBe(4);
    expect(workout?.exerciseIds).toHaveLength(9);
    expect(state.exercises.find(item => item.id === workout?.exerciseIds[2])?.targets).toEqual(['6–8', '6–8', '6–8']);
    expect(state.startSession(workout!.id)).toBeTruthy();
    expect(useAppStore.getState().activeSession?.exercises).toHaveLength(9);
  });
});
