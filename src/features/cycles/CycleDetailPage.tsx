import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftRight, ChevronRight, FileBarChart, Layers3, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, EmptyState, SegmentedControl, Sheet, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { dateLabel, duration, number, toDisplayWeight } from '../../utils/format';
import { completedSessions, completedSets, exerciseEntries, exerciseLoad, exerciseVolume, localDate, sessionSetCount, sessionTime, sessionVolume, weeklySessions } from '../history/analytics';
import CycleComparisonSheet from '../progress/CycleComparisonSheet';
import ProgressChart from '../progress/ProgressChart';
import '../history/history.css';
import '../progress/progress.css';
import './cycles.css';

export default function CycleDetailPage() {
  const { id } = useParams();
  const cycle = useAppStore(s => s.cycles.find(c => c.id === id));
  const workouts = useAppStore(s => s.workouts);
  const history = useAppStore(s => s.history);
  const unit = useAppStore(s => s.preferences.unit);
  const setCurrentCycle = useAppStore(s => s.setCurrentCycle);
  const [tab, setTab] = useState('workouts');
  const [report, setReport] = useState(false);
  const [compare, setCompare] = useState(false);
  const [limit, setLimit] = useState(4);
  const sessions = completedSessions(history).filter(s => s.cycleId === id);
  const cycleWorkouts = workouts.filter(w => w.cycleId === id && w.exerciseIds.length > 0);
  const time = sessions.reduce((n, s) => n + sessionTime(s), 0);
  const volume = sessions.reduce((n, s) => n + sessionVolume(s), 0);
  const sets = sessions.reduce((n, s) => n + sessionSetCount(s), 0);
  const exerciseNames = [...new Map(sessions.flatMap(s => s.exercises.map(e => [e.id, e.name] as const))).entries()];
  const weekly = weeklySessions(sessions);
  if (!cycle) return <div className="page cycles-page"><TopBar title="Ciclo" back="/app/cycles" /><EmptyState icon={<Layers3 />} title="Ciclo não encontrado" description="Este ciclo não está disponível neste dispositivo." action={<Link className="text-link" to="/app/cycles">Ver ciclos</Link>} /></div>;
  return <div className="page cycles-page">
    <TopBar title={cycle.name} back="/app/cycles" eyebrow={`${cycle.weeks} semanas · ${cycle.frequency} treinos / semana`} action={<Badge tone={cycle.current ? 'accent' : 'neutral'}>{cycle.current ? 'Atual' : 'Anterior'}</Badge>} />
    <p className="cycles-dates">{dateLabel(+localDate(cycle.start), { day: 'numeric', month: 'short' })} a {dateLabel(+localDate(cycle.end), { day: 'numeric', month: 'short', year: 'numeric' })} · período planejado</p>
    <div className="history-facts"><div><strong>{sessions.length}</strong><span>Treinos realizados</span></div><div><strong>{duration(time)}</strong><span>Tempo total</span></div><div><strong>{sets}</strong><span>Séries feitas</span></div></div>
    <div className="cycles-track" role="progressbar" aria-label="Meta de treinos do ciclo" aria-valuemin={0} aria-valuemax={cycle.weeks * cycle.frequency} aria-valuenow={Math.min(sessions.length, cycle.weeks * cycle.frequency)}>
      <span style={{ width: `${Math.min(100, sessions.length / Math.max(1, cycle.weeks * cycle.frequency) * 100)}%` }} /></div>
    <div className="row between small"><span>{sessions.length} de {cycle.weeks * cycle.frequency} treinos planejados</span><span className="muted">{number(sessions.length / Math.max(1, cycle.weeks * cycle.frequency) * 100)}%</span></div>
    <div className="cycles-actions"><Button variant="secondary" size="sm" onClick={() => setReport(true)}><FileBarChart size={16} /> Relatório</Button><Button variant="ghost" size="sm" onClick={() => setCompare(true)}><ArrowLeftRight size={16} /> Comparar</Button></div>
    <div className="cycles-tabs"><SegmentedControl value={tab} onChange={setTab} options={[{ value: 'workouts', label: 'Treinos' }, { value: 'sessions', label: 'Sessões' }]} /></div>
    {tab === 'workouts' ? <>
      {cycleWorkouts.length ? <div className="history-list">{cycleWorkouts.map(w => <Link className="cycles-list-item" key={w.id} to={`/app/workouts/${w.id}`}>
        <div><strong>{w.name}</strong><p>{w.subtitle}</p><span>{w.exerciseIds.length} exercícios · Ver exercícios</span></div><ChevronRight size={17} /></Link>)}</div>
        : <EmptyState icon={<Layers3 />} title={sessions.length ? 'Os registros continuam aqui' : 'Seu ciclo está pronto'}
          description={sessions.length ? 'Não há modelos de treino vinculados a este ciclo. Suas sessões e séries estão preservadas na aba Sessões.' : 'Adicione seu primeiro treino para começar. Você também pode deixar este ciclo vazio por enquanto.'}
          action={sessions.length ? <Button variant="secondary" size="sm" onClick={() => setTab('sessions')}>Ver sessões</Button> : <Link className="text-link" to={`/app/workouts/import?cycleId=${encodeURIComponent(cycle.id)}`}>Importar treino</Link>} />}
      {cycleWorkouts.length > 0 && <div className="history-more"><Link className="text-link small" to={`/app/workouts/import?cycleId=${encodeURIComponent(cycle.id)}`}><Upload size={15} /> Adicionar treino</Link></div>}
    </> : <>
      {!sessions.length ? <EmptyState title="Ainda sem sessões" description="Os treinos finalizados deste ciclo aparecerão aqui." /> : <div className="history-list">{sessions.slice(0, limit).map(s => <Link className="cycles-list-item" key={s.id} to={`/app/history/session/${s.id}`}>
        <div><strong>{s.workoutName}</strong><p>{dateLabel(s.startedAt, { day: 'numeric', month: 'short', year: 'numeric' })} · {duration(s.elapsedTime)}</p><span>{sessionSetCount(s)} séries feitas</span></div><ChevronRight size={17} /></Link>)}</div>}
      {sessions.length > limit && <div className="history-more"><Button variant="ghost" size="sm" onClick={() => setLimit(limit + 12)}>Ver mais sessões</Button></div>}
    </>}
    {!cycle.current && <div className="history-more"><Button variant="ghost" size="sm" onClick={() => { setCurrentCycle(cycle.id); toast.success('Este é seu ciclo atual. O histórico foi preservado.'); }}>Usar como ciclo atual</Button></div>}
    <Sheet open={report} onOpenChange={setReport} title="Relatório do ciclo" description={cycle.name} wide>
      <div className="cycles-report">
        {!sessions.length ? <EmptyState icon={<FileBarChart />} title="O relatório nasce com a prática" description="Finalize o primeiro treino deste ciclo para visualizar suas métricas." /> : <>
          <div className="history-facts"><div><strong>{sessions.length}</strong><span>Sessões</span></div><div><strong>{duration(time / sessions.length)}</strong><span>Tempo médio</span></div><div><strong>{number(toDisplayWeight(volume, unit))}</strong><span>Volume · {unit} × reps</span></div></div>
          <h3>Frequência por semana</h3><ProgressChart points={weekly.map(w => ({ date: w.date, value: w.count }))} label="Sessões" bars />
          <p className="muted small">Semanas entre o primeiro e o último registro, incluindo intervalos sem treino.</p>
          <h3>Por exercício</h3>
          {exerciseNames.map(([exerciseId, name]) => {
            const entries = exerciseEntries(sessions, exerciseId);
            const loads = entries.map(e => exerciseLoad(e.exercise)).filter((v): v is number => v !== null);
            const total = entries.reduce((n, e) => n + exerciseVolume(e.exercise), 0);
            return <div className="cycles-report-exercise" key={exerciseId}><strong>{name}</strong>
              <p>{loads.length ? `${number(toDisplayWeight(Math.max(...loads), unit))} ${unit} de carga máxima` : 'Sem séries concluídas'} · {entries.reduce((n, e) => n + completedSets(e.exercise).length, 0)} séries<br />
                {number(toDisplayWeight(total, unit))} {unit} × reps · {entries.length} sessões · {duration(entries.reduce((n, e) => n + e.exercise.elapsedTime, 0))}</p></div>;
          })}
          <p className="muted small">Relatório calculado do histórico local. Carga e volume consideram somente séries concluídas; datas e metas do ciclo são planejadas.</p>
        </>}
      </div>
    </Sheet>
    <CycleComparisonSheet key={cycle.id} open={compare} onOpenChange={setCompare} cycleId={cycle.id} />
  </div>;
}
