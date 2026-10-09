import { scryptAsync } from '@noble/hashes/scrypt.js';
import { EncryptedPDFError, PDFDocument } from 'pdf-lib';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const fail = (status: number, code: string, message: string): never => { throw new ApiError(status, code, message); };
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
export async function digest(bytes: Uint8Array | string) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes as Uint8Array<ArrayBuffer>)));
}
export function equal(a: string, b: string) { let diff = a.length ^ b.length; for(let i=0;i<Math.max(a.length,b.length);i++) diff |= (a.charCodeAt(i)||0) ^ (b.charCodeAt(i)||0); return diff === 0; }
export async function hashPassword(password: string, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  // OWASP scrypt configuration: 16 MiB memory, p=5.
  const key = await scryptAsync(password, salt, {N:16384,r:8,p:5,dkLen:32,maxmem:32*1024*1024});
  return `scrypt:${salt}:${hex(key)}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm,salt,key] = stored.split(':');
  if(algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt??'') || !key) return false;
  return equal(await hashPassword(password,salt),stored);
}
export function requireSameOrigin(request: Request) {
  if(request.headers.get('Origin') !== new URL(request.url).origin) fail(403,'ORIGEM_INVALIDA','Requisição não autorizada.');
}
export async function validatePdf(bytes: Uint8Array) {
  if(bytes.length > 20*1024*1024) fail(413,'ARQUIVO_GRANDE','O limite é 20 MB.');
  if(new TextDecoder().decode(bytes.slice(0,5)) !== '%PDF-') fail(400,'ARQUIVO_INVALIDO','Escolha um PDF válido.');
  const document = await PDFDocument.load(bytes).catch((error: unknown) => {
    if (error instanceof EncryptedPDFError) fail(400,'PDF_PROTEGIDO','Este PDF exige senha. Envie uma cópia sem proteção para importar.');
    return fail(400,'ARQUIVO_INVALIDO','Não foi possível ler este PDF. Confira se o arquivo está íntegro.');
  });
  const pages = document.getPageCount();
  if(pages < 1 || pages > 40) fail(400,'PDF_MUITAS_PAGINAS','O limite é 40 páginas.');
  return pages;
}
