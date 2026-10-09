import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { pdfVideoLinks } from './pdf-links';

describe('links reais do PDF', () => {
  it('lê alvo e posição de hyperlinks e descarta ações executáveis', async () => {
    const doc=await PDFDocument.create(); const page=doc.addPage();
    const link=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[30,700,180,720],A:{S:'URI',URI:PDFString.of('https://youtu.be/9fzZx9MlumA')}}));
    const unsafe=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[30,650,180,670],A:{S:'URI',URI:PDFString.of('javascript:alert(1)')}}));
    page.node.set(PDFName.of('Annots'),doc.context.obj([link,unsafe]));
    expect(await pdfVideoLinks(await doc.save())).toEqual([{page:1,url:'https://youtu.be/9fzZx9MlumA',rect:[30,700,180,720]}]);
  });
});
