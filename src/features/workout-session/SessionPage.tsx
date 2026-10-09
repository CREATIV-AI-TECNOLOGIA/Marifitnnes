import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Dumbbell, History, List, Timer } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useReducedMotion } from 'framer-motion';
import { Badge, Button, EmptyState, Sheet, StickyActionBar } from '../../components/ui';
import { a1Guidance } from '../../data/a1-guidance';
import { useAppStore } from '../../stores/use-app-store';
import type { SessionSet, TrainingSession } from '../../types';
import { dateLabel, duration, haptic } from '../../utils/format';
import ExerciseGuide from './ExerciseGuide';
import ExercisePicker from './ExercisePicker';
import SetRow from './SetRow';
import RestTimer, { SessionClock } from './SessionTimers';

import { exerciseStatus, getPreviousSets, isExerciseComplete, summarizeSession, suggestedRestSeconds } from './session-utils';
import { useRestTimer } from './use-rest-timer';
import './workout-session.css';
import { PdfMobilityGuide } from '../imports/PdfSourceDetails';

export default function SessionPage() {
  const { id, exerciseId } = useParams<{ id: string; exerciseId: string }>();
  const session = useAppStore(state => state.activeSession);
  const saved = useAppStore(state => state.history.find(item => item.id === id));
  if (saved) return <Navigate to={`/app/session/${encodeURIComponent(saved.id)}/finish`} replace />;
  if (!session || session.id !== id) return <div className="page workout-session"><EmptyState icon={<Dumbbell size={32} />} title="Sessão não encontrada" description={session ? 'Há outro treino em andamento. Ele continua salvo e pronto para você voltar.' : 'Este treino não está em andamento. Escolha um treino no início para começar.'} action={<div className="stack">{session && <Link className="text-link" to={`/app/session/${encodeURIComponent(session.id)}`}>Retomar treino em andamento</Link>}<Link className="text-link" to="/app">Ir para o início</Link></div>} /></div>;
  return <ActiveSession key={session.id} session={session} requestedExerciseId={exerciseId} />;
}

