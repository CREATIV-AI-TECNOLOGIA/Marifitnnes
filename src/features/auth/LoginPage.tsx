import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui';
import { Logo } from '../../app/layouts/AppShell';
import { useAppStore } from '../../stores/use-app-store';

export default function LoginPage() {
  const login = useAppStore(state => state.login);
  const user = useAppStore(state => state.user);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError('Digite seu nome para continuar.');
      return;
    }
    login({ name: cleanName, email: '' });
    navigate('/app/home', { replace: true });
  }

  if (user) return <Navigate to="/app/home" replace />;
  return <div className="login-page"><div className="login-content"><Logo />
    <div className="login-form"><p className="eyebrow">SEU TREINO, NO SEU RITMO</p><h1>Treine.<br />Registre.<br /><span style={{ color: 'var(--accent)' }}>Evolua.</span></h1>
      <p>Entre para organizar agendas, cadastrar exercícios e acompanhar suas séries.</p>
      <form onSubmit={enter} noValidate>
        <label className="field" htmlFor="local-name">Como podemos chamar você?<input className="input" id="local-name" autoComplete="given-name" maxLength={70} value={name} onChange={event => { setName(event.target.value); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'local-name-error' : 'local-profile-note'} /></label>
        {error && <p id="local-name-error" className="error-text" role="alert">{error}</p>}
        <Button type="submit">Continuar neste dispositivo<ArrowRight size={17} /></Button>
      </form>
      <p id="local-profile-note" className="login-local-note">Este perfil fica salvo neste dispositivo. Esta versão não cria conta nem sincroniza dados entre telefones.</p>
    </div>
    <p className="login-footer">Sua agenda. Seus exercícios. Seu histórico.</p>
  </div></div>;
}
