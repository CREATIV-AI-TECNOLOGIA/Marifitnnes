import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleAlert, Home, Trophy } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge, Button, ConfirmDialog, EmptyState } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import type { TrainingSession } from '../../types';
import { dateLabel, duration, number, toDisplayWeight } from '../../utils/format';
import { getLoadRecords, isExerciseComplete, summarizeSession } from './session-utils';
import { clearRestTimer } from './use-rest-timer';
import './workout-session.css';

export default function FinishPage() {
  const { id } = useParams<{ id: string }>();
  const active = useAppStore(state => state.activeSession);
  const saved = useAppStore(state => state.history.find(session => session.id === id));
  if (saved) return <FinishedSummary session={saved} />;
  if (!active || active.id !== id) return <div className="page workout-session"><EmptyState icon={<CircleAlert size={32} />} title="Sessão não encontrada" description="Não há um treino com este endereço para finalizar. Seus treinos salvos continuam no histórico." action={<div className="stack"><Link className="text-link" to="/app/history">Ver histórico</Link>{active && <Link className="text-link" to={`/app/session/${encodeURIComponent(active.id)}`}>Retomar treino em andamento</Link>}<Link className="text-link" to="/app">Ir para o início</Link></div>} /></div>;
  return <FinishFlow key={active.id} session={active} />;
}

function FinishFlow({ session }: { session: TrainingSession }) {
  const navigate = useNavigate();
  const finishSession = useAppStore(state => state.finishSession);
  const selectExercise = useAppStore(state => state.selectExercise);
  const incomplete = session.exercises.filter(exercise => !isExerciseComplete(exercise));
  const [confirmed, setConfirmed] = useState(false);
  const noteKey = `forma-session-note:${session.id}`;
  const [note, setNote] = useState(() => {
    try { return localStorage.getItem(noteKey) ?? session.notes; } catch { return session.notes; }
  });
  const saving = useRef(false);
  const needsConfirmation = incomplete.length > 0 && !confirmed;
  const basePath = `/app/session/${encodeURIComponent(session.id)}`;
  const summary = summarizeSession(session);

  function continueSession() {
    const next = incomplete[0];
    if (next && useAppStore.getState().activeSession?.id === session.id) selectExercise(next.id);
    navigate(next ? `${basePath}/exercise/${encodeURIComponent(next.id)}` : basePath);
  }

  function saveSession() {
    if (saving.current || needsConfirmation) return;
    if (useAppStore.getState().activeSession?.id !== session.id) {
      toast.error('Esta sessão não está mais em andamento.');
      return;
    }
    saving.current = true;
    const savedId = finishSession(note.trim());
    if (!savedId) {
      saving.current = false;
      toast.error('Não foi possível finalizar. Seu treino continua salvo.');
      return;
    }
    clearRestTimer(session.id);
    try { localStorage.removeItem(noteKey); } catch { /* The finished note is already in the store. */ }
    toast.success('Treino salvo no histórico.');
  }

  return <div className="workout-session session-finish">
    <header className="row between session-finish-header"><Link className="session-exit" to={basePath}><ArrowLeft size={18} /> Voltar ao treino</Link><Badge>{session.workoutName}</Badge></header>
    <div className="session-finish-body">
      <span className="eyebrow">Encerrar sessão</span>
      <h1>{needsConfirmation ? 'Cada série conta.' : 'Último detalhe.'}</h1>
      <p className="muted">{summary.completedSets} de {summary.totalSets} séries realizadas. {needsConfirmation ? 'Você decide se quer continuar ou salvar o que fez até aqui.' : 'Uma única nota para o treino inteiro, só se quiser.'}</p>
      {!needsConfirmation && <form className="stack session-note-form" onSubmit={event => { event.preventDefault(); saveSession(); }}>
        {incomplete.length > 0 && <p className="session-partial-note small"><CircleAlert size={16} />{incomplete.length} {incomplete.length === 1 ? 'exercício será registrado como não concluído' : 'exercícios serão registrados como não concluídos'}. As séries feitas serão preservadas.</p>}
        <label className="field" htmlFor="session-general-note">Como foi o treino? <span className="muted small">Opcional</span>
          <textarea className="input session-note" id="session-general-note" rows={5} maxLength={2000} value={note} placeholder="Energia, execução, como você se sentiu..." onChange={event => {
            const value = event.target.value;
            setNote(value);
            try { localStorage.setItem(noteKey, value); } catch { /* Keep the note editable without storage. */ }
          }} aria-describedby="session-note-help" />
        </label>
        <div id="session-note-help" className="row between small muted"><span>A nota ficará junto deste treino no histórico.</span><span>{note.length}/2000</span></div>
        <Button type="submit" variant="primary">{note.trim() ? 'Salvar e finalizar' : 'Finalizar sem nota'}<ArrowRight size={18} /></Button>
      </form>}
    </div>
    <ConfirmDialog open={needsConfirmation} onOpenChange={open => { if (!open) continueSession(); }} title="Ainda há exercícios incompletos" description="Você pode voltar e continuar ou finalizar agora. Só as séries marcadas entram nos totais; os exercícios incompletos ficam identificados no histórico.">
      <ul className="session-incomplete-list">{incomplete.map(exercise => <li key={exercise.id}><span>{exercise.name}</span><span className="small muted">{exercise.sets.filter(set => set.completed).length}/{exercise.sets.length} séries</span></li>)}</ul>
      <div className="stack session-confirm-actions"><Button variant="primary" onClick={continueSession}>Continuar treino</Button><Button variant="secondary" onClick={() => setConfirmed(true)}>Finalizar mesmo assim</Button></div>
    </ConfirmDialog>
  </div>;
}

