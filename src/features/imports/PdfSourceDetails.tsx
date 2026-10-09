import type { PdfSource } from '../../types';
import { safeVideoUrl } from '../../services/exercise-video';
import ExerciseGuide from '../workout-session/ExerciseGuide';
import './pdf-source-details.css';

export function PdfMobilityGuide({ source, showVideos = true }: { source?: PdfSource; showVideos?: boolean }) {
  const pageNumber = source?.id === 'she-pro-a1' ? 5 : source?.id === 'she-start-c' ? 3 : undefined;
  const page = source?.pages.find(item => item.number === pageNumber);
  if (!page?.links[0]) return null;
  return <div className="pdf-mobility-guide"><p className="small muted">Mobilidade pré-treino · página {page.number}</p>
    <ExerciseGuide name="Mobilidade pré-treino" showVideos={showVideos} showGeneralSafety={false}
      definition={{ instructions: page.text, cadence: '', technique: '', videoUrl: page.links[0] }} />
  </div>;
}

export default function PdfSourceDetails({ source }: { source?: PdfSource }) {
  if (!source) return null;
  return <details className="card pdf-source-details"><summary>Texto completo do PDF<span>{source.pageCount} páginas</span></summary>
    <p className="small muted">{source.name}. A extração mantém o texto e os links; consulte o PDF original para imagens e a disposição das tabelas.</p>
    {source.pages.map(page => <details className="pdf-source-page" key={page.number}><summary>Página {page.number}</summary>
      <p className="pdf-source-text">{page.text || 'Esta página não tem texto extraído. Confira no PDF original.'}</p>
      {page.links.filter(link => safeVideoUrl(link)).map((link, index) => <a className="text-link small" key={`${link}-${index}`} href={safeVideoUrl(link)} target="_blank" rel="noopener noreferrer">Link original {index + 1} da página {page.number}</a>)}
    </details>)}
  </details>;
}
