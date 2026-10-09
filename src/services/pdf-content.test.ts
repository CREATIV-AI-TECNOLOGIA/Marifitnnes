import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { preparePdfImport, sanitizeSourceText, verifiedSources } from './pdf-content';
import { studioExercises, studioWorkouts } from '../data/studio-catalog';
import { useAppStore } from '../stores/use-app-store';

vi.hoisted(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
});
afterAll(() => vi.unstubAllGlobals());

describe('conversão dos documentos reais conferidos', () => {
  it.each(verifiedSources.map(source => [source.name, source] as const))('confere todas as páginas de %s', (_, source) => {
    const draft = preparePdfImport(structuredClone(source));
    expect(draft.source.pages).toHaveLength(source.pageCount);
    expect(draft.source.pages.every(page => page.text.length > 0)).toBe(true);
    expect(JSON.stringify(draft.source)).not.toMatch(/licensed to|mfigueiredo|@gmail/i);
  });

  it('atualiza demonstrações das fichas conhecidas sem descartar fontes ou registros salvos', async () => {
    const original = studioExercises[0];
    const extraSource = { ...verifiedSources[1], id: 'other-source', sha256: 'other-hash' };
    const active = { id: 'existing-session', workoutId: 'studio-start-c' };
    const migrate = useAppStore.persist.getOptions().migrate!;
    const migrated = await migrate({
      sources: [extraSource], exercises: [{ ...original, videoId: undefined }],
      workouts: studioWorkouts, activeSession: active,
    }, 8) as Partial<ReturnType<typeof useAppStore.getState>>;
    expect(migrated.sources).toContainEqual(extraSource);
    expect(migrated.exercises?.find(item => item.id === original.id)?.videoId).toBe(original.videoId);
    expect(migrated.activeSession).toEqual(active);
  });

  it('mantém Start independente da agenda e preserva tempo, combinação e séries variáveis', () => {
    const draft = preparePdfImport(verifiedSources.find(source => source.id === 'she-start-c')!);
    expect(draft.agenda).toBeUndefined();
    expect(draft.exercises).toHaveLength(12);
    expect(draft.exercises.at(-1)?.measurementLabel).toBe('Duração (s)');
    expect(draft.exercises.at(-1)?.setCountRange).toEqual({ min: 2, max: 3 });
    expect(draft.exercises.at(-2)?.secondaryMovement?.targets).toEqual(['12–15', '12–15', '12–15']);
    expect(draft.source.pages.flatMap(page => page.links)).toHaveLength(13);
  });

  it('preserva os dados ambíguos do A1 sem preencher a quarta série da mesa flexora', () => {
    const draft = preparePdfImport(verifiedSources.find(source => source.id === 'she-pro-a1')!);
    expect(draft.exercises).toHaveLength(10);
    expect(draft.exercises[0].targets).toEqual(['3–5 min']);
    expect(draft.exercises[1].targets).toEqual(['12–15 passos', '12–15 passos']);
    expect(draft.exercises[3].restLabelsBySet).toEqual(['60 s', '60–80 s', '80–100 s']);
    expect(draft.exercises[8].targets.at(-1)).toBe('Não informada no PDF');
    expect(draft.warnings).toHaveLength(3);
  });

  it('recusa outra edição, mesmo quando o nome é o mesmo', () => {
    expect(() => preparePdfImport({ ...verifiedSources[0], sha256: 'different' })).toThrow('FORMATO_NAO_SUPORTADO');
    expect(preparePdfImport({ ...verifiedSources[1], name: 'renomeado.pdf' }).workout?.name).toBe('C');
  });

  it.each(['missing', 'empty', 'truncated'])('recusa leitura %s sem completar conteúdo', mode => {
    const source = structuredClone(verifiedSources[2]);
    if (mode === 'missing') source.pages.pop();
    if (mode === 'empty') source.pages[4].text = '';
    if (mode === 'truncated') source.pages[4].text = source.pages[4].text.slice(0, 50);
    expect(() => preparePdfImport(source)).toThrow('LEITURA_INCOMPLETA');
  });

  it('confere as 168 células dos calendários e as quatro frequências', () => {
    const agenda = preparePdfImport(verifiedSources[0]).agenda!;
    expect(agenda.frequencies.map(item => item.frequency)).toEqual([3, 4, 5, 6]);
    expect(agenda.frequencies.flatMap(item => item.weeks.flatMap(week => week.days))).toHaveLength(168);
    expect(agenda.frequencies[0].weeks[1].days).toEqual(['C1', 'Descanso', 'B1', 'Descanso / SheFlow', 'A1', 'Descanso', 'Descanso / SheFlow']);
    expect(agenda.exerciseTemplates).toBeUndefined();
  });

  it('remove apenas o cabeçalho pessoal de licença do texto', () => {
    expect(sanitizeSourceText('Licensed to contato@example.com - Nome\nExercício\n3 séries')).toBe('Exercício\n3 séries');
  });
});

