import type {D1Database} from '@cloudflare/workers-types';
import {createRemoteJWKSet,jwtVerify,type JWTPayload,type JWTVerifyGetKey} from 'jose';
import {z} from 'zod';
import {digest,fail,equal} from './security';

const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export function validateGoogleIdentity(claims:JWTPayload,nonce:string){
  const identity=z.object({sub:z.string().min(1).max(255),email:z.string().email().max(254),email_verified:z.literal(true),nonce:z.string(),name:z.string().max(200).optional()}).safeParse(claims);
  if(!identity.success || !equal(identity.data.nonce,nonce))return fail(401,'GOOGLE_INVALIDO','Não foi possível confirmar sua identidade Google. Tente novamente.');
  return {...identity.data,email:identity.data.email.toLowerCase()};
}
export async function verifyGoogleToken(token:string,clientId:string,nonce:string,keySet:JWTVerifyGetKey=keys){
  try{
    const {payload}=await jwtVerify(token,keySet,{issuer:['https://accounts.google.com','accounts.google.com'],audience:clientId,algorithms:['RS256'],requiredClaims:['exp','iat','sub'],maxTokenAge:'10m'});
    return validateGoogleIdentity(payload,nonce);
  }catch{return fail(401,'GOOGLE_INVALIDO','Não foi possível confirmar sua identidade Google. Tente novamente.');}
}
export async function googleAccount(db:D1Database,identity:ReturnType<typeof validateGoogleIdentity>,linkUserId:string|null){
  type Account={id:string;name:string;email:string};
  const existing=await db.prepare('SELECT u.id,u.name,u.email FROM google_identities g JOIN users u ON u.id=g.user_id WHERE g.subject=?').bind(identity.sub).first<Account>();
  if(existing){if(linkUserId && existing.id!==linkUserId)fail(409,'GOOGLE_OUTRA_CONTA','Este Google já está vinculado a outra conta.');return existing;}
  if(linkUserId){
    const user=await db.prepare('SELECT id,name,email FROM users WHERE id=?').bind(linkUserId).first<Account>();
    if(!user) return fail(401,'SESSAO_EXPIRADA','Entre na conta novamente antes de vincular o Google.');
    const other=await db.prepare('SELECT subject FROM google_identities WHERE user_id=?').bind(linkUserId).first();
    if(other)fail(409,'GOOGLE_JA_VINCULADO','Sua conta já tem um Google vinculado.');
    const result=await db.prepare('INSERT INTO google_identities(subject,user_id) VALUES(?,?) ON CONFLICT DO NOTHING').bind(identity.sub,linkUserId).run();
    if(!result.meta.changes)fail(409,'GOOGLE_CONFLITO','Não foi possível vincular. Tente novamente.');return user;
  }
  // Existing password accounts must prove ownership before linking, even with matching email.
  const emailExists=await db.prepare('SELECT id FROM users WHERE email=?').bind(identity.email).first();
  if(emailExists)fail(409,'GOOGLE_VINCULAR','Já existe uma conta com este e-mail. Entre com sua senha e vincule o Google no Perfil.');
  const user={id:crypto.randomUUID(),name:(identity.name?.trim()||identity.email.split('@')[0]).slice(0,70),email:identity.email};
  await db.batch([
    db.prepare('INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)').bind(user.id,user.email,user.name,'google-only',Date.now()),
    db.prepare('INSERT INTO google_identities(subject,user_id) VALUES(?,?)').bind(identity.sub,user.id),
  ]);
  return user;
}
export function googleCookie(request:Request,token:string,age:number){return `forma_google=${token}; Path=/api/auth/google; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
export async function googleChallenge(request:Request,db:D1Database,userId:string|null){
  const token=crypto.randomUUID(),nonce=crypto.randomUUID();
  await db.batch([db.prepare('DELETE FROM google_challenges WHERE expires_at<?').bind(Date.now()),db.prepare('INSERT INTO google_challenges(token_hash,nonce,user_id,expires_at) VALUES(?,?,?,?)').bind(await digest(token),nonce,userId,Date.now()+300000)]);
  return {nonce,cookie:googleCookie(request,token,300)};
}
export async function consumeGoogleChallenge(request:Request,db:D1Database){
  const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)forma_google=([a-f0-9-]{36})(?:;|$)/)?.[1];
  if(!token)return fail(401,'GOOGLE_TENTATIVA_EXPIRADA','Abra o login Google novamente.');
  const row=await db.prepare('DELETE FROM google_challenges WHERE token_hash=? RETURNING nonce,user_id,expires_at').bind(await digest(token)).first<{nonce:string;user_id:string|null;expires_at:number}>();
  if(!row||row.expires_at<Date.now())return fail(401,'GOOGLE_TENTATIVA_EXPIRADA','Abra o login Google novamente.');return row;
}
