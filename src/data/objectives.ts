import rawSuggestions from './objective-suggestions.json';
import { z } from 'zod';
const suggestions=z.array(z.object({id:z.string(),summary:z.string(),source:z.object({file:z.string(),pages:z.record(z.string(),z.number())}),codes:z.record(z.string(),z.string()),frequencies:z.record(z.string(),z.object({weeks:z.array(z.array(z.string()).length(7)),notes:z.array(z.string())}))})).parse(rawSuggestions);
import starterProgram from './starter-program';
import type { TrainingProgram, Workout } from '../types';
export interface Objective {
 id:string; title:string; description:string; place:string; libraryProgramId?:string; codes?:string[];
 suggestion?:TrainingProgram; notes:string[]; missing?:string; sourcePages?:Record<string,number>;
}
const specifications = [
 ['pro-hipertrofia','Hipertrofia','Desenvolvimento muscular com uma rotina na academia.','Academia'],
 ['agenda-gluteos','Glúteos','Prioridade para glúteos, com o treino C2 de outubro.','Academia'],
 ['agenda-quadriceps','Quadríceps','Ênfase em quadríceps, mantendo os outros grupos ativos.','Academia'],
 ['agenda-posterior','Posteriores','Foco na parte posterior dos membros inferiores.','Academia'],
 ['start-academia','Primeiros passos','Objetivo para quem está começando na academia.','Academia'],
 ['home','Condicionamento em casa','Uma rotina de movimento para fazer em casa.','Casa'],
 ['home-emagrecimento','Emagrecimento em casa','Organização voltada ao emagrecimento em casa.','Casa'],
 ['pro-emagrecimento','Emagrecimento na academia','Organização do material de treinos híbridos.','Academia'],
 ['inferiores','Membros inferiores','Fichas voltadas aos membros inferiores.','Academia'],
 ['superiores','Membros superiores','Costas, peito, braços, ombros e abdome.','Academia'],
];
export function getObjectives(programs:TrainingProgram[]=[]):Objective[]{
 const objectives:Objective[]=specifications.map(([id,title,description,place])=>{
  const source=suggestions.find(a=>a.id===id);
  const options=Object.entries(source?.frequencies??{}).map(([key,opt])=>({frequency:Number(key),weeks:opt.weeks.map((days, i)=>({week:i+1,days})),note:opt.notes.join(' ')}));
  const libraryProgramId=id==='start-academia'?'she-start-treino-na-academia':place==='Academia'&&id!=='pro-emagrecimento'?starterProgram.id:undefined;
  const suggestion=id==='pro-hipertrofia'?(programs.find(p=>p.id===starterProgram.id)??starterProgram):source&&options.length?{
   id:source.id,name:title,focus:title,description:source.summary,sourceFile:source.source.file,
   cycleWeeks:Math.max(...options.map(f=>f.weeks.length)),frequencies:options,
   workoutCodes:Object.keys(source.codes),workoutLabels:source.codes,
  }:undefined;
  return {id,title,description,place,libraryProgramId,suggestion,
   codes:id==='agenda-posterior'?['C1','C2']:id==='inferiores'?['A1','A2','C1','C2']:id==='superiores'?['B1','B2','B3']:id==='start-academia'?['A','B','C']:undefined,
   notes:id==='agenda-gluteos'||id==='agenda-quadriceps'?['As agendas de foco chamam A1 de quadríceps, enquanto a ficha disponível se chama inferiores completo. O vínculo de A1 precisa de conferência.']:[],
   sourcePages:source?.source.pages as Record<string,number>|undefined,
   missing:id==='agenda-posterior'?'O material recebido contém somente a capa, sem os dias da semana.':id==='start-academia'?'Temos fichas de iniciantes, mas falta a divisão semanal sugerida.':id==='home-emagrecimento'?'Não foi identificado um documento com a agenda específica deste objetivo.':id==='inferiores'||id==='superiores'?'Há fichas para este objetivo, mas nenhuma agenda específica foi confirmada.':undefined};
 });
 for(const program of programs.filter(p=>p.id!==starterProgram.id)){
  if(!objectives.some(o=>o.suggestion?.id===program.id))objectives.push({id:program.id,title:program.name,description:program.description,place:'Importado',libraryProgramId:program.id,suggestion:program.frequencies.length?program:undefined,notes:[],missing:program.frequencies.length?undefined:'A agenda deste material ainda não está disponível.'});
 }
 return objectives;
}
export function objectiveWorkouts(objective:Objective,workouts:Workout[]):Workout[]{
 const matched=workouts.filter(w=>w.programId===objective.libraryProgramId&&!!objective.libraryProgramId&&w.exerciseIds.length&&(!objective.codes||objective.codes.includes(w.programCode??'')));
 const seen=new Set<string>();
 return matched.sort((a,b)=>Number(!!a.cycleId)-Number(!!b.cycleId)).filter(w=>{const key=w.programCode??w.id;if(seen.has(key))return false;seen.add(key);return true;});
}
