import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ChevronRight, Search, TrendingUp } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button, EmptyState, IconButton, SegmentedControl, Sheet, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { duration, number, toDisplayWeight } from '../../utils/format';
import { completedSessions, dateKey, exerciseDays, exerciseEntries, inPeriod, periodOptions, sessionTime, sessionVolume, weeklySessions, type Period } from '../history/analytics';
import ProgressChart from './ProgressChart';
import CycleComparisonSheet from './CycleComparisonSheet';
import '../history/history.css';
import './progress.css';

export default function ProgressPage() {
  const history = useAppStore(s => s.history);
  const exercises = useAppStore(s => s.exercises);
  const unit = useAppStore(s => s.preferences.unit);
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState<Period>('30d');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [limit, setLimit] = useState(5);
  const [exerciseChoice, setExerciseChoice] = useState('');
  const [compare, setCompare] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const all = completedSessions(history);
  const sessions = inPeriod(history, period);
  const totalTime = sessions.reduce((n, s) => n + sessionTime(s), 0);
  const volume = sessions.reduce((n, s) => n + sessionVolume(s), 0);
  const days = new Set(sessions.map(s => dateKey(s.startedAt))).size;
  const daily = new Map<string, { date: string; volume: number; minutes: number }>();
  for (const s of sessions) {
    const key = dateKey(s.startedAt);
    const point = daily.get(key) ?? { date: key, volume: 0, minutes: 0 };
    point.volume += sessionVolume(s);
    point.minutes += sessionTime(s) / 60;
    daily.set(key, point);
  }
  const points = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  const names = new Map(exercises.map(e => [e.id, e.name]));
  for (const s of [...all].reverse()) for (const e of s.exercises) names.set(e.id, e.name);
  const library = [...names].map(([id, name]) => ({ id, name, entries: exerciseEntries(sessions, id) }));
  const recorded = library.filter(e => e.entries.length);
  const selectedId = recorded.find(e => e.id === exerciseChoice)?.id ?? recorded[0]?.id ?? '';
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visibleExercises = library.filter(e => normalize(e.name).includes(normalize(deferredQuery)))
    .sort((a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name, 'pt-BR'));
  const weekly = weeklySessions(sessions);

  return <div className="page progress-page">
    <TopBar title="Evolução" eyebrow="Seu ritmo, seus resultados" action={<IconButton label="Comparar ciclos" onClick={() => setCompare(true)}><ArrowLeftRight size={19} /></IconButton>} />
    <div className="progress-period"><SegmentedControl label="Período da evolução" value={period} onChange={v => setPeriod(v as Period)} options={periodOptions} /></div>
    {!all.length ? <EmptyState icon={<TrendingUp />} title="O primeiro passo vira progresso"
      description="Seus gráficos aparecem após finalizar um treino. Nenhuma estimativa substitui o que você registrou."
      action={<Link className="text-link" to="/app/workouts">Começar um treino</Link>} /> : <>
      <div className="progress-tabs"><SegmentedControl label="Indicador de evolução" value={tab} onChange={setTab} options={[
        { value: 'overview', label: 'Visão geral' }, { value: 'load', label: 'Carga' },
        { value: 'time', label: 'Tempo' }, { value: 'consistency', label: 'Constância' },
      ]} /></div>
      <motion.div key={tab} className="progress-tab-content" initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: .15 }}>
        {!sessions.length ? <EmptyState title="Sem treinos neste período" description="Experimente 3 meses, 6 meses ou todo o histórico." /> : <>
          {tab === 'overview' && <>
            <div className="history-facts"><div><strong>{sessions.length}</strong><span>Treinos</span></div><div><strong>{days}</strong><span>Dias ativos</span></div><div><strong>{duration(totalTime)}</strong><span>Tempo total</span></div></div>
            <section className="progress-panel"><h2>Volume movimentado</h2><p className="progress-headline"><strong>{number(toDisplayWeight(volume, unit))}</strong><span>{unit} × reps</span></p>
              <ProgressChart points={points.map(p => ({ date: p.date, value: toDisplayWeight(p.volume, unit) }))} label="Volume diário" unit={`${unit} × reps`} />
              <p className="progress-summary-note">Soma de carga × repetições das séries concluídas em cada dia. Varia também com a quantidade de exercícios.</p>
            </section>
          </>}
          {tab === 'load' && <section className="progress-panel"><h2>Maior carga por dia</h2>
            {recorded.length ? <><label className="history-sr" htmlFor="progress-exercise">Exercício da curva de carga</label>
              <select id="progress-exercise" className="input progress-inline-select" value={selectedId} onChange={e => setExerciseChoice(e.target.value)}>{recorded.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
              <ProgressChart points={exerciseDays(sessions, selectedId).map(p => ({ date: p.date, value: p.load === null ? null : toDisplayWeight(p.load, unit) }))} label="Maior carga" unit={unit} />
              <Link className="text-link small" to={`/app/progress/exercise/${selectedId}`}>Ver séries e recorde <ChevronRight size={13} /></Link>
            </> : <EmptyState title="Sem séries registradas" description="Registre as séries de um exercício para acompanhar a carga." />}
          </section>}
          {tab === 'time' && <section className="progress-panel"><h2>Tempo dedicado</h2><p className="progress-headline"><strong>{duration(totalTime / sessions.length)}</strong><span>por treino, em média</span></p>
            <ProgressChart points={points.map(p => ({ date: p.date, value: p.minutes }))} label="Tempo diário" unit="min" />
            <p className="progress-summary-note">{duration(totalTime)} registrados no período. O tempo da sessão inclui pausas; duração menor não implica maior evolução.</p>
          </section>}
          {tab === 'consistency' && <section className="progress-panel"><h2>Treinos por semana</h2><p className="progress-headline"><strong>{days}</strong><span>dias com treino</span></p>
            <ProgressChart points={weekly.map(p => ({ date: p.date, value: p.count }))} label="Treinos" bars />
            <p className="progress-summary-note">{weekly.filter(w => w.count > 0).length} semanas ativas. Semanas de segunda a domingo, entre o primeiro e o último registro do filtro; semanas sem treino aparecem com zero.</p>
          </section>}
        </>}
      </motion.div>
    </>}
    <div className="progress-library-action"><Button variant="secondary" onClick={() => setLibraryOpen(true)}><Search size={17} /> Buscar exercício <ChevronRight size={15} /></Button></div>
    <Sheet open={libraryOpen} onOpenChange={setLibraryOpen} title="Evolução por exercício" description="Busque um exercício para ver suas séries e recordes.">
    <section className="progress-library">
      <div className="progress-search"><Search size={17} /><label className="history-sr" htmlFor="exercise-search">Buscar exercício</label>
        <input id="exercise-search" className="input" type="search" placeholder="Buscar exercício" value={query} onChange={e => { setQuery(e.target.value); setLimit(5); }} /></div>
      {!visibleExercises.length ? <EmptyState title="Nenhum exercício encontrado" description="Tente outro nome ou registre seu primeiro exercício." /> : visibleExercises.slice(0, limit).map(e => {
        const loads = e.entries.flatMap(entry => entry.exercise.sets.filter(s => s.completed).map(s => s.weight));
        return <Link className="progress-exercise-link" key={e.id} to={`/app/progress/exercise/${e.id}`}><div><strong>{e.name}</strong><p>{e.entries.length ? `${e.entries.length} sessões no período` : 'Sem registros no período'}</p></div>
          <span>{loads.length ? `${number(toDisplayWeight(Math.max(...loads), unit))} ${unit}` : '-'}<ChevronRight size={15} /></span></Link>;
      })}
      {visibleExercises.length > limit && <div className="history-more"><Button variant="ghost" size="sm" onClick={() => setLimit(limit + 10)}>Ver mais exercícios</Button></div>}
    </section>
    </Sheet>
    <CycleComparisonSheet open={compare} onOpenChange={setCompare} />
  </div>;
}
