import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui';
import { Logo } from '../../app/layouts/AppShell';
import { useAppStore } from '../../stores/use-app-store';
import { authenticateCloud, cloudEnabled } from '../../services/cloud';
import GoogleLoginButton from './GoogleLoginButton';

export default function LoginPage() {
  const login = useAppStore(state => state.login);
  const user = useAppStore(state => state.user);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [registering,setRegistering]=useState(false),[busy,setBusy]=useState(false);

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy)return;
    if(cloudEnabled){
      setBusy(true);setError('');
      try{await authenticateCloud(registering?'/auth/register':'/auth/login',{email:email.trim(),password,...(registering?{name:name.trim()}:{})});navigate('/app/home',{replace:true});}
      catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível conectar.');}
      finally{setBusy(false);}return;
    }
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError('Digite seu nome para continuar.');
      return;
    }
    login({ name: cleanName, email: '' });
    navigate('/app/home', { replace: true });
  }

  if (user && !busy) return <Navigate to="/app/home" replace />;
  return <div className="login-page"><div className="login-content"><Logo />
    <div className="login-form"><p className="eyebrow">SEU TREINO, NO SEU RITMO</p><h1>Treine.<br />Registre.<br /><span style={{ color: 'var(--accent)' }}>Evolua.</span></h1>
      <p>Entre para organizar agendas, cadastrar exercícios e acompanhar suas séries.</p>
      {cloudEnabled&&<GoogleLoginButton />}
      <form onSubmit={enter} noValidate>
        {(!cloudEnabled||registering)&&<label className="field" htmlFor="local-name">Como podemos chamar você?<input className="input" id="local-name" autoComplete="given-name" maxLength={70} value={name} onChange={event => { setName(event.target.value); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'local-name-error' : 'local-profile-note'} /></label>}
        {cloudEnabled&&<><label className="field" htmlFor="cloud-email">E-mail<input className="input" id="cloud-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label><label className="field" htmlFor="cloud-password">Senha<input className="input" id="cloud-password" type="password" autoComplete={registering?'new-password':'current-password'} minLength={10} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} /></label><p className="small muted">Use pelo menos 10 caracteres. A recuperação de senha ainda não está disponível.</p></>}
        {error && <p id="local-name-error" className="error-text" role="alert">{error}</p>}
        <Button type="submit" disabled={busy}>{busy?'Conectando…':cloudEnabled?(registering?'Criar conta':'Entrar'):'Continuar neste dispositivo'}<ArrowRight size={17} /></Button>
        {cloudEnabled&&<Button variant="ghost" type="button" disabled={busy} onClick={()=>{setRegistering(!registering);setError('');}}>{registering?'Já tenho conta':'Criar minha conta'}</Button>}
      </form>
      <p id="local-profile-note" className="login-local-note">{cloudEnabled?'Sua conta mantém treinos e PDFs privados sincronizados entre dispositivos.':'Este perfil fica salvo neste dispositivo. Esta versão não cria conta nem sincroniza dados entre telefones.'}</p>
    </div>
    <p className="login-footer">Sua agenda. Seus exercícios. Seu histórico.<br /><a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos de uso</a></p>
  </div></div>;
}
