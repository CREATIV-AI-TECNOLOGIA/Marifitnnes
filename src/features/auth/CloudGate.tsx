import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { api, cloudEnabled, connectCloud, flushCloud, reloadCloud, syncStatus } from '../../services/cloud';
import { useAppStore } from '../../stores/use-app-store';
import { Button } from '../../components/ui';
import type { User } from '../../types';
let bootstrap:Promise<void>|undefined;

export default function CloudGate({children}:{children:ReactNode}){
  const [ready,setReady]=useState(!cloudEnabled),[error,setError]=useState('');
  const user=useAppStore(s=>s.user);
  const status=useSyncExternalStore(syncStatus.subscribe,syncStatus.get,syncStatus.get);
  useEffect(()=>{if(!cloudEnabled)return;let active=true;
    bootstrap??=api<{user:User & {id:string}}>('/auth/me').then(async result=>{await connectCloud(result.user);});
    bootstrap.catch(e=>{if(active){useAppStore.setState({user:null});if(e.status!==401)setError('Não foi possível conectar. Tente novamente.');}}).finally(()=>{if(active)setReady(true);});
    return()=>{active=false;};
  },[]);
  if(!ready)return <div className="page"><p role="status">Conectando sua conta…</p></div>;
  return <>{error&&<p className="cloud-status" role="alert">{error}</p>}{cloudEnabled&&user&&<aside className="cloud-status" role="status"><span>{status}</span>{status!=='Tudo salvo na nuvem.'&&status!=='Salvando…'&&<><Button variant="ghost" onClick={()=>void flushCloud()}>Tentar salvar</Button><Button variant="ghost" onClick={()=>{if(window.confirm('Carregar a versão da nuvem? As alterações locais ainda não sincronizadas serão substituídas.'))void reloadCloud();}}>Carregar nuvem</Button></>}</aside>}{children}</>;
}
