import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CircleDot, FileText, Info, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Sheet, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { processPdf } from '../../services/pdf-import';
import './imports.css';

const steps = [
  { key: 'read', label: 'Lendo o PDF neste dispositivo' },
  { key: 'identify', label: 'Identificando ciclo e frequências' },
  { key: 'calendar', label: 'Reconstruindo a agenda semanal' },
  { key: 'review', label: 'Preparando a revisão' },
];

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'ARQUIVO_INVALIDO') return 'Escolha um arquivo PDF.';
  if (message === 'ARQUIVO_GRANDE') return 'O PDF passa de 20 MB. Escolha uma versão mais leve.';
  if (message === 'PDF_MUITAS_PAGINAS') return 'Este PDF tem mais de 40 páginas. Divida o arquivo e tente novamente.';
  if (message === 'PDF_SEM_TEXTO') return 'Não encontrei texto selecionável. PDFs escaneados precisam de uma versão com OCR.';
  if (message === 'AGENDA_NAO_RECONHECIDA') return 'Não encontrei uma agenda semanal com frequências e dias de treino neste PDF.';
  return 'Não foi possível ler este PDF. Verifique se o arquivo abre normalmente e tente novamente.';
}

export default function ImportPage() {
  const navigate = useNavigate();
  const setDraft = useAppStore(state => state.setDraft);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  function pick(fileList: FileList | null) {
    const selected = fileList?.[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
      setError('Escolha um arquivo PDF.');
      setFile(null);
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError('O PDF passa de 20 MB. Escolha uma versão mais leve.');
      setFile(null);
      return;
    }
    setError('');
    setFile(selected);
  }

  async function importFile() {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setError('');
    try {
      const draft = await processPdf(file, setProgress);
      setDraft(draft);
      toast.success('Agenda pronta para revisão.');
      navigate('/app/workouts/import/review');
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page import-page">
      <TopBar title="Adicionar agenda" back="/app/agenda" eyebrow="Importe um plano em PDF" />
      <div
        className={`import-dropzone ${dragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={event => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => { event.preventDefault(); setDragging(false); pick(event.dataTransfer.files); }}
      >
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div key="file" className="import-file" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <span className="import-file-icon"><FileText size={22} /></span>
              <div><strong>{file.name}</strong><p className="small muted">{(file.size / 1024).toFixed(0)} KB · pronto para leitura</p></div>
              <button type="button" onClick={() => { setFile(null); setError(''); }} aria-label="Remover arquivo"><X size={18} /></button>
            </motion.div>
          ) : (
            <motion.div key="empty" className="import-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="import-empty-icon"><Upload size={24} /></span>
              <h2>Escolha uma agenda</h2>
              <p className="muted small">PDF com agenda semanal e frequências de treino, até 20 MB.</p>
              <Button variant="secondary" onClick={() => input.current?.click()}><Upload size={16} />Escolher PDF</Button>
            </motion.div>
          )}
        </AnimatePresence>
        <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={event => pick(event.target.files)} />
      </div>

      {error && <p className="error-text import-error" role="alert">{error}</p>}
      <p className="import-note small"><Info size={14} />O arquivo é lido neste dispositivo e não é enviado. Revise a agenda antes de disponibilizá-la.</p>
      <Button variant="primary" className="btn-block import-cta" disabled={!file || busy} onClick={importFile}>Ler agenda</Button>

      <Sheet open={busy} onOpenChange={() => {}} title="Lendo sua agenda" description="As páginas são processadas no aparelho.">
        <div className="import-steps">
          {steps.map((step, index) => {
            const state = progress > index ? 'done' : progress === index ? 'active' : 'todo';
            return (
              <div key={step.key} className={`import-step is-${state}`}>
                <span className="import-step-mark">{state === 'done' ? <Check size={14} /> : state === 'active' ? <CircleDot size={14} /> : null}</span>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
        <p className="import-reassure small muted">O conteúdo extraído só é salvo depois da sua revisão.</p>
      </Sheet>
    </div>
  );
}
