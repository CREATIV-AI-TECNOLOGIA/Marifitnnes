import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import assert from 'node:assert/strict';

const base=process.env.CLOUD_TEST_URL??'http://127.0.0.1:8788';
const checks=[];
async function request(path,options={}){return fetch(base+path,{...options,headers:{Origin:base,...options.headers}});}
async function create(){const email=`cloud-smoke-${crypto.randomUUID()}@example.invalid`,password=crypto.randomUUID();const response=await request('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,name:'Validação técnica'})});const value=await response.json();assert.equal(response.status,200,JSON.stringify({status:response.status,code:value.code}));return{cookie:response.headers.get('set-cookie').split(';')[0],userId:value.user.id,email,password};}
const accounts=[],imports=[];
try{
  assert.equal((await request('/api/state')).status,401);checks.push('estado anônimo bloqueado');
  assert.equal((await fetch(base+'/api/auth/register',{method:'POST',headers:{Origin:'https://evil.test'},body:'{}'})).status,403);checks.push('CSRF bloqueado');
  const a=await create(),b=await create();accounts.push(a,b);checks.push('duas contas e cookies criados');
  const login=await request('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})});assert.equal(login.status,200);checks.push('login com senha válido');
  const empty={exercises:[],workouts:[],programs:[],cycles:[],activeAgenda:null,preferredFrequency:null,agendaChoices:{},history:[],activeSession:null,sources:[],preferences:{showPrevious:true,trackDuration:true,autoRest:false,showVideos:true,unit:'kg',theme:'dark'}};
  const state=await request('/api/state',{method:'PUT',headers:{Cookie:a.cookie,'Content-Type':'application/json'},body:JSON.stringify({revision:0,data:empty})});assert.equal(state.status,200);assert.equal((await state.json()).revision,1);
  const other=await (await request('/api/state',{headers:{Cookie:b.cookie}})).json();assert.equal(other.data,null);checks.push('snapshot isolado por usuário');
  assert.equal((await request('/api/state',{method:'PUT',headers:{Cookie:a.cookie,'Content-Type':'application/json'},body:JSON.stringify({revision:0,data:empty})})).status,409);checks.push('conflito entre dispositivos bloqueado');
  assert.equal((await request('/api/imports',{method:'POST',headers:{Cookie:a.cookie},body:new Uint8Array([1,2,3])})).status,400);checks.push('arquivo falso recusado');
  const pdf=await PDFDocument.create();pdf.addPage();const missing=await request('/api/imports',{method:'POST',headers:{Cookie:a.cookie,'Content-Type':'application/pdf'},body:await pdf.save()});assert.equal(missing.status,503);assert.equal((await missing.json()).code,'IA_NAO_CONFIGURADA');checks.push('Gemini sem chave sinalizado');
  if(process.env.PDF_AUDIT_DIR){
    for(const filename of ['Treino A1.pdf','She start.pdf','Aenda she.pdf']){
      const bytes=await readFile(`${process.env.PDF_AUDIT_DIR}/${filename}`);
      const response=await request('/api/imports',{method:'POST',headers:{Cookie:a.cookie,'Content-Type':'application/pdf','X-Filename':encodeURIComponent(filename)},body:bytes});
      const draft=await response.json();assert.equal(response.status,200,JSON.stringify({status:response.status,code:draft.code}));imports.push({id:draft.cloudImportId,cookie:a.cookie});
      assert.ok(draft.workout||draft.agenda);assert.ok(draft.source.pageCount>0);
      assert.equal((await request(`/api/imports/${draft.cloudImportId}/pdf`,{headers:{Cookie:b.cookie}})).status,404);
      const original=await request(`/api/imports/${draft.cloudImportId}/pdf`,{headers:{Cookie:a.cookie}});assert.equal(original.status,200);assert.equal((await original.arrayBuffer()).byteLength,bytes.length);
      const confirmed=await request(`/api/imports/${draft.cloudImportId}/confirm`,{method:'POST',headers:{Cookie:a.cookie,'Content-Type':'application/json'},body:JSON.stringify(draft)});assert.equal(confirmed.status,200);
      checks.push(`${filename}: leitura, PDF privado e confirmação`);
    }
  }
  await request('/api/auth/logout',{method:'POST',headers:{Cookie:a.cookie},body:'{}'});assert.equal((await request('/api/state',{headers:{Cookie:a.cookie}})).status,401);checks.push('logout invalida sessão');
  // Restore one authenticated session only to remove the test PDFs.
  const restored=await request('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})});a.cookie=restored.headers.get('set-cookie').split(';')[0];
  for(const item of imports)item.cookie=a.cookie;
  console.log(JSON.stringify({ok:true,checks,testUsers:accounts.map(a=>a.userId)}));
}catch(error){console.log(JSON.stringify({ok:false,checks,message:error.message,testUsers:accounts.map(a=>a.userId)}));process.exitCode=1;}
finally{for(const item of imports)await request(`/api/imports/${item.id}`,{method:'DELETE',headers:{Cookie:item.cookie}});for(const a of accounts)await request('/api/auth/logout',{method:'POST',headers:{Cookie:a.cookie},body:'{}'});}
