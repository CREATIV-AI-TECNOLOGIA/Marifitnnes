import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { cloudEnabled, confirmCloudPdf, flushCloud } from '../../services/cloud';
import './imports.css';

export default function ReviewPage() {
  const navigate = useNavigate();
  const draft = useAppStore(state => state.pdfDraft);
  const save = useAppStore(state => state.savePdfImport);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!draft) return <div className="page import-page"><TopBar title="Importar PDF" back="/app/settings" /><EmptyState title="Escolha um PDF" description="Adicione um treino ou uma agenda." action={<Link className="btn btn-primary" to="/app/workouts/import">Escolher PDF</Link>} /></div>;

  async function confirm() {
    if (!draft || saving) return;
    setSaving(true);
    try {
      if (cloudEnabled) await confirmCloudPdf(draft);
      save(draft);
      if (cloudEnabled) await flushCloud();
      navigate(draft.agenda ? '/app/agenda' : `/app/workouts/${draft.workout!.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. A importação permanece aberta.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="page import-page">
    <TopBar title={draft.workout ? 'Adicionar treino' : 'Adicionar agenda'} back="/app/workouts/import" />
    <section className="card source-heading">
      <h2>{draft.workout ? `${draft.workout.name} · ${draft.workout.subtitle}` : draft.agenda!.name}</h2>
      <p>{draft.workout ? `${draft.exercises.length} exercícios` : `${draft.agenda!.cycleWeeks} semanas · ${draft.agenda!.frequencies.length} frequências`}</p>
      <p className="small muted">{draft.source.name} · {draft.source.pageCount} páginas</p>
    </section>
    {draft.warnings.length > 0 && <aside className="card source-warnings"><h2>Confira antes de adicionar</h2>{draft.warnings.map(warning => <p key={warning}>{warning}</p>)}</aside>}
    {draft.workout && <ol className="card source-exercise-list" aria-label="Exercícios importados">
      {draft.exercises.map(exercise => <li key={exercise.id}><span>{exercise.name}</span><small>Página {exercise.sourcePage} · {exercise.targets.length} {exercise.targets.length === 1 ? 'série' : 'séries'}</small></li>)}
    </ol>}
    {error && <p className="error-text" role="alert">{error}</p>}
    <Button className="btn-block import-confirm" disabled={saving} onClick={confirm}>{saving ? 'Salvando…' : draft.agenda ? 'Adicionar agenda' : 'Adicionar treino'}</Button>
  </div>;
}
