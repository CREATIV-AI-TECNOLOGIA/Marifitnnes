import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Preferences, SessionSet } from '../../types';
import { number, toDisplayWeight, toKg } from '../../utils/format';
import NumberInput from './NumberInput';
import type { PreviousSet } from './session-utils';

interface SetRowProps {
  exerciseId: string;
  set: SessionSet;
  previous: PreviousSet;
  preferences: Preferences;
  measurementLabel?: string;
  secondaryMovementName?: string;
  onChange: (patch: Partial<SessionSet>) => void;
  onToggle: () => void;
}

export default function SetRow({ exerciseId, set, previous, preferences, measurementLabel, secondaryMovementName, onChange, onToggle }: SetRowProps) {
  const reducedMotion = useReducedMotion();
  const weight = toDisplayWeight(set.weight, preferences.unit);
  const inputId = `session-${exerciseId}-${set.setNumber}`;
  const previousParts = [
    previous.performedReps === undefined ? null : `${number(previous.performedReps)} reps`,
    previous.weight === undefined ? null : `${number(toDisplayWeight(previous.weight, preferences.unit))} ${preferences.unit}`,
  ].filter(Boolean);

  return <article className={`session-set ${set.completed ? 'is-complete' : ''}`} aria-label={`Série ${set.setNumber}`}>
    <div className="row session-set-heading"><span className="session-set-number">Série {set.setNumber}</span><span className="small"><span className="muted">Meta </span><strong>{set.targetReps}{set.secondaryTargetReps ? ` + ${set.secondaryTargetReps}` : ''}</strong></span></div>
    <div className={`session-set-fields ${set.secondaryTargetReps && secondaryMovementName ? 'is-paired' : ''}`}>
      <div className="field"><label htmlFor={`${inputId}-reps`}>{measurementLabel ?? (set.secondaryTargetReps ? 'Pullover' : 'Repetições')}</label>
        <NumberInput id={`${inputId}-reps`} value={set.performedReps} onValueChange={performedReps => onChange({ performedReps })} />
      </div>
      {set.secondaryTargetReps && secondaryMovementName && <div className="field"><label htmlFor={`${inputId}-secondary-reps`}>{secondaryMovementName}</label>
        <NumberInput id={`${inputId}-secondary-reps`} value={set.secondaryPerformedReps ?? 0} onValueChange={secondaryPerformedReps => onChange({ secondaryPerformedReps })} />
      </div>}
      <div className="field"><label htmlFor={`${inputId}-weight`}>Carga <span className="muted">({preferences.unit})</span></label>
        <NumberInput id={`${inputId}-weight`} value={weight} step={0.1} onValueChange={value => onChange({ weight: toKg(value, preferences.unit) })} />
      </div>
      <div className="session-check-field"><motion.button type="button" role="checkbox" aria-checked={set.completed} aria-label={`${set.completed ? 'Desmarcar' : 'Concluir'} série ${set.setNumber}`} className="session-check" whileTap={reducedMotion ? undefined : { scale: .9 }} onClick={onToggle}>
        <motion.span key={String(set.completed)} initial={reducedMotion ? false : { scale: .5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 450, damping: 20 }}>{set.completed ? <Check size={23} strokeWidth={2.5} /> : <span className="session-check-dot" />}</motion.span>
      </motion.button><span className="session-check-label">{set.completed ? 'Feita' : 'Marcar'}</span></div>
      {preferences.showPrevious && previousParts.length > 0 && <p className="session-previous-summary" aria-label={`Desempenho anterior: ${previousParts.join(' · ')}`}>Antes: {previousParts.join(' · ')}</p>}
    </div>
  </article>;
}
