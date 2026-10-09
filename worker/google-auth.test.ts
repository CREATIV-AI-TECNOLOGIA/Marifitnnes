import {expect,it,vi} from 'vitest';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import type {D1Database} from '@cloudflare/workers-types';
import {validateGoogleIdentity,verifyGoogleToken,googleAccount} from './google-auth';
it('aceita identidade verificada com nonce da tentativa',()=>{
  expect(validateGoogleIdentity({sub:'google-user',email:'caio@example.com',email_verified:true,nonce:'random-nonce',name:'Caio'},'random-nonce').sub).toBe('google-user');
});
it('verifica assinatura, destinatário e validade do token',async()=>{
  const {privateKey,publicKey}=await generateKeyPair('RS256');
  const jwk=await exportJWK(publicKey);jwk.kid='test-key';const keys=createLocalJWKSet({keys:[jwk]});
  const token=await new SignJWT({email:'caio@example.com',email_verified:true,nonce:'test-nonce'}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setSubject('subject').setIssuer('https://accounts.google.com').setAudience('test-client').setIssuedAt().setExpirationTime('5m').sign(privateKey);
  expect((await verifyGoogleToken(token,'test-client','test-nonce',keys)).sub).toBe('subject');
  await expect(verifyGoogleToken(token,'another-client','test-nonce',keys)).rejects.toThrow();
  await expect(verifyGoogleToken(token,'test-client','wrong-nonce',keys)).rejects.toThrow();
  const expired=await new SignJWT({email:'caio@example.com',email_verified:true,nonce:'test-nonce'}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setSubject('subject').setIssuer('https://accounts.google.com').setAudience('test-client').setIssuedAt().setExpirationTime(1).sign(privateKey);
  await expect(verifyGoogleToken(expired,'test-client','test-nonce',keys)).rejects.toThrow();
});
it('não vincula conta existente apenas pelo mesmo e-mail',async()=>{
  const first=vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({id:'password-user'});
  const batch=vi.fn();const db={prepare:()=>({bind:()=>({first})}),batch} as unknown as D1Database;
  await expect(googleAccount(db,{sub:'subject',email:'caio@example.com',email_verified:true,nonce:'nonce'},null)).rejects.toThrow('Entre com sua senha');
  expect(batch).not.toHaveBeenCalled();
});
it.each([
  {sub:'google-user',email:'caio@example.com',email_verified:false,nonce:'random-nonce'},
  {sub:'google-user',email:'caio@example.com',email_verified:true,nonce:'other-nonce'},
  {email:'caio@example.com',email_verified:true,nonce:'random-nonce'},
])('recusa identidade não verificada ou outra tentativa',claims=>{
  expect(()=>validateGoogleIdentity(claims,'random-nonce')).toThrow();
});
