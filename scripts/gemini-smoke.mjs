import assert from 'node:assert/strict';
import { PDFDocument, PDFName, PDFString, StandardFonts } from 'pdf-lib';
import { writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createServer } from 'vite';

const base='https://marifitnnes-api.caiooficial2025.workers.dev';
const request=(path,options={})=>fetch(base+path,{...options,headers:{Origin:base,...options.headers}});
const health=await (await request('/api/health')).json();
assert.equal(health.geminiConfigured,true);
const credentials={name:'Teste Gemini',email:`gemini-smoke-${crypto.randomUUID()}@example.invalid`,password:crypto.randomUUID()};
const fixtureId=process.argv.includes('--fixture')?crypto.randomUUID():null;
const d1=(sql)=>{
  const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','marifitnnes-db','--remote','--command',sql],{encoding:'utf8'});
  assert.equal(result.status,0,'Falha no gerenciamento da conta técnica D1.');
};
if(fixtureId){
  const server=await createServer({server:{middlewareMode:true}});
  const {hashPassword}=await server.ssrLoadModule('/worker/security.ts');
  const hash=await hashPassword(credentials.password); await server.close();
  // Only generated UUIDs/email and a locally computed hash enter this fixture SQL.
  d1(`INSERT INTO users(id,email,name,password_hash,created_at) VALUES('${fixtureId}','${credentials.email}','Teste Gemini','${hash}',${Date.now()})`);
}
const auth=await request(fixtureId?'/api/auth/login':'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials)});
const account=await auth.json(); assert.equal(auth.status,200);
const cookie=auth.headers.get('set-cookie').split(';')[0];
const pdf=await PDFDocument.create(); const font=await pdf.embedFont(StandardFonts.Helvetica); const page=pdf.addPage();
const lines=['Programa de teste tecnico Forma','Ficha T1 - Treino de teste','Agachamento livre: 3 series de 12 repeticoes; descanso 60 segundos.','Ver video do agachamento','Mesa flexora: 2 series de 10 repeticoes; descanso 45 segundos.','Ver video da mesa flexora','Nao ha carga ou cadencia informada.'];
lines.forEach((line,i)=>page.drawText(line,{x:40,y:780-i*30,size:12,font}));
const videoUrls=['https://youtu.be/9fzZx9MlumA','https://youtu.be/51A2x9sXVN0'];
page.node.set(PDFName.of('Annots'),pdf.context.obj(videoUrls.map((url,index)=>pdf.context.register(pdf.context.obj({Type:'Annot',Subtype:'Link',Rect:[40,690-index*60,250,705-index*60],A:{S:'URI',URI:PDFString.of(url)}})))));
const response=await request('/api/imports',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/pdf','X-Filename':'Teste%20Gemini.pdf'},body:await pdf.save()});
const draft=await response.json();
console.log(JSON.stringify({status:response.status,code:draft.code,testUser:account.user.id,importId:draft.cloudImportId,workout:draft.workout?.name,exercises:draft.exercises?.map(e=>({name:e.name,targets:e.targets,rest:e.rest,sourcePage:e.sourcePage,evidence:e.sourceEvidence,videoUrl:e.videoUrl}))}));
try {
  assert.equal(response.status,200);
  assert.equal(draft.exercises.length,2);
  assert.deepEqual(draft.exercises.map(e=>e.targets.length),[3,2]);
  assert.deepEqual(draft.exercises.map(e=>e.rest),[60,45]);
  assert.ok(draft.exercises.every(e=>e.sourcePage===1&&e.sourceEvidence));
  assert.ok(draft.exercises[0].targets.every(t=>/12/.test(t)));
  assert.ok(draft.exercises[1].targets.every(t=>/10/.test(t)));
  assert.deepEqual(draft.exercises.map(e=>e.videoUrl),videoUrls);
  assert.equal((await fetch(base+`/api/imports/${draft.cloudImportId}/pdf`)).status,401);
  console.log('OK: PDF sintetico extraido com series e videos da linha correta; arquivo exige autenticacao.');
  if(process.argv.includes('--preview')){
    const confirmed=await request(`/api/imports/${draft.cloudImportId}/confirm`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(draft)});assert.equal(confirmed.status,200);
    const data={exercises:draft.exercises,workouts:[draft.workout],programs:[],cycles:[],activeAgenda:null,preferredFrequency:null,agendaChoices:{},history:[],activeSession:null,sources:[draft.source],preferences:{showPrevious:true,trackDuration:true,autoRest:false,showVideos:true,unit:'kg',theme:'dark'}};
    assert.equal((await request('/api/state',{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({revision:0,data})})).status,200);
    await writeFile('C:/Users/Windows/Documents/ChatGPT/Marifitnnes/tmp/gemini-ui-fixture.json',JSON.stringify({credentials,fixtureId,importId:draft.cloudImportId,sourceId:draft.source.id}));
    console.log('Conta técnica disponível para conferir player; credenciais temporárias fora do repositório.');
  }
} finally {
  if(draft.cloudImportId&&!process.argv.includes('--preview')) await request(`/api/imports/${draft.cloudImportId}`,{method:'DELETE',headers:{Cookie:cookie}});
  await request('/api/auth/logout',{method:'POST',headers:{Cookie:cookie}});
  if(fixtureId&&!process.argv.includes('--preview'))d1(`DELETE FROM users WHERE id='${fixtureId}'`);
}
