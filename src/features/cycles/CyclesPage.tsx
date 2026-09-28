import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ChevronRight, Layers3, Plus } from 'lucide-react';
import { Badge, Button, EmptyState, IconButton, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { dateLabel } from '../../utils/format';
import { completedSessions, localDate } from '../history/analytics';
import CycleComparisonSheet from '../progress/CycleComparisonSheet';
import NewCycleSheet from './NewCycleSheet';
import '../history/history.css';
import './cycles.css';

export default function CyclesPage() {
  const cycles = useAppStore(s => s.cycles);
  const history = useAppStore(s => s.history);
  const [create, setCreate] = useState(false);
  const [compare, setCompare] = useState(false);
  const current = cycles.find(c => c.current);
  const past = cycles.filter(c => !c.current).sort((a, b) => b.start.localeCompare(a.start));
  const sessions = completedSessions(history);
  const count = (id: string) => sessions.filter(s => s.cycleId === id).length;
  return <div className="page cycles-page">
    <TopBar title="Ciclos" eyebrow="Uma fase de cada vez" action={<IconButton label="Comparar ciclos" onClick={() => setCompare(true)}><ArrowLeftRight size={19} /></IconButton>} />
    {current ? <Link className="cycles-current" to={`/app/cycles/${current.id}`}>
      <div className="row between"><Badge tone="accent">Ciclo atual</Badge><ChevronRight size={19} /></div>
      <h2>{current.name}</h2><p>{current.weeks} semanas · {current.frequency} treinos / semana</p>
      <div className="cycles-track" role="progressbar" aria-label="Sessões realizadas na meta do ciclo" aria-valuemin={0} aria-valuemax={current.weeks * current.frequency} aria-valuenow={Math.min(count(current.id), current.weeks * current.frequency)}>
        <span style={{ width: `${Math.min(100, count(current.id) / Math.max(1, current.weeks * current.frequency) * 100)}%` }} /></div>
      <div className="row between small"><span>{count(current.id)} treinos realizados</span><span className="muted">Meta: {current.weeks * current.frequency}</span></div>
    </Link> : <EmptyState icon={<Layers3 />} title="Espaço para um novo começo" description="Crie um ciclo para organizar a próxima fase dos seus treinos." />}
    <Button className="cycles-create" variant="secondary" onClick={() => setCreate(true)}><Plus size={17} /> Novo ciclo</Button>
    <section><h2 className="history-month">Ciclos anteriores</h2>
      {past.length ? <div className="history-list">{past.map(c => <Link key={c.id} className="cycles-list-item" to={`/app/cycles/${c.id}`}>
        <div><strong>{c.name}</strong><p>{dateLabel(+localDate(c.start), { day: 'numeric', month: 'short', year: 'numeric' })} · {c.weeks} semanas</p><span>{count(c.id)} treinos realizados</span></div><ChevronRight size={17} />
      </Link>)}</div> : <p className="muted small">Seus ciclos anteriores ficam guardados aqui, sem perder os registros.</p>}
    </section>
    <NewCycleSheet open={create} onOpenChange={setCreate} /><CycleComparisonSheet open={compare} onOpenChange={setCompare} />
  </div>;
}
