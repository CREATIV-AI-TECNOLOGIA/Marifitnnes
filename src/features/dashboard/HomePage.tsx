import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Play, Target } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../stores/use-app-store';
import { getObjectives, objectiveWorkouts } from '../../data/objectives';
import { studioCatalog } from '../../data/studio-catalog';
import './dashboard.css';
import '../objectives/objectives.css';
export default function HomePage(){
 const programs=useAppStore(s=>s.programs),workouts=useAppStore(s=>s.workouts),session=useAppStore(s=>s.activeSession);
 const [search,setSearch]=useState('');
 const objectives=getObjectives(programs).filter(o=>(o.title+' '+o.description).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
 return <div className="page home-page home-simple objectives-page">
  <header className="home-header"><div><p className="eyebrow">SEU CAMINHO</p><h1>Qual é o seu<br/><span>objetivo?</span></h1><p className="home-library-intro">Escolha um objetivo. Siga a sugestão do estúdio ou organize os seus dias.</p></div><Target size={28} aria-hidden="true"/></header>
  {session&&<Link className="home-current-session" to={`/app/session/${session.id}`}><Play size={18}/><span><small>EM ANDAMENTO</small><strong>Continuar treino {session.workoutName}</strong></span><ArrowRight size={18}/></Link>}
  <label className="field objective-search">Buscar objetivo<input className="input" type="search" placeholder="Hipertrofia, glúteos, superiores…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
  <div className="objective-grid">{objectives.map(o=>{
   const cover=studioCatalog.find(x=>x.workout.programId===o.libraryProgramId)??studioCatalog[0];
   const count=objectiveWorkouts(o,workouts).length;
   return <Link className="objective-card" key={o.id} to={`/app/objectives/${o.id}`} aria-label={`Explorar objetivo ${o.title}`}>
    <div className="objective-cover"><img src={cover.image} alt="" style={{objectPosition:cover.imagePosition}}/><span>{o.place}</span><Target size={20} aria-hidden="true"/></div>
    <div className="objective-copy"><h2>{o.title}</h2><p>{o.description}</p><small>{o.suggestion?'Agenda sugerida disponível':'Agenda sugerida pendente'}{count?` · ${count} fichas`:''}</small><span className="objective-open">Explorar objetivo<ArrowRight size={16}/></span></div>
   </Link>;
  })}</div>
  {!objectives.length&&<p role="status">Nenhum objetivo encontrado.</p>}
  <Link to="/app/agenda" className="home-agenda-link"><CalendarDays size={22}/><span><strong>Minha agenda</strong><small>Veja os dias que você escolheu seguir</small></span><ArrowRight size={17}/></Link>
 </div>;
}
