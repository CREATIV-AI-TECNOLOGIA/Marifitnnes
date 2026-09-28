import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Check, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { weekdayNames } from '../../services/agenda-parser';
import type { TrainingProgram } from '../../types';
import './imports.css';

export default function ReviewPage() {
  const navigate = useNavigate();
  const draft = useAppStore(state => state.draft);
  const setDraft = useAppStore(state => state.setDraft);
  const saveProgram = useAppStore(state => state.saveProgram);
  const [name, setName] = useState(draft?.name ?? '');

  useEffect(() => setName(draft?.name ?? ''), [draft?.name]);

  if (!draft) return <div className="page"><TopBar title="Revisar agenda" back="/app/workouts/import" /><EmptyState icon={<FileText />} title="Nada para revisar" description="Escolha um PDF de agenda para importar os dias de treino e as frequências disponíveis." action={<Link className="btn btn-primary" to="/app/workouts/import">Escolher PDF</Link>} /></div>;

  function save() {
    if (!draft || !draft.cycleWeeks || !draft.frequencies.length || !name.trim()) return;
    const program: TrainingProgram = { ...draft, id: `program-${crypto.randomUUID()}`, name: name.trim(), cycleWeeks: draft.cycleWeeks };
    saveProgram(program);
    toast.success('Agenda salva neste dispositivo.');
    navigate('/app/agenda');
  }

  return (
    <div className="page review-page">
      <TopBar title="Revisar agenda" back="/app/workouts/import" eyebrow="Confira antes de salvar" />
      <section className="agenda-review-heading card">
        <CalendarDays size={22} />
        <div><h2>Agenda reconhecida</h2><p>{draft.cycleWeeks ?? 'Duração não identificada'} semanas · {draft.frequencies.length} frequências</p></div>
      </section>
      <label className="field agenda-program-name" htmlFor="agenda-name">Nome desta agenda
        <input id="agenda-name" className="input" value={name} onChange={event => setName(event.target.value)} maxLength={80} />
      </label>
      <p className="review-source small muted"><FileText size={13} />{draft.sourceFile} · {draft.description}</p>

      <section className="agenda-frequencies">
        <div className="row between"><h2 className="section-title">Frequências e divisão semanal</h2><span className="muted small">Encontradas no PDF</span></div>
        {draft.frequencies.map(frequency => (
          <article className="agenda-frequency-card card" key={frequency.frequency}>
            <header><strong>{frequency.frequency}x por semana</strong><span className="muted small">{frequency.weeks.length} semanas na agenda</span></header>
            <div className="agenda-week-grid" role="table" aria-label={`Agenda de ${frequency.frequency} vezes por semana`}>
              {weekdayNames().map(day => <span key={day} className="agenda-weekday" role="columnheader">{day.slice(0, 3)}</span>)}
              {frequency.weeks[0]?.days.map((entry, index) => <span key={`${frequency.frequency}-${index}`} className={`agenda-week-cell ${entry !== 'Descanso' ? 'has-workout' : ''}`} role="cell">{entry.split('/').join(' / ')}</span>)}
            </div>
            <p className="small muted">{frequency.note ?? `A tabela do PDF se repete durante o ciclo de ${draft.cycleWeeks} semanas.`}</p>
          </article>
        ))}
      </section>

      <aside className="agenda-import-note card">
        <strong>Os PDFs não trazem exercícios detalhados.</strong>
        <p className="small muted">Depois de ativar a agenda, cadastre os exercícios reais de cada treino. Nenhum exercício fictício será adicionado.</p>
      </aside>

      <div className="sticky-actions review-actions">
        <Button variant="secondary" onClick={() => navigate('/app/workouts/import')}><Plus size={16} />Outro PDF</Button>
        <Button variant="primary" onClick={save} disabled={!name.trim() || !draft.cycleWeeks}><Check size={16} />Salvar agenda</Button>
      </div>
    </div>
  );
}
