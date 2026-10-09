import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../stores/use-app-store';
import { studioWorkouts, studioExercises } from '../../data/studio-catalog';
import { FinishedSummary } from './FinishPage';

vi.hoisted(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
});
afterAll(() => vi.unstubAllGlobals());

describe('navegação após finalizar o treino', () => {
  it('oferece o endereço da sessão salva no histórico', () => {
    const initialState = useAppStore.getState();

    try {
      useAppStore.setState({workouts:structuredClone(studioWorkouts),exercises:structuredClone(studioExercises)});
      const sessionId = initialState.startSession('studio-pro-a1');
      expect(sessionId).toBeTruthy();
      expect(useAppStore.getState().finishSession('Nota de teste')).toBe(sessionId);
      const saved = useAppStore.getState().history.find(session => session.id === sessionId);
      expect(saved).toBeDefined();
      const html = renderToStaticMarkup(<MemoryRouter>
        <FinishedSummary session={saved!} />
      </MemoryRouter>);
      expect(html).toContain('Treino registrado.');
      expect(html).toContain(`href="/app/history/session/${encodeURIComponent(sessionId)}"`);
    } finally {

      useAppStore.setState(initialState, true);
    }
  });
});
