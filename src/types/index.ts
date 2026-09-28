export type ExerciseStatus = 'not_started' | 'in_progress' | 'completed' | 'not_completed';
export type SessionStatus = 'not_started' | 'in_progress' | 'completed';
export interface Exercise {
  id: string; name: string; group: 'lower' | 'upper'; block: 'Mobilidade' | 'Ativação' | 'Treino principal';
  targets: string[]; previousWeights: number[]; previousReps: number[]; best: number;
  cadence: string; rest: number; restBySet?: number[]; instructions: string; technique: string; videoId?: string;
}
export interface Workout { id: string; name: string; subtitle: string; cycleId: string; exerciseIds: string[]; lastDate?: string; programId?: string; programCode?: string; preparation?: string; notes?: string; }
export interface Cycle { id: string; name: string; weeks: number; frequency: number; start: string; end: string; current: boolean; programId?: string; }
export interface AgendaWeek { week: number; days: string[]; }
export interface ProgramFrequency { frequency: number; weeks: AgendaWeek[]; note?: string; }
export interface TrainingProgram {
  id: string; name: string; focus: string; description: string; sourceFile: string;
  cycleWeeks: number; frequencies: ProgramFrequency[]; workoutCodes: string[]; workoutLabels: Record<string, string>;
  workoutPreparation?: Record<string, string>; workoutNotes?: Record<string, string>;
  exerciseTemplates?: Record<string, Exercise[]>;
}
export type ImportDraft = Omit<TrainingProgram, 'id' | 'cycleWeeks'> & { cycleWeeks: number | null };
export interface ActiveAgenda { programId: string; frequency: number; startedAt: string; cycleId: string; }
export interface SessionSet { setNumber: number; targetReps: string; performedReps: number; weight: number; completed: boolean; }
export interface SessionExercise { id: string; name: string; status: ExerciseStatus; startedAt?: number; finishedAt?: number; elapsedTime: number; sets: SessionSet[]; }
export interface TrainingSession { id: string; workoutId: string; workoutName: string; cycleId: string; startedAt: number; finishedAt?: number; elapsedTime: number; currentExerciseId: string; exercises: SessionExercise[]; notes: string; status: SessionStatus; }
export interface Preferences { showPrevious: boolean; trackDuration: boolean; autoRest: boolean; showVideos: boolean; unit: 'kg' | 'lb'; theme: 'system' | 'light' | 'dark'; }
export interface User { name: string; email: string; }
