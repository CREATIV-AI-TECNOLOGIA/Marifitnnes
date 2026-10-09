import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, requireSameOrigin, validatePdf } from './security';
import { extractionSchema, toDraft } from './extraction';
import worker from './index';

describe('segurança da nuvem', () => {
  it('salga senhas e recusa a senha incorreta', async () => {
    const one = await hashPassword('Senha comprida 123!');
    const two = await hashPassword('Senha comprida 123!');
    expect(one).not.toBe(two);
    expect(await verifyPassword('Senha comprida 123!', one)).toBe(true);
    expect(await verifyPassword('Outra senha', one)).toBe(false);
  });
  it('recusa mutação de outra origem e requisição sem Origin', () => {
    expect(() => requireSameOrigin(new Request('https://app.test/api/state', {method:'PUT',headers:{Origin:'https://evil.test'}}))).toThrow();
    expect(() => requireSameOrigin(new Request('https://app.test/api/state', {method:'PUT'}))).toThrow();
    expect(() => requireSameOrigin(new Request('https://app.test/api/state', {method:'PUT',headers:{Origin:'https://app.test'}}))).not.toThrow();
  });
  it('recusa arquivo falso e limite excedido', async () => {
    await expect(validatePdf(new Uint8Array([1,2,3]))).rejects.toThrow();
    await expect(validatePdf(new Uint8Array(20 * 1024 * 1024 + 1))).rejects.toThrow();
    await expect(validatePdf(new TextEncoder().encode('%PDF-arquivo-incompleto')))
      .rejects.toThrow('Não foi possível ler este PDF. Confira se o arquivo está íntegro.');
  });
  it('não entrega estado sem sessão', async () => {
    const response = await worker.fetch(new Request('https://app.test/api/state'), {} as never);
    expect(response.status).toBe(401);
  });
});

describe('fidelidade da extração', () => {
  const raw = {kind:'workout',name:'Ficha C1',code:'C1',programName:'Programa',preparation:'',notes:'',warnings:[],exercises:[{name:'Mesa flexora',group:'lower',block:'Treino principal',targets:['12','10','8',null],restSeconds:null,cadence:null,instructions:'4 séries, somente 3 descritas',technique:'',sourcePage:2,evidence:'Mesa flexora 4 séries',secondaryName:null,secondaryTargets:null}],frequencies:[],cycleWeeks:null};
  it('conserva meta ausente e produz aviso, com página da fonte', () => {
    const result = toDraft(extractionSchema.parse(raw), {id:'abc',sha256:'abc',name:'ficha.pdf',kind:'workout',pageCount:2,pages:[]});
    expect(result.exercises[0].targets[3]).toBe('Não informada no PDF');
    expect(result.exercises[0].restLabel).toBe('Não informado no PDF');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.exercises[0].sourcePage).toBe(2);
  });
  it('recusa referência a página inexistente', () => {
    expect(() => toDraft(extractionSchema.parse(raw),{id:'abc',sha256:'abc',name:'ficha.pdf',kind:'workout',pageCount:1,pages:[]})).toThrow();
  });
  it('recusa agenda com semana sem sete dias', () => {
    expect(() => extractionSchema.parse({...raw,kind:'agenda',frequencies:[{frequency:3,weeks:[{week:1,days:['C1']}]}]})).toThrow();
  });
});
