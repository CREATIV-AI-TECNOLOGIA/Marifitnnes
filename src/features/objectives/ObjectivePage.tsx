import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, TopBar } from '../../components/ui';
import { getObjectives, objectiveWorkouts } from '../../data/objectives';
import { agendaDays, createCustomAgenda, createObjectiveAgenda, localDateKey, monday } from '../../services/personal-agenda';
import { useAppStore } from '../../stores/use-app-store';
import type { PersonalAgenda } from '../../types';
import './objectives.css';
export default function ObjectivePage(){
 const {id}=useParams(),navigate=useNavigate();const [query,setQuery]=useSearchParams();
 const programs=useAppStore(s=>s.programs),workouts=useAppStore(s=>s.workouts),plans=useAppStore(s=>s.personalAgendas??[]),save=useAppStore(s=>s.savePersonalAgenda);
 const objective=getObjectives(programs).find(o=>o.id===id);
 const editing=plans.find(p=>p.id===query.get('edit')&&p.objectiveId===id);
 const [frequency,setFrequency]=useState(objective?.suggestion?.frequencies[0]?.frequency??0),[week,setWeek]=useState(1);
 const [startsOn,setStartsOn]=useState(editing?.startsOn??localDateKey(monday(new Date())));
 const [duration,setDuration]=useState(editing?.weeks.length??6);
 const [days,setDays]=useState<string[][]>(()=>editing?.weeks[0].days.map(slots=>slots.filter(s=>s.kind!=='rest'&&s.kind!=='choice').map(s=>s.workoutId??'ref:'+s.code))??Array.from({length:7},()=>[]));
 const [candidate,setCandidate]=useState<PersonalAgenda|null>(null);
 if(!objective)return <div className="page"><TopBar title="Objetivo não encontrado" back="/app/home"/></div>;
 const options=objective.suggestion?.frequencies??[],selected=options.find(f=>f.frequency===frequency),row=selected?.weeks.find(w=>w.week===week);
 const available=objectiveWorkouts(objective,workouts);
 const referenceCodes=objective.suggestion?.workoutCodes??objective.codes??[];
 const custom=query.get('mode')==='custom'||!!editing;
 function commit(plan:PersonalAgenda){save(plan);toast.success('Agenda incluída em Minha agenda.');navigate('/app/agenda');}
 function submit(plan:PersonalAgenda|null){if(!plan){toast.error('Confira a data e escolha pelo menos uma ficha nos seus dias.');return;}if(plans.some(p=>p.objectiveId===plan.objectiveId))setCandidate(plan);else commit(plan);}
 function choose(day:number,index:number,value:string){setDays(previous=>previous.map((values,d)=>d===day?values.map((old,i)=>i===index?value:old):values));}
 return <div className="page objective-detail">
  <TopBar title={objective.title} eyebrow="OBJETIVO" back="/app/home"/>
  <p className="objective-intro">{objective.description}</p>
  <section className="card objective-suggestion"><div className="row between"><h2>{custom?'Minha divisão de dias':'Agenda sugerida pelo estúdio'}</h2><CalendarDays size={22}/></div>
   <p className="muted small">{custom?'Escolha os treinos e os dias. Essa divisão será repetida pelo número de semanas que você definir.':'Ao aceitar, os dias e as semanas desta sugestão aparecem na sua agenda.'}</p>
   <div className="objective-controls"><label className="field">Semana de início<input className="input" type="date" value={startsOn} onChange={e=>setStartsOn(e.target.value)}/></label>
    {custom?<label className="field">Repetir por quantas semanas?<input className="input" type="number" min={1} max={12} value={duration} onChange={e=>setDuration(Number(e.target.value))}/></label>:options.length>0&&<><label className="field">Dias por semana<select className="input" value={frequency} onChange={e=>{setFrequency(Number(e.target.value));setWeek(1);}}>{options.map(f=><option key={f.frequency} value={f.frequency}>{f.frequency} dias</option>)}</select></label><label className="field">Ver semana<select className="input" value={week} onChange={e=>setWeek(Number(e.target.value))}>{selected?.weeks.map(w=><option key={w.week} value={w.week}>Semana {w.week}</option>)}</select></label></>}
   </div>
   {custom?<div className="objective-week">{agendaDays.map((day,d)=><div className="objective-day" key={day}><h3>{day}</h3>{days[d].map((value,i)=><div className="custom-slot" key={i}><select className="input" aria-label={`Ficha de ${day} ${i+1}`} value={value} onChange={e=>choose(d,i,e.target.value)}><option value="">Escolha uma ficha</option>{available.map(w=><option key={w.id} value={w.id}>{w.name} · {w.subtitle}</option>)}{referenceCodes.filter(code=>!available.some(w=>w.programCode===code)).map(code=><option key={code} value={'ref:'+code}>{code} · ficha pendente</option>)}</select><Button variant="ghost" size="sm" aria-label={`Remover ficha de ${day} ${i+1}`} onClick={()=>setDays(old=>old.map((list,index)=>index===d?list.filter((_,n)=>n!==i):list))}>Remover</Button></div>)}{!days[d].length&&<p className="muted small">Descanso</p>}<Button variant="secondary" size="sm" disabled={days[d].length>=8||!available.length&&!referenceCodes.length} onClick={()=>setDays(old=>old.map((list,index)=>index===d?[...list,'']:list))}>Escolher ficha</Button></div>)}</div>:
    row?<div className="objective-week">{row.days.map((code,i)=><div key={i} className={`objective-day ${code.startsWith('Descanso')?'objective-rest':''}`}><h3>{agendaDays[i]}</h3><strong>{code}</strong><p className="muted small">{objective.suggestion?.workoutLabels[code]??(code.startsWith('Escolher')?'Defina o treino ao personalizar a agenda.':code.startsWith('Descanso')?'Recuperação':'Treino do objetivo')}</p></div>)}</div>:<div className="objective-missing"><h3>Agenda sugerida pendente</h3><p>{objective.missing}</p><p className="muted small">Você pode organizar os treinos disponíveis nos seus próprios dias.</p></div>}
   {[...objective.notes,...(!custom&&selected?.note?[selected.note]:[])].map(note=><p className="objective-note" key={note}>{note}</p>)}
   {custom&&editing?.mode==='suggestion'&&<p className="objective-note">Esta edição usa a primeira semana como base e repete a sua divisão pelo período escolhido. A sugestão original continua disponível no objetivo.</p>}
   {custom&&!available.length&&!referenceCodes.length&&<p className="objective-note">Ainda faltam treinos deste objetivo. Nenhum exercício será preenchido automaticamente.</p>}
   <div className="objective-actions">{custom?<><Button onClick={()=>submit(createCustomAgenda(objective,startsOn,days.map(list=>list.filter(Boolean)),workouts,duration))}>Salvar minha agenda<ArrowRight size={16}/></Button><Button variant="ghost" onClick={()=>setQuery({})}>Ver sugestão</Button></>:<>{selected&&<Button onClick={()=>submit(createObjectiveAgenda(objective,frequency,startsOn,workouts))}>Usar esta agenda<ArrowRight size={16}/></Button>}<Button variant="secondary" onClick={()=>setQuery({mode:'custom'})}>Criar minha agenda</Button></>}</div>
  </section>
  <section className="card objective-library"><h2>Treinos deste objetivo</h2><p className="muted small">Cada treino contém os exercícios de uma sessão.</p>{available.length?available.map(w=><Link className="objective-workout" to={`/app/workouts/${w.id}`} key={w.id}><span><strong>{w.name}</strong><small>{w.subtitle} · {w.exerciseIds.length} exercícios</small></span><ArrowRight size={17}/></Link>):<p className="objective-note">Treinos ainda não disponíveis para este objetivo.</p>}</section>
  <ConfirmDialog open={!!candidate} onOpenChange={open=>!open&&setCandidate(null)} title="Substituir a agenda deste objetivo?" description="Os dias que você tinha escolhido para este objetivo serão substituídos. Seus treinos realizados permanecem no histórico."><div className="stack"><Button onClick={()=>{if(candidate)commit(candidate);}}>Substituir agenda</Button><Button variant="secondary" onClick={()=>setCandidate(null)}>Manter minha agenda</Button></div></ConfirmDialog>
 </div>;
}