function FinishedSummary({ session }: { session: TrainingSession }) {
  const preferences = useAppStore(state => state.preferences);
  const history = useAppStore(state => state.history);
  const definitions = useAppStore(state => state.exercises);
  const summary = summarizeSession(session);
  const records = getLoadRecords(session, history, definitions, preferences.unit);
  return <div className="workout-session session-finish">
    <header className="row between session-finish-header"><Link className="session-exit" to="/app"><Home size={17} /> Início</Link><Badge tone="success">Salvo no histórico</Badge></header>
    <section className="session-finish-body session-summary" aria-label="Resumo do treino">
      <div className="session-success-mark"><Check size={31} strokeWidth={2} /></div>
      <span className="eyebrow">{session.workoutName} · {dateLabel(session.finishedAt ?? session.startedAt)}</span>
      <h1>Treino registrado.</h1>
      <p className="muted">{summary.completedExercises} de {summary.totalExercises} exercícios concluídos.{preferences.trackDuration && ` ${duration(session.elapsedTime)} de dedicação.`}</p>
      <div className="session-summary-grid">
        <div><span className="metric-value">{summary.completedSets}<small>/{summary.totalSets}</small></span><span className="small muted">Séries realizadas</span></div>
        <div><span className="metric-value">{number(summary.reps)}</span><span className="small muted">Repetições</span></div>
        <div><span className="metric-value">{number(toDisplayWeight(summary.volume, preferences.unit))}</span><span className="small muted">Volume ({preferences.unit})</span></div>
      </div>
      <p className="session-volume-help small muted">Volume = carga × repetições, apenas das séries concluídas.</p>
      {records.length > 0 && <section className="session-records" aria-label="Novos recordes de carga"><div className="row"><Trophy size={20} /><h2>{records.length === 1 ? 'Novo recorde de carga' : 'Novos recordes de carga'}</h2></div>{records.map(record => <p key={record.id}><strong>{record.name}</strong><span>{number(toDisplayWeight(record.weight, preferences.unit))} {preferences.unit}<small className="muted">Anterior: {number(toDisplayWeight(record.previousBest, preferences.unit))} {preferences.unit}</small></span></p>)}</section>}
      {session.notes && <section className="session-summary-note"><h2>Sua nota</h2><p>{session.notes}</p></section>}
      <div className="stack session-summary-links"><Link className="session-primary-link" to={`/app/history/${encodeURIComponent(session.id)}`}>Ver detalhes no histórico <ArrowRight size={18} /></Link><Link className="session-home-link" to="/app">Voltar ao início</Link></div>
    </section>
  </div>;
}
