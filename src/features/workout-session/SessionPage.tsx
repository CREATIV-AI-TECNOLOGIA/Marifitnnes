import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCheck, Dumbbell, History, Timer } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge, Button, EmptyState, Sheet, StickyActionBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import type { SessionSet, TrainingSession } from '../../types';
import { dateLabel, duration, haptic } from '../../utils/format';
import ExerciseGuide from './ExerciseGuide';
import ExercisePicker from './ExercisePicker';
import SetRow from './SetRow';
import RestTimer, { SessionClock } from './SessionTimers';
import WeightSheet from './WeightSheet';
import { getPreviousSets, isExerciseComplete, summarizeSession } from './session-utils';
import { useRestTimer } from './use-rest-timer';
import './workout-session.css';

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
  const workoutPreparation = useAppStore(state => state.workouts.find(item => item.id === session.workoutId)?.preparation);
  const history = useAppStore(state => state.history);
  const preferences = useAppStore(state => state.preferences);
  const selectExercise = useAppStore(state => state.selectExercise);
  const updateSet = useAppStore(state => state.updateSet);
  const setPreferences = useAppStore(state => state.setPreferences);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  const [weightIndex, setWeightIndex] = useState<number | null>(null);
  const suppressWeightFocus = useRef<number | null>(null);
  const rest = useRestTimer(session.id);
  const basePath = `/app/session/${encodeURIComponent(session.id)}`;
  const requested = session.exercises.find(exercise => exercise.id === requestedExerciseId);
  const exercise = requested ?? session.exercises.find(exercise => exercise.id === session.currentExerciseId) ?? session.exercises[0];
  const definition = definitions.find(item => item.id === exercise?.id);
  const previous = exercise ? getPreviousSets(exercise, definition, history, session.startedAt) : [];
  const summary = summarizeSession(session);
  const previousWorkouts = history.filter(item => item.workoutId === session.workoutId && item.status === 'completed').slice(0, 8);
  const suggestedRestFor = (setIndex = 0) => Math.max(1, Math.min(3600, Math.round(definition?.restBySet?.[setIndex] ?? definition?.rest ?? 60)));

  useEffect(() => {
    if (requestedExerciseId && !requested) {
      toast.info('Exercício não encontrado neste treino.');
      navigate(basePath, { replace: true });
    }
  }, [requestedExerciseId, requested, navigate, basePath]);

  useEffect(() => {
    if (exercise && session.currentExerciseId !== exercise.id) selectExercise(exercise.id);
  }, [exercise?.id, session.currentExerciseId, selectExercise]);

  useEffect(() => {
    setWeightIndex(null);
    suppressWeightFocus.current = null;
  }, [exercise?.id]);

  function chooseExercise(exerciseId: string) {
    selectExercise(exerciseId);
    navigate(`${basePath}/exercise/${encodeURIComponent(exerciseId)}`);
  }

  function changeSet(index: number, patch: Partial<SessionSet>) {
    if (!exercise || useAppStore.getState().activeSession?.id !== session.id) return;
    if (patch.performedReps === 0 && exercise.sets[index]?.completed) patch = { ...patch, completed: false };
    updateSet(exercise.id, index, patch);
  }

  function toggleSet(index: number) {
    const set = exercise?.sets[index];
    if (!set) return;
    if (!set.completed && set.performedReps < 1) {
      toast.error('Informe pelo menos uma repetição antes de concluir a série.');
      return;
    }
    changeSet(index, { completed: !set.completed });
    haptic();
    if (!set.completed && preferences.autoRest) rest.start(suggestedRestFor(index));
  }

  function openWeight(index: number, fromFocus = false) {
    // Modal focus restoration must not immediately reopen the same sheet.
    if (fromFocus && suppressWeightFocus.current === index) {
      suppressWeightFocus.current = null;
      return;
    }
    suppressWeightFocus.current = null;
    setWeightIndex(index);
  }

  return (
    <div className={`workout-session ${rest.active ? 'has-rest' : ''}`}>
      <header className="session-header">
        <div className="session-header-inner">
          <div className="row between">
            <Link to="/app" className="session-exit" aria-label="Sair para o início. Seu treino continua salvo."><ArrowLeft size={18} /> Início</Link>
            <span className="session-autosave"><CheckCheck size={14} /> Salvo automaticamente</span>
          </div>
          <div className="row between session-header-title"><h1>{session.workoutName}</h1>{preferences.trackDuration && <SessionClock startedAt={session.startedAt} label="Tempo total do treino" />}</div>
          <div className="row between small"><span><strong>{summary.completedExercises}</strong> de {summary.totalExercises} exercícios</span><span className="muted">{summary.completedSets}/{summary.totalSets} séries</span></div>
          <progress className="session-progress" max={summary.totalSets || 1} value={summary.completedSets} aria-label={`${summary.completedSets} de ${summary.totalSets} séries concluídas`} />
        </div>
      </header>

      <div className="session-content">
        <ExercisePicker exercises={session.exercises} currentId={exercise?.id} onSelect={chooseExercise} />
        {workoutPreparation && <p className="session-preparation-note"><strong>Antes de começar:</strong> {workoutPreparation}</p>}
        {exercise ? <>
          <section className="session-exercise-heading" aria-labelledby="session-exercise-title">
            <div className="row between"><span className="eyebrow">{definition?.block ?? 'Seu treino'} · {session.exercises.indexOf(exercise) + 1}/{summary.totalExercises}</span>{isExerciseComplete(exercise) && <Badge tone="success">Concluído</Badge>}</div>
            <h2 id="session-exercise-title">{exercise.name}</h2>
            <div className="row session-exercise-meta"><span>{exercise.sets.length} séries</span>{definition?.rest !== undefined && <span>Descanso sugerido: {suggestedRestFor()}s</span>}{preferences.trackDuration && <SessionClock startedAt={exercise.startedAt} elapsed={exercise.elapsedTime} label={`Tempo em ${exercise.name}`} />}</div>
            <ExerciseGuide key={exercise.id} name={exercise.name} definition={definition} showVideos={preferences.showVideos} />
          </section>

          <div className="row between session-sets-toolbar"><h3 className="section-title">Suas séries</h3><div className="session-set-actions"><Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}><History size={15} />Treinos anteriores</Button><Button variant="ghost" size="sm" onClick={() => setRestOpen(true)}><Timer size={15} />Descanso</Button></div></div>
          <div className="session-sets">
            {exercise.sets.map((set, index) => <SetRow key={`${exercise.id}-${set.setNumber}-${preferences.unit}`} exerciseId={exercise.id} set={set} previous={previous[index] ?? {}} preferences={preferences} onChange={patch => changeSet(index, patch)} onToggle={() => toggleSet(index)} onOpenWeight={fromFocus => openWeight(index, fromFocus)} />)}
          </div>
          <p className="session-footnote small muted">Treine na ordem que preferir. Seus registros ficam salvos mesmo ao sair.</p>
        </> : <EmptyState icon={<Dumbbell size={32} />} title="Nenhum exercício nesta sessão" description="Volte ao início para conferir os exercícios do seu treino." action={<Link className="text-link" to="/app">Voltar ao início</Link>} />}
      </div>

      <div className="session-action-dock"><StickyActionBar><div className="session-bottom-actions"><Button variant="primary" onClick={() => navigate(`${basePath}/finish`)}>Finalizar <ArrowRight size={17} /></Button></div></StickyActionBar></div>
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen} title="Treinos anteriores" description={`Sessões registradas de ${session.workoutName}`}>
        {previousWorkouts.length ? <div className="session-history-list">{previousWorkouts.map(item => {
          const sets = item.exercises.reduce((count, entry) => count + entry.sets.filter(set => set.completed).length, 0);
          return <Link key={item.id} to={`/app/history/session/${encodeURIComponent(item.id)}`} onClick={() => setHistoryOpen(false)} className="session-history-item">
            <span><strong>{dateLabel(item.startedAt, { day: 'numeric', month: 'long', year: 'numeric' })}</strong><small>{item.exercises.length} exercícios · {sets} séries feitas</small></span><span>{duration(item.elapsedTime)}<ArrowRight size={15} /></span>
          </Link>;
        })}</div> : <div className="session-history-empty"><p className="muted small">Este treino ainda não tem sessões anteriores registradas.</p><Link to="/app/history" onClick={() => setHistoryOpen(false)} className="text-link">Abrir histórico completo<ArrowRight size={15} /></Link></div>}
      </Sheet>
      <WeightSheet set={weightIndex === null ? undefined : exercise?.sets[weightIndex]} unit={preferences.unit} onChange={weight => { if (weightIndex !== null) changeSet(weightIndex, { weight }); }} onClose={() => { suppressWeightFocus.current = weightIndex; setWeightIndex(null); }} />
      <RestTimer timer={rest} open={restOpen} onOpenChange={setRestOpen} autoRest={preferences.autoRest} onAutoRestChange={autoRest => setPreferences({ autoRest })} suggestedSeconds={suggestedRestFor()} />
    </div>
  );
}
