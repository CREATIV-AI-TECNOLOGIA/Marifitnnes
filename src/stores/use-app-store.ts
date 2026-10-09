import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ActiveAgenda, PersonalAgenda, Cycle, Exercise, ImportDraft, Preferences, ProgramFrequency,
  SessionSet, TrainingProgram, TrainingSession, User, Workout, WorkoutOrder, PdfSource, PdfImportDraft,
} from '../types';
import starterProgram from '../data/starter-program';
import { studioExercises, studioWorkouts } from '../data/studio-catalog';
import { isSessionWorkout } from '../services/session-workout';
import { combineWorkouts } from '../services/combined-workout';

interface AppState {
  user: User | null;
  exercises: Exercise[];
  workouts: Workout[];
  cycles: Cycle[];
  programs: TrainingProgram[];
  activeAgenda: ActiveAgenda | null;
  personalAgendas: PersonalAgenda[];
  savePersonalAgenda: (plan: PersonalAgenda) => void;
  preferredFrequency: number | null;
  agendaChoices: Record<string, string>;
  history: TrainingSession[];
  activeSession: TrainingSession | null;
  draft: ImportDraft | null;
  pdfDraft: PdfImportDraft | null;
  sources: PdfSource[];
  setPdfDraft: (draft: PdfImportDraft | null) => void;
  savePdfImport: (draft: PdfImportDraft) => void;
  preferences: Preferences;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setPreferences: (preferences: Partial<Preferences>) => void;
  setDraft: (draft: ImportDraft | null) => void;
  saveProgram: (program: TrainingProgram) => void;
  activateProgram: (programId: string, frequency: number) => string | null;
  setAgendaFrequency: (frequency: number) => void;
  setAgendaChoice: (programId: string, date: string, code: string) => void;
  saveWorkout: (workout: Workout, exercises?: Exercise[], cycle?: Cycle) => void;
  renameWorkout: (id: string, name: string) => void;
  createCombinedWorkout: (ids: string[], order: WorkoutOrder, selection?: Record<string, string[]>) => string | null;
  deleteWorkout: (id: string) => void;
  setCurrentCycle: (id: string) => void;
  addCycle: (cycle: Cycle) => void;
  startSession: (id: string) => string;
  selectExercise: (id: string) => void;
  updateSet: (exerciseId: string, index: number, patch: Partial<SessionSet>) => void;
  replaceSets: (exerciseId: string, sets: SessionSet[]) => void;
  finishSession: (notes: string) => string | null;
  discardSession: () => void;
}

const emptyPreferences: Preferences = {
  showPrevious: true,
  trackDuration: true,
  autoRest: false,
  showVideos: true,
  unit: 'kg',
  theme: 'dark',
};

const exampleExerciseIds = new Set([
  'leg-press', 'remada', 'stiff', 'supino', 'extensora', 'rosca', 'flexora',
  'desenvolvimento', 'agachamento', 'panturrilha',
]);
const exampleWorkoutIds = new Set(['a', 'b', 'c']);
const exampleCycleIds = new Set(['setembro', 'agosto', 'abril']);

