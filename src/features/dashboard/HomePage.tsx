import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, ChevronRight, Dumbbell, Play, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import type { ProgramFrequency, TrainingProgram } from '../../types';
import './dashboard.css';

function todayCode(startedAt: string, program: TrainingProgram, agenda: ProgramFrequency) {
  const [year, month, day] = startedAt.split('-').map(Number);
  const start = new Date(year, month - 1, day, 12);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const week = Math.floor((monday.getTime() - start.getTime()) / 604800000);
  if (week < 0) return null;
  const cycleWeek = (week % Math.max(1, program.cycleWeeks)) + 1;
  const row = agenda.weeks.find(item => item.week === cycleWeek) ?? agenda.weeks[week % agenda.weeks.length];
  return row?.days[(today.getDay() + 6) % 7] ?? null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAppStore(state => state.user);
  const programs = useAppStore(state => state.programs);
  const activeAgenda = useAppStore(state => state.activeAgenda);
  const workouts = useAppStore(state => state.workouts);
  const history = useAppStore(state => state.history);
  const session = useAppStore(state => state.activeSession);
  const startSession = useAppStore(state => state.startSession);
  const choices = useAppStore(state => state.agendaChoices);
  const program = programs.find(item => item.id === activeAgenda?.programId);
  const frequency = program?.frequencies.find(item => item.frequency === activeAgenda?.frequency);
  const cycleWorkouts = workouts.filter(item => item.cycleId === activeAgenda?.cycleId && item.exerciseIds.length > 0);
  const scheduled = program && frequency && activeAgenda ? todayCode(activeAgenda.startedAt, program, frequency) : null;
  const options = scheduled?.split('/').filter(Boolean) ?? [];
  const chosen = activeAgenda ? choices[`${activeAgenda.programId}:${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`] : undefined;
  const code = chosen && options.includes(chosen) ? chosen : options[0];
  const todayWorkout = cycleWorkouts.find(item => item.programCode === code);
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const name = user?.name.trim().split(/\s+/)[0];

  function startWorkout(id: string) {
    const sessionId = startSession(id);
    if (!sessionId) {
      toast.info('Cadastre os exercícios deste treino antes de iniciar.');
      navigate(`/app/workouts/builder?workoutId=${encodeURIComponent(id)}`);
      return;
    }
    navigate(`/app/session/${sessionId}`);
  }

  if (!programs.length && workouts.length === 0) return <div className="page home-page home-simple">
    <header className="home-header"><div><p className="eyebrow">{greeting}{name ? `, ${name}` : ''}</p><h1>Seu próximo treino começa com uma agenda.</h1></div></header>
    <EmptyState icon={<CalendarDays />} title="Adicione sua agenda" description="Importe o PDF do programa e escolha quantos dias por semana quer treinar." action={<Link className="btn btn-primary" to="/app/workouts/import"><Plus size={16} />Importar agenda</Link>} />
  </div>;

  return <div className="page home-page home-simple">
    <header className="home-header"><div><p className="eyebrow">{greeting}{name ? `, ${name}` : ''}</p><h1>Pronto para hoje?</h1></div><Link to="/app/profile" className="home-avatar" aria-label="Abrir seu perfil">{name?.slice(0, 2).toUpperCase() ?? 'EU'}</Link></header>

    {session && <section className="home-current-session card"><div><span className="badge badge-accent">TREINO EM ANDAMENTO</span><h2>{session.workoutName}</h2><p className="small muted">Continue de onde parou.</p></div><Button onClick={() => navigate(`/app/session/${session.id}`)}>Continuar<ArrowRight size={16} /></Button></section>}

    {!program || !activeAgenda || !frequency ? <section className="home-empty-agenda card">
      <CalendarDays size={22} /><div><h2>Escolha sua agenda</h2><p className="small muted">{programs.length ? 'Selecione um programa e defina sua frequência semanal.' : 'Importe um PDF para começar.'}</p></div>
      <Link className="btn btn-primary" to={programs.length ? '/app/agenda' : '/app/workouts/import'}>{programs.length ? 'Abrir agenda' : 'Importar PDF'}<ChevronRight size={16} /></Link>
    </section> : <>
      <section className="home-today-card card">
        <div className="row between"><div><p className="eyebrow">TREINO DE HOJE</p><h2>{todayWorkout?.name ?? (scheduled === 'Descanso' ? 'Dia de descanso' : scheduled ? 'Nenhum treino disponível' : 'Agenda ativa')}</h2></div><Link to="/app/agenda" className="home-today-calendar" aria-label="Abrir calendário"><CalendarDays size={19} /></Link></div>
        {scheduled && scheduled !== 'Descanso' ? <>
          <p className="muted small">{program.name}{todayWorkout?.subtitle ? ` · ${todayWorkout.subtitle}` : ''}</p>
          {todayWorkout ? <div className="home-today-actions">
            <Button variant="primary" onClick={() => startWorkout(todayWorkout.id)}><Play size={15} fill="currentColor" />Iniciar treino</Button>
            <Link className="text-link" to={`/app/workouts/${todayWorkout.id}`}>Ver exercícios<ChevronRight size={15} /></Link>
          </div> : <p className="small muted">A agenda prevê um treino hoje, mas a ficha detalhada não foi incluída nos PDFs recebidos.</p>}
        </> : <p className="muted small">{scheduled === 'Descanso' ? 'A agenda prevê descanso hoje. Confira os próximos dias no calendário.' : 'Confira sua agenda mensal.'}</p>}
      </section>

      <section className="home-workouts-section">
        <div className="row between"><div><p className="eyebrow">SUA AGENDA</p><h2>{program.name}</h2></div><Link className="text-link small" to="/app/agenda">Calendário<ChevronRight size={14} /></Link></div>
        <div className="home-workout-list">
          {cycleWorkouts.map(workout => {
            const last = history.find(item => item.workoutId === workout.id);
            return <article key={workout.id} className="home-workout-row card">
              <div className="home-workout-symbol"><Dumbbell size={17} /></div>
              <div className="home-workout-row-copy"><strong>{workout.name}</strong><span>{workout.subtitle || 'Exercícios ainda não cadastrados'}</span><small>{workout.exerciseIds.length} exercícios{last ? ` · último treino ${new Date(last.startedAt).toLocaleDateString('pt-BR')}` : ''}</small></div>
              <Link className="home-workout-view" to={`/app/workouts/${workout.id}`}>Ver exercícios<ChevronRight size={14} /></Link>
            </article>;
          })}
        </div>
      </section>
    </>}
  </div>;
}
