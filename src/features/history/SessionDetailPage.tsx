import { Link, useParams } from 'react-router-dom';
import { ChevronDown, FileText } from 'lucide-react';
import { Badge, EmptyState, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { dateLabel, duration, number, toDisplayWeight } from '../../utils/format';
import { completedSets, sessionSetCount, sessionVolume } from './analytics';
import SetTable from './SetTable';
import './history.css';

export default function SessionDetailPage() {
  const { id } = useParams();
  const session = useAppStore(s => s.history.find(h => h.id === id && h.status === 'completed'));
  const unit = useAppStore(s => s.preferences.unit);
  const cycle = useAppStore(s => s.cycles.find(c => c.id === session?.cycleId));
  if (!session) return <div className="page history-page"><TopBar title="Sessão" back="/app/history" />
    <EmptyState title="Sessão não encontrada" description="Este registro não está disponível neste dispositivo."
      action={<Link className="text-link" to="/app/history">Voltar ao histórico</Link>} /></div>;
  return <div className="page history-page">
    <TopBar title={session.workoutName} eyebrow={dateLabel(session.startedAt, { day: 'numeric', month: 'long', year: 'numeric' })} back="/app/history" action={<Badge tone="success">Finalizado</Badge>} />
    {cycle && <Link className="text-link small" to={`/app/cycles/${cycle.id}`}>{cycle.name}</Link>}
    <div className="history-facts">
      <div><strong>{duration(session.elapsedTime)}</strong><span>Duração registrada</span></div>
      <div><strong>{sessionSetCount(session)}</strong><span>Séries feitas</span></div>
      <div><strong>{number(toDisplayWeight(sessionVolume(session), unit))}</strong><span>Volume · {unit} × reps</span></div>
    </div>
    <h2 className="section-title">Exercícios <span className="muted small">/ {session.exercises.length}</span></h2>
    {!session.exercises.length && <EmptyState title="Sem exercícios registrados" description="Esta sessão não possui detalhes de séries." />}
    {session.exercises.map(exercise => <details key={exercise.id} className="history-exercise">
      <summary><div><strong>{exercise.name}</strong><p>{completedSets(exercise).length}/{exercise.sets.length} séries feitas · {duration(exercise.elapsedTime)}</p></div><ChevronDown size={17} /></summary>
      <SetTable exercise={exercise} />
      <Link className="text-link small" to={`/app/progress/exercise/${exercise.id}`}>Ver evolução do exercício</Link>
      <div style={{ height: 14 }} />
    </details>)}
    <section className="history-note-card"><h2 className="row"><FileText size={15} aria-hidden="true" /> Nota do treino</h2>
      <p className={`history-note${session.notes ? '' : ' muted'}`}>{session.notes || 'Nenhuma nota adicionada a esta sessão.'}</p>
    </section>
    <p className="muted small">Volume considera apenas séries concluídas. Séries não feitas não entram nas métricas.</p>
  </div>;
}
