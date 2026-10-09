import { useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, Dumbbell, Pencil, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, TopBar } from '../../components/ui';
import { a1Guidance } from '../../data/a1-guidance';
import { useAppStore } from '../../stores/use-app-store';
import { isSessionWorkout } from '../../services/session-workout';

import './workouts.css';
import RenameWorkoutForm from './RenameWorkoutForm';
import PdfSourceDetails, { PdfMobilityGuide } from '../imports/PdfSourceDetails';

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workout = useAppStore(state => state.workouts.find(item => item.id === id));
  const exercises = useAppStore(state => state.exercises);
  const sources = useAppStore(state => state.sources);
  const workouts = useAppStore(state => state.workouts);
  const session = useAppStore(state => state.activeSession);
  const startSession = useAppStore(state => state.startSession);
  const [activePanel, setActivePanel] = useState<'guidance' | 'plan' | null>(null);
  const [displayedPanel, setDisplayedPanel] = useState<'guidance' | 'plan'>('guidance');
  const [renaming, setRenaming] = useState(false);
  const panelId = useId();
  if (!workout) return <div className="page"><TopBar title="Treino" back="/app/workouts" /><EmptyState icon={<Dumbbell />} title="Treino não encontrado" description="Ele pode ter sido removido. Volte para a lista e escolha outro." action={<Link className="btn btn-primary" to="/app/workouts">Ver treinos</Link>} /></div>;
  const currentWorkout = workout;
  const continuing = isSessionWorkout(session, currentWorkout, workouts);
  const items = currentWorkout.exerciseIds.map(exerciseId => exercises.find(exercise => exercise.id === exerciseId)).filter((exercise): exercise is NonNullable<typeof exercise> => !!exercise);
  const programWorkout = !!(currentWorkout.programId && currentWorkout.programCode);
  const agendaEntry = !!(currentWorkout.cycleId && programWorkout);
  const source = sources.find(item => item.id === currentWorkout.sourceId);
  const verifiedA1 = currentWorkout.sourceId === 'she-pro-a1';
  const cadenceItems = items.filter(exercise => exercise.cadence.trim());
  const hasGuidance = cadenceItems.length > 0 || verifiedA1 || (!agendaEntry && !!(currentWorkout.preparation || currentWorkout.notes));
  const panelOpen = activePanel !== null;
  function togglePanel(panel: 'guidance' | 'plan') {
    setDisplayedPanel(panel);
    setActivePanel(current => current === panel ? null : panel);
  }
  function start() {
    const activeSession = useAppStore.getState().activeSession;
    if (activeSession && !isSessionWorkout(activeSession, currentWorkout, useAppStore.getState().workouts)) {
      toast.info(`Continue ou finalize o treino ${activeSession.workoutName} antes de iniciar outro.`);
      return;
    }
    const sessionId = startSession(currentWorkout.id);
    if (!sessionId) {
      toast.info('Este treino ainda não tem exercícios cadastrados.');
      navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(currentWorkout.id)}`);
      return;
    }
    navigate(`/app/session/${sessionId}`);
  }

  return <div className="page workout-detail">
    <TopBar title={<span className="workout-detail-title"><span className="workout-detail-title-count" aria-hidden="true">{items.length}</span><span className="sr-only">{items.length} {items.length === 1 ? 'exercício' : 'exercícios'}</span><span>{currentWorkout.name}</span></span>} back="/app/workouts" eyebrow={currentWorkout.subtitle || 'Seu treino'}
      action={<Button variant="secondary" size="sm" onClick={() => setRenaming(value => !value)}><Pencil size={15} />Renomear</Button>} />
    {renaming && <RenameWorkoutForm key={currentWorkout.id} workout={currentWorkout} onClose={() => setRenaming(false)} />}

    {(hasGuidance || items.length > 0) && <section className="workout-detail-switcher">
      <div className="workout-detail-switcher-options" role="group" aria-label="Conteúdo da ficha">
        {hasGuidance && <button type="button" className={`workout-detail-switcher-option ${activePanel === 'guidance' ? 'is-active' : ''}`} aria-expanded={activePanel === 'guidance'} aria-controls={panelId} onClick={() => togglePanel('guidance')}>
          <span>Orientações do treino</span><ChevronDown size={16} aria-hidden="true" />
        </button>}
        {items.length > 0 && <button type="button" className={`workout-detail-switcher-option ${activePanel === 'plan' ? 'is-active' : ''}`} aria-expanded={activePanel === 'plan'} aria-controls={panelId} onClick={() => togglePanel('plan')}>
          <span>Treino principal<small>{items.length} exercícios</small></span><ChevronDown size={16} aria-hidden="true" />
        </button>}
      </div>
      <div id={panelId} className={`workout-detail-switcher-panel card ${panelOpen ? 'is-open' : ''}`} role="region" aria-label={displayedPanel === 'guidance' ? 'Orientações do treino' : 'Treino principal'} aria-hidden={!panelOpen} inert={!panelOpen}>
        <div className="workout-detail-switcher-inner">
          {displayedPanel === 'guidance' && <div className="workout-detail-guidance-inner">
            {verifiedA1 && a1Guidance.map(item => <div key={item.title}><h2>{item.title}</h2><p>{item.text}</p></div>)}
            {!verifiedA1 && currentWorkout.preparation && <div><h2>Antes de começar</h2><p>{currentWorkout.preparation}</p></div>}
            {!verifiedA1 && currentWorkout.notes && <div><h2>Orientações gerais</h2><p>{currentWorkout.notes}</p></div>}
            <PdfMobilityGuide source={source} />
            <PdfSourceDetails source={source} />
            {cadenceItems.map(exercise => <div key={exercise.id}><h2>{exercise.name} · cadência</h2><p>{exercise.cadence}</p></div>)}
          </div>}
          {displayedPanel === 'plan' && <div className="workout-detail-plan-inner">
            <p className="workout-detail-plan-note">Exercícios, séries, repetições e descanso. Anote as cargas durante o treino.</p>
            {items.map((exercise, index) => <article key={exercise.id} className="workout-detail-plan-exercise">
              <header><span className="workout-detail-plan-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{exercise.name}</strong><small>{exercise.block}</small></div><span className="badge">{exercise.setCountRange ? `${exercise.setCountRange.min}–${exercise.setCountRange.max} séries` : `${exercise.targets.length} séries`}</span></header>
              <ol>{exercise.targets.map((target, setIndex) => {
                const rest = exercise.restBySet?.[setIndex] ?? exercise.rest;
                const secondaryTarget = exercise.secondaryMovement?.targets[setIndex];
                return <li key={`${exercise.id}-${setIndex}`}>
                  <span>Série {String(setIndex + 1).padStart(2, '0')}</span>
                  <span className="workout-detail-plan-rest">{exercise.restLabelsBySet?.[setIndex] ? `${exercise.restLabelsBySet[setIndex]} descanso` : exercise.restLabel ? `${exercise.restLabel} descanso` : rest > 0 ? `${rest} s descanso` : 'Descanso não informado'}</span>
                  <strong>{target}</strong>
                  {secondaryTarget && <small className="workout-detail-plan-secondary">{exercise.secondaryMovement?.name}: {secondaryTarget}</small>}
                </li>;
              })}</ol>
            </article>)}
            <Link className="text-link small workout-detail-plan-edit" to={`/app/workouts/builder?workoutId=${encodeURIComponent(currentWorkout.id)}`}>{programWorkout ? 'Organizar lista' : 'Editar lista'}<Pencil size={13} /></Link>
            <button type="button" className="workout-detail-plan-collapse" onClick={() => setActivePanel(null)}>Recolher treino principal<ChevronDown size={16} aria-hidden="true" /></button>
          </div>}
        </div>
      </div>
    </section>}


    {!items.length && <EmptyState icon={<Dumbbell />} title={programWorkout ? 'Ficha não disponível' : 'Exercícios ainda não cadastrados'} description={programWorkout
        ? `A ficha de exercícios do treino ${currentWorkout.programCode} ainda não foi cadastrada.`
        : 'Este treino ainda não tem exercícios cadastrados.'} action={agendaEntry
          ? <Link className="btn btn-primary" to="/app/workouts">Ver treinos disponíveis</Link>
          : programWorkout ? <Link className="btn btn-primary" to="/app/workouts">Ver treinos disponíveis</Link>
          : <Button variant="primary" onClick={() => navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(currentWorkout.id)}`)}><Pencil size={16} />Cadastrar exercícios</Button>} />}

    {(items.length > 0 || !programWorkout) && <div className="sticky-actions workout-detail-actions">
      {items.length > 0 && <Button variant="secondary" onClick={() => navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(currentWorkout.id)}`)}><Pencil size={16} />{programWorkout ? 'Organizar treino' : 'Editar treino'}</Button>}
      {!items.length && !programWorkout && <Button variant="secondary" onClick={() => navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(currentWorkout.id)}`)}><Pencil size={16} />Cadastrar exercícios</Button>}
      {items.length > 0 && <Button variant="primary" onClick={start}><Play size={16} fill="currentColor" />{continuing ? 'Continuar treino' : 'Iniciar treino'}<ArrowRight size={16} /></Button>}
    </div>}
  </div>;
}
