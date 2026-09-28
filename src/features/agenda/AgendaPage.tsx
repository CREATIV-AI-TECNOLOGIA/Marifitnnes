import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, FilePlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import type { ProgramFrequency, TrainingProgram } from '../../types';
import { weekdayNames } from '../../services/agenda-parser';
import './agenda.css';

const weekdays = weekdayNames();

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function mondayOf(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return monday;
}

function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const start = mondayOf(first);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function frequencyFor(program: TrainingProgram, selected: number | null): ProgramFrequency | undefined {
  return program.frequencies.find(frequency => frequency.frequency === selected) ?? program.frequencies[0];
}

function scheduledEntry(date: Date, startedAt: string, program: TrainingProgram, frequency: ProgramFrequency) {
  const start = mondayOf(parseDate(startedAt));
  const current = mondayOf(date);
  const weeksSinceStart = Math.floor((current.getTime() - start.getTime()) / 604800000);
  if (weeksSinceStart < 0) return null;
  const cycleWeek = (weeksSinceStart % Math.max(1, program.cycleWeeks)) + 1;
  return frequency.weeks.find(week => week.week === cycleWeek)?.days[(date.getDay() + 6) % 7]
    ?? frequency.weeks[(cycleWeek - 1) % frequency.weeks.length]?.days[(date.getDay() + 6) % 7]
    ?? 'Descanso';
}