function ActiveSession({ session, requestedExerciseId }: { session: TrainingSession; requestedExerciseId?: string }) {
  const navigate = useNavigate();
  const definitions = useAppStore(state => state.exercises);
  const workout = useAppStore(state => state.workouts.find(item => item.id === session.workoutId));
  const sources = useAppStore(state => state.sources);
  const source = sources.find(item => item.id === workout?.sourceId);
  const verifiedA1 = workout?.sourceId === 'she-pro-a1';
  const workoutPreparation = verifiedA1 ? undefined : workout?.preparation;
  const workoutNotes = verifiedA1 ? undefined : workout?.notes;
  const history = useAppStore(state => state.history);
  const preferences = useAppStore(state => state.preferences);
  const selectExercise = useAppStore(state => state.selectExercise);
  const updateSet = useAppStore(state => state.updateSet);
  const replaceSets = useAppStore(state => state.replaceSets);
  const setPreferences = useAppStore(state => state.setPreferences);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [compactSessionHeader, setCompactSessionHeader] = useState(false);
  const sessionHeaderRef = useRef<HTMLElement | null>(null);
  const exerciseHeadingRef = useRef<HTMLElement | null>(null);
  const seriesToolbarRef = useRef<HTMLDivElement | null>(null);
  const pendingSeriesScroll = useRef(false);
  const reducedMotion = useReducedMotion();
  const guidanceId = useId();
  const rest = useRestTimer(session.id);
  const basePath = `/app/session/${encodeURIComponent(session.id)}`;
  const requested = session.exercises.find(exercise => exercise.id === requestedExerciseId);
  const exercise = requested ?? session.exercises.find(exercise => exercise.id === session.currentExerciseId) ?? session.exercises[0];
  const definition = definitions.find(item => item.id === exercise?.id);
  const previous = exercise ? getPreviousSets(exercise, definition, history, session.startedAt) : [];
  const summary = summarizeSession(session);
  const canAdjustSetCount = !!exercise && exercise.sets.every(set => !set.completed && set.performedReps === 0 && (set.secondaryPerformedReps ?? 0) === 0 && set.weight === 0);
  const previousWorkouts = history.filter(item => item.workoutId === session.workoutId && item.status === 'completed').slice(0, 8);
  const suggestedRestFor = (setIndex = 0) => suggestedRestSeconds(definition, setIndex);

  function scrollToSeries() {
    const toolbar = seriesToolbarRef.current;
    if (toolbar) window.scrollTo({ top: window.scrollY + toolbar.getBoundingClientRect().top - 75, behavior: 'auto' });
  }

  function showSeries() {
    if (compactSessionHeader) scrollToSeries();
    else {
      pendingSeriesScroll.current = true;
      setCompactSessionHeader(true);
    }
  }

  useLayoutEffect(() => {
    if (!compactSessionHeader || !pendingSeriesScroll.current) return;
    pendingSeriesScroll.current = false;
    scrollToSeries();
  }, [compactSessionHeader]);

  function changeSetCount(count: number) {
    if (!exercise || !definition?.setCountRange || !canAdjustSetCount) return;
    const sets = definition.targets.slice(0, count).map((targetReps, index) => ({
      setNumber: index + 1,
      targetReps,
      performedReps: previous[index]?.performedReps ?? definition.previousReps[index] ?? 0,
      secondaryTargetReps: definition.secondaryMovement?.targets[index],
      secondaryPerformedReps: 0,
      weight: previous[index]?.weight ?? definition.previousWeights[index] ?? 0,
      completed: false,
    }));
    replaceSets(exercise.id, sets);
  }

  useLayoutEffect(() => {
    const header = sessionHeaderRef.current;
    if (!header) return;

    const measureExpandedHeader = () => {
      if (!header.classList.contains('is-compact')) {
        header.style.setProperty('--session-header-expanded-height', `${header.getBoundingClientRect().height}px`);
      }
    };
    const syncHeader = () => {
      const shouldCompact = window.scrollY > 64;
      if (!shouldCompact) measureExpandedHeader();
      setCompactSessionHeader(shouldCompact);
    };

    measureExpandedHeader();
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
    window.addEventListener('resize', measureExpandedHeader);
    return () => {
      window.removeEventListener('scroll', syncHeader);
      window.removeEventListener('resize', measureExpandedHeader);
    };
  }, []);

  useEffect(() => {
    if (requestedExerciseId && !requested) {
      toast.info('Exercício não encontrado neste treino.');
      navigate(basePath, { replace: true });
    }
  }, [requestedExerciseId, requested, navigate, basePath]);

  useEffect(() => {
    if (exercise && session.currentExerciseId !== exercise.id) selectExercise(exercise.id);
  }, [exercise?.id, session.currentExerciseId, selectExercise]);

  useLayoutEffect(() => {
    const header = sessionHeaderRef.current;
    const heading = exerciseHeadingRef.current;
    if (!header || !heading) return;

    const overlap = header.getBoundingClientRect().bottom + 12 - heading.getBoundingClientRect().top;
    if (overlap > 0) window.scrollBy({ top: -overlap, behavior: 'auto' });
  }, [exercise?.id]);


  function chooseExercise(exerciseId: string) {
    selectExercise(exerciseId);
    navigate(`${basePath}/exercise/${encodeURIComponent(exerciseId)}`);
  }

  function changeSet(index: number, patch: Partial<SessionSet>) {
    if (!exercise || useAppStore.getState().activeSession?.id !== session.id) return;
    if ((patch.performedReps === 0 || patch.secondaryPerformedReps === 0) && exercise.sets[index]?.completed) patch = { ...patch, completed: false };
    updateSet(exercise.id, index, patch);
  }

  function toggleSet(index: number) {
    const set = exercise?.sets[index];
    if (!set) return;
    if (!set.completed && (set.performedReps < 1 || (set.secondaryTargetReps && (set.secondaryPerformedReps ?? 0) < 1))) {
      toast.error(set.secondaryTargetReps
        ? 'Informe as repetições dos dois movimentos antes de concluir a série.'
        : definition?.measurementLabel
          ? 'Informe a duração antes de concluir a série.'
          : 'Informe pelo menos uma repetição antes de concluir a série.');
      return;
    }
    changeSet(index, { completed: !set.completed });
    haptic();
    if (!set.completed && preferences.autoRest && suggestedRestFor(index) > 0) rest.start(suggestedRestFor(index));
  }


  return (
    <div className={`workout-session ${rest.active ? 'has-rest' : ''}`}>
      <header ref={sessionHeaderRef} className={`session-header ${compactSessionHeader ? 'is-compact' : ''}`}>
        <div className="session-header-inner">
          <Link to="/app" className="session-exit" aria-label="Voltar ao início"><ArrowLeft size={18} /> Início</Link>
          <div className="row between session-header-title"><h1>{session.workoutName}</h1>{preferences.trackDuration && <SessionClock startedAt={session.startedAt} label="Tempo total do treino" />}</div>
          <div className="row between small"><span><strong>{summary.completedExercises}</strong> de {summary.totalExercises} exercícios</span><span className="muted">{summary.completedSets}/{summary.totalSets} séries</span></div>
          <progress className="session-progress" max={summary.totalSets || 1} value={summary.completedSets} aria-label={`${summary.completedSets} de ${summary.totalSets} séries concluídas`} />
        </div>
      </header>

      <div className="session-content">
        <ExercisePicker exercises={session.exercises} currentId={exercise?.id} onSelect={chooseExercise} />
        {(verifiedA1 || workoutPreparation || workoutNotes) && <section className={`session-guidance card ${guidanceOpen ? 'is-open' : ''}`}>
          <button type="button" className="session-guidance-toggle" aria-expanded={guidanceOpen} aria-controls={guidanceId} onClick={() => setGuidanceOpen(value => !value)}>
            <span>Orientações do treino</span><ChevronDown size={18} aria-hidden="true" />
          </button>
          <div id={guidanceId} className="session-guidance-content" role="region" aria-label="Orientações do treino" aria-hidden={!guidanceOpen} inert={!guidanceOpen}>
            <div className="session-guidance-inner">
              {verifiedA1 && a1Guidance.map(item => <div key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>)}

              <PdfMobilityGuide source={source} showVideos={preferences.showVideos} />
              {workoutPreparation && <div><h3>Antes de começar</h3><p>{workoutPreparation}</p></div>}
              {workoutNotes && <div><h3>Observação da ficha</h3><p>{workoutNotes}</p></div>}
            </div>
          </div>
        </section>}
        {exercise ? <>
          <section ref={exerciseHeadingRef} className="session-exercise-heading" aria-labelledby="session-exercise-title">
            <div className="row between"><span className="eyebrow">{definition?.block ?? 'Seu treino'} · {session.exercises.indexOf(exercise) + 1}/{summary.totalExercises}</span>{isExerciseComplete(exercise) && <Badge tone="success">Concluído</Badge>}</div>
            <h2 id="session-exercise-title">{exercise.name}</h2>
            <div className="row session-exercise-meta"><button type="button" className="session-series-link" aria-label={`Ver as ${exercise.sets.length} séries de ${exercise.name}`} onClick={() => seriesToolbarRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })}>{exercise.sets.length} séries<ChevronDown size={12} aria-hidden="true" /></button>{definition?.rest !== undefined && <span>Descanso sugerido: {suggestedRestFor()}s</span>}{preferences.trackDuration && <SessionClock startedAt={exercise.startedAt} elapsed={exercise.elapsedTime} label={`Tempo em ${exercise.name}`} />}</div>
            {definition?.setCountRange && <div className="session-set-count-control" role="group" aria-label="Quantidade de séries deste exercício">
              <span>Ficha: {definition.setCountRange.min}–{definition.setCountRange.max} séries</span>
              <div>{Array.from({ length: definition.setCountRange.max - definition.setCountRange.min + 1 }, (_, offset) => definition.setCountRange!.min + offset).map(count => <button key={count} type="button" aria-pressed={exercise.sets.length === count} disabled={!canAdjustSetCount || exercise.sets.length === count} onClick={() => changeSetCount(count)}>{count}</button>)}</div>
            </div>}
            <ExerciseGuide key={exercise.id} name={exercise.name} definition={definition} showVideos={preferences.showVideos} showGeneralSafety={!workout?.sourceId} />
          </section>

          <div ref={seriesToolbarRef} className="session-sets-toolbar">
            <div className="session-sets-context"><span>Séries de hoje · {session.workoutName}</span><strong>{exercise.name}</strong></div>
            <div className="session-set-actions">
              {previousWorkouts.length > 0 && <Button variant="ghost" size="sm" aria-label={`Abrir sessões anteriores de ${session.workoutName}`} title={`Sessões anteriores de ${session.workoutName}`} onClick={() => setHistoryOpen(true)}><History size={15} />Histórico do {session.workoutName}</Button>}
              <Button variant="ghost" size="sm" onClick={() => setRestOpen(true)}><Timer size={15} />Descanso</Button>
            </div>
          </div>
          <div className="session-sets" role="group" aria-label="Séries do exercício">
            {exercise.sets.map((set, index) => <SetRow key={`${exercise.id}-${set.setNumber}-${preferences.unit}`} exerciseId={exercise.id} set={set} previous={previous[index] ?? {}} preferences={preferences} measurementLabel={exercise.measurementLabel} secondaryMovementName={definition?.secondaryMovement?.name} onChange={patch => changeSet(index, patch)} onToggle={() => toggleSet(index)} />)}
          </div>

        </> : <EmptyState icon={<Dumbbell size={32} />} title="Nenhum exercício nesta sessão" description="Volte ao início para conferir os exercícios do seu treino." action={<Link className="text-link" to="/app">Voltar ao início</Link>} />}
      </div>

      <div className="session-action-dock"><StickyActionBar><div className="session-bottom-actions">
        <Button variant="secondary" className="session-overview-button" onClick={() => setOverviewOpen(true)}><List size={16} />Visão geral <span className="session-bottom-count">{summary.completedExercises}/{summary.totalExercises}</span></Button>
        <Button variant="primary" onClick={() => navigate(`${basePath}/finish`)}>Finalizar <ArrowRight size={17} /></Button>
      </div></StickyActionBar></div>
      <Sheet open={overviewOpen} onOpenChange={setOverviewOpen} title="Visão geral do treino" description={`${summary.completedExercises} de ${summary.totalExercises} exercícios concluídos.`} className="session-sheet">
        <nav className="session-overview-list" aria-label="Todos os exercícios do treino">
          {session.exercises.map((item, index) => {
            const complete = isExerciseComplete(item);
            const status = item.id === exercise?.id && !complete ? 'Em andamento' : exerciseStatus(item);
            return <button
              key={item.id}
              type="button"
              className={`session-overview-item ${item.id === exercise?.id ? 'is-current' : ''}`}
              aria-current={item.id === exercise?.id ? 'step' : undefined}
              onClick={() => { setOverviewOpen(false); chooseExercise(item.id); }}
            >
              <span className="session-overview-number">{index + 1}</span>
              <strong>{item.name}</strong>
              <span className="session-overview-status">{status}</span>
            </button>;
          })}
        </nav>
      </Sheet>
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen} title="Treinos anteriores" description={`Sessões registradas de ${session.workoutName}`} className="session-sheet">
        {previousWorkouts.length ? <div className="session-history-list">{previousWorkouts.map(item => {
          const sets = item.exercises.reduce((count, entry) => count + entry.sets.filter(set => set.completed).length, 0);
          return <Link key={item.id} to={`/app/history/session/${encodeURIComponent(item.id)}`} onClick={() => setHistoryOpen(false)} className="session-history-item">
            <span><strong>{dateLabel(item.startedAt, { day: 'numeric', month: 'long', year: 'numeric' })}</strong><small>{item.exercises.length} exercícios · {sets} séries feitas</small></span><span>{duration(item.elapsedTime)}<ArrowRight size={15} /></span>
          </Link>;
        })}</div> : <div className="session-history-empty"><p className="muted small">Este treino ainda não tem sessões anteriores registradas.</p><Link to="/app/history" onClick={() => setHistoryOpen(false)} className="text-link">Abrir histórico completo<ArrowRight size={15} /></Link></div>}
      </Sheet>

      <RestTimer timer={rest} open={restOpen} onOpenChange={setRestOpen} autoRest={preferences.autoRest} onAutoRestChange={autoRest => setPreferences({ autoRest })} suggestedSeconds={suggestedRestFor() || 60} />
    </div>
  );
}
