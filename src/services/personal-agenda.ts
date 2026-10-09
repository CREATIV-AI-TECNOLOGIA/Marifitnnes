import type { ActiveAgenda, PersonalAgenda, AgendaSlot, TrainingProgram, Workout } from '../types';
import type { Objective } from '../data/objectives';
import { getObjectives, objectiveWorkouts } from '../data/objectives';
import { agendaWorkout } from './combined-workout';
export const agendaDays=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
export function localDateKey(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function readDate(value:string){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d,12);}
export function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&localDateKey(readDate(value))===value;}
export function monday(date:Date){const result=new Date(date);result.setHours(12,0,0,0);result.setDate(result.getDate()-(result.getDay()+6)%7);return result;}
function dayNumber(date:Date){return Math.round(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);}
export function agendaWeek(plan:PersonalAgenda,date:Date){const delta=dayNumber(monday(date))-dayNumber(monday(readDate(plan.startsOn)));const week=Math.floor(delta/7)+1;return week>=1&&week<=plan.weeks.length?week:null;}
export function slotsOnDate(plan:PersonalAgenda,date:Date){const week=agendaWeek(plan,date);return week?plan.weeks.find(w=>w.week===week)?.days[(date.getDay()+6)%7]??[]:[];}
export function suggestionSlot(objective:Objective,code:string,workouts:Workout[]):AgendaSlot{
 if(code==='Descanso'||code==='Descanso / SheFlow')return {kind:'rest',code,label:code};
 if(code.startsWith('Escolher')||code.includes('/'))return {kind:'choice',code,label:'Escolha a ficha indicada para este dia'};
 const conflict=(objective.id==='agenda-gluteos'||objective.id==='agenda-quadriceps')&&code==='A1';
 const workout=!conflict?objectiveWorkouts(objective,workouts).find(w=>w.programCode===code):undefined;
 return {kind:workout?'workout':'reference',code,label:workout?.subtitle||objective.suggestion?.workoutLabels[code]||code,...(workout?{workoutId:workout.id}:{})};
}
export function createObjectiveAgenda(objective:Objective,frequency:number,startsOn:string,workouts:Workout[]):PersonalAgenda|null{
 const option=objective.suggestion?.frequencies.find(f=>f.frequency===frequency);
 if(!option?.weeks.length||!validDate(startsOn))return null;
 return {id:crypto.randomUUID(),objectiveId:objective.id,title:objective.title,startsOn,
  mode:'suggestion',frequency,sourceFile:objective.suggestion?.sourceFile,notes:[...objective.notes,...(option.note?[option.note]:[])],
  weeks:option.weeks.map(w=>({week:w.week,days:w.days.map(code=>[suggestionSlot(objective,code,workouts)])}))};
}
export function createCustomAgenda(objective:Objective,startsOn:string,days:string[][],workouts:Workout[],duration=6):PersonalAgenda|null{
 if(!Number.isInteger(duration)||duration<1||duration>12||!validDate(startsOn)||days.length!==7||days.some(d=>d.length>8)||!days.some(d=>d.length))return null;
 const available=objectiveWorkouts(objective,workouts);
 const codes=objective.suggestion?.workoutCodes??objective.codes??[];
 if(days.flat().some(id=>!available.some(w=>w.id===id)&&!(id.startsWith('ref:')&&codes.includes(id.slice(4)))))return null;
 return {id:crypto.randomUUID(),objectiveId:objective.id,title:objective.title,startsOn,mode:'custom',frequency:days.filter(d=>d.length).length,notes:[],
  weeks:Array.from({length:duration},(_,index)=>({week:index+1,days:days.map(ids=>ids.length?ids.map(id=>{if(id.startsWith('ref:'))return {kind:'reference' as const,code:id.slice(4),label:objective.suggestion?.workoutLabels[id.slice(4)]??id.slice(4)};const w=available.find(w=>w.id===id)!;return {kind:'workout' as const,code:w.programCode??w.name,label:w.subtitle||w.name,workoutId:w.id};}):[{kind:'rest' as const,code:'Descanso',label:'Descanso'}])}))};
}
export function effectiveAgendas(plans:PersonalAgenda[],active:ActiveAgenda|null,programs:TrainingProgram[],workouts:Workout[]):PersonalAgenda[]{
 if(!active)return plans;
 const program=programs.find(p=>p.id===active.programId);if(!program)return plans;
 const objective=getObjectives(programs).find(o=>o.suggestion?.id===program.id);if(!objective||plans.some(p=>p.objectiveId===objective.id))return plans;
 const legacy=createObjectiveAgenda(objective,active.frequency,active.startedAt,workouts);if(!legacy)return plans;
 return [...plans,{...legacy,id:'legacy-'+active.cycleId,legacyCycleId:active.cycleId,weeks:legacy.weeks.map(week=>({...week,days:week.days.map(day=>day.map(slot=>{
  const w=agendaWorkout(undefined,slot.code,workouts,active.cycleId);return w?{...slot,kind:'workout' as const,workoutId:w.id}:slot;
 }))}))}];
}
export function resolveSlot(slot:AgendaSlot,workouts:Workout[],objective?:Objective){
 if(slot.kind==='workout')return workouts.find(w=>w.id===slot.workoutId&&w.exerciseIds.length);
 if(slot.kind==='reference'&&objective){const checked=suggestionSlot(objective,slot.code,workouts);return checked.workoutId?workouts.find(w=>w.id===checked.workoutId):undefined;}
 return undefined;
}
