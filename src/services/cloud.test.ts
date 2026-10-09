import { expect, it, vi } from 'vitest';
import { useAppStore } from '../stores/use-app-store';
import { connectCloud,authenticateCloud } from './cloud';

vi.hoisted(() => vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} }));

it('não expõe conta nem altera treinos quando o carregamento remoto falha', async () => {
  useAppStore.setState({...useAppStore.getInitialState(),user:null},true);
  const before=useAppStore.getState();
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  await expect(connectCloud({id:'test-user',name:'Teste',email:'teste@example.invalid'})).rejects.toThrow('offline');
  expect(useAppStore.getState().user).toBeNull();
  expect(useAppStore.getState().workouts).toBe(before.workouts);
  vi.unstubAllGlobals();
});
it('recusa snapshot de outra conta antes de gravar no cache',async()=>{
  useAppStore.setState({...useAppStore.getInitialState(),user:null},true);
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({userId:'other-user',data:null,revision:0})}));
  await expect(connectCloud({id:'test-user',name:'Teste',email:'teste@example.invalid'})).rejects.toThrow('A conta mudou');
  expect(useAppStore.getState().user).toBeNull();vi.unstubAllGlobals();
});
it('serializa senha e Google para impedir troca de cookie durante conexão',async()=>{
  let reject!:(reason:Error)=>void;
  const pending=new Promise<never>((_resolve,fail)=>{reject=fail;});
  const fetch=vi.fn().mockReturnValue(pending);vi.stubGlobal('fetch',fetch);
  const first=authenticateCloud('/auth/login',{});
  await expect(authenticateCloud('/auth/google',{})).rejects.toThrow('Aguarde a entrada');
  expect(fetch).toHaveBeenCalledTimes(1);reject(new Error('offline'));
  await expect(first).rejects.toThrow('offline');vi.unstubAllGlobals();
});
it('inclui C1/B2 ao conectar conta existente e sincroniza sem substituir a ficha pessoal', async () => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
  const personal = { id: 'personal-c1', name: 'C1 pessoal', subtitle: '', exerciseIds: ['personal-exercise'] };
  const data = { ...useAppStore.getInitialState(), workouts: [personal] };
  const fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ userId: 'existing', revision: 5, data }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ revision: 6 }) });
  vi.stubGlobal('fetch', fetch);
  await connectCloud({ id: 'existing', name: 'Teste', email: 'teste@example.invalid' });
  expect(fetch).toHaveBeenCalledTimes(2);
  const saved = JSON.parse(fetch.mock.calls[1][1].body);
  expect(saved.revision).toBe(5);
  expect(saved.data.workouts).toContainEqual(personal);
  expect(saved.data.workouts.find((item: { id: string }) => item.id === 'studio-pro-c1').exerciseIds).toHaveLength(9);
  expect(saved.data.workouts.find((item: { id: string }) => item.id === 'studio-pro-b2').exerciseIds).toHaveLength(13);
  vi.unstubAllGlobals();
});
