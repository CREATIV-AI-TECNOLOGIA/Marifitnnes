import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button, SegmentedControl, Sheet } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { combinableWorkouts, orderedExerciseIds } from '../../services/combined-workout';
import type { WorkoutOrder } from '../../types';
import './workout-composer.css';

export default function WorkoutComposer({ onClose, onSave, initialId, dayLabel }: {
  onClose: () => void; onSave: (id: string) => void; initialId?: string; dayLabel?: string;
}) {
  const workouts = useAppStore(state => state.workouts);
  const definitions = useAppStore(state => state.exercises);
  const createCombined = useAppStore(state => state.createCombinedWorkout);
  const initial = workouts.find(workout => workout.id === initialId);
  const initialIds = initial?.combination?.workoutIds ?? (initial ? [initial.id] : []);
  const candidates = combinableWorkouts([
    ...workouts.filter(workout => initialIds.includes(workout.id)), ...workouts,
  ], definitions);
  const [selected, setSelected] = useState<string[]>(initialIds.filter(id => candidates.some(workout => workout.id === id)));
  const [savedCombinationId, setSavedCombinationId] = useState('');
  const [order, setOrder] = useState<WorkoutOrder>(initial?.combination?.order ?? 'alternating');
  const [exerciseSelection, setExerciseSelection] = useState<Record<string, string[]>>(initial?.combination?.selectedExerciseIds ?? {});
  const sourceParts = selected.map(id => candidates.find(workout => workout.id === id)!);
  const parts = sourceParts.map(workout => ({ ...workout, exerciseIds: workout.exerciseIds.filter(id => (exerciseSelection[workout.id] ?? workout.exerciseIds).includes(id)) }));
  const preview = orderedExerciseIds(parts, order);
  const valid = parts.every(workout => workout.exerciseIds.length > 0);

  function toggle(id: string) {
    setSavedCombinationId('');
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 2 ? [...current, id] : current);
  }

  function save() {
    if (savedCombinationId) { onSave(savedCombinationId); onClose(); return; }
    if (!selected.length || !valid || (!dayLabel && selected.length !== 2)) return;
    const id = selected.length === 1 ? selected[0] : createCombined(selected, order,
      Object.fromEntries(parts.map(workout => [workout.id, workout.exerciseIds])));
    if (!id) { toast.error('Confira se as duas fichas têm todos os exercícios disponíveis.'); return; }
    onSave(id);
    onClose();
  }

  return <Sheet open onOpenChange={open => !open && onClose()} title={dayLabel ? 'Treino deste dia' : 'Juntar dois treinos'}
    description={dayLabel ? `${dayLabel}. Escolha uma ou duas fichas para uma única sessão.` : 'Combine duas fichas dos seus PDFs em uma única sessão.'}>
    <div className="workout-composer">
      <p className="small muted">{selected.length}/2 selecionados · A ordem da seleção define qual ficha começa.</p>
      {dayLabel && workouts.some(workout => workout.combination && workout.exerciseIds.length) && <label className="composer-saved">
        <span>Usar uma combinação já salva</span>
        <select className="input" value={savedCombinationId} onChange={event => setSavedCombinationId(event.target.value)}>
          <option value="">Escolher combinação</option>
          {workouts.filter(workout => workout.combination && workout.exerciseIds.length).map(workout => <option key={workout.id} value={workout.id}>{workout.name} · {workout.combination?.order === 'alternating' ? 'Alternados' : 'Em sequência'}</option>)}
        </select>
      </label>}
      {savedCombinationId && <p className="small muted">{workouts.find(workout => workout.id === savedCombinationId)?.exerciseIds.length} exercícios. A combinação será aplicada ao salvar neste dia.</p>}
      <div className="composer-options" aria-label="Selecionar fichas">
        {candidates.map(workout => <button key={workout.id} type="button" aria-pressed={selected.includes(workout.id)}
          disabled={selected.length === 2 && !selected.includes(workout.id)} onClick={() => toggle(workout.id)}>
          <span className="composer-check">{selected.includes(workout.id) ? <Check size={17} /> : <Plus size={17} />}</span>
          <span><strong>{workout.name}</strong><small>{workout.subtitle} · {workout.exerciseIds.length} exercícios</small></span>
          {selected.includes(workout.id) && <span className="composer-position">{selected.indexOf(workout.id) + 1}º</span>}
        </button>)}
        {!candidates.length && <p className="muted small">Importe as fichas dos PDFs para escolher seus treinos.</p>}
      </div>
      {selected.length === 2 && <section className="composer-exercise-selection" aria-label="Escolher exercícios de cada ficha">
        <div><h3>Monte do seu jeito</h3><p className="small muted">Use as fichas completas ou marque apenas os exercícios que deseja fazer.</p></div>
        {sourceParts.map((workout, partIndex) => <details key={workout.id} open>
          <summary>{workout.name}<span>{parts[partIndex].exerciseIds.length}/{workout.exerciseIds.length} exercícios</span></summary>
          <div className="composer-exercise-actions">
            <button type="button" onClick={() => setExerciseSelection(current => ({ ...current, [workout.id]: [...workout.exerciseIds] }))}>Selecionar todos</button>
            <button type="button" onClick={() => setExerciseSelection(current => ({ ...current, [workout.id]: [] }))}>Limpar seleção</button>
          </div>
          <div className="composer-exercise-list">{workout.exerciseIds.map(id => {
            const exercise = definitions.find(item => item.id === id)!;
            const checked = parts[partIndex].exerciseIds.includes(id);
            return <label key={id}><input type="checkbox" checked={checked} onChange={() => setExerciseSelection(current => {
              const ids = current[workout.id] ?? workout.exerciseIds;
              return { ...current, [workout.id]: checked ? ids.filter(item => item !== id) : [...ids, id] };
            })} /><span><strong>{exercise.name}</strong><small>{exercise.block} · {exercise.targets.length} séries</small></span></label>;
          })}</div>
        </details>)}
        {!valid && <p className="small" role="status">Selecione pelo menos um exercício de cada ficha.</p>}
      </section>}
      {selected.length === 2 && <div className="composer-order">
        <h3>Como deseja treinar?</h3>
        <SegmentedControl value={order} onChange={value => setOrder(value as WorkoutOrder)} label="Ordem dos exercícios"
          options={[{ value: 'alternating', label: 'Alternar fichas' }, { value: 'sequential', label: 'Uma após a outra' }]} />
        <p className="small muted">{order === 'alternating'
          ? `Um exercício de ${parts[0].name}, um de ${parts[1].name}. Ao terminar uma ficha, continue a outra.`
          : `Complete ${parts[0].name} e depois ${parts[1].name}.`} As séries e orientações de cada exercício são mantidas.</p>
      </div>}
      {preview.length > 0 && <details className="composer-preview"><summary>Conferir sequência · {preview.length} exercícios</summary>
        <ol>{preview.map((id, index) => <li key={`${id}-${index}`}><span>{definitions.find(exercise => exercise.id === id)?.name}</span><small>{parts.find(workout => workout.exerciseIds.includes(id))?.name}</small></li>)}</ol>
      </details>}
      <Button className="btn-block" disabled={!savedCombinationId && (!valid || (dayLabel ? !selected.length : selected.length !== 2))} onClick={save}>
        {dayLabel ? 'Salvar neste dia' : 'Criar treino combinado'}
      </Button>
    </div>
  </Sheet>;
}
