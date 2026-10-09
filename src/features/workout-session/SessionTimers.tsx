import { useState } from 'react';
import { Clock3, Timer, X } from 'lucide-react';
import { Button, IconButton, SegmentedControl, Sheet } from '../../components/ui';
import { useNow } from '../../hooks/use-timer';
import { clock } from '../../utils/format';
import type { RestTimerState } from './use-rest-timer';

export function SessionClock({ startedAt, elapsed = 0, label }: { startedAt?: number; elapsed?: number; label: string }) {
  const now = useNow();
  const seconds = elapsed + (startedAt ? Math.max(0, now - startedAt) / 1000 : 0);
  return <span className="session-clock" role="timer" aria-label={`${label}: ${clock(seconds)}`} aria-live="off"><Clock3 size={14} aria-hidden="true" /><span>{clock(seconds)}</span></span>;
}

interface RestTimerProps {
  timer: RestTimerState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoRest: boolean;
  onAutoRestChange: (enabled: boolean) => void;
  suggestedSeconds: number;
}

export default function RestTimer({ timer, open, onOpenChange, autoRest, onAutoRestChange, suggestedSeconds }: RestTimerProps) {
  const [preset, setPreset] = useState('60');
  const [custom, setCustom] = useState('');
  const selectedSeconds = preset === 'custom' ? Number(custom) : Number(preset);
  const valid = Number.isInteger(selectedSeconds) && selectedSeconds > 0 && selectedSeconds <= 3600;
  return (
    <>
      {timer.active && !open && <div className="session-rest-float">
        <button type="button" className="session-rest-open" onClick={() => onOpenChange(true)} aria-label={`Descanso: ${clock(timer.remaining)}. Abrir opções`}>
          <Timer size={18} /><span>Descanso</span><strong role="timer" aria-live="off">{timer.remaining >= 3600 ? clock(timer.remaining) : clock(timer.remaining).slice(3)}</strong>
        </button>
        <IconButton label="Encerrar descanso" onClick={timer.stop}><X size={16} /></IconButton>
      </div>}
      <Sheet open={open} onOpenChange={onOpenChange} title="Seu intervalo" description="Respire. O próximo movimento pode esperar." className="session-sheet">
        <div className="stack session-rest-sheet">
          {timer.active && <div className="session-rest-current"><span className="eyebrow">Descanso em andamento</span><strong role="timer" aria-live="off">{clock(timer.remaining)}</strong><Button variant="ghost" onClick={timer.stop}>Encerrar descanso</Button></div>}
          <label className="session-auto-rest">
            <span><strong>Descanso automático</strong><span className="small muted">Começar ao marcar uma série. Sugestão deste exercício: {suggestedSeconds}s.</span></span>
            <input type="checkbox" role="switch" checked={autoRest} onChange={event => onAutoRestChange(event.target.checked)} />
          </label>
          <div className="field"><span>Duração do descanso</span>
            <SegmentedControl label="Duração do descanso" value={preset} onChange={setPreset} options={[{ value: '30', label: '30s' }, { value: '60', label: '60s' }, { value: '90', label: '90s' }, { value: '120', label: '2min' }, { value: 'custom', label: 'Outro' }]} />
          </div>
          {preset === 'custom' && <label className="field" htmlFor="session-custom-rest">Personalizado (segundos)
            <input className="input" id="session-custom-rest" type="number" inputMode="numeric" min={1} max={3600} step={1} value={custom} onChange={event => setCustom(event.target.value)} aria-describedby="session-rest-help" />
            <span id="session-rest-help" className="small muted">De 1 a 3.600 segundos.</span>
          </label>}
          <Button variant="primary" disabled={!valid} onClick={() => { timer.start(selectedSeconds); onOpenChange(false); }}>{timer.active ? 'Reiniciar descanso' : 'Iniciar descanso'}</Button>
          <p className="small muted">O contador continua ao fechar esta janela. A vibração depende do dispositivo; fora da página, o aviso pode ser adiado até você voltar.</p>
        </div>
      </Sheet>
    </>
  );
}
