import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface RestState { endsAt: number; duration: number; }
const storageKey = (sessionId: string) => `forma-session-rest:${sessionId}`;

function readRest(sessionId: string): RestState | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(sessionId)) ?? 'null');
    if (value && typeof value === 'object' && 'endsAt' in value && 'duration' in value
      && typeof value.endsAt === 'number' && Number.isFinite(value.endsAt)
      && typeof value.duration === 'number' && value.duration > 0 && value.duration <= 3600) {
      return { endsAt: value.endsAt, duration: value.duration };
    }
  } catch { /* Storage may be unavailable in private browsing. */ }
  return null;
}

export function clearRestTimer(sessionId: string) {
  try { localStorage.removeItem(storageKey(sessionId)); } catch { /* The in-memory timer still works. */ }
}

export function useRestTimer(sessionId: string) {
  const [rest, setRest] = useState<RestState | null>(() => readRest(sessionId));
  const [now, setNow] = useState(Date.now);
  const notified = useRef<number | null>(null);
  const remaining = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!rest) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [rest]);

  useEffect(() => {
    if (!rest || remaining > 0 || notified.current === rest.endsAt) return;
    notified.current = rest.endsAt;
    clearRestTimer(sessionId);
    setRest(null);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate?.([120, 70, 120]);
    toast.success('Descanso concluído. Vamos para a próxima série?', { id: `rest-${sessionId}` });
  }, [remaining, rest, sessionId]);

  return {
    remaining,
    active: rest !== null && remaining > 0,
    start(seconds: number) {
      if (!Number.isFinite(seconds) || seconds < 1 || seconds > 3600) return;
      const now = Date.now();
      const next = { endsAt: now + Math.round(seconds) * 1000, duration: Math.round(seconds) };
      setNow(now);
      setRest(next);
      try { localStorage.setItem(storageKey(sessionId), JSON.stringify(next)); } catch { /* Keep the timer usable without storage. */ }
    },
    stop() {
      clearRestTimer(sessionId);
      setRest(null);
    },
  };
}

export type RestTimerState = ReturnType<typeof useRestTimer>;
