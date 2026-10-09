import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, Check, GripVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, EmptyState, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import type { Exercise } from '../../types';
import './builder.css';

export default function BuilderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const workouts = useAppStore(state => state.workouts);
  const definitions = useAppStore(state => state.exercises);
  const saveWorkout = useAppStore(state => state.saveWorkout);
  const workoutId = params.get('workoutId');
  const workout = workouts.find(item => item.id === workoutId);
  const source = useMemo(() => workout?.exerciseIds.map(id => definitions.find(item => item.id === id)).filter((item): item is Exercise => !!item) ?? [], [workout, definitions]);
  const [items, setItems] = useState<Exercise[]>(source);
  const [exerciseName, setExerciseName] = useState('');
  const [group, setGroup] = useState<Exercise['group'] | ''>('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [rest, setRest] = useState('');
  const [pendingRemove, setPendingRemove] = useState<Exercise | null>(null);
  useEffect(() => setItems(source), [source]);
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!workout) return <div className="page"><TopBar title="Editar treino" back="/app/workouts" /><EmptyState title="Escolha um treino" description="Abra um treino da sua lista para cadastrar os exercícios correspondentes." action={<Button onClick={() => navigate('/app/workouts')}>Ver treinos</Button>} /></div>;
  const currentWorkout = workout;
  const isPresetWorkout = !!currentWorkout.programId && !!currentWorkout.programCode;

  function addExercise() {
    const count = Number(sets);
    const restSeconds = Number(rest);
    if (!exerciseName.trim() || !group || !reps.trim() || !Number.isInteger(count) || count < 1 || count > 20 || !Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 3600) {
      toast.error('Preencha nome, grupo, repetições, séries e descanso com valores válidos.');
      return;
    }
    const exercise: Exercise = {
      id: `exercise-${crypto.randomUUID()}`,
      name: exerciseName.trim(),
      group,
      block: 'Treino principal',
      targets: Array.from({ length: count }, () => reps.trim()),
      previousWeights: [],
      previousReps: [],
      best: 0,
      cadence: '',
      rest: restSeconds,
      instructions: '',
      technique: '',
    };
    setItems(current => [...current, exercise]);
    setExerciseName('');
    setGroup('');
    setSets('');
    setReps('');
    setRest('');
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems(current => {
      const oldIndex = current.findIndex(item => item.id === active.id);
      const newIndex = current.findIndex(item => item.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function move(id: string, direction: -1 | 1) {
    setItems(current => {
      const index = current.findIndex(item => item.id === id);
      if (index < 0 || index + direction < 0 || index + direction >= current.length) return current;
      return arrayMove(current, index, index + direction);
    });
  }

  function save() {
    saveWorkout({ ...currentWorkout, exerciseIds: items.map(item => item.id) }, items);
    toast.success('Lista de exercícios salva.');
    navigate(`/app/workouts/${currentWorkout.id}`);
  }

  return <div className="page builder-page">
    <TopBar title={isPresetWorkout ? 'Ordem dos exercícios' : 'Exercícios'} back={`/app/workouts/${workout.id}`} eyebrow={workout.name} />
    <p className="builder-description muted small">{isPresetWorkout ? 'Arraste ou use as setas para organizar os exercícios desta ficha.' : 'Cadastre os movimentos deste treino com suas séries e repetições.'}</p>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="builder-list">
          {items.map((exercise, index) => <SortableRow key={exercise.id} exercise={exercise} index={index + 1}
            onMove={direction => move(exercise.id, direction)} onRemove={isPresetWorkout ? undefined : () => setPendingRemove(exercise)} />)}
        </div>
      </SortableContext>
    </DndContext>
    {!items.length && <div className="builder-empty-note card"><strong>A lista ainda está vazia.</strong><p className="small muted">{isPresetWorkout ? 'Esta ficha ainda não tem exercícios cadastrados.' : `Adicione abaixo cada exercício que pertence a ${workout.name}.`}</p></div>}

    {!isPresetWorkout && <section className="builder-add card">
      <h2>Novo exercício</h2>
      <label className="field" htmlFor="exercise-name">Nome<input id="exercise-name" className="input" value={exerciseName} onChange={event => setExerciseName(event.target.value)} maxLength={100} /></label>
      <div className="grid-2">
        <label className="field" htmlFor="exercise-group">Grupo muscular<select id="exercise-group" className="input" value={group} onChange={event => setGroup(event.target.value as Exercise['group'] | '')}><option value="">Selecione</option><option value="lower">Inferiores</option><option value="upper">Superiores</option></select></label>
        <label className="field" htmlFor="exercise-sets">Séries<input id="exercise-sets" className="input" type="number" min={1} max={20} step={1} value={sets} onChange={event => setSets(event.target.value)} inputMode="numeric" /></label>
        <label className="field" htmlFor="exercise-reps">Repetições por série<input id="exercise-reps" className="input" value={reps} onChange={event => setReps(event.target.value)} maxLength={30} /></label>
        <label className="field" htmlFor="exercise-rest">Descanso · segundos<input id="exercise-rest" className="input" type="number" min={0} max={3600} step={1} value={rest} onChange={event => setRest(event.target.value)} inputMode="numeric" /></label>
      </div>
      <Button variant="secondary" className="btn-block" onClick={addExercise}><Plus size={16} />Adicionar exercício</Button>
    </section>}

    <div className="sticky-actions"><Button variant="secondary" onClick={() => navigate(`/app/workouts/${workout.id}`)}>Cancelar</Button><Button variant="primary" onClick={save} disabled={!items.length}><Check size={16} />{isPresetWorkout ? 'Salvar ordem' : 'Salvar exercícios'}</Button></div>
    <ConfirmDialog open={!!pendingRemove} onOpenChange={open => { if (!open) setPendingRemove(null); }} title="Remover exercício?" description={pendingRemove ? `“${pendingRemove.name}” sairá deste treino quando você salvar as alterações.` : undefined}>
      <div className="stack"><Button variant="danger" onClick={() => { if (pendingRemove) setItems(current => current.filter(item => item.id !== pendingRemove.id)); setPendingRemove(null); }}>Remover exercício</Button><Button variant="secondary" onClick={() => setPendingRemove(null)}>Manter exercício</Button></div>
    </ConfirmDialog>
  </div>;
}

function SortableRow({ exercise, index, onMove, onRemove }: { exercise: Exercise; index: number; onMove: (direction: -1 | 1) => void; onRemove?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id });
  const targetSummary = exercise.targets.every(target => target === exercise.targets[0]) ? exercise.targets[0] : exercise.targets.join(' / ');
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`builder-row card ${isDragging ? 'is-dragging' : ''}`}>
    <button className="builder-handle" type="button" {...attributes} {...listeners} aria-label={`Reordenar ${exercise.name}`}><GripVertical size={17} /></button>
    <span className="builder-index">{String(index).padStart(2, '0')}</span>
    <div className="builder-row-copy"><strong>{exercise.name}</strong><p className="small muted">{exercise.targets.length} {exercise.targets.length === 1 ? 'série' : 'séries'} · {targetSummary}</p></div>
    <div className="builder-move"><button type="button" onClick={() => onMove(-1)} aria-label={`Mover ${exercise.name} para cima`}><ArrowUp size={15} /></button><button type="button" onClick={() => onMove(1)} aria-label={`Mover ${exercise.name} para baixo`}><ArrowDown size={15} /></button>{onRemove && <button type="button" onClick={onRemove} aria-label={`Remover ${exercise.name}`}><Trash2 size={15} /></button>}</div>
  </div>;
}
