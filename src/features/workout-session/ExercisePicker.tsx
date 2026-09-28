import { ChevronDown } from 'lucide-react';
import type { SessionExercise } from '../../types';
import { exerciseStatus, isExerciseComplete } from './session-utils';

interface ExercisePickerProps {
  exercises: SessionExercise[];
  currentId?: string;
  onSelect: (id: string) => void;
}

export default function ExercisePicker({ exercises, currentId, onSelect }: ExercisePickerProps) {
  const currentIndex = exercises.findIndex(exercise => exercise.id === currentId);
  const remaining = exercises.filter(exercise => exercise.id !== currentId);

  return <label className="session-exercise-picker">
    <span>Exercício {Math.max(1, currentIndex + 1)} de {exercises.length}</span>
    {remaining.length > 0 ? <span className="session-exercise-picker-control">
      <select aria-label="Ir para outro exercício" value="" onChange={event => event.target.value && onSelect(event.target.value)}>
        <option value="" disabled>Ir para outro exercício</option>
        {remaining.map(exercise => {
          const complete = isExerciseComplete(exercise);
          const status = exerciseStatus(exercise);
          return <option key={exercise.id} value={exercise.id}>{exercise.name} · {complete ? 'Concluído' : status}</option>;
        })}
      </select>
      <ChevronDown size={17} aria-hidden="true" />
    </span> : <span className="session-exercise-picker-single">Único exercício deste treino</span>}
  </label>;
}
