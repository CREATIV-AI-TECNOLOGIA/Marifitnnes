import type { SessionExercise } from '../../types';
import { useAppStore } from '../../stores/use-app-store';
import { number, toDisplayWeight } from '../../utils/format';

export default function SetTable({ exercise }: { exercise: SessionExercise }) {
  const unit = useAppStore(s => s.preferences.unit);
  if (!exercise.sets.length) return <p className="muted small">Nenhuma série registrada.</p>;
  return <div className="history-set-wrap"><table className="history-sets">
    <caption className="history-sr">Séries de {exercise.name}</caption>
    <thead><tr><th>Série</th><th>Reps / meta</th><th>{unit}</th><th>Feita</th></tr></thead>
    <tbody>{exercise.sets.map((set, i) => <tr key={`${set.setNumber}-${i}`} className={set.completed ? '' : 'history-unfinished'}>
      <td>{set.setNumber}</td><td>{set.completed ? set.performedReps : '-'}<small>{set.targetReps}</small></td>
      <td>{set.completed ? number(toDisplayWeight(set.weight, unit)) : '-'}</td>
      <td><span aria-label={set.completed ? 'Concluída' : 'Não concluída'}>{set.completed ? 'Sim' : 'Não'}</span></td>
    </tr>)}</tbody>
  </table></div>;
}
