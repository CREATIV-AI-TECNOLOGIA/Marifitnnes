export function safeVideoUrl(value: string | undefined): string | undefined {
  if (!value || value.length > 2048) return;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.port || !url.hostname.includes('.')
      || /^(?:localhost|.*\.(?:localhost|local|internal)|(?:\d{1,3}\.){3}\d{1,3}|\[.*\])$/i.test(url.hostname)) return;
    if(url.protocol==='http:' && /^(?:www\.|m\.)?(?:youtube\.com|youtu\.be|vimeo\.com)$/.test(url.hostname))url.protocol='https:';
    if (url.protocol !== 'https:') return;
    return url.href;
  } catch { return; }
}

export function exerciseVideo(exercise: { videoId?: string; videoUrl?: string }) {
  const original = exercise.videoUrl ?? (/^[\w-]{11}$/.test(exercise.videoId ?? '') ? `https://www.youtube.com/watch?v=${exercise.videoId}` : undefined);
  const href = safeVideoUrl(original);
  if (!href) return;
  const url = new URL(href);
  if (['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com','youtu.be','www.youtu.be'].includes(url.hostname)) {
    const id = url.hostname.endsWith('youtu.be') ? url.pathname.split('/')[1]
      : url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:embed|shorts|live)\/([\w-]{11})/.exec(url.pathname)?.[1];
    if (/^[\w-]{11}$/.test(id ?? '')) return { kind:'iframe' as const, href, src:`https://www.youtube-nocookie.com/embed/${id}?rel=0` };
  }
  if (['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(url.hostname)) {
    const match=/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/.exec(url.pathname);
    if(match){const hash=match[2]??url.searchParams.get('h');return {kind:'iframe' as const,href,src:`https://player.vimeo.com/video/${match[1]}${hash&&/^[a-zA-Z0-9]+$/.test(hash)?`?h=${hash}`:''}`};}
  }
  if (/\.(?:mp4|webm|ogg)$/i.test(url.pathname)) return {kind:'file' as const,href,src:href};
  return {kind:'external' as const,href,src:undefined};
}
