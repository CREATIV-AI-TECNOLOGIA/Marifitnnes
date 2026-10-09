import { useEffect } from 'react';

// Play once per interaction, including keyboard clicks, without moving the control.
export function useIconMotion() {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const playing = new WeakMap<SVGSVGElement, Animation>();
    function onClick(event: MouseEvent) {
      if (reduced.matches || !(event.target instanceof Element)) return;
      const control = event.composedPath().find((node): node is Element => node instanceof Element && node.matches('button, a'));
      if (!control || control.closest('.mobile-bottom-nav') || control.hasAttribute('aria-expanded')) return;
      const icon = control.querySelector<SVGSVGElement>('svg.lucide');
      if (!icon?.animate) return;
      playing.get(icon)?.cancel();
      const base = getComputedStyle(icon).transform;
      const origin = base === 'none' ? '' : base;
      const direction = icon.classList.contains('lucide-arrow-left') || icon.classList.contains('lucide-chevron-left') ? -1 : 1;
      const isArrow = /(?:arrow|chevron)/.test(icon.getAttribute('class') ?? '');
      const isTurn = /(?:sun|moon|settings|circle-help|lucide-x)/.test(icon.getAttribute('class') ?? '');
      const peak = isArrow ? `translateX(${direction * 3}px)` : isTurn ? 'rotate(18deg) scale(1.08)' : 'translateY(-2px) scale(1.12)';
      const animation = icon.animate([
        { transform: `${origin} translate(0) scale(1)` },
        { transform: `${origin} ${peak}`, offset: .38 },
        { transform: `${origin} translate(0) scale(1)` },
      ], { duration: 640, easing: 'cubic-bezier(.22,.68,.2,1)' });
      playing.set(icon, animation);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}
