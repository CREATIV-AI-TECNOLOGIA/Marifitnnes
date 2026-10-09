import type { D1Database, R2Bucket, Fetcher } from '@cloudflare/workers-types';
import { z } from 'zod';
import { ApiError, fail, digest, hashPassword, verifyPassword, requireSameOrigin, validatePdf } from './security';
import { extractWithGemini } from './extraction';
import { snapshotSchema, draftSchema } from '../src/services/cloud-schema';
import { preparePdfImport, verifiedSources } from '../src/services/pdf-content';
import type { PdfSource, PdfImportDraft } from '../src/types';
import {googleAccount,googleChallenge,consumeGoogleChallenge,verifyGoogleToken,googleCookie} from './google-auth';

interface Env { DB:D1Database; PDFS:R2Bucket; ASSETS:Fetcher; GEMINI_API_KEY?:string; GEMINI_MODEL?:string; GOOGLE_CLIENT_ID?:string; }
type Account={id:string;name:string;email:string};
const json=(data:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
async function body(request:Request,max:number) {
  if(Number(request.headers.get('Content-Length'))>max) fail(413,'ARQUIVO_GRANDE','O conteúdo excede o limite.');
  const reader=request.body?.getReader(); if(!reader) return new Uint8Array();
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done) break;length+=value.length;if(length>max){await reader.cancel();fail(413,'ARQUIVO_GRANDE','O conteúdo excede o limite.');}chunks.push(value);}
  const out=new Uint8Array(length);let offset=0;for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length;}return out;
}
async function parse(request:Request,max=100000){try{return JSON.parse(new TextDecoder().decode(await body(request,max)));}catch(e){if(e instanceof ApiError)throw e;return fail(400,'DADOS_INVALIDOS','Dados inválidos.');}}
async function quota(env:Env,key:string,maximum:number,seconds:number){
  const now=Math.floor(Date.now()/1000),bucket=Math.floor(now/seconds);
  const result=await env.DB.prepare('INSERT INTO limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(`${key}:${bucket}`,now+seconds).first<{count:number}>();
  if(!result || result.count>maximum)fail(429,'LIMITE_ATINGIDO','Limite de tentativas atingido. Aguarde e tente novamente.');
  await env.DB.prepare('DELETE FROM limits WHERE key IN (SELECT key FROM limits WHERE expires_at < ? LIMIT 100)').bind(now).run();
}
async function account(request:Request,env:Env):Promise<Account>{
  const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)forma_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if(!token)return fail(401,'SESSAO_EXPIRADA','Entre na sua conta para continuar.');
  const user=await env.DB.prepare('SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token),Date.now()).first<Account>();
  if(!user)return fail(401,'SESSAO_EXPIRADA','Entre na sua conta para continuar.');return user;
}
const cookie=(request:Request,token:string,age:number)=>`forma_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol==='https:'?'; Secure':''}`;
async function auth(request:Request,env:Env,path:string){
  const ip=request.headers.get('CF-Connecting-IP')??'local';await quota(env,`auth:${await digest(ip)}`,12,300);
  const credentials=z.object({email:z.string().email().max(254).transform(s=>s.toLowerCase().trim()),password:z.string().min(10).max(128),name:z.string().trim().min(2).max(70).optional()}).parse(await parse(request));
  let user:Account;
  if(path.endsWith('/register')){
    if(!credentials.name)fail(400,'DADOS_INVALIDOS','Informe seu nome.');
    await quota(env,`register:${await digest(ip)}`,10,86400);
    user={id:crypto.randomUUID(),name:credentials.name!,email:credentials.email};
    const passwordHash=await hashPassword(credentials.password);
    const result=await env.DB.prepare('INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?) ON CONFLICT(email) DO NOTHING').bind(user.id,user.email,user.name,passwordHash,Date.now()).run();
    if(!result.meta.changes)fail(409,'CONTA_EXISTENTE','Não foi possível criar a conta. Se você já possui conta, use Entrar.');
  }else{
    const row=await env.DB.prepare('SELECT id,email,name,password_hash FROM users WHERE email=?').bind(credentials.email).first<Account & {password_hash:string}>();
    // Same expensive operation for unknown e-mails prevents timing enumeration.
    const stored=row?.password_hash.startsWith('scrypt:')?row.password_hash:`scrypt:${'0'.repeat(32)}:${'0'.repeat(64)}`;
    const valid=await verifyPassword(credentials.password,stored);
    if(!row||!valid)fail(401,'CREDENCIAIS_INVALIDAS','E-mail ou senha incorretos.');
    user={id:row!.id,name:row!.name,email:row!.email};
  }
  return session(request,env,user);
}
async function session(request:Request,env:Env,user:Account,google=false){
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()),env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await digest(token),user.id,Date.now()+7*86400000)]);
  const response=json({user},200,{'Set-Cookie':cookie(request,token,7*86400)});
  if(google)response.headers.append('Set-Cookie',googleCookie(request,'',0));return response;
}
async function importPdf(request:Request,env:Env,user:Account){
  await quota(env,`upload:${user.id}`,30,3600);
  const bytes=await body(request,20*1024*1024);const sha256=await digest(bytes);
  const known=(verifiedSources as PdfSource[]).find(s=>s.sha256===sha256);
  const pageCount=known?.pageCount??await validatePdf(bytes);
  if(!known&&!env.GEMINI_API_KEY)fail(503,'IA_NAO_CONFIGURADA','A leitura de PDFs novos ficará disponível após configurar o Gemini.');
  const existing=await env.DB.prepare('SELECT id,draft,status,created_at FROM imports WHERE user_id=? AND sha256=?').bind(user.id,sha256).first<{id:string;draft:string|null;status:string;created_at:number}>();
  if(existing?.draft)return json({...JSON.parse(existing.draft),cloudImportId:existing.id});
  if(existing?.status==='processing' && existing.created_at>Date.now()-180000)fail(409,'IMPORTACAO_EM_ANDAMENTO','Este PDF já está sendo processado. Aguarde antes de tentar novamente.');
  let filename='treino.pdf';try{filename=decodeURIComponent(request.headers.get('X-Filename')??filename).slice(0,200).replace(/[\r\n/\\]/g,'_');}catch{}
  const importId=existing?.id??crypto.randomUUID();
  const inserted=await env.DB.prepare("INSERT INTO imports(id,user_id,sha256,filename,page_count,status,created_at) VALUES(?,?,?,?,?,'processing',?) ON CONFLICT(user_id,sha256) DO UPDATE SET status='processing',created_at=excluded.created_at WHERE imports.status='failed' OR (imports.status='processing' AND imports.created_at<excluded.created_at-180000) RETURNING id").bind(importId,user.id,sha256,filename,pageCount,Date.now()).first();
  if(!inserted)fail(409,'IMPORTACAO_EM_ANDAMENTO','Este PDF já está sendo processado.');
  try{
    if(!known)await quota(env,`gemini:${user.id}`,5,86400);
    const source:PdfSource={id:sha256,sha256,name:filename,kind:'workout',pageCount,pages:[]};
    await env.PDFS.put(`${user.id}/${sha256}.pdf`,bytes,{httpMetadata:{contentType:'application/pdf'}});
    const draft:PdfImportDraft=known?preparePdfImport({...known,name:filename}):await extractWithGemini(bytes,source,env.GEMINI_API_KEY!,env.GEMINI_MODEL??'gemini-3.5-flash-lite');
    draft.cloudImportId=importId;
    await env.DB.prepare("UPDATE imports SET status='review',draft=? WHERE id=? AND user_id=?").bind(JSON.stringify(draft),importId,user.id).run();return json(draft);
  }catch(error){await env.DB.prepare("UPDATE imports SET status='failed' WHERE id=? AND user_id=?").bind(importId,user.id).run();throw error;}
}
async function route(request:Request,env:Env){
  const path=new URL(request.url).pathname;
  if(!path.startsWith('/api/'))return env.ASSETS.fetch(request as never) as unknown as Response;
  if(!['GET','HEAD'].includes(request.method))requireSameOrigin(request);
  if(path==='/api/health'&&request.method==='GET')return json({status:'ok',geminiConfigured:!!env.GEMINI_API_KEY});
  if(path==='/api/auth/google/config'&&request.method==='POST'){
    if(!env.GOOGLE_CLIENT_ID)return json({enabled:false});
    const ip=request.headers.get('CF-Connecting-IP')??'local';await quota(env,`google-start:${await digest(ip)}`,30,300);
    const {link}=z.object({link:z.boolean().default(false)}).parse(await parse(request));
    const user=link?await account(request,env):null;
    const challenge=await googleChallenge(request,env.DB,user?.id??null);
    return json({enabled:true,clientId:env.GOOGLE_CLIENT_ID,nonce:challenge.nonce},200,{'Set-Cookie':challenge.cookie});
  }
  if(path==='/api/auth/google'&&request.method==='POST'){
    if(!env.GOOGLE_CLIENT_ID)fail(503,'GOOGLE_NAO_CONFIGURADO','O login Google ainda está em configuração.');
    const ip=request.headers.get('CF-Connecting-IP')??'local';await quota(env,`google-login:${await digest(ip)}`,12,300);
    const {credential}=z.object({credential:z.string().min(1).max(12000)}).parse(await parse(request,15000));
    const challenge=await consumeGoogleChallenge(request,env.DB);
    if(challenge.user_id && (await account(request,env)).id!==challenge.user_id)fail(401,'SESSAO_EXPIRADA','Entre novamente antes de vincular.');
    const identity=await verifyGoogleToken(credential,env.GOOGLE_CLIENT_ID!,challenge.nonce);
    const user=await googleAccount(env.DB,identity,challenge.user_id);
    return session(request,env,user,true);
  }
  if(['/api/auth/login','/api/auth/register'].includes(path)&&request.method==='POST')return auth(request,env,path);
  const user=await account(request,env);
  if(path==='/api/auth/me'&&request.method==='GET')return json({user});
  if(path==='/api/auth/profile'&&request.method==='PUT'){
    const {name}=z.object({name:z.string().trim().min(2).max(70)}).parse(await parse(request));
    await env.DB.prepare('UPDATE users SET name=? WHERE id=?').bind(name,user.id).run();return json({user:{...user,name}});
  }
  if(path==='/api/auth/logout'&&request.method==='POST'){
    const token=request.headers.get('Cookie')?.match(/forma_session=([a-f0-9]{64})/)?.[1];if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=? AND user_id=?').bind(await digest(token),user.id).run();return json({ok:true},200,{'Set-Cookie':cookie(request,'',0)});
  }
  if(path==='/api/state'&&request.method==='GET'){
    const row=await env.DB.prepare('SELECT data,revision FROM snapshots WHERE user_id=?').bind(user.id).first<{data:string;revision:number}>();return json({userId:user.id,data:row?JSON.parse(row.data):null,revision:row?.revision??0});
  }
  if(path==='/api/state'&&request.method==='PUT'){
    await quota(env,`state:${user.id}`,600,3600);
    const input=z.object({revision:z.number().int().min(0),data:snapshotSchema}).parse(await parse(request,3*1024*1024));
    const result=input.revision===0
      ? await env.DB.prepare('INSERT INTO snapshots(user_id,data,revision,updated_at) VALUES(?,?,1,?) ON CONFLICT(user_id) DO NOTHING RETURNING revision').bind(user.id,JSON.stringify(input.data),Date.now()).first<{revision:number}>()
      : await env.DB.prepare('UPDATE snapshots SET data=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? RETURNING revision').bind(JSON.stringify(input.data),Date.now(),user.id,input.revision).first<{revision:number}>();
    if(!result)fail(409,'CONFLITO_DE_SYNC','Outro dispositivo alterou seus dados. Recarregue a versão da nuvem antes de continuar.');return json(result);
  }
  if(path==='/api/imports'&&request.method==='POST')return importPdf(request,env,user);
  const match=path.match(/^\/api\/imports\/([a-f0-9-]{36})\/(pdf|confirm)$/);
  const removal=path.match(/^\/api\/imports\/([a-f0-9-]{36})$/);
  if(removal&&request.method==='DELETE'){
    const own=await env.DB.prepare('SELECT sha256 FROM imports WHERE id=? AND user_id=?').bind(removal[1],user.id).first<{sha256:string}>();
    if(!own)fail(404,'NAO_ENCONTRADO','Arquivo não encontrado.');
    await env.PDFS.delete(`${user.id}/${own!.sha256}.pdf`);
    await env.DB.prepare('DELETE FROM imports WHERE id=? AND user_id=?').bind(removal[1],user.id).run();return json({ok:true});
  }
  if(match){
    const row=await env.DB.prepare('SELECT sha256,draft FROM imports WHERE id=? AND user_id=?').bind(match[1],user.id).first<{sha256:string;draft:string|null}>();
    if(!row)fail(404,'NAO_ENCONTRADO','Arquivo não encontrado.');
    if(match[2]==='pdf'&&request.method==='GET'){
      const object=await env.PDFS.get(`${user.id}/${row!.sha256}.pdf`);if(!object)fail(404,'NAO_ENCONTRADO','Arquivo não encontrado.');
      return new Response(object!.body as unknown as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="treino.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"frame-ancestors 'self'"}});
    }
    if(match[2]==='confirm'&&request.method==='POST'){
      const draft=draftSchema.parse(await parse(request,1024*1024));const original=JSON.parse(row!.draft??'null') as PdfImportDraft|null;
      if(!original||draft.source.id!==original.source.id||draft.source.sha256!==row!.sha256||draft.source.pageCount!==original.source.pageCount||draft.workout?.id!==original.workout?.id||draft.agenda?.id!==original.agenda?.id)fail(400,'DADOS_INVALIDOS','A referência do PDF não pode ser alterada.');
      if(draft.exercises.some(e=>e.sourcePage && e.sourcePage>draft.source.pageCount))fail(400,'DADOS_INVALIDOS','Página de origem inválida.');
      await env.DB.prepare("UPDATE imports SET draft=?,status='confirmed' WHERE id=? AND user_id=?").bind(JSON.stringify(draft),match[1],user.id).run();return json({ok:true});
    }
  }
  return json({code:'NAO_ENCONTRADO',message:'Rota não encontrada.'},404);
}
export default {async fetch(request:Request,env:Env):Promise<Response>{try{return await route(request,env);}catch(error){
  if(error instanceof ApiError)return json({code:error.code,message:error.message},error.status);
  if(error instanceof z.ZodError)return json({code:'DADOS_INVALIDOS',message:'Os dados estão incompletos ou fora dos limites permitidos.'},400);
  return json({code:'ERRO_INTERNO',message:'Não foi possível concluir. Seus dados confirmados foram preservados.'},500);
}}};
