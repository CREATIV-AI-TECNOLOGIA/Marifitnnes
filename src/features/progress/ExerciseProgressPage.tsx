import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftRight, ChevronDown, Trophy } from 'lucide-react';
import { Button, EmptyState, IconButton, SegmentedControl, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { dateLabel, duration, number, toDisplayWeight } from '../../utils/format';
import { completedSets, dateKey, exerciseDays, exerciseEntries, inPeriod, localDate, periodOptions, type Period } from '../history/analytics';
import SetTable from '../history/SetTable';
import ProgressChart from './ProgressChart';
import CycleComparisonSheet from './CycleComparisonSheet';
import '../history/history.css';
import './progress.css';

export default function ExerciseProgressPage() {
  const { id = '' } = useParams();
  const history = useAppStore(s => s.history);
  const exercise = useAppStore(s => s.exercises.find(e => e.id === id));
  const unit = useAppStore(s => s.preferences.unit);
  const [period, setPeriod] = useState<Period>('30d');
  const [metric, setMetric] = useState('load');
  const [compare, setCompare] = useState(false);
  const [limit, setLimit] = useState(3);
  const all = exerciseEntries(history, id);
  const entries = exerciseEntries(inPeriod(history, period), id);
  const days = exerciseDays(inPeriod(history, period), id);
  const record = all.flatMap(entry => completedSets(entry.exercise).map(set => ({ ...entry, set })))
    .sort((a, b) => b.set.weight - a.set.weight || b.session.startedAt - a.session.startedAt)[0];
  const name = exercise?.name ?? all[0]?.exercise.name;
  const label = metric === 'load' ? 'Maior carga' : metric === 'volume' ? 'Volume diário' : 'Tempo diário';
  const chartUnit = metric === 'time' ? 'min' : metric === 'volume' ? `${unit} × reps` : unit;
  const dates = [...new Set(entries.map(e => dateKey(e.session.startedAt)))];
  if (!name) return <div className="page progress-page"><TopBar title="Exercício" back="/app/progress" /><EmptyState title="Exercício não encontrado" description="Não há cadastro ou histórico deste exercício neste dispositivo." action={<Link className="text-link" to="/app/progress">Voltar à evolução</Link>} /></div>;
  return <div className="page progress-page">
    <TopBar title={name} eyebrow="Evolução por exercício" back="/app/progress" action={<IconButton label="Comparar exercício entre ciclos" onClick={() => setCompare(true)}><ArrowLeftRight size={18} /></IconButton>} />
    {record && <section className="progress-record"><Trophy size={24} aria-hidden="true" /><div><h2>Maior carga registrada · todo o histórico</h2>
      <strong>{number(toDisplayWeight(record.set.weight, unit))} {unit}</strong>
      <p>{record.set.performedReps} repetições · {dateLabel(record.session.startedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</p></div></section>}
    <div className="progress-period"><SegmentedControl value={period} onChange={v => { setPeriod(v as Period); setLimit(3); }} options={periodOptions} /></div>
    {!all.length ? <EmptyState icon={<Trophy />} title="Seu próximo recorde começa aqui" description="Conclua séries deste exercício para acompanhar sua carga, volume e tempo." action={<Link className="text-link" to="/app/workouts">Ir aos treinos</Link>} /> : <>
      <section className="progress-panel"><SegmentedControl value={metric} onChange={setMetric} options={[{ value: 'load', label: 'Carga' }, { value: 'volume', label: 'Volume' }, { value: 'time', label: 'Tempo' }]} />
        <ProgressChart label={label} unit={chartUnit} points={days.map(d => ({ date: d.date,
          value: metric === 'time' ? d.seconds / 60 : metric === 'volume' ? toDisplayWeight(d.volume, unit) : d.load === null ? null : toDisplayWeight(d.load, unit),
        }))} />
        <p className="progress-summary-note">{metric === 'load' ? 'Maior carga entre as séries concluídas em cada dia, não uma estimativa de 1RM.' : metric === 'volume' ? 'Carga × repetições concluídas. Sessões do mesmo dia são somadas.' : 'Tempo registrado neste exercício. Sessões do mesmo dia são somadas; pausas podem estar incluídas.'}</p>
      </section>
      <section className="progress-library"><h2 className="section-title">Registros por dia <span className="muted small">/ {dates.length}</span></h2>
        {!dates.length && <EmptyState title="Sem registros no período" description="Amplie o filtro para consultar seus treinos anteriores." />}
        {dates.slice(0, limit).map(date => {
          const dayEntries = entries.filter(e => dateKey(e.session.startedAt) === date);
          const sets = dayEntries.reduce((n, e) => n + completedSets(e.exercise).length, 0);
          return <details className="history-exercise" key={date}><summary><div><strong>{dateLabel(+localDate(date), { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            <p>{sets} séries feitas · {duration(dayEntries.reduce((n, e) => n + e.exercise.elapsedTime, 0))}</p></div><ChevronDown size={17} /></summary>
            {dayEntries.map(({ session, exercise: recorded }) => <div key={session.id} className="progress-date-session"><h3>{session.workoutName} · {new Date(session.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</h3>
              <SetTable exercise={recorded} /><Link className="text-link small" to={`/app/history/session/${session.id}`}>Ver sessão completa</Link></div>)}
          </details>;
        })}
        {dates.length > limit && <div className="history-more"><Button variant="ghost" size="sm" onClick={() => setLimit(limit + 10)}>Ver mais registros</Button></div>}
      </section>
    </>}
    <CycleComparisonSheet key={id} open={compare} onOpenChange={setCompare} exerciseId={id} />
  </div>;
}