describe('salvamento e reimportação', () => {
  it.each(['agenda primeiro', 'ficha primeiro'])('vincula apenas fichas importadas: %s', order => {
    useAppStore.setState({ workouts: [], exercises: [], programs: [], sources: [], cycles: [], activeAgenda: null, activeSession: null });
    const agenda = preparePdfImport(verifiedSources.find(source => source.id === 'she-pro-agenda')!);
    const a1 = preparePdfImport(verifiedSources.find(source => source.id === 'she-pro-a1')!);
    const store = useAppStore.getState();
    if (order === 'agenda primeiro') {
      store.savePdfImport(agenda);
      const cycle = store.activateProgram(agenda.agenda!.id, 3);
      expect(useAppStore.getState().workouts.find(workout => workout.cycleId === cycle && workout.programCode === 'A1')?.exerciseIds).toEqual([]);
      store.savePdfImport(a1);
    } else {
      store.savePdfImport(a1);
      store.savePdfImport(agenda);
    }
    const cycle = store.activateProgram(agenda.agenda!.id, 3);
    const workouts = useAppStore.getState().workouts.filter(workout => workout.cycleId === cycle);
    expect(workouts.find(workout => workout.programCode === 'A1')?.exerciseIds).toHaveLength(10);
    expect(workouts.filter(workout => workout.programCode !== 'A1').every(workout => !workout.exerciseIds.length)).toBe(true);
  });
  it('inicia sem fichas e não recria PDFs depois de uma limpeza', async () => {
    const initial = useAppStore.getInitialState();
    expect(initial.workouts).toEqual([]);
    expect(initial.exercises).toEqual([]);
    expect(initial.programs).toEqual([]);
    expect(initial.sources).toEqual([]);
    const migrated = await useAppStore.persist.getOptions().migrate!({ workouts: [], exercises: [], programs: [], sources: [] }, 8) as Partial<ReturnType<typeof useAppStore.getState>>;
    expect(migrated.workouts).toEqual([]);
    expect(migrated.exercises).toEqual([]);
    expect(migrated.programs).toEqual([]);
    expect(migrated.sources).toEqual([]);
  });
  beforeEach(() => {
    useAppStore.setState({ workouts: structuredClone(studioWorkouts), exercises: structuredClone(studioExercises), pdfDraft: null, activeSession: null, history: [] });

  });

  it('não duplica ficha nem documento e preserva a sessão em andamento', () => {
    const draft = preparePdfImport(verifiedSources[1]);
    const id = useAppStore.getState().startSession('studio-start-c');
    const active = structuredClone(useAppStore.getState().activeSession);
    useAppStore.getState().savePdfImport(draft);
    useAppStore.getState().savePdfImport(draft);
    const state = useAppStore.getState();
    expect(state.workouts.filter(item => item.id === draft.workout!.id)).toHaveLength(1);
    expect(state.sources.filter(item => item.sha256 === draft.source.sha256)).toHaveLength(1);
    expect(state.exercises.filter(item => draft.workout!.exerciseIds.includes(item.id))).toHaveLength(12);
    expect(state.activeSession?.id).toBe(id);
    expect(state.activeSession).toEqual(active);
  });

  it('preserva o nome personalizado ao importar a mesma ficha novamente', () => {
    const draft = preparePdfImport(verifiedSources[1]);
    useAppStore.getState().renameWorkout(draft.workout!.id, 'Meu treino de pernas');
    useAppStore.getState().savePdfImport(draft);
    expect(useAppStore.getState().workouts.find(item => item.id === draft.workout!.id)?.name)
      .toBe('Meu treino de pernas');
  });

  it('mantém a revisão e os dados quando o armazenamento falha', () => {
    const draft = preparePdfImport(verifiedSources[1]);
    useAppStore.getState().setPdfDraft(draft);
    const previous = useAppStore.getState();
    const storage = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => previous.savePdfImport(draft)).toThrow('quota');
    expect(useAppStore.getState()).toBe(previous);
    storage.mockRestore();
  });
});