export default function AgendaPage() {
  const programs = useAppStore(state => state.programs);
  const active = useAppStore(state => state.activeAgenda);
  const preferredFrequency = useAppStore(state => state.preferredFrequency);
  const choices = useAppStore(state => state.agendaChoices);
  const workouts = useAppStore(state => state.workouts);
  const saveFrequency = useAppStore(state => state.setAgendaFrequency);
  const saveChoice = useAppStore(state => state.setAgendaChoice);
  const activateProgram = useAppStore(state => state.activateProgram);
  const [programId, setProgramId] = useState(active?.programId ?? programs[0]?.id ?? '');
  const [frequency, setFrequency] = useState<number | null>(active?.frequency ?? preferredFrequency);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));

  useEffect(() => {
    if (!programs.some(program => program.id === programId)) setProgramId(active?.programId ?? programs[0]?.id ?? '');
  }, [programs, programId, active?.programId]);

  const program = programs.find(item => item.id === programId);
  const includedCodes = program?.workoutCodes.filter(code => (program.exerciseTemplates?.[code]?.length ?? 0) > 0) ?? [];
  const activeProgram = !!program && active?.programId === program.id;
  const selectedFrequency = program
    ? activeProgram && frequency === active?.frequency
      ? frequencyFor(program, active.frequency)
      : frequencyFor(program, frequency ?? preferredFrequency)
    : undefined;
  const selectedFrequencyValue = selectedFrequency?.frequency ?? null;
  const calendar = useMemo(() => monthDays(month), [month]);

  useEffect(() => {
    if (program && !program.frequencies.some(item => item.frequency === frequency)) {
      setFrequency(activeProgram ? active?.frequency ?? program.frequencies[0]?.frequency ?? null : program.frequencies[0]?.frequency ?? null);
    }
  }, [program, frequency, activeProgram, active?.frequency]);

  function chooseProgram(id: string) {
    const next = programs.find(item => item.id === id);
    if (!next) return;
    setProgramId(id);
    setFrequency(active?.programId === id ? active.frequency : next.frequencies[0]?.frequency ?? null);
  }

  function applyAgenda() {
    if (!program || selectedFrequencyValue === null) return;
    if (activeProgram && selectedFrequencyValue !== active?.frequency) {
      saveFrequency(selectedFrequencyValue);
      setFrequency(selectedFrequencyValue);
      toast.success('Frequência atualizada para este ciclo.');
      return;
    }
    const cycleId = activateProgram(program.id, selectedFrequencyValue);
    if (!cycleId) toast.error('Não foi possível ativar essa frequência da agenda.');
    else toast.success('Agenda ativada. Ela continuará selecionada nos próximos meses.');
  }

  function changeChoice(date: string, options: string[]) {
    if (!program || options.length < 2) return;
    const current = choices[`${program.id}:${date}`] ?? options[0];
    const next = options[(options.indexOf(current) + 1) % options.length];
    saveChoice(program.id, date, next);
  }

  if (!programs.length) return <div className="page agenda-page">
    <TopBar title="Minha agenda" eyebrow="Escolha um plano e seu ritmo" />
    <EmptyState icon={<CalendarDays />} title="Nenhuma agenda adicionada" description="Importe um PDF com a divisão semanal para montar o calendário. A lista de exercícios não vem nesses dois materiais e deverá ser cadastrada depois." action={<Link className="btn btn-primary" to="/app/workouts/import"><FilePlus2 size={16} />Importar agenda</Link>} />
  </div>;

  return <div className="page agenda-page">
    <TopBar title="Minha agenda" eyebrow="Sua frequência fica salva neste dispositivo"
      action={<Link className="btn btn-secondary btn-sm" to="/app/workouts/import"><FilePlus2 size={15} />Importar PDF</Link>} />

    <section className="agenda-program-list" aria-label="Agendas disponíveis">
      {programs.map(item => <button key={item.id} type="button" className={`agenda-program-option ${item.id === programId ? 'is-selected' : ''}`} onClick={() => chooseProgram(item.id)}>
        <span><strong>{item.name}</strong><small>{item.focus} · ciclo de {item.cycleWeeks} semanas</small></span>
        {active?.programId === item.id && <span className="agenda-active-badge">Em uso</span>}
      </button>)}
    </section>

    {program && selectedFrequency && <>
      <section className="agenda-frequency-picker card">
        <div><p className="eyebrow">FREQUÊNCIA SEMANAL</p><h2>Quantos dias você vai treinar?</h2><p className="small muted">Selecione uma das opções descritas nesta agenda.</p></div>
        <div className="agenda-frequency-options">
          {program.frequencies.map(item => <button key={item.frequency} type="button" className={selectedFrequencyValue === item.frequency ? 'is-selected' : ''} onClick={() => setFrequency(item.frequency)} aria-pressed={selectedFrequencyValue === item.frequency}>{item.frequency}x</button>)}
        </div>
        {(!activeProgram || selectedFrequencyValue !== active?.frequency) && <Button variant="primary" className="btn-block" onClick={applyAgenda}>{activeProgram ? 'Salvar frequência' : 'Usar esta agenda'}<ChevronRight size={16} /></Button>}
        {activeProgram && selectedFrequencyValue === active?.frequency && <p className="agenda-persist-note">Frequência ativa: {active.frequency} dias por semana. A escolha continua nos próximos meses.</p>}
      </section>

      {activeProgram ? <section className="agenda-calendar-section">
        <div className="agenda-calendar-heading">
          <div><p className="eyebrow">CALENDÁRIO</p><h2>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2></div>
          <div className="agenda-month-controls">
            <button type="button" onClick={() => setMonth(value => new Date(value.getFullYear(), value.getMonth() - 1, 1, 12))} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => setMonth(value => new Date(value.getFullYear(), value.getMonth() + 1, 1, 12))} aria-label="Próximo mês"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="agenda-calendar card" role="grid" aria-label={`Agenda de ${month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}>
          {weekdays.map(day => <span key={day} className="agenda-calendar-weekday" role="columnheader">{day.slice(0, 3)}</span>)}
          {calendar.map(date => {
            const key = dateKey(date);
            const entry = scheduledEntry(date, active.startedAt, program, selectedFrequency);
            const options = entry?.split('/').filter(Boolean) ?? [];
            const stored = choices[`${program.id}:${key}`];
            const code = stored && options.includes(stored) ? stored : options[0];
            const workout = code ? workouts.find(item => item.cycleId === active.cycleId && item.programCode === code && item.exerciseIds.length > 0) : undefined;
            const isCurrentMonth = date.getMonth() === month.getMonth();
            return <article key={key} role="gridcell" className={`agenda-day ${isCurrentMonth ? '' : 'is-outside'} ${entry && entry !== 'Descanso' ? 'has-workout' : ''}`}>
              <span className="agenda-day-number">{date.getDate()}</span>
              {entry === 'Descanso' ? <span className="agenda-day-rest">—</span> : entry && code ? <>
                {options.length > 1 && <button type="button" className="agenda-day-code" onClick={() => changeChoice(key, options)} aria-label={`${weekdays[(date.getDay() + 6) % 7]} ${date.getDate()}: alternar treino ${options.join(' ou ')}`}>{code}</button>}
                {options.length === 1 && <span className="agenda-day-code">{code}</span>}
                {workout && <Link to={`/app/workouts/${workout.id}`} className="agenda-day-link">Ver treino</Link>}
              </> : <span className="agenda-day-rest">—</span>}
            </article>;
          })}
        </div>
        {selectedFrequency.note && <p className="agenda-calendar-note small muted">{selectedFrequency.note}</p>}
        <div className="agenda-code-list">
          {program.workoutCodes.filter(code => workouts.some(item => item.cycleId === active.cycleId && item.programCode === code && item.exerciseIds.length > 0)).map(code => {
            const workout = workouts.find(item => item.cycleId === active.cycleId && item.programCode === code && item.exerciseIds.length > 0);
            return <Link key={code} to={workout ? `/app/workouts/${workout.id}` : '/app/workouts'}><strong>{code}</strong><span>{program.workoutLabels[code] ?? `Treino ${code}`}</span><small>Ver exercícios</small></Link>;
          })}
        </div>
        {(() => {
          const ready = program.workoutCodes.filter(code => (program.exerciseTemplates?.[code]?.length ?? 0) > 0
            || workouts.some(workout => workout.cycleId === active.cycleId && workout.programCode === code && workout.exerciseIds.length > 0));
          const waiting = program.workoutCodes.length - ready.length;
          return <p className="agenda-cycle-note small muted">O PDF organiza um ciclo de {program.cycleWeeks} semanas. {ready.length ? `Só ${ready.join(', ')} aparece na lista de treinos porque é a ficha detalhada recebida. ${waiting} outros códigos permanecem apenas na agenda semanal, sem cards ou exercícios.` : 'Nenhuma ficha detalhada foi recebida para os códigos desta agenda.'}</p>;
        })()}
      </section> : <section className="agenda-frequency-preview card">
        <p className="eyebrow">VISUALIZAÇÃO DA DIVISÃO</p><h2>{selectedFrequency.frequency} dias por semana</h2>
        <p className="small muted">{includedCodes.length ? `Ficha${includedCodes.length > 1 ? 's' : ''} ${includedCodes.join(', ')} já incluída${includedCodes.length > 1 ? 's' : ''}.` : 'Ative a agenda para abrir o calendário e começar a cadastrar as fichas de exercício.'} {includedCodes.length ? 'Ative a agenda para abrir o calendário e iniciar os treinos disponíveis.' : ''}</p>
        <div className="agenda-preview-week">
          {weekdays.map((day, index) => <span key={day}><small>{day.slice(0, 3)}</small><strong>{selectedFrequency.weeks[0]?.days[index] ?? '—'}</strong></span>)}
        </div>
        <Button variant="primary" className="btn-block" onClick={applyAgenda}>Usar esta agenda<ChevronRight size={16} /></Button>
      </section>}
    </>}
  </div>;
}
