import {useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {api,authenticateCloud} from '../../services/cloud';
type GoogleApi={initialize:(options:{client_id:string;nonce:string;auto_select:boolean;callback:(result:{credential:string})=>void})=>void;renderButton:(element:HTMLElement,options:Record<string,string|number>)=>void;};
type GoogleConfig={enabled:boolean;clientId?:string;nonce?:string};
declare global {interface Window {google?:{accounts:{id:GoogleApi}};}}
let scriptPromise:Promise<void>|undefined;
function loadGoogle(){
  if(window.google)return Promise.resolve();
  return scriptPromise??=new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
    script.onload=()=>resolve();script.onerror=()=>{scriptPromise=undefined;script.remove();reject(new Error('Não foi possível carregar o Google. Confira sua conexão.'));};document.head.append(script);
  });
}
export default function GoogleLoginButton({link=false}:{link?:boolean}){
  const host=useRef<HTMLDivElement>(null),working=useRef(false),navigate=useNavigate();
  const [status,setStatus]=useState('Carregando Google…'),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const challenge=useRef<{attempt:number;promise:Promise<GoogleConfig>}|null>(null);
  useEffect(()=>{let active=true;let resize:ResizeObserver|undefined;
    async function setup(){try{
      if(!challenge.current || challenge.current.attempt!==attempt)challenge.current={attempt,promise:api<GoogleConfig>('/auth/google/config',{method:'POST',body:JSON.stringify({link})})};
      const config=await challenge.current.promise;
      if(!active)return;
      if(!config.enabled){setStatus('O login Google estará disponível após a configuração.');return;}
      await loadGoogle();if(!active||!host.current||!window.google)return;
      window.google.accounts.id.initialize({client_id:config.clientId!,nonce:config.nonce!,auto_select:false,callback:result=>{void login(result.credential);}});
      const element=host.current;let lastWidth=0;
      const render=()=>{
        if(!active||!window.google)return;
        const width=Math.min(400,Math.floor(element.getBoundingClientRect().width));
        if(width<=0||width===lastWidth)return;lastWidth=width;
        element.replaceChildren();window.google.accounts.id.renderButton(element,{type:'standard',theme:'filled_black',size:'large',shape:'rectangular',text:'continue_with',logo_alignment:'left',locale:'pt-BR',width});
      };
      render();resize=new ResizeObserver(render);resize.observe(element);setStatus('');
    }catch(cause){if(active){setStatus('');setError(cause instanceof Error?cause.message:'Não foi possível abrir o Google.');}}}
    async function login(credential:string){
      if(!active||working.current)return;working.current=true;setStatus('Conectando…');setError('');
      try{await authenticateCloud('/auth/google',{credential});if(active)navigate(link?'/app/profile':'/app/home',{replace:true});}
      catch(cause){if(active){setError(cause instanceof Error?cause.message:'Não foi possível entrar com o Google.');setStatus('');setAttempt(value=>value+1);}}
      finally{working.current=false;}
    }
    void setup();return()=>{active=false;resize?.disconnect();};
  },[link,attempt,navigate]);
  return <div className="google-login"><div className="google-login-host" ref={host} />{status&&<p className="small muted" role="status">{status}</p>}{error&&<><p className="error-text" role="alert">{error}</p><button className="btn btn-secondary" type="button" onClick={()=>{setError('');setAttempt(value=>value+1);}}>Tentar Google novamente</button></>}</div>;
}
