import { useState } from 'react';
import { ArrowRight, Layers3 } from 'lucide-react';
import { Badge, EmptyState, Sheet } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { duration, number, toDisplayWeight } from '../../utils/format';
import { exerciseEntries, exerciseLoad, exerciseVolume } from '../history/analytics';
import './progress.css';

export default function CycleComparisonSheet({ open, onOpenChange, exerciseId, cycleId }: { open: boolean; onOpenChange: (open: boolean) => void; exerciseId?: string; cycleId?: string }) {
  const cycles = useAppStore(s => s.cycles);
  const history = useAppStore(s => s.history);
  const unit = useAppStore(s => s.preferences.unit);
  const ordered = [...cycles].sort((a, b) => b.start.localeCompare(a.start));
  const [currentChoice, setCurrentChoice] = useState('');
  const [previousChoice, setPreviousChoice] = useState('');
  const [exerciseChoice, setExerciseChoice] = useState('');
  const current = cycles.find(c => c.id === currentChoice) ?? cycles.find(c => c.id === cycleId) ?? cycles.find(c => c.current) ?? ordered[0];
  const previous = cycles.find(c => c.id === previousChoice && c.id !== current?.id)
    ?? ordered.find(c => c.id !== current?.id && c.start < (current?.start ?? ''))
    ?? ordered.find(c => c.id !== current?.id);
  const currentSessions = history.filter(s => s.cycleId === current?.id && s.status === 'completed');
  const previousSessions = history.filter(s => s.cycleId === previous?.id && s.status === 'completed');
  const ids = new Set(previousSessions.flatMap(s => s.exercises.filter(e => e.sets.some(set => set.completed) || e.elapsedTime > 0).map(e => e.id)));
  const common = [...new Map(currentSessions.flatMap(s => s.exercises
    .filter(e => ids.has(e.id) && (e.sets.some(set => set.completed) || e.elapsedTime > 0)).map(e => [e.id, e.name] as const))).entries()];
  const selected = common.find(([id]) => id === exerciseChoice)?.[0] ?? common.find(([id]) => id === exerciseId)?.[0] ?? common[0]?.[0] ?? '';
  const currentEntries = exerciseEntries(currentSessions, selected);
  const previousEntries = exerciseEntries(previousSessions, selected);
  const metrics = (entries: ReturnType<typeof exerciseEntries>) => {
    const loads = entries.map(({ exercise }) => exerciseLoad(exercise)).filter((v): v is number => v !== null);
    return {
      load: loads.length ? `${number(toDisplayWeight(Math.max(...loads), unit))} ${unit}` : 'Sem séries',
      time: entries.length ? duration(entries.reduce((n, e) => n + e.exercise.elapsedTime, 0) / entries.length) : '-',
      volume: `${number(toDisplayWeight(entries.reduce((n, e) => n + exerciseVolume(e.exercise), 0), unit))} ${unit} × reps`,
      frequency: `${new Set(entries.map(e => e.session.id)).size} sessões`,
    };
  };
  const a = metrics(previousEntries), b = metrics(currentEntries);
  const targets = (entries: ReturnType<typeof exerciseEntries>) => entries[0]?.exercise.sets.map(s => s.targetReps.trim().toLowerCase()).join('|');
  const hasStrategy = !!targets(currentEntries) && !!targets(previousEntries);
  const sameStrategy = hasStrategy && targets(currentEntries) === targets(previousEntries);
  return <Sheet open={open} onOpenChange={onOpenChange} title="Comparar ciclos" description="O mesmo exercício, em dois momentos." wide>
    <div className="progress-compare stack">
      {cycles.length < 2 ? <EmptyState icon={<Layers3 />} title="Um ciclo de cada vez" description="A comparação fica disponível quando houver dois ciclos com sessões do mesmo exercício." /> : <>
        <div className="grid-2">
          <label className="field">Ciclo de referência<select className="input" value={previous?.id ?? ''} onChange={e => setPreviousChoice(e.target.value)}>
            {ordered.filter(c => c.id !== current?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
          <label className="field">Comparar com<select className="input" value={current?.id ?? ''} onChange={e => { setCurrentChoice(e.target.value); setPreviousChoice(''); }}>
            {ordered.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        </div>
        {!common.length ? <EmptyState title="Ainda não há dados em comum" description="Escolha outros ciclos. É preciso registrar o mesmo exercício nos dois para comparar." /> : <>
          <label className="field">Exercício<select className="input" value={selected} onChange={e => setExerciseChoice(e.target.value)}>
            {common.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select></label>
          <div className="progress-comparison-head"><span>Referência</span><ArrowRight size={16} /><span>Comparação</span></div>
          <div className="progress-comparison-grid">
            {([['load', 'Maior carga'], ['time', 'Tempo médio / sessão'], ['volume', 'Volume total'], ['frequency', 'Frequência registrada']] as const).map(([key, title]) =>
              <div className="progress-comparison-row" key={key}><span>{title}</span><div><strong>{a[key]}</strong><ArrowRight size={13} /><strong>{b[key]}</strong></div></div>)}
          </div>
          {hasStrategy && <div className="progress-strategy"><Badge tone={sameStrategy ? 'accent' : 'neutral'}>{sameStrategy ? 'Estratégia semelhante' : 'Estratégia diferente'}</Badge>
            <p className="muted small">{sameStrategy ? 'Mesma quantidade de séries e mesmas metas de repetições' : 'Quantidade de séries ou metas de repetições diferentes'} no registro mais recente de cada ciclo. Não compara técnica de execução.</p></div>}
          <p className="muted small">Calculado com as sessões registradas neste dispositivo. Volume = carga × repetições concluídas. Frequência = sessões com este exercício; os ciclos podem ter durações diferentes. Menos tempo não significa necessariamente melhor desempenho.</p>
        </>}
      </>}
    </div>
  </Sheet>;
}
