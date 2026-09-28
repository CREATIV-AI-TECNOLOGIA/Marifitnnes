import { motion, useReducedMotion } from 'framer-motion';
import { Check, SlidersHorizontal } from 'lucide-react';
import { IconButton } from '../../components/ui';
import type { Preferences, SessionSet } from '../../types';
import { number, toDisplayWeight, toKg } from '../../utils/format';
import NumberInput from './NumberInput';
import type { PreviousSet } from './session-utils';

interface SetRowProps {
  exerciseId: string;
  set: SessionSet;
  previous: PreviousSet;
  preferences: Preferences;
  onChange: (patch: Partial<SessionSet>) => void;
  onToggle: () => void;
  onOpenWeight: (fromFocus?: boolean) => void;
}

export default function SetRow({ exerciseId, set, previous, preferences, onChange, onToggle, onOpenWeight }: SetRowProps) {
  const reducedMotion = useReducedMotion();
  const weight = toDisplayWeight(set.weight, preferences.unit);
  const inputId = `session-${exerciseId}-${set.setNumber}`;
  const previousParts = [
    previous.performedReps === undefined ? null : `${number(previous.performedReps)} reps`,
    previous.weight === undefined ? null : `${number(toDisplayWeight(previous.weight, preferences.unit))} ${preferences.unit}`,
  ].filter(Boolean);

  return <article className={`session-set ${set.completed ? 'is-complete' : ''}`} aria-label={`Série ${set.setNumber}`}>
    <div className="row session-set-heading"><span className="session-set-number">{String(set.setNumber).padStart(2, '0')}</span><span className="small"><span className="muted">Meta </span><strong>{set.targetReps}</strong></span></div>
    <div className="session-set-fields">
      <div className="field"><label htmlFor={`${inputId}-reps`}>Repetições</label>
        <NumberInput id={`${inputId}-reps`} value={set.performedReps} onValueChange={performedReps => onChange({ performedReps })} />
      </div>
      <div className="field"><label htmlFor={`${inputId}-weight`}>Carga <span className="muted">({preferences.unit})</span></label>
        <div className="session-weight-field">
          <NumberInput id={`${inputId}-weight`} value={weight} step={0.1} onValueChange={value => onChange({ weight: toKg(value, preferences.unit) })} onFocus={() => onOpenWeight(true)} />
          <IconButton label={`Ajustar carga da série ${set.setNumber}`} onClick={() => onOpenWeight()}><SlidersHorizontal size={17} /></IconButton>
        </div>
      </div>
      <div className="session-check-field"><motion.button type="button" role="checkbox" aria-checked={set.completed} aria-label={`${set.completed ? 'Desmarcar' : 'Concluir'} série ${set.setNumber}`} className="session-check" whileTap={reducedMotion ? undefined : { scale: .9 }} onClick={onToggle}>
        <motion.span key={String(set.completed)} initial={reducedMotion ? false : { scale: .5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 450, damping: 20 }}>{set.completed ? <Check size={23} strokeWidth={2.5} /> : <span className="session-check-dot" />}</motion.span>
      </motion.button><span className="session-check-label">{set.completed ? 'Feita' : 'Marcar'}</span></div>
      {preferences.showPrevious && <p className="session-previous-summary" aria-label={previousParts.length ? `Desempenho anterior: ${previousParts.join(' · ')}` : 'Sem desempenho anterior registrado'}>{previousParts.length ? `Antes: ${previousParts.join(' · ')}` : 'Sem registro anterior'}</p>}
    </div>
  </article>;
}
