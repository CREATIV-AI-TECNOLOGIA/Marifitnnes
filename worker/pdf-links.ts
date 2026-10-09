import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFString } from 'pdf-lib';
import { safeVideoUrl } from '../src/services/exercise-video';

export interface PdfVideoLink { page:number; url:string; rect:number[]; }
export async function pdfVideoLinks(bytes:Uint8Array):Promise<PdfVideoLink[]> {
  const document=await PDFDocument.load(bytes);
  const links:PdfVideoLink[]=[];
  for(const [index,page] of document.getPages().entries()) {
    const annotations=page.node.lookupMaybe(PDFName.of('Annots'),PDFArray);
    for(const ref of annotations?.asArray().slice(0,300)??[]) {
      try {
        const annotation=document.context.lookup(ref,PDFDict);
        if(annotation.get(PDFName.of('Subtype'))?.toString()!=='/Link')continue;
        const action=annotation.lookupMaybe(PDFName.of('A'),PDFDict);
        if(action?.get(PDFName.of('S'))?.toString()!=='/URI')continue;
        const uri=action.get(PDFName.of('URI'));
        if(!(uri instanceof PDFString || uri instanceof PDFHexString))continue;
        const url=safeVideoUrl(uri.decodeText());if(!url)continue;
        const rect=annotation.lookupMaybe(PDFName.of('Rect'),PDFArray)?.asArray().map(n=>n instanceof PDFNumber?n.asNumber():NaN)??[];
        links.push({page:index+1,url,rect:rect.length===4&&rect.every(Number.isFinite)?rect:[]});
      }catch { /* Malformed links do not invalidate the workout itself. */ }
    }
  }
  return links;
}
