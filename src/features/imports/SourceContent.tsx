import type { PdfSource } from '../../types';

export default function SourceContent({ source }: { source: PdfSource }) {
  return <section className="source-pages" aria-label="Texto completo do documento">
    <h2 className="section-title">Todas as páginas</h2>
    <p className="small muted">O texto é extraído do PDF e pode conter repetições do layout original. Orientações e links permanecem disponíveis aqui.</p>
    {source.pages.map(page => <details className="source-page card" key={page.number}>
      <summary>Página {page.number}<span>{page.links.length ? `${page.links.length} links` : 'Texto'}</span></summary>
      <pre>{page.text}</pre>
      {page.links.length > 0 && <div className="source-links">{page.links.map((url, index) => <a key={url} className="text-link small" href={url} target="_blank" rel="noopener noreferrer">Demonstração {index + 1} · página {page.number}</a>)}</div>}
    </details>)}
  </section>;
}
