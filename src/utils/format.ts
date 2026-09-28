export const clock = (seconds: number) => { const s=Math.max(0,Math.floor(seconds)); return `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor(s%3600/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; };
export const duration = (seconds: number) => seconds>=3600 ? `${Math.floor(seconds/3600)}h${Math.floor(seconds%3600/60).toString().padStart(2,'0')}` : `${Math.floor(seconds/60)} min`;
export const number = (n:number) => new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n);
export const dateLabel = (date: number | string, options: Intl.DateTimeFormatOptions = {day:'numeric',month:'long'}) => new Date(date).toLocaleDateString('pt-BR', options);
export const haptic = () => { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate?.(12); };
export const toDisplayWeight = (kg:number, unit:'kg'|'lb') => Math.round(kg*(unit==='lb'?2.20462:1)*10)/10;
export const toKg = (weight:number, unit:'kg'|'lb') => unit==='lb'?weight/2.20462:weight;
