import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Dumbbell, Pencil, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { dateLabel } from '../../utils/format';
import './workouts.css';

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workout = useAppStore(state => state.workouts.find(item => item.id === id));
  const exercises = useAppStore(state => state.exercises);
  const history = useAppStore(state => state.history);
  const startSession = useAppStore(state => state.startSession);
  if (!workout) return <div className="page"><TopBar title="Treino" back="/app/workouts" /><EmptyState icon={<Dumbbell />} title="Treino não encontrado" description="Ele pode ter sido removido. Volte para a lista e escolha outro." action={<Link className="btn btn-primary" to="/app/workouts">Ver treinos</Link>} /></div>;
  const currentWorkout = workout;
  const items = currentWorkout.exerciseIds.map(exerciseId => exercises.find(exercise => exercise.id === exerciseId)).filter((exercise): exercise is NonNullable<typeof exercise> => !!exercise);
  const agendaEntry = !!(currentWorkout.programId && currentWorkout.programCode);
  const last = history.find(session => session.workoutId === currentWorkout.id);

  function start() {
    const sessionId = startSession(currentWorkout.id);
    if (!sessionId) {
      toast.info('Este treino ainda não tem exercícios cadastrados.');
      navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(currentWorkout.id)}`);
      return;
    }
    navigate(`/app/session/${sessionId}`);
  }

  return <div className="page workout-detail">
    <TopBar title={currentWorkout.name} back="/app/workouts" eyebrow={currentWorkout.subtitle || 'Seu treino'}
      action={items.length || !agendaEntry ? <Button variant="secondary" size="sm" onClick={() => navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(currentWorkout.id)}`)}><Pencil size={15} />Editar</Button> : undefined} />
    <section className="workout-detail-summary card">
      <div><strong>{items.length}</strong><span>exercícios</span></div>
      <div><strong>{last ? dateLabel(last.startedAt, { day: '2-digit', month: 'short' }) : '—'}</strong><span>último treino</span></div>
    </section>

    {currentWorkout.preparation && <section className="workout-detail-note card">
      <h2>Antes de começar</h2><p>{currentWorkout.preparation}</p>
    </section>}
    {currentWorkout.notes && <aside className="workout-detail-note workout-detail-source-note card">
      <h2>Observação da ficha</h2><p>{currentWorkout.notes}</p>
    </aside>}

    {(items.length > 0 || !agendaEntry) && <div className="row between workout-detail-heading"><h2 className="section-title">Exercícios</h2><Link className="text-link small" to={`/app/workouts/builder?workoutId=${encodeURIComponent(workout.id)}`}>Editar lista<Pencil size={13} /></Link></div>}
      {!items.length ? <EmptyState icon={<Dumbbell />} title={agendaEntry ? 'Ficha não disponível' : 'Exercícios ainda não cadastrados'} description={agendaEntry
        ? `A agenda inclui o código ${currentWorkout.programCode}, mas não descreve os movimentos. O único PDF detalhado recebido é o A1; por isso, ${currentWorkout.programCode} não aparece na lista de treinos disponíveis.`
        : 'Este treino ainda não tem exercícios cadastrados.'} action={agendaEntry
          ? <Link className="btn btn-primary" to="/app/workouts">Ver treinos disponíveis</Link>
          : <Button variant="primary" onClick={() => navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(currentWorkout.id)}`)}><Pencil size={16} />Cadastrar exercícios</Button>} /> : <ol className="workout-detail-list">
      {items.map((exercise, index) => <li key={exercise.id}>
        <span className="workout-detail-index">{String(index + 1).padStart(2, '0')}</span>
        <div><strong>{exercise.name}</strong><p className="small muted">{exercise.block} · {exercise.targets.length} séries · {exercise.targets.join(' / ')}</p></div>
        <span className="badge">{exercise.group === 'lower' ? 'Inf.' : 'Sup.'}</span>
      </li>)}
    </ol>}

    {(items.length > 0 || !agendaEntry) && <div className="sticky-actions workout-detail-actions">
      <Button variant="secondary" onClick={() => navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(currentWorkout.id)}`)}><Pencil size={16} />{items.length ? 'Editar treino' : 'Cadastrar exercícios'}</Button>
      {items.length > 0 && <Button variant="primary" onClick={start}><Play size={16} fill="currentColor" />Iniciar treino<ArrowRight size={16} /></Button>}
    </div>}
  </div>;
}
