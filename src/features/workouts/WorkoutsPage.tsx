import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Button, ConfirmDialog, EmptyState, IconButton, Sheet, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { dateLabel } from '../../utils/format';
import './workouts.css';
import WorkoutComposer from './WorkoutComposer';
import RenameWorkoutForm from './RenameWorkoutForm';

export default function WorkoutsPage() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion() !== false;
  const cycles = useAppStore(state => state.cycles);
  const workouts = useAppStore(state => state.workouts);
  const history = useAppStore(state => state.history);
  const deleteWorkout = useAppStore(state => state.deleteWorkout);
  const setCurrentCycle = useAppStore(state => state.setCurrentCycle);
  const startSession = useAppStore(state => state.startSession);
  const [menu, setMenu] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const cycle = cycles.find(item => item.current) ?? cycles[0];
  const availableWorkouts = workouts.filter(workout => workout.exerciseIds.length > 0);
  const catalogWorkouts = availableWorkouts.filter(workout => !workout.cycleId);
  const cycleWorkouts = cycle ? availableWorkouts.filter(workout => workout.cycleId === cycle.id) : [];
  const currentWorkouts = cycleWorkouts.filter(workout => !catalogWorkouts.some(item =>
    item.programId && item.programId === workout.programId && item.programCode === workout.programCode));
  const list = catalogWorkouts.length ? [...catalogWorkouts, ...currentWorkouts] : cycle ? currentWorkouts : availableWorkouts;
  const visibleIds = new Set(list.map(workout => workout.id));
  const others = availableWorkouts.filter(workout => !visibleIds.has(workout.id) && !catalogWorkouts.some(item =>
    item.programId && item.programId === workout.programId && item.programCode === workout.programCode));
  const target = workouts.find(workout => workout.id === confirm);

  function remove() {
    if (!confirm) return;
    deleteWorkout(confirm);
    setConfirm(null);
    setMenu(null);
    toast.success('Treino removido. Os registros anteriores continuam no histórico.');
  }

  function begin(id: string) {
    const activeSession = useAppStore.getState().activeSession;
    if (activeSession && activeSession.workoutId !== id) {
      toast.info(`Continue ou finalize o treino ${activeSession.workoutName} antes de iniciar outro.`);
      return;
    }
    const sessionId = startSession(id);
    if (!sessionId) {
      toast.info('Cadastre os exercícios deste treino antes de iniciar.');
      navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(id)}`);
      return;
    }
    setMenu(null);
    navigate(`/app/session/${sessionId}`);
  }

  return <div className="page workouts-page">
    <TopBar title="Fichas" eyebrow="Seus exercícios e últimas sessões"
      action={<Button variant="secondary" size="sm" onClick={() => navigate('/app/agenda')}><Plus size={16} />Minha agenda</Button>} />

    {cycles.length > 1 && <label className="workouts-cycle"><span className="eyebrow">CICLO</span>
      <select className="input workouts-cycle-select" value={cycle?.id ?? ''} onChange={event => setCurrentCycle(event.target.value)} aria-label="Selecionar ciclo">
        {cycles.map(item => <option key={item.id} value={item.id}>{item.name}{item.current ? ' · atual' : ''}</option>)}
      </select>
    </label>}

    <Button variant="secondary" className="workouts-compose-button" onClick={() => setComposerOpen(true)}><Plus size={17} />Juntar duas fichas</Button>
    {composerOpen && <WorkoutComposer onClose={() => setComposerOpen(false)} onSave={id => {
      toast.success('Treino combinado criado.');
      navigate(`/app/workouts/${id}`);
    }} />}

    {!list.length ? <EmptyState icon={<Plus />} title="Nenhuma ficha disponível" description="Esta lista mostra só treinos com exercícios detalhados. Consulte as agendas para ver a divisão semanal." action={<Link className="btn btn-primary" to="/app/agenda">Abrir minha agenda</Link>} /> : <div className="workouts-list">
      {list.map((workout, index) => {
        const last = history.find(item => item.workoutId === workout.id);
        return <motion.article key={workout.id} className="workout-card card" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reducedMotion ? 0 : index * .04, duration: reducedMotion ? 0 : .22 }}>
          <div className="workout-card-main">
            <div className="workout-card-copy"><div className="row between"><strong>{workout.name}</strong><span className="small muted">{workout.exerciseIds.length} exercícios</span></div>
              <p className="small muted">{workout.subtitle || 'Exercícios ainda não cadastrados'}</p>
              <p className="workout-card-last">{last ? `Última vez · ${dateLabel(last.startedAt, { day: '2-digit', month: '2-digit' })}` : 'Ainda não realizado'}</p>
            </div>
            <IconButton label={`Ações de ${workout.name}`} className="workout-card-menu" onClick={() => { setMenu(workout.id); setRenaming(false); }}><MoreVertical size={17} /></IconButton>
            <Link to={`/app/workouts/${workout.id}`} className="workout-card-view">Ver exercícios<ChevronRight size={15} /></Link>
          </div>
        </motion.article>;
      })}
    </div>}

    {others.length > 0 && <section className="workouts-others"><h2 className="section-title">Outros ciclos</h2><div className="workouts-others-list">
      {others.map(workout => <Link key={workout.id} to={`/app/workouts/${workout.id}`} className="workouts-other-item"><span>{workout.name} · Ver exercícios</span><ChevronRight size={15} /></Link>)}
    </div></section>}

    <Sheet open={!!menu} onOpenChange={open => { if (!open) { setMenu(null); setRenaming(false); } }} title={workouts.find(item => item.id === menu)?.name ?? 'Treino'} description="Acesse os exercícios ou edite a lista deste treino.">
      {renaming && workouts.find(item => item.id === menu) ? <RenameWorkoutForm key={menu} workout={workouts.find(item => item.id === menu)!} onClose={() => { setMenu(null); setRenaming(false); }} /> : <div className="workouts-menu">
        <Button variant="secondary" className="btn-block" onClick={() => setRenaming(true)}><Pencil size={16} />Renomear</Button>
        <Button variant="secondary" className="btn-block" onClick={() => { navigate(`/app/workouts/${menu}`); setMenu(null); }}>Ver exercícios<ChevronRight size={16} /></Button>
        <Button variant="secondary" className="btn-block" onClick={() => { navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(menu ?? '')}`); setMenu(null); }}><Pencil size={16} />{workouts.find(item => item.id === menu)?.programId ? 'Organizar exercícios' : 'Cadastrar ou editar exercícios'}</Button>
        <Button variant="secondary" className="btn-block" onClick={() => begin(menu ?? '')}>Iniciar treino</Button>
        {!workouts.find(item => item.id === menu)?.programId && <Button variant="danger" className="btn-block" onClick={() => { setConfirm(menu); setMenu(null); }}><Trash2 size={16} />Remover treino</Button>}
      </div>}
    </Sheet>

    <ConfirmDialog open={!!confirm} onOpenChange={open => !open && setConfirm(null)} title="Remover este treino?" description={`${target?.name ?? 'Este treino'} sai da agenda atual. As sessões anteriores permanecem no histórico.`}>
      <div className="stack"><Button variant="danger" onClick={remove}>Remover treino</Button><Button variant="ghost" onClick={() => setConfirm(null)}>Manter</Button></div>
    </ConfirmDialog>
  </div>;
}
