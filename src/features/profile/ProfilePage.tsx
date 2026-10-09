import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ChevronRight, CircleHelp, History, Layers3, LogOut, Settings2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import AccountSheet from './AccountSheet';
import HelpSheet from './HelpSheet';
import '../history/history.css';
import './profile.css';
import { cloudEnabled, cloudLogout } from '../../services/cloud';
import GoogleLoginButton from '../auth/GoogleLoginButton';

export default function ProfilePage() {
  const storedUser = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);
  const activeSession = useAppStore(s => s.activeSession);
  const [account, setAccount] = useState(false);
  const [help, setHelp] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [leaving,setLeaving]=useState(false);
  const navigate = useNavigate();
  const words = (storedUser?.name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!storedUser) return <Navigate to="/login" replace />;
  const user = storedUser;
  const initials = (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : words[0]?.slice(0, 2) || 'EU').toLocaleUpperCase('pt-BR');
  return <div className="page profile-page">
    <TopBar title="Perfil" eyebrow="Do seu jeito" />
    <section className="profile-identity"><div className="profile-avatar" aria-label={`Iniciais de ${user.name}`}>{initials}</div>
      <div><h2>{user.name}</h2><p>{user.email || 'Perfil neste dispositivo'}</p></div></section>
    <div className="profile-menu">
      {cloudEnabled&&<section className="card"><h2>Vincular Google</h2><p className="small muted">Use o Google para entrar nesta mesma conta, mantendo seus treinos.</p><GoogleLoginButton link /></section>}
      <button className="profile-menu-item" onClick={() => setAccount(true)}><UserRound size={20} /><span><strong>Minha conta</strong><small>Nome e e-mail</small></span><ChevronRight size={16} /></button>
      <Link className="profile-menu-item" to="/app/settings"><Settings2 size={20} /><span><strong>Configurações</strong><small>Aparência, treino e seus dados</small></span><ChevronRight size={16} /></Link>
      <Link className="profile-menu-item" to="/app/cycles"><Layers3 size={20} /><span><strong>Meus ciclos</strong><small>Cada fase do seu treino</small></span><ChevronRight size={16} /></Link>
      <Link className="profile-menu-item" to="/app/history"><History size={20} /><span><strong>Histórico</strong><small>Volte a qualquer sessão</small></span><ChevronRight size={16} /></Link>
      <button className="profile-menu-item" onClick={() => setHelp(true)}><CircleHelp size={20} /><span><strong>Sobre o app</strong><small>{cloudEnabled?'Conta e sincronização':'Dados locais e funcionamento'}</small></span><ChevronRight size={16} /></button>
    </div>
    <div className="profile-logout"><Button variant="ghost" onClick={() => setConfirmLogout(true)}><LogOut size={17} /> {cloudEnabled?'Sair da conta':'Sair do perfil'}</Button><p>{cloudEnabled?'Os dados sincronizados continuam na sua conta.':'Seu treino continua guardado neste dispositivo.'}</p></div>
    {account && <AccountSheet user={user} onOpenChange={setAccount} />}
    <HelpSheet open={help} onOpenChange={setHelp} />
    <ConfirmDialog open={confirmLogout} onOpenChange={setConfirmLogout} title={cloudEnabled?'Sair da conta?':'Sair do perfil?'} description={cloudEnabled?'Sua sessão será encerrada. Dados sincronizados permanecem na conta e alterações pendentes ficam na cópia privada deste navegador.':`Seus treinos, ciclos, histórico e preferências serão preservados neste navegador.${activeSession ? ' O treino em andamento também ficará salvo para retomar depois.' : ''} Isso não apaga seus dados de um dispositivo compartilhado.`}>
      <div className="profile-confirm-actions"><Button variant="secondary" onClick={() => setConfirmLogout(false)}>Continuar aqui</Button>
        <Button variant="danger" disabled={leaving} onClick={async () => {setLeaving(true);try{if(cloudEnabled)await cloudLogout();else logout();setConfirmLogout(false);toast.success('Sessão encerrada.');navigate('/login',{replace:true});}catch(error){toast.error(error instanceof Error?error.message:'Não foi possível encerrar a sessão.');}finally{setLeaving(false);}}}>{leaving?'Saindo…':'Sair'}</Button></div>
    </ConfirmDialog>
  </div>;
}
