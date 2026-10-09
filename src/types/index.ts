export type ExerciseStatus = 'not_started' | 'in_progress' | 'completed' | 'not_completed';
export type SessionStatus = 'not_started' | 'in_progress' | 'completed';
export interface Exercise {
  id: string; name: string; group: 'lower' | 'upper'; block: 'Mobilidade' | 'Ativação' | 'Treino principal';
  targets: string[]; previousWeights: number[]; previousReps: number[]; best: number;
  cadence: string; rest: number; restBySet?: number[]; instructions: string; technique: string; videoId?: string; videoUrl?: string;
  setCountRange?: { min: number; max: number };
  restLabel?: string;
  restLabelsBySet?: string[];
  sourcePage?: number;
  sourceEvidence?: string;
  measurementLabel?: string;
  secondaryMovement?: { name: string; targets: string[]; videoUrl?: string };
}
export type WorkoutOrder = 'sequential' | 'alternating';
export interface Workout { id: string; name: string; subtitle: string; cycleId?: string; exerciseIds: string[]; lastDate?: string; programId?: string; programCode?: string; preparation?: string; notes?: string; sourceId?: string; combination?: { workoutIds: string[]; order: WorkoutOrder; selectedExerciseIds?: Record<string, string[]> }; }
export interface Cycle { id: string; name: string; weeks: number; frequency: number; start: string; end: string; current: boolean; programId?: string; }
export interface AgendaWeek { week: number; days: string[]; }
export interface ProgramFrequency { frequency: number; weeks: AgendaWeek[]; note?: string; }
export interface TrainingProgram {
  id: string; name: string; focus: string; description: string; sourceFile: string;
  cycleWeeks: number; frequencies: ProgramFrequency[]; workoutCodes: string[]; workoutLabels: Record<string, string>;
  workoutPreparation?: Record<string, string>; workoutNotes?: Record<string, string>;
  exerciseTemplates?: Record<string, Exercise[]>;
  sourceId?: string;
}
export interface SourcePage { number: number; text: string; links: string[]; }
export interface PdfSource {
  id: string; name: string; sha256: string; kind: 'agenda' | 'workout';
  pageCount: number; pages: SourcePage[];
}
export interface PdfImportDraft {
  cloudImportId?: string;
  source: PdfSource;
  warnings: string[];
  agenda?: TrainingProgram;
  workout?: Workout;
  exercises: Exercise[];
}
export type ImportDraft = Omit<TrainingProgram, 'id' | 'cycleWeeks'> & { cycleWeeks: number | null };
export interface ActiveAgenda { programId: string; frequency: number; startedAt: string; cycleId: string; }
export interface SessionSet { setNumber: number; targetReps: string; performedReps: number; weight: number; completed: boolean; secondaryTargetReps?: string; secondaryPerformedReps?: number; }
export interface SessionExercise { id: string; name: string; status: ExerciseStatus; startedAt?: number; finishedAt?: number; elapsedTime: number; measurementLabel?: string; sets: SessionSet[]; }
export interface TrainingSession { id: string; workoutId: string; workoutName: string; cycleId?: string; startedAt: number; finishedAt?: number; elapsedTime: number; currentExerciseId: string; exercises: SessionExercise[]; notes: string; status: SessionStatus; }
export interface Preferences { showPrevious: boolean; trackDuration: boolean; autoRest: boolean; showVideos: boolean; unit: 'kg' | 'lb'; theme: 'system' | 'light' | 'dark'; }
export interface User { name: string; email: string; }

export interface AgendaSlot { kind: 'rest' | 'choice' | 'reference' | 'workout'; code: string; label: string; workoutId?: string; }
export interface PersonalAgenda { id: string; objectiveId: string; title: string; startsOn: string; mode: 'suggestion' | 'custom'; frequency: number; sourceFile?: string; notes: string[]; weeks: { week: number; days: AgendaSlot[][] }[]; legacyCycleId?: string; }
