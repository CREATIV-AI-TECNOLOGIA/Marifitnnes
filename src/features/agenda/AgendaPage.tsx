import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { agendaDays, agendaWeek, effectiveAgendas, localDateKey, monday, readDate, resolveSlot, slotsOnDate } from '../../services/personal-agenda';
import { getObjectives } from '../../data/objectives';
import { agendaWorkout } from '../../services/combined-workout';
import { isSessionWorkout } from '../../services/session-workout';
import type { PersonalAgenda } from '../../types';
import './agenda.css';
import '../objectives/objectives.css';
export function monthDays(month:Date){
 const first=new Date(month.getFullYear(),month.getMonth(),1,12),start=monday(first);
 const length=Math.ceil(((first.getDay()+6)%7+new Date(month.getFullYear(),month.getMonth()+1,0).getDate())/7)*7;
 return Array.from({length},(_,index)=>{const date=new Date(start);date.setDate(start.getDate()+index);return date;});
}
export default function AgendaPage(){
 const navigate=useNavigate();
 const saved=useAppStore(s=>s.personalAgendas??[]),active=useAppStore(s=>s.activeAgenda),programs=useAppStore(s=>s.programs),workouts=useAppStore(s=>s.workouts),choices=useAppStore(s=>s.agendaChoices),session=useAppStore(s=>s.activeSession),startSession=useAppStore(s=>s.startSession),save=useAppStore(s=>s.savePersonalAgenda);
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1,12)),[selected,setSelected]=useState(()=>localDateKey(new Date()));
 const plans=effectiveAgendas(saved,active,programs,workouts);
 function slots(plan:PersonalAgenda,date:Date){
  const original=slotsOnDate(plan,date),choice=plan.legacyCycleId&&active?choices[`${active.programId}:${localDateKey(date)}`]:undefined;
  if(!choice||!plan.legacyCycleId)return original;
  const workout=agendaWorkout(choice,original.map(s=>s.code).join('/'),workouts,plan.legacyCycleId);
  return workout?[{kind:'workout' as const,code:workout.programCode??workout.name,label:workout.subtitle,workoutId:workout.id}]:original;
 }
 function begin(id:string){const result=startSession(id);if(result)navigate(`/app/session/${result}`);else toast.info('Continue ou finalize o treino em andamento antes de iniciar outro.');}
 function edit(plan:PersonalAgenda){if(plan.legacyCycleId)save(plan);navigate(`/app/objectives/${plan.objectiveId}?edit=${encodeURIComponent(plan.id)}`);}
 const date=readDate(selected),entries=plans.flatMap(plan=>slots(plan,date).map(slot=>({plan,slot})));
 return <div className="page agenda-page personal-agenda"><TopBar title="Minha agenda" eyebrow="OS DIAS QUE VOCÊ ESCOLHEU"/>
  <section className="card personal-instructions"><h2>Como montar sua rotina</h2><p>Abra um objetivo e confira a agenda sugerida pelo estúdio. Toque em <strong>Usar esta agenda</strong> para seguir os mesmos dias e semanas. Se preferir definir seus dias, escolha <strong>Criar minha agenda</strong> dentro do objetivo.</p><Link className="btn btn-secondary" to="/app/home">Explorar objetivos</Link></section>
  {!plans.length?<section className="card" style={{marginTop:20}}><h2>Sua agenda começa no objetivo</h2><p className="muted small" style={{marginTop:10}}>Escolha um objetivo para seguir a sugestão ou criar sua própria divisão de dias.</p></section>:<>
   <div className="personal-active-list">{plans.map(plan=><section className="card personal-plan-row" key={plan.id}><div><h2>{plan.title}</h2><p>{plan.mode==='suggestion'?'Sugestão do estúdio':'Dias escolhidos por você'} · {plan.weeks.length} semanas · início {readDate(plan.startsOn).toLocaleDateString('pt-BR')}</p>{agendaWeek(plan,new Date())===null&&<p>Fora do período escolhido. Confira as datas no calendário ou organize o próximo período dentro do objetivo.</p>}</div><Button variant="secondary" size="sm" onClick={()=>edit(plan)}>Ajustar no objetivo</Button></section>)}</div>
   <section className="agenda-calendar-section"><div className="agenda-calendar-heading"><div><p className="eyebrow">SEU CALENDÁRIO</p><h2>{month.toLocaleDateString('pt-BR',{month:'long'})}<span>{month.getFullYear()}</span></h2></div><div className="agenda-month-controls"><button aria-label="Mês anterior" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1,12))}><ChevronLeft size={18}/></button><button aria-label="Próximo mês" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1,12))}><ChevronRight size={18}/></button></div></div>
    <div className="agenda-calendar-layout"><div className="agenda-calendar card" role="group" aria-label="Calendário da minha agenda">{agendaDays.map(day=><span key={day} className="agenda-calendar-weekday">{day.slice(0,3)}</span>)}{monthDays(month).map(day=>{
     const key=localDateKey(day),scheduled=plans.flatMap(plan=>slots(plan,day)),codes=scheduled.filter(s=>s.kind!=='rest').map(s=>s.code),hasFlow=scheduled.some(s=>s.code.includes('SheFlow'));
     return <button key={key} type="button" className={`agenda-day ${selected===key?'is-selected':''} ${key===localDateKey(new Date())?'is-today':''} ${day.getMonth()!==month.getMonth()?'is-outside':''} ${codes.length?'has-workout':''}`} aria-label={`${day.toLocaleDateString('pt-BR')}: ${codes.join(' + ')||(hasFlow?'Descanso / SheFlow':scheduled.length?'Descanso':'sem rotina programada')}`} aria-pressed={selected===key} aria-current={key===localDateKey(new Date())?'date':undefined} onClick={()=>setSelected(key)}><span className="agenda-day-number">{day.getDate()}</span><span className="agenda-day-marker">{codes.length>1?`${codes.length} treinos`:codes[0]??(hasFlow?'Flow':scheduled.length?'—':'·')}</span></button>;
    })}</div><section className="card agenda-selected-day"><p className="eyebrow">DIA ESCOLHIDO</p><h2>{date.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</h2><div className="personal-selected-slots">{entries.length?entries.map(({plan,slot},index)=>{
     const workout=resolveSlot(slot,workouts,getObjectives(programs).find(o=>o.id===plan.objectiveId));
     return <div className="personal-slot" key={`${plan.id}-${index}`}><p className="eyebrow">{plan.title} · semana {agendaWeek(plan,date)}</p><h3>{slot.code} {slot.kind==='rest'?'':`· ${slot.label}`}</h3>{slot.kind==='rest'?<p className="muted small">Recuperação conforme a sua rotina.</p>:workout?<div className="row"><Button size="sm" onClick={()=>begin(workout.id)}><Play size={14}/>{isSessionWorkout(session,workout,workouts)?'Continuar treino':'Iniciar treino'}</Button><Link className="btn btn-secondary btn-sm" to={`/app/workouts/${workout.id}`}>Ver ficha</Link></div>:<><small>{slot.kind==='choice'?'A sugestão deixa esta ficha a escolher.':'A ficha deste dia ainda não está disponível ou precisa de conferência.'}</small><Link className="text-link" to={`/app/objectives/${plan.objectiveId}`}>Conferir objetivo</Link></>}</div>;
    }):<p className="muted small">Nenhuma rotina programada para esta data.</p>}</div></section></div>
   </section>
  </>}
 </div>;
}
