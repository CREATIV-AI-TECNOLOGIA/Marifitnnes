import { expect, it } from 'vitest';
import { c2Exercises, proC2 } from './pro-c2-outubro';
import { addReadyWorkouts } from './ready-workouts';
import { getObjectives, objectiveWorkouts } from './objectives';
it('vincula o C2 de outubro a Glúteos e preserva treinos pessoais e sessões',()=>{
 const session={workoutId:proC2.id} as never;
 const custom={...proC2,exerciseIds:['pessoal']};
 const state={workouts:[custom],exercises:[],programs:[],activeSession:session};
 const next=addReadyWorkouts(state);
 expect(next.workouts.find(w=>w.id===proC2.id)).toBe(custom);
 expect(next.activeSession).toBe(session);
 const library=addReadyWorkouts({...state,workouts:[],activeSession:null});
 expect(objectiveWorkouts(getObjectives().find(o=>o.id==='agenda-gluteos')!,library.workouts).some(w=>w.id===proC2.id)).toBe(true);
});
it('preserva as ambiguidades de séries e identifica C2 pelo conteúdo',()=>{
 expect(proC2.programCode).toBe('C2');expect(c2Exercises).toHaveLength(8);
 for(const name of ['Stiff sumô','Coice na polia'])expect(c2Exercises.find(e=>e.name===name)?.targets.at(-1)).toBe('Não informada no PDF');
 expect(proC2.notes).toContain('5 semanas');expect(proC2.notes).toContain('6 semanas');
});
