import { useEffect, useRef, useState } from 'react';
import { BookOpen, Play, VideoOff, X } from 'lucide-react';
import { Button, EmptyState, IconButton, Sheet } from '../../components/ui';
import type { Exercise } from '../../types';

interface ExerciseGuideProps { name: string; definition?: Exercise; showVideos: boolean; }

export default function ExerciseGuide({ name, definition, showVideos }: ExerciseGuideProps) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const videoId = definition?.videoId && /^[\w-]{11}$/.test(definition.videoId) ? definition.videoId : undefined;

  useEffect(() => {
    if (videoOpen && showVideos) dialog.current?.showModal();
    else dialog.current?.close();
    return () => dialog.current?.close();
  }, [videoOpen, showVideos]);

  return (
    <>
      <div className="row session-guide-actions">
        <Button variant="secondary" size="sm" onClick={() => setInstructionsOpen(true)}><BookOpen size={16} /> Orientações</Button>
        {showVideos && <Button variant="ghost" size="sm" onClick={() => setVideoOpen(true)}>{videoId ? <Play size={16} /> : <VideoOff size={16} />}{videoId ? 'Ver execução' : 'Vídeo indisponível'}</Button>}
      </div>
      <Sheet open={instructionsOpen} onOpenChange={setInstructionsOpen} title={name} description="Orientações para uma execução consciente.">
        <div className="stack session-guide">
          <section><h3>Como executar</h3><p>{definition?.instructions || 'Nenhuma orientação cadastrada para este exercício.'}</p></section>
          {definition?.cadence && <section><h3>Cadência</h3><p>{definition.cadence}</p></section>}
          {definition?.technique && <section><h3>Técnica</h3><p>{definition.technique}</p></section>}
          <p className="small muted">Respeite seus limites. Em caso de dor, interrompa o movimento e procure orientação profissional.</p>
          <Button variant="primary" onClick={() => setInstructionsOpen(false)}>Entendi</Button>
        </div>
      </Sheet>
      <dialog ref={dialog} className="session-video" aria-labelledby="session-video-title" onCancel={() => setVideoOpen(false)} onClose={() => setVideoOpen(false)}>
        {videoOpen && showVideos && <div className="session-video-content">
          <header className="row between"><div><span className="eyebrow">Execução</span><h2 id="session-video-title">{name}</h2></div><IconButton label="Fechar vídeo" autoFocus onClick={() => setVideoOpen(false)}><X size={24} /></IconButton></header>
          {videoId ? <div className="session-video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`} title={`Execução de ${name}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /><p className="small muted">Se o vídeo não carregar, <a className="text-link" href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} target="_blank" rel="noopener noreferrer">abrir no YouTube</a>.</p></div>
            : <EmptyState icon={<VideoOff size={36} />} title="Vídeo ainda não disponível" description="Este exercício não tem um vídeo cadastrado. Consulte as orientações de execução, sem usar demonstrações de outro exercício." action={<Button variant="secondary" onClick={() => { setVideoOpen(false); setInstructionsOpen(true); }}>Ler orientações</Button>} />}
        </div>}
      </dialog>
    </>
  );
}
