import { useAppStore } from '../stores/use-app-store';
import { snapshotSchema, type CloudSnapshot } from './cloud-schema';
import type { PdfImportDraft, User } from '../types';
import { addReadyWorkouts } from '../data/ready-workouts';

export const cloudEnabled=import.meta.env.VITE_CLOUD_MODE==='true';
export class CloudError extends Error { constructor(public code:string,message:string,public status:number){super(message);} }
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
  const response=await fetch(`/api${path}`,{...options,credentials:'same-origin',headers:{...(options.body && !(options.body instanceof File)?{'Content-Type':'application/json'}:{}),...options.headers}});
  const result=await response.json();if(!response.ok)throw new CloudError(result.code??'ERRO',result.message??'Não foi possível concluir.',response.status);return result as T;
}
type CloudUser=User & {id:string};
let authenticating=false;
export async function authenticateCloud(path:string,credentials:unknown){
  if(authenticating)throw new CloudError('LOGIN_EM_ANDAMENTO','Aguarde a entrada em andamento.',409);
  authenticating=true;
  try{const result=await api<{user:CloudUser}>(path,{method:'POST',body:JSON.stringify(credentials)});await connectCloud(result.user);return result.user;}
  finally{authenticating=false;}
}
const initial=useAppStore.getInitialState();
let connected:CloudUser|null=null,revision=0,dirty=false,saving=false,stop:(()=>void)|null=null,timer:ReturnType<typeof setTimeout>|undefined;
let status='';const listeners=new Set<()=>void>();
export const syncStatus={subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};},get:()=>status};
function announce(message:string){status=message;listeners.forEach(fn=>fn());}
const fields=['personalAgendas','exercises','workouts','programs','cycles','activeAgenda','preferredFrequency','agendaChoices','history','activeSession','sources','preferences'] as const;
export function snapshot():CloudSnapshot {const state=useAppStore.getState();return snapshotSchema.parse(Object.fromEntries(fields.map(key=>[key,state[key]])));}
function marker(){return connected?`forma-cloud-pending-${connected.id}`:'';}
export async function connectCloud(user:CloudUser){
  // Finish loading before exposing the account to routes that can edit its data.
  const remote=await api<{data:CloudSnapshot|null;revision:number;userId:string}>('/state');
  if(remote.userId!==user.id)throw new CloudError('CONTA_ALTERADA','A conta mudou durante a conexão. Entre novamente.',409);
  stop?.();clearTimeout(timer);connected=null;dirty=false;
  let cached:CloudSnapshot|undefined;
  try{const raw=localStorage.getItem(`forma-cloud-${user.id}`);if(raw)cached=snapshotSchema.parse(JSON.parse(raw).state);}catch{}
  useAppStore.persist.setOptions({name:`forma-cloud-${user.id}`});
  useAppStore.setState({...initial,...cached,user});
  connected=user;
  const pending=localStorage.getItem(marker());
  let pendingRevision:number|undefined;try{pendingRevision=pending?JSON.parse(pending).revision:undefined;}catch{}
  if(pendingRevision!==undefined){dirty=true;revision=pendingRevision;if(revision!==remote.revision)announce('Outro dispositivo alterou os dados. Sua cópia local foi preservada.');else announce('Alterações aguardando sincronização.');}
  else{revision=remote.revision;if(remote.data)useAppStore.setState({...snapshotSchema.parse(remote.data),user});else dirty=true;announce(dirty?'Preparando sua conta…':'Tudo salvo na nuvem.');}
  stop=useAppStore.subscribe((state,previous)=>{
    if(fields.every(key=>state[key]===previous[key]))return;
    dirty=true;localStorage.setItem(marker(),JSON.stringify({revision}));announce('Salvando…');clearTimeout(timer);timer=setTimeout(()=>{void flushCloud();},1200);
  });
  useAppStore.setState(addReadyWorkouts);
  if(dirty && revision===remote.revision)await flushCloud();
}
export async function flushCloud(){
  if(!connected||!dirty||saving)return;
  const userId=connected.id;
  saving=true;dirty=false;
  try{
    const data=snapshot();const result=await api<{revision:number}>('/state',{method:'PUT',body:JSON.stringify({revision,data})});
    if(connected?.id!==userId)return;
    revision=result.revision;if(dirty){localStorage.setItem(marker(),JSON.stringify({revision}));timer=setTimeout(()=>{void flushCloud();},1200);}else{localStorage.removeItem(marker());announce('Tudo salvo na nuvem.');}
  }catch(error){if(connected?.id!==userId)return;dirty=true;announce(error instanceof Error?error.message:'Sem conexão. Alterações preservadas neste dispositivo.');localStorage.setItem(marker(),JSON.stringify({revision}));}
  finally{saving=false;}
}
export async function reloadCloud(){
  if(!connected||saving)return;
  const remote=await api<{data:CloudSnapshot|null;revision:number}>('/state');
  stop?.();stop=null;localStorage.removeItem(marker());
  if(remote.data)useAppStore.setState(snapshotSchema.parse(remote.data));
  await connectCloud(connected);
}
export async function cloudLogout(){
  await flushCloud();await api('/auth/logout',{method:'POST',body:'{}'});
  stop?.();stop=null;clearTimeout(timer);connected=null;announce('');
  const cacheName=useAppStore.persist.getOptions().name;
  useAppStore.persist.setOptions({name:'forma-cloud-signed-out'});
  useAppStore.setState({...initial,user:null});
  useAppStore.persist.setOptions({name:cacheName});
}
export function importCloudPdf(file:File){return api<PdfImportDraft>('/imports',{method:'POST',body:file,headers:{'Content-Type':'application/pdf','X-Filename':encodeURIComponent(file.name)}});}
export async function confirmCloudPdf(draft:PdfImportDraft){if(draft.cloudImportId)await api(`/imports/${draft.cloudImportId}/confirm`,{method:'POST',body:JSON.stringify(draft)});}
