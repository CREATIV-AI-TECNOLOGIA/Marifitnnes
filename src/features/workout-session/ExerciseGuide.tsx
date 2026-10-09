import { useEffect, useRef, useState } from 'react';
import { BookOpen, Play, VideoOff, X } from 'lucide-react';
import { Button, EmptyState, IconButton, Sheet } from '../../components/ui';
import type { Exercise } from '../../types';
import { exerciseVideo } from '../../services/exercise-video';
import './workout-session.css';

interface ExerciseGuideProps { name: string; definition?: Pick<Exercise, 'instructions' | 'cadence' | 'technique' | 'videoId' | 'videoUrl' | 'secondaryMovement'>; showVideos: boolean; showGeneralSafety?: boolean; }

export default function ExerciseGuide({ name, definition, showVideos, showGeneralSafety = true }: ExerciseGuideProps) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = definition ? exerciseVideo(definition) : undefined;

  useEffect(() => {
    if (videoOpen && showVideos) dialog.current?.showModal();
    else dialog.current?.close();
    return () => dialog.current?.close();
  }, [videoOpen, showVideos]);

  return (
    <>
      <div className="row session-guide-actions">
        <Button variant="secondary" size="sm" onClick={() => setInstructionsOpen(true)}><BookOpen size={16} /> Orientações</Button>
        {showVideos && video && <Button variant="ghost" size="sm" onClick={() => setVideoOpen(true)}><Play size={16} />Ver execução</Button>}
      </div>
      <Sheet open={instructionsOpen} onOpenChange={setInstructionsOpen} title={name} className="session-sheet">
        <div className="stack session-guide">
          <section><h3>Como executar</h3><p>{definition?.instructions || 'Nenhuma orientação cadastrada para este exercício.'}</p></section>
          {definition?.cadence && <section><h3>Cadência</h3><p>{definition.cadence}</p></section>}
          {definition?.technique && <section><h3>Técnica</h3><p>{definition.technique}</p></section>}
          {showGeneralSafety && <p className="small muted">Respeite seus limites. Em caso de dor, interrompa o movimento e procure orientação profissional.</p>}
          <Button variant="primary" onClick={() => setInstructionsOpen(false)}>Entendi</Button>
        </div>
      </Sheet>
      <dialog ref={dialog} className="session-video" aria-labelledby="session-video-title" onCancel={() => setVideoOpen(false)} onClose={() => setVideoOpen(false)}>
        {videoOpen && showVideos && <div className="session-video-content">
          <header className="row between"><div><span className="eyebrow">Execução</span><h2 id="session-video-title">{name}</h2></div><IconButton label="Fechar vídeo" autoFocus onClick={() => setVideoOpen(false)}><X size={24} /></IconButton></header>
          {video ? <div className="session-video-frame">
            {video.kind==='iframe'&&<iframe src={video.src} title={`Execução de ${name}`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}
            {video.kind==='file'&&<video src={video.src} controls playsInline preload="metadata" aria-label={`Execução de ${name}`} />}
            <p className="small muted">{video.kind==='external'?'Este endereço não oferece reprodução integrada.':'Se o player não carregar ou o autor bloquear a reprodução,'} <a className="text-link" href={video.href} target="_blank" rel="noopener noreferrer">abrir vídeo original</a>.</p>
            {definition?.secondaryMovement?.videoUrl && <p className="small muted"><a className="text-link" href={definition.secondaryMovement.videoUrl} target="_blank" rel="noopener noreferrer">Ver vídeo de {definition.secondaryMovement.name.toLowerCase()}</a></p>}
          </div>
            : <EmptyState icon={<VideoOff size={36} />} title="Vídeo ainda não disponível" description="Este exercício não tem um vídeo cadastrado. Consulte as orientações de execução, sem usar demonstrações de outro exercício." action={<Button variant="secondary" onClick={() => { setVideoOpen(false); setInstructionsOpen(true); }}>Ler orientações</Button>} />}
        </div>}
      </dialog>
    </>
  );
}
