import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { processPdf } from '../../services/pdf-import';
import './imports.css';
import { cloudEnabled, importCloudPdf } from '../../services/cloud';

export function pdfErrorMessage(error: unknown) {
  if (error instanceof Error && error.name === 'PasswordException') return 'Este PDF exige senha. Envie uma cópia sem proteção para importar.';
  const code = error instanceof Error ? error.message : '';
  const messages: Record<string, string> = {
    ARQUIVO_INVALIDO: 'Escolha um arquivo PDF válido.',
    ARQUIVO_GRANDE: 'O PDF passa de 20 MB. Escolha uma versão mais leve.',
    PDF_MUITAS_PAGINAS: 'Escolha um PDF com até 40 páginas.',
    PDF_SEM_TEXTO: 'Não foi possível ler este PDF. Escolha uma versão com texto selecionável.',
    LEITURA_INCOMPLETA: 'Não foi possível ler o arquivo completo. Tente outra cópia.',
    FORMATO_NAO_SUPORTADO: 'Este PDF ainda não é compatível. Use She Start, Treino A1 ou Agenda Pro.',
  };
  return messages[code] ?? 'Não foi possível concluir a leitura deste PDF. Confira o arquivo e tente novamente. Nada foi salvo.';
}

export default function ImportPage() {
  const navigate = useNavigate();
  const setDraft = useAppStore(state => state.setPdfDraft);
  const input = useRef<HTMLInputElement>(null);
  const reading = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ read: 0, total: 0 });
  const [error, setError] = useState('');

  async function read(selectedFile: File) {
    if (reading.current) return;
    reading.current = true;
    setFile(selectedFile);
    setBusy(true);
    setError('');
    setDraft(null);
    setProgress({ read: 0, total: 0 });
    try {
      const draft = cloudEnabled ? await importCloudPdf(selectedFile) : await processPdf(selectedFile, (read, total) => setProgress({ read, total }));
      setDraft(draft);
      navigate('/app/workouts/import/review');
    } catch (cause) {
      const message = cloudEnabled && cause instanceof Error ? cause.message : pdfErrorMessage(cause);
      setError(message);
      toast.error(message);
    } finally { reading.current = false; setBusy(false); }
  }

  return <div className="page import-page">
    <TopBar title="Importar PDF" back="/app/settings" eyebrow="Treinos e agenda" />
    <section className="import-dropzone">
      <div className="import-empty"><span className="import-empty-icon"><FileText size={26} /></span>
        <h2>{file ? file.name : 'Adicionar treino ou agenda'}</h2>
        <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()}><Upload size={17} />{file ? 'Trocar PDF' : 'Escolher PDF'}</Button>
      </div>
      <input ref={input} type="file" accept="application/pdf,.pdf" hidden disabled={busy} onChange={event => {
        const selectedFile = event.target.files?.[0];
        event.target.value = '';
        if (selectedFile) void read(selectedFile);
      }} />
    </section>

    {busy && <div className="import-progress" role="status" aria-live="polite">
      <p>Importando…</p>
      <progress value={progress.read} max={progress.total || 1} />
    </div>}
    {error && <p className="error-text import-error" role="alert">{error}</p>}
    {cloudEnabled&&<p className="small muted">O PDF será guardado de forma privada. Arquivos novos são enviados ao Gemini para leitura; você revisa antes de adicionar.</p>}
    {error && file && <Button className="btn-block" disabled={busy} onClick={() => void read(file)}>Tentar novamente</Button>}
  </div>;
}