function migrateExampleData(value: unknown): Partial<AppState> {
  const saved = (value && typeof value === 'object' ? value : {}) as Partial<AppState>;
  const existingWorkouts = (saved.workouts ?? [])
    .filter(workout => !exampleWorkoutIds.has(workout.id))
    .map(workout => workout.programId === starterProgram.id && workout.programCode === 'A1'
      ? { ...workout, preparation: undefined, notes: undefined }
      : workout);
  const workouts = [...existingWorkouts.map(workout => ({ ...workout, sourceId: workout.sourceId ?? studioWorkouts.find(item => item.id === workout.id || (item.programId === workout.programId && item.programCode === workout.programCode))?.sourceId }))];
  const history = (saved.history ?? []).filter(session => !session.id.startsWith('history-'));
  const activeSession = saved.activeSession && !exampleWorkoutIds.has(saved.activeSession.workoutId)
    ? saved.activeSession
    : null;
  const referencedCycles = new Set([
    ...workouts.map(workout => workout.cycleId),
    ...history.map(session => session.cycleId),
    ...(activeSession ? [activeSession.cycleId] : []),
  ]);
  const cycles = (saved.cycles ?? [])
    .filter(cycle => !exampleCycleIds.has(cycle.id) || referencedCycles.has(cycle.id))
    .map(cycle => exampleCycleIds.has(cycle.id)
      ? { ...cycle, name: 'Treinos anteriores', current: false }
      : cycle);

  const programs = (saved.programs ?? []).map(program => {
    if (program.id !== starterProgram.id) return program;
    const workoutPreparation = { ...program.workoutPreparation };
    const workoutNotes = { ...program.workoutNotes };
    delete workoutPreparation.A1;
    delete workoutNotes.A1;
    return {
      ...program,
      ...starterProgram,
      exerciseTemplates: program.exerciseTemplates,
      workoutPreparation: Object.keys(workoutPreparation).length ? workoutPreparation : undefined,
      workoutNotes: Object.keys(workoutNotes).length ? workoutNotes : undefined,
    };
  });
  return {
    ...saved,
    user: saved.user?.email.toLowerCase() === 'demo@forma.app' ? null : saved.user ?? null,
    exercises: [
      ...(saved.exercises ?? []).filter(exercise => !exampleExerciseIds.has(exercise.id)).map(exercise => {
        const original = studioExercises.find(item => item.id === exercise.id || exercise.id.endsWith(item.id.replace('studio-pro-a1-', '')) && item.id.startsWith('studio-pro-a1-'));
        if (!original) return exercise;
        return { ...exercise, restLabel: original.restLabel, restLabelsBySet: original.restLabelsBySet, sourcePage: original.sourcePage,
          setCountRange: original.setCountRange, measurementLabel: original.measurementLabel, videoId: original.videoId,
          ...(original.name === 'Mesa flexora' && exercise.targets.length === 4 && exercise.targets[3] === '10–12'
            ? { targets: [...exercise.targets.slice(0, 3), 'Não informada no PDF'], instructions: original.instructions } : {}) };
      }),
    ],
    workouts,
    cycles,
    history,
    activeSession,
    programs,
    activeAgenda: saved.activeAgenda ?? null,
    preferredFrequency: saved.preferredFrequency ?? null,
    agendaChoices: saved.agendaChoices ?? {},
    draft: null,
    pdfDraft: null,
    sources: saved.sources ?? [],
    preferences: { ...emptyPreferences, ...saved.preferences },
  };
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekStart(date: Date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return monday;
}

function codeId(code: string) {
  return code.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const useAppStore = create<AppState>()(persist((set, get) => ({
  user: null,
  exercises: [],
  workouts: [],
  cycles: [],
  programs: [],
  activeAgenda: null,
  personalAgendas: [],
  savePersonalAgenda: plan => set(state => ({personalAgendas: [...(state.personalAgendas ?? []).filter(p => p.objectiveId !== plan.objectiveId), plan]})),
  preferredFrequency: null,
  agendaChoices: {},
  history: [],
  activeSession: null,
  draft: null,
  pdfDraft: null,
  sources: [],
  preferences: emptyPreferences,

  login: user => set({ user }),
  logout: () => set({ user: null }),
  setUser: user => set({ user }),
  setPreferences: preferences => set(state => ({ preferences: { ...state.preferences, ...preferences } })),
  setDraft: draft => set({ draft }),
  setPdfDraft: pdfDraft => set({ pdfDraft }),
  savePdfImport: draft => {
    const state = get();
    const sources = [...state.sources.filter(item => item.sha256 !== draft.source.sha256), draft.source];
    let workouts = state.workouts;
    let exercises = state.exercises;
    let programs = state.programs;
    if (draft.workout) {
      const incomingWorkout = draft.workout;
      const previousWorkout = workouts.find(item => item.id === incomingWorkout.id);
      const workout = { ...incomingWorkout, name: previousWorkout?.name ?? incomingWorkout.name, sourceId: draft.source.id };
      workouts = [...workouts.filter(item => item.id !== workout.id), workout];
      const definitions=draft.exercises.map(exercise=>state.activeSession?.exercises.some(active=>active.id===exercise.id)?{...exercise,id:`${exercise.id}-import-${crypto.randomUUID()}`}:exercise);
      workouts=workouts.map(item=>item.id===workout.id?{...item,exerciseIds:definitions.map(e=>e.id)}:item);
      exercises = [...exercises.filter(item => !definitions.some(next => next.id === item.id)), ...definitions];
      programs = programs.map(program => program.id === workout.programId ? {
        ...program, exerciseTemplates: { ...program.exerciseTemplates, [workout.programCode!]: definitions },
        workoutPreparation: { ...program.workoutPreparation, ...(workout.preparation ? { [workout.programCode!]: workout.preparation } : {}) },
        workoutNotes: { ...program.workoutNotes, ...(workout.notes ? { [workout.programCode!]: workout.notes } : {}) },
      } : program);
      workouts=workouts.map(item=>{
        if(!item.cycleId||item.programId!==workout.programId||item.programCode!==workout.programCode||state.activeSession?.workoutId===item.id)return item;
        const copies=definitions.map((exercise,index)=>({...exercise,id:`${item.id}-import-${draft.source.sha256}-${index}`}));
        exercises=[...exercises.filter(e=>!copies.some(copy=>copy.id===e.id)),...copies];
        return {...item,exerciseIds:copies.map(e=>e.id),sourceId:draft.source.id,preparation:workout.preparation,notes:workout.notes};
      });
    }
    if (draft.agenda) {
      const previous = programs.find(item => item.id === draft.agenda!.id);
      const importedWorkouts = workouts.filter(workout => workout.programId === draft.agenda!.id && workout.programCode && workout.exerciseIds.length);
      const templates = Object.fromEntries(importedWorkouts.map(workout => [workout.programCode!, workout.exerciseIds.map(id => exercises.find(exercise => exercise.id === id)).filter((exercise): exercise is Exercise => !!exercise)]));
      const preparation = Object.fromEntries(importedWorkouts.filter(workout => workout.preparation).map(workout => [workout.programCode!, workout.preparation!]));
      const notes = Object.fromEntries(importedWorkouts.filter(workout => workout.notes).map(workout => [workout.programCode!, workout.notes!]));
      const program = { ...draft.agenda,
        exerciseTemplates: { ...draft.agenda.exerciseTemplates, ...previous?.exerciseTemplates, ...templates },
        workoutPreparation: { ...draft.agenda.workoutPreparation, ...previous?.workoutPreparation, ...preparation },
        workoutNotes: { ...draft.agenda.workoutNotes, ...previous?.workoutNotes, ...notes },
      };
      programs = [...programs.filter(item => item.id !== program.id), program];
    }
    const next = { ...state, sources, workouts, exercises, programs, pdfDraft: null, draft: null };
    // Preflight the persistent write before changing the live store; quota failures leave the review open.
    localStorage.setItem(useAppStore.persist?.getOptions().name??'forma-app-v1', JSON.stringify({ state: next, version: 10 }));
    set({ sources, workouts, exercises, programs, pdfDraft: null });
  },

  saveProgram: program => set(state => ({
    programs: [...state.programs.filter(item => item.id !== program.id), program],
    draft: null,
  })),

  activateProgram: (programId, frequency) => {
    const state = get();
    const program = state.programs.find(item => item.id === programId);
    const agenda: ProgramFrequency | undefined = program?.frequencies.find(item => item.frequency === frequency);
    if (!program || !agenda || !agenda.weeks.length) return null;

    if (state.activeAgenda?.programId === programId) {
      state.setAgendaFrequency(frequency);
      return get().activeAgenda?.cycleId ?? null;
    }

    const start = weekStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + program.cycleWeeks * 7 - 1);
    const cycleId = `cycle-${crypto.randomUUID()}`;
    const cycle: Cycle = {
      id: cycleId,
      name: program.name,
      weeks: program.cycleWeeks,
      frequency,
      start: dateKey(start),
      end: dateKey(end),
      current: true,
      programId,
    };
    const exercises: Exercise[] = [];
    const workouts: Workout[] = program.workoutCodes.map(code => {
      const workoutId = `${cycleId}-${codeId(code)}`;
      const definitions = (program.exerciseTemplates?.[code] ?? []).map(template => ({
        ...template,
        id: `${workoutId}-${template.id}`,
        targets: [...template.targets],
        previousWeights: [...template.previousWeights],
        previousReps: [...template.previousReps],
        restBySet: template.restBySet ? [...template.restBySet] : undefined,
      }));
      exercises.push(...definitions);
      return {
        id: workoutId,
        name: state.workouts.find(item => item.programId === programId && item.programCode === code)?.name ?? code,
        subtitle: program.workoutLabels[code] ?? program.focus,
        cycleId,
        exerciseIds: definitions.map(exercise => exercise.id),
        programId,
        programCode: code,
        preparation: program.workoutPreparation?.[code],
        notes: program.workoutNotes?.[code],
        sourceId: state.workouts.find(item => item.programId === programId && item.programCode === code && item.sourceId)?.sourceId,
      };
    });

    set(current => ({
      cycles: [...current.cycles.map(item => ({ ...item, current: false })), cycle],
      workouts: [...current.workouts, ...workouts],
      exercises: [...current.exercises, ...exercises],
      activeAgenda: { programId, frequency, startedAt: cycle.start, cycleId },
      preferredFrequency: frequency,
    }));
    return cycleId;
  },

  setAgendaFrequency: frequency => set(state => {
    const active = state.activeAgenda;
    if (!active) return { preferredFrequency: frequency };
    const program = state.programs.find(item => item.id === active.programId);
    if (!program?.frequencies.some(item => item.frequency === frequency)) return {};
    return {
      preferredFrequency: frequency,
      activeAgenda: { ...active, frequency },
      cycles: state.cycles.map(cycle => cycle.id === active.cycleId ? { ...cycle, frequency } : cycle),
    };
  }),
  setAgendaChoice: (programId, date, code) => set(state => ({
    agendaChoices: { ...state.agendaChoices, [`${programId}:${date}`]: code },
  })),

  saveWorkout: (workout, exercises, cycle) => set(state => ({
    workouts: [...state.workouts.filter(item => item.id !== workout.id), workout],
    exercises: exercises
      ? [...state.exercises.filter(item => !exercises.some(next => next.id === item.id)), ...exercises]
      : state.exercises,
    cycles: cycle
      ? [...state.cycles.map(item => ({ ...item, current: false })), cycle]
      : state.cycles,
    draft: null,
  })),

  renameWorkout: (id, name) => set(state => {
    const trimmed = name.trim();
    const target = state.workouts.find(workout => workout.id === id);
    if (!target || !trimmed || trimmed.length > 80) return {};
    const matches = (workout: Workout) => workout.id === id || !!(target.programId && target.programCode
      && workout.programId === target.programId && workout.programCode === target.programCode);
    const renamedIds = new Set(state.workouts.filter(matches).map(workout => workout.id));
    return {
      workouts: state.workouts.map(workout => matches(workout) ? { ...workout, name: trimmed } : workout),
      activeSession: state.activeSession && renamedIds.has(state.activeSession.workoutId)
        ? { ...state.activeSession, workoutName: trimmed }
        : state.activeSession,
    };
  }),

  createCombinedWorkout: (ids, order, selection) => {
    const state = get();
    const selected = ids.map(id => state.workouts.find(workout => workout.id === id));
    if (selected.some(workout => !workout)) return null;
    const id = `combined-${crypto.randomUUID()}`;
    const combined = combineWorkouts(id, selected as Workout[], state.exercises, order, selection);
    if (!combined) return null;
    set(current => ({ workouts: [...current.workouts, combined.workout], exercises: [...current.exercises, ...combined.exercises] }));
    return id;
  },
  deleteWorkout: id => set(state => ({
    workouts: state.workouts.filter(workout => workout.id !== id),
    agendaChoices: Object.fromEntries(Object.entries(state.agendaChoices).filter(([, choice]) => choice !== id)),
  })),
  setCurrentCycle: id => set(state => ({ cycles: state.cycles.map(cycle => ({ ...cycle, current: cycle.id === id })) })),
  addCycle: cycle => set(state => ({ cycles: [...state.cycles.map(item => ({ ...item, current: false })), cycle] })),

  startSession: id => {
    const state = get();
    const workout = state.workouts.find(item => item.id === id);
    if (state.activeSession) return isSessionWorkout(state.activeSession, workout, state.workouts) ? state.activeSession.id : '';
    if (!workout || !workout.exerciseIds.length) return '';
    const exercises = workout.exerciseIds
      .map(exerciseId => state.exercises.find(exercise => exercise.id === exerciseId))
      .filter((exercise): exercise is Exercise => !!exercise);
    if (!exercises.length) return '';

    const now = Date.now();
    const session: TrainingSession = {
      id: `session-${now}`,
      workoutId: id,
      workoutName: workout.name,
      cycleId: workout.cycleId ?? (workout.programId && state.activeAgenda?.programId === workout.programId
        ? state.activeAgenda.cycleId
        : undefined),
      startedAt: now,
      elapsedTime: 0,
      currentExerciseId: exercises[0].id,
      notes: '',
      status: 'in_progress',
      exercises: exercises.map((exercise, index) => {
        const previous = state.history
          .find(item => item.exercises.some(entry => entry.id === exercise.id))
          ?.exercises.find(entry => entry.id === exercise.id);
        return {
          id: exercise.id,
          name: exercise.name,
          status: index === 0 ? 'in_progress' : 'not_started',
          startedAt: index === 0 ? now : undefined,
          elapsedTime: 0,
          measurementLabel: exercise.measurementLabel,
          sets: exercise.targets.map((target, setIndex) => ({
            setNumber: setIndex + 1,
            targetReps: target,
            performedReps: previous?.sets[setIndex]?.performedReps ?? exercise.previousReps[setIndex] ?? 0,
            weight: previous?.sets[setIndex]?.weight ?? exercise.previousWeights[setIndex] ?? 0,
            completed: false,
            secondaryTargetReps: exercise.secondaryMovement?.targets[setIndex],
            secondaryPerformedReps: previous?.sets[setIndex]?.secondaryPerformedReps ?? 0,
          })),
        };
      }),
    };
    set({ activeSession: session });
    return session.id;
  },

  selectExercise: id => set(state => {
    const active = state.activeSession;
    if (!active || active.currentExerciseId === id) return {};
    const now = Date.now();
    return {
      activeSession: {
        ...active,
        currentExerciseId: id,
        exercises: active.exercises.map(exercise => exercise.id === active.currentExerciseId
          ? { ...exercise, elapsedTime: exercise.elapsedTime + (exercise.startedAt ? (now - exercise.startedAt) / 1000 : 0), startedAt: undefined }
          : exercise.id === id
            ? { ...exercise, startedAt: now, status: exercise.status === 'not_started' ? 'in_progress' : exercise.status }
            : exercise),
      },
    };
  }),

  updateSet: (exerciseId, index, patch) => set(state => {
    const active = state.activeSession;
    if (!active) return {};
    return {
      activeSession: {
        ...active,
        exercises: active.exercises.map(exercise => {
          if (exercise.id !== exerciseId) return exercise;
          const sets = exercise.sets.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
          const completed = sets.every(item => item.completed);
          return { ...exercise, sets, status: completed ? 'completed' : 'in_progress', finishedAt: completed ? Date.now() : undefined };
        }),
      },
    };
  }),

  replaceSets: (exerciseId, sets) => set(state => ({
    activeSession: state.activeSession
      ? { ...state.activeSession, exercises: state.activeSession.exercises.map(exercise => exercise.id === exerciseId
        ? { ...exercise, sets, status: sets.every(item => item.completed) ? 'completed' : 'in_progress' }
        : exercise) }
      : null,
  })),

  finishSession: notes => {
    const active = get().activeSession;
    if (!active) return null;
    const now = Date.now();
    const finished: TrainingSession = {
      ...active,
      notes,
      status: 'completed',
      finishedAt: now,
      elapsedTime: (now - active.startedAt) / 1000,
      exercises: active.exercises.map(exercise => ({
        ...exercise,
        elapsedTime: exercise.elapsedTime + (exercise.startedAt ? (now - exercise.startedAt) / 1000 : 0),
        startedAt: undefined,
        status: exercise.sets.every(item => item.completed) ? 'completed' : 'not_completed',
      })),
    };
    set(state => ({
      activeSession: null,
      history: [finished, ...state.history],
      workouts: state.workouts.map(workout => workout.id === active.workoutId
        ? { ...workout, lastDate: new Date(now).toISOString() }
        : workout),
    }));
    return active.id;
  },

  discardSession: () => set({ activeSession: null }),
}), {
  name: 'forma-app-v1',
  version: 10,
  partialize: state => ({ ...state, draft: null, pdfDraft: null }),
  migrate: migrateExampleData,
}));
