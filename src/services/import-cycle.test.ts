import { beforeEach, expect, it, vi } from 'vitest';
import { useAppStore } from '../stores/use-app-store';
import starterProgram from '../data/starter-program';
import { studioWorkouts, studioExercises } from '../data/studio-catalog';

beforeEach(()=>{vi.stubGlobal('localStorage',{setItem:vi.fn(),getItem:()=>null,removeItem:vi.fn()});useAppStore.setState({...useAppStore.getInitialState(), programs:[starterProgram],workouts:structuredClone(studioWorkouts),exercises:structuredClone(studioExercises)},true);});
it('preserva sessão e definições usadas quando reimporta a mesma ficha',()=>{
  const store=useAppStore.getState();const workout=store.workouts.find(w=>w.exerciseIds.length>0)!;
  store.startSession(workout.id);
  const session=useAppStore.getState().activeSession!;
  const exercise=useAppStore.getState().exercises.find(e=>e.id===session.exercises[0].id)!;
  store.savePdfImport({source:{id:'reimport-source',sha256:'b'.repeat(64),name:'ficha.pdf',kind:'workout',pageCount:2,pages:[]},warnings:[],exercises:[{...exercise,name:'Correção na nova ficha'}],workout:{...workout,exerciseIds:[exercise.id]}});
  expect(useAppStore.getState().activeSession).toBe(session);
  expect(useAppStore.getState().exercises.find(e=>e.id===exercise.id)).toEqual(exercise);
  const updated=useAppStore.getState().workouts.find(w=>w.id===workout.id)!;
  expect(updated.exerciseIds[0]).not.toBe(exercise.id);
});
it('disponibiliza a ficha importada em ciclo ativo',()=>{
  const store=useAppStore.getState();const program=store.programs[0];const cycle=store.activateProgram(program.id,program.frequencies[0].frequency)!;
  const target=useAppStore.getState().workouts.find(w=>w.cycleId===cycle&&w.programCode==='C1')!;
  expect(target.exerciseIds).toHaveLength(0);
  const exercise={...studioExercises[0],id:'nova-ficha-c1-exercicio'};
  store.savePdfImport({source:{id:'new-source',sha256:'a'.repeat(64),name:'C1.pdf',kind:'workout',pageCount:2,pages:[]},warnings:[],exercises:[exercise],workout:{id:'nova-ficha-c1',name:'C1',subtitle:'C1',programId:program.id,programCode:'C1',exerciseIds:[exercise.id]}});
  const updated=useAppStore.getState().workouts.find(w=>w.id===target.id)!;
  expect(updated.exerciseIds).toHaveLength(1);
  expect(updated.sourceId).toBe('new-source');
});
