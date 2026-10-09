import { Button, Sheet } from '../../components/ui';
import type { Preferences, SessionSet } from '../../types';
import { number, toDisplayWeight, toKg } from '../../utils/format';
import NumberInput from './NumberInput';

interface WeightSheetProps {
  set: SessionSet | undefined;
  unit: Preferences['unit'];
  onClose: () => void;
  onChange: (weight: number) => void;
}

export default function WeightSheet({ set, unit, onClose, onChange }: WeightSheetProps) {
  const weight = toDisplayWeight(set?.weight ?? 0, unit);
  return (
    <Sheet open={!!set} onOpenChange={open => { if (!open) onClose(); }} title={`Carga da série ${set?.setNumber ?? ''}`} description={`Ajustes em ${unit}, salvos automaticamente nesta série.`} className="session-sheet">
      {set && <div className="stack session-weight-sheet">
        <label className="field" htmlFor="session-sheet-weight">Carga ({unit})
          <NumberInput key={`${set.setNumber}-${unit}`} id="session-sheet-weight" value={weight} step={0.1} onValueChange={value => onChange(toKg(value, unit))} />
        </label>
        <div className="session-weight-steps">
          {[-5, -2.5, 2.5, 5].map(step => <Button key={step} variant="secondary" disabled={weight + step < 0} onClick={() => onChange(toKg(Math.max(0, Math.round((weight + step) * 10) / 10), unit))} aria-label={`${step > 0 ? 'Adicionar' : 'Remover'} ${number(Math.abs(step))} ${unit}`}>{step > 0 ? '+' : ''}{number(step)}</Button>)}
        </div>
        <p className="small muted">A mudança vale apenas para esta série. Zero é uma carga válida para exercícios com peso corporal.</p>
        <Button variant="primary" onClick={onClose}>Pronto</Button>
      </div>}
    </Sheet>
  );
}
