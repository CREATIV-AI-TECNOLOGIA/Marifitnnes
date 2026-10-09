import { expect,it,vi } from 'vitest';
import { recoverUpdate } from './update-recovery';
it('recupera arquivos antigos sem criar loop de recarregamento',()=>{
  let value:string|null=null;const storage={getItem:()=>value,setItem:(_key:string,next:string)=>{value=next;}};const reload=vi.fn();
  expect(recoverUpdate(storage,reload,100000)).toBe(true);
  expect(recoverUpdate(storage,reload,100001)).toBe(false);
  expect(reload).toHaveBeenCalledTimes(1);
});
