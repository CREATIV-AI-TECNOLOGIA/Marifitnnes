import { Link, useParams } from 'react-router-dom';
import { EmptyState, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { a1SourceWarnings } from '../../services/pdf-content';
import SourceContent from './SourceContent';
import './imports.css';

export default function SourcePage() {
  const { id } = useParams();
  const source = useAppStore(state => state.sources.find(item => item.id === id));
  return <div className="page import-page">
    <TopBar title="Documento convertido" back="/app/settings" />
    {source ? <>
      <section className="card source-heading"><h2>{source.name}</h2><p>{source.pageCount} páginas · texto e links</p><p className="small muted">O PDF original não fica armazenado no app.</p></section>
      {source.id === 'she-pro-a1' && <aside className="card source-warnings"><h2>Pontos a confirmar na ficha original</h2>{a1SourceWarnings.map(warning => <p key={warning}>{warning}</p>)}</aside>}
      <SourceContent source={source} />
    </> : <EmptyState title="Documento não encontrado" description="Volte às Configurações para consultar os documentos disponíveis." action={<Link className="btn btn-primary" to="/app/settings">Configurações</Link>} />}
  </div>;
}
