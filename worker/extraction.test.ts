import { describe, expect, it } from 'vitest';
import { extractionSchema, geminiJsonSchema, toDraft } from './extraction';

describe('contrato JSON do Gemini', () => {
  it('associa somente links da página do exercício ou URLs citadas literalmente', () => {
    const url='https://youtu.be/9fzZx9MlumA';
    const item={name:'Agachamento',group:'lower',block:'Treino principal',targets:['12'],restSeconds:60,cadence:null,instructions:'',technique:'',sourcePage:1,evidence:'Agachamento 12',secondaryName:null,secondaryTargets:null,videoUrl:url};
    const raw=extractionSchema.parse({kind:'workout',name:'Teste',code:'T1',programName:'Teste',preparation:'',notes:'',warnings:[],cycleWeeks:null,exercises:[item],frequencies:[]});
    const source={id:'test',sha256:'test',name:'test.pdf',kind:'workout' as const,pageCount:2,pages:[{number:1,text:'',links:[url]}]};
    expect(toDraft(raw,source).exercises[0].videoUrl).toBe(url);
    const wrongPage={...source,pages:[{number:2,text:'',links:[url]}]};
    expect(toDraft(raw,wrongPage).exercises[0].videoUrl).toBeUndefined();
    expect(toDraft(raw,wrongPage).warnings.join(' ')).toContain('link de vídeo');
    expect(toDraft({...raw,exercises:[{...raw.exercises[0],evidence:`Agachamento ${url}`}]},wrongPage).exercises[0].videoUrl).toBe(url);
  });
  it('envia um esquema sem limites de texto/arrays que impedem a geração', () => {
    const visit = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      for (const [key, item] of Object.entries(value)) {
        expect(['$schema', 'minLength', 'maxLength', 'minItems', 'maxItems']).not.toContain(key);
        visit(item);
      }
    };
    visit(geminiJsonSchema);
    expect(geminiJsonSchema).toMatchObject({ type: 'object', additionalProperties: false });
  });

  it('mantém limites estritos no servidor mesmo com o esquema simplificado', () => {
    const data = {kind:'workout',name:'Teste',code:'T1',programName:'Teste',preparation:'',notes:'',warnings:[],cycleWeeks:null,exercises:[],frequencies:[]};
    expect(extractionSchema.safeParse(data).success).toBe(true);
    expect(extractionSchema.safeParse({...data,name:'a'.repeat(12001)}).success).toBe(false);
    expect(extractionSchema.safeParse({...data,warnings:Array(101).fill('aviso')}).success).toBe(false);
    expect(extractionSchema.safeParse({...data,extra:true}).success).toBe(false);
  });
});
