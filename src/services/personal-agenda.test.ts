import { describe, expect, it, vi } from 'vitest';
import { getObjectives } from '../data/objectives';
import starterProgram from '../data/starter-program';
import { studioWorkouts } from '../data/studio-catalog';
import { createObjectiveAgenda, createCustomAgenda, slotsOnDate, readDate, effectiveAgendas, resolveSlot } from './personal-agenda';
import { snapshotSchema } from './cloud-schema';
import { useAppStore } from '../stores/use-app-store';
vi.hoisted(()=>vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}));
const objectives=getObjectives([starterProgram]);
const objective=objectives.find(o=>o.id==='pro-hipertrofia')!;
describe('objetivos e agenda pessoal',()=>{
 it('mantém objetivos separados de fichas e não inventa agendas ausentes',()=>{
  expect(objectives).toHaveLength(10);
  expect(objectives.filter(o=>!o.suggestion).map(o=>o.id)).toEqual(['agenda-posterior','start-academia','home-emagrecimento','inferiores','superiores']);
  expect(createObjectiveAgenda(objectives.find(o=>o.id==='agenda-posterior')!,3,'2026-10-05',studioWorkouts)).toBeNull();
 });
 it('copia todas as semanas e mantém o mesmo dia, com descanso/Flow',()=>{
  const plan=createObjectiveAgenda(objective,6,'2026-10-05',studioWorkouts)!;
  expect(plan.weeks).toHaveLength(6);
  expect(plan.weeks.map(w=>w.days.map(d=>d[0].code))).toEqual(starterProgram.frequencies.find(f=>f.frequency===6)!.weeks.map(w=>w.days));
  expect(slotsOnDate(plan,readDate('2026-10-06'))[0].code).toBe('B2');
  expect(slotsOnDate(plan,readDate('2026-10-12'))[0].code).toBe('A2');
  expect(slotsOnDate(plan,readDate('2026-10-11'))[0].code).toContain('SheFlow');
  expect(slotsOnDate(plan,readDate('2026-11-16'))).toEqual([]);
 });
 it('conserva agendas parciais e dias a escolher sem decidir pelo usuário',()=>{
  const home=objectives.find(o=>o.id==='home')!;
  expect(createObjectiveAgenda(home,3,'2026-10-05',[])!.weeks).toHaveLength(4);
  expect(createObjectiveAgenda(home,5,'2026-10-05',[])!.weeks[0].days[5][0].kind).toBe('choice');
  const glute=objectives.find(o=>o.id==='agenda-gluteos')!;
  const plan=createObjectiveAgenda(glute,6,'2026-10-05',studioWorkouts)!;
  expect(plan.weeks[0].days[2][0].kind).toBe('reference');
  expect(resolveSlot(plan.weeks[0].days[2][0],studioWorkouts,glute)).toBeUndefined();
 });
 it('permite escolher dias próprios e repetir apenas pelo período definido',()=>{
  const upper=objectives.find(o=>o.id==='superiores')!;
  const days=[[],['studio-pro-b2'],[],[],['studio-pro-b3'],[],[]];
  const plan=createCustomAgenda(upper,'2026-10-05',days,studioWorkouts,3)!;
  expect(plan.weeks).toHaveLength(3);
  expect(slotsOnDate(plan,readDate('2026-10-06'))[0].workoutId).toBe('studio-pro-b2');
  expect(createCustomAgenda(upper,'2026-02-30',days,studioWorkouts)).toBeNull();
  expect(createCustomAgenda(upper,'2026-10-05',[['studio-pro-a1'],[],[],[],[],[],[]],studioWorkouts)).toBeNull();
  expect(createCustomAgenda(upper,'2026-10-05',days,studioWorkouts,13)).toBeNull();
  expect(createCustomAgenda(upper,'2026-10-05',Array.from({length:7},()=>[]),studioWorkouts)).toBeNull();
 });
 it('preserva a agenda anterior e escolhas sem substituir histórico',()=>{
  const active={programId:starterProgram.id,frequency:6,startedAt:'2026-10-05',cycleId:'cycle-original'};
  const plans=effectiveAgendas([],active,[starterProgram],studioWorkouts);
  expect(plans[0].legacyCycleId).toBe('cycle-original');
  const chosen=createObjectiveAgenda(objective,3,'2026-10-05',studioWorkouts)!;
  expect(effectiveAgendas([chosen],active,[starterProgram],studioWorkouts)).toEqual([chosen]);
 });
 it('o formato sincroniza agendas novas e lê contas anteriores sem esse campo',()=>{
  const base=useAppStore.getInitialState();
  const plan=createObjectiveAgenda(objective,3,'2026-10-05',studioWorkouts)!;
  expect(snapshotSchema.parse({...base,personalAgendas:[plan]}).personalAgendas).toEqual([plan]);
  const {personalAgendas:_,...old}=base;
  expect(snapshotSchema.parse(old).personalAgendas).toEqual([]);
  expect(snapshotSchema.safeParse({...base,personalAgendas:[{...plan,weeks:[{week:1,days:[]}]}]}).success).toBe(false);
 });
 it('salvar um objetivo preserva os demais e as sessões já registradas',()=>{
  useAppStore.setState(useAppStore.getInitialState(),true);
  const other=createObjectiveAgenda(objectives.find(o=>o.id==='agenda-gluteos')!,3,'2026-10-05',studioWorkouts)!;
  useAppStore.getState().savePersonalAgenda(other);
  const first=createObjectiveAgenda(objective,3,'2026-10-05',studioWorkouts)!;
  useAppStore.getState().savePersonalAgenda(first);
  const next=createObjectiveAgenda(objective,5,'2026-10-12',studioWorkouts)!;
  useAppStore.getState().savePersonalAgenda(next);
  expect(useAppStore.getState().personalAgendas).toEqual([other,next]);
  expect(useAppStore.getState().history).toEqual([]);
 });
});
