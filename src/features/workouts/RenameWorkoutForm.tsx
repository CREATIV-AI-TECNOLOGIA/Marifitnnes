import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import type { Workout } from '../../types';

export default function RenameWorkoutForm({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const [name, setName] = useState(workout.name);
  const renameWorkout = useAppStore(state => state.renameWorkout);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Digite um nome para o treino.');
      return;
    }
    renameWorkout(workout.id, trimmed);
    toast.success('Nome do treino salvo.');
    onClose();
  }

  return <form className="workout-rename-form" onSubmit={save}>
    <label className="field" htmlFor={`workout-name-${workout.id}`}>Nome do treino
      <input id={`workout-name-${workout.id}`} className="input" value={name} onChange={event => setName(event.target.value)} maxLength={80} />
    </label>
    {workout.programCode && <p className="small muted">Ficha original: {workout.programCode}. A lista de exercícios continua igual.</p>}
    <div className="workout-rename-actions">
      {workout.programCode && workout.name !== workout.programCode && <Button type="button" variant="ghost" onClick={() => setName(workout.programCode!)}>Usar {workout.programCode}</Button>}
      <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
      <Button type="submit" variant="primary">Salvar nome</Button>
    </div>
  </form>;
}
