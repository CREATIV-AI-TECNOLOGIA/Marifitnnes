import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, expect, it, vi } from 'vitest';
import { preparePdfImport, verifiedSources } from '../../services/pdf-content';
import { useAppStore } from '../../stores/use-app-store';
import ReviewPage from './ReviewPage';

vi.hoisted(() => vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} }));
afterAll(() => vi.unstubAllGlobals());
vi.mock('../../stores/use-app-store', async importOriginal => {
  const actual = await importOriginal<typeof import('../../stores/use-app-store')>();
  const store = actual.useAppStore;
  return { ...actual, useAppStore: Object.assign(
    (selector: (state: ReturnType<typeof store.getState>) => unknown) => selector(store.getState()), store,
  ) };
});

it('mostra as três ambiguidades do A1 e a página de origem antes de salvar', () => {
  const draft = preparePdfImport(verifiedSources.find(source => source.id === 'she-pro-a1')!);
  useAppStore.setState({ pdfDraft: draft });
  const html = renderToStaticMarkup(<MemoryRouter><ReviewPage /></MemoryRouter>);
  expect(html).toContain('Confira antes de adicionar');
  for (const warning of draft.warnings) expect(html).toContain(warning);
  expect(html).toContain('Página 9');
  expect(html).toContain('Adicionar treino');
  for (const exercise of draft.exercises) expect(html).toContain(exercise.name);
});
