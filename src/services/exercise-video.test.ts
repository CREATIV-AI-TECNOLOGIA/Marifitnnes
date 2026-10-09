import { describe, expect, it } from 'vitest';
import { exerciseVideo, safeVideoUrl } from './exercise-video';

describe('vídeos associados ao exercício', () => {
  it.each(['https://youtu.be/9fzZx9MlumA','https://www.youtube.com/watch?v=9fzZx9MlumA','https://www.youtube.com/shorts/9fzZx9MlumA'])('abre %s no player interno', videoUrl => {
    expect(exerciseVideo({videoUrl})?.src).toBe('https://www.youtube-nocookie.com/embed/9fzZx9MlumA?rel=0');
  });
  it('preserva o link explícito do PDF em preferência ao vídeo antigo', () => {
    expect(exerciseVideo({videoId:'9fzZx9MlumA',videoUrl:'https://vimeo.com/123456789'})?.src).toBe('https://player.vimeo.com/video/123456789');
  });
  it('reproduz arquivo de vídeo e rejeita endereços perigosos', () => {
    expect(exerciseVideo({videoUrl:'https://videos.example.org/aula.mp4'})?.kind).toBe('file');
    for(const url of ['javascript:alert(1)','http://example.org/a.mp4','https://127.0.0.1/a.mp4','https://youtube.com.evil.test/watch?v=9fzZx9MlumA','https://user:secret@example.org/a.mp4']) {
      expect(exerciseVideo({videoUrl:url})?.kind).not.toBe('iframe');
    }
    expect(safeVideoUrl('https://127.0.0.1/a.mp4')).toBeUndefined();
    expect(safeVideoUrl('javascript:alert(1)')).toBeUndefined();
  });
});
