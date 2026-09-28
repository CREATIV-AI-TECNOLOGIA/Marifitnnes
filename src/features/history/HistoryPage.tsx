import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Button, EmptyState, IconButton, SegmentedControl, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import type { TrainingSession } from '../../types';
import { dateLabel, duration } from '../../utils/format';
import { completedSessions, dateKey, localDate, sessionSetCount } from './analytics';
import './history.css';

function SessionRow({ session }: { session: TrainingSession }) {
  return <Link className="history-session" to={`/app/history/session/${session.id}`}>
    <div className="history-day-stamp"><strong>{new Date(session.startedAt).getDate()}</strong>
      <span>{dateLabel(session.startedAt, { weekday: 'short' }).replace('.', '')}</span></div>
    <div className="history-session-copy"><strong>{session.workoutName}</strong>
      <p>{duration(session.elapsedTime)} · {sessionSetCount(session)} séries · {new Date(session.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p></div>
    <ChevronRight size={16} aria-hidden="true" />
  </Link>;
}

export default function HistoryPage() {
  const history = useAppStore(s => s.history);
  const all = completedSessions(history);
  const [view, setView] = useState('list');
  const [workout, setWorkout] = useState('all');
  const [limit, setLimit] = useState(6);
  const [month, setMonth] = useState(() => {
    const date = new Date(all[0]?.startedAt ?? Date.now());
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const workouts = [...new Map(all.map(s => [s.workoutId, s.workoutName])).entries()];
  const filtered = all.filter(s => workout === 'all' || s.workoutId === workout);
  const groups = new Map<string, TrainingSession[]>();
  for (const session of filtered.slice(0, limit)) {
    const key = dateKey(session.startedAt).slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), session]);
  }
  const monthKey = dateKey(month).slice(0, 7);
  const monthSessions = filtered.filter(s => dateKey(s.startedAt).startsWith(monthKey));
  const performedDays = new Set(monthSessions.map(s => dateKey(s.startedAt)));
  const activeDay = selectedDay && performedDays.has(selectedDay) ? selectedDay : monthSessions[0] ? dateKey(monthSessions[0].startedAt) : null;
  const offset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const moveMonth = (amount: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
    setSelectedDay(null);
  };

  return <div className="page history-page">
    <TopBar title="Histórico" eyebrow="Cada treino conta" />
    {!all.length ? <EmptyState icon={<History />} title="Sua história começa no próximo treino"
      description="As sessões finalizadas aparecem aqui, com suas séries, cargas e notas."
      action={<Link className="text-link" to="/app/workouts">Ver meus treinos</Link>} /> : <>
      <div className="history-toolbar">
        <label className="history-sr" htmlFor="history-workout">Filtrar por treino</label>
        <select id="history-workout" className="input" value={workout} onChange={e => { setWorkout(e.target.value); setLimit(6); setSelectedDay(null); }}>
          <option value="all">Todos os treinos</option>{workouts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <SegmentedControl value={view} onChange={setView} options={[{ value: 'list', label: 'Lista' }, { value: 'calendar', label: 'Calendário' }]} />
      </div>
      {view === 'list' ? <>
        {!filtered.length && <EmptyState title="Nenhuma sessão" description="Escolha outro treino para consultar seu histórico." />}
        {[...groups].map(([key, sessions]) => <section key={key}>
          <h2 className="history-month">{dateLabel(localDate(`${key}-01`).getTime(), { month: 'long', year: 'numeric' })}</h2>
          <div className="history-list">{sessions.map(s => <SessionRow key={s.id} session={s} />)}</div>
        </section>)}
        {filtered.length > limit && <div className="history-more"><Button variant="ghost" onClick={() => setLimit(limit + 6)}>Ver mais sessões</Button></div>}
      </> : <>
        <section className="history-calendar" aria-label="Calendário de treinos">
          <div className="history-calendar-head"><IconButton label="Mês anterior" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></IconButton>
            <h2 aria-live="polite">{dateLabel(+month, { month: 'long', year: 'numeric' })}</h2>
            <IconButton label="Próximo mês" onClick={() => moveMonth(1)}><ChevronRight size={18} /></IconButton></div>
          <div className="history-calendar-grid">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => <span className="history-weekday" key={day}>{day}</span>)}
            {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = new Date(month.getFullYear(), month.getMonth(), i + 1);
              const key = dateKey(d);
              const performed = performedDays.has(key);
              return <button key={key} className="history-calendar-day" disabled={!performed} data-performed={performed}
                aria-pressed={key === activeDay} aria-label={`${dateLabel(+d)}${performed ? ', treino realizado' : ', sem treino'}`}
                onClick={() => setSelectedDay(key)}>{i + 1}</button>;
            })}
          </div>
          <p className="history-calendar-key">{performedDays.size} dias com treino · Toque em um dia marcado.</p>
        </section>
        {activeDay ? <section aria-live="polite"><h2 className="history-month">{dateLabel(+localDate(activeDay))}</h2>
          <div className="history-list">{monthSessions.filter(s => dateKey(s.startedAt) === activeDay).map(s => <SessionRow key={s.id} session={s} />)}</div>
        </section> : <EmptyState icon={<CalendarDays />} title="Um mês sem registros" description="Navegue pelos meses para encontrar os treinos realizados." />}
      </>}
    </>}
  </div>;
}
