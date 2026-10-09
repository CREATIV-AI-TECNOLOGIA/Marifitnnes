import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { SessionExercise } from '../../types';
import { exerciseStatus, isExerciseComplete } from './session-utils';

interface ExercisePickerProps {
  exercises: SessionExercise[];
  currentId?: string;
  onSelect: (id: string) => void;
}

export default function ExercisePicker({ exercises, currentId, onSelect }: ExercisePickerProps) {
  const foundIndex = exercises.findIndex(exercise => exercise.id === currentId);
  const currentIndex = foundIndex >= 0 ? foundIndex : 0;
  const carouselRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion() !== false;
  const positioned = useRef(false);
  const dragStart = useRef<{ x: number; scrollLeft: number } | null>(null);
  const suppressClick = useRef(false);

  useLayoutEffect(() => {
    const carousel = carouselRef.current;
    const selected = carousel?.querySelector<HTMLElement>('.is-current');
    if (!carousel || !selected) return;

    function centerCurrent(behavior: ScrollBehavior) {
      if (!carousel || !selected) return;
      const viewport = carousel.getBoundingClientRect();
      const card = selected.getBoundingClientRect();
      const left = carousel.scrollLeft + card.left - viewport.left - (carousel.clientWidth - card.width) / 2;
      carousel.scrollTo({ left: Math.max(0, Math.min(left, carousel.scrollWidth - carousel.clientWidth)), behavior });
    }

    centerCurrent(positioned.current && !reducedMotion ? 'smooth' : 'auto');
    positioned.current = true;
    let previousWidth = carousel.clientWidth;
    const observer = new ResizeObserver(() => {
      if (carousel.clientWidth === previousWidth) return;
      previousWidth = carousel.clientWidth;
      centerCurrent('auto');
    });
    observer.observe(carousel);
    return () => observer.disconnect();
  }, [currentId, reducedMotion]);

  return <section className="session-exercise-picker" aria-label="Exercício anterior, atual e próximo">
    <div className="session-exercise-picker-heading">
      <span>Treino em andamento</span>
      <span>{currentIndex + 1} de {exercises.length}</span>
    </div>
    <nav ref={carouselRef} className="session-exercise-carousel" aria-label="Exercícios do treino" onPointerDown={event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      dragStart.current = { x: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
      suppressClick.current = false;
    }} onPointerMove={event => {
      const start = dragStart.current;
      if (!start || event.buttons !== 1) return;
      if (Math.abs(event.clientX - start.x) > 5) {
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      event.currentTarget.scrollLeft = start.scrollLeft + start.x - event.clientX;
    }} onPointerUp={() => { dragStart.current = null; }} onPointerCancel={() => { dragStart.current = null; }} onClickCapture={event => {
      if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
    }}>
      {exercises.map((exercise, index) => {
        const selected = index === currentIndex;
        const complete = isExerciseComplete(exercise);
        const status = exerciseStatus(exercise);
        const label = selected && !complete ? 'Atual' : status;
        return <button
          key={exercise.id}
          type="button"
          className={`session-exercise-card ${selected ? 'is-current' : ''}`}
          aria-current={selected ? 'step' : undefined}
          aria-label={`${index + 1}. ${exercise.name}, ${label}`}
          title={exercise.name}
          onClick={() => onSelect(exercise.id)}
        >
          <span className="session-exercise-card-top">
            <span className="session-exercise-card-number">{index + 1}</span>
            <small>{label}</small>
          </span>
          <strong className="session-exercise-card-name">{exercise.name}</strong>
        </button>;
      })}
    </nav>
  </section>;
}
