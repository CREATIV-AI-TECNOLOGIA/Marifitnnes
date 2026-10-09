import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ArrowUpRight, CalendarDays, CircleHelp, Dumbbell, House, Layers2, Moon, Settings2, Sun, UserRound, WifiOff } from 'lucide-react';
import { NavLink, Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '../../stores/use-app-store';
import { addReadyWorkouts } from '../../data/ready-workouts';
import HelpSheet from '../../features/profile/HelpSheet';
import { useIconMotion } from '../../components/ui/use-icon-motion';
import './app-shell.css';
export function Logo(){return <span className="logo"><span className="logo-mark"><i/><i/><i/></span>forma<span className="logo-dot">.</span></span>;}
const links=[{to:'/app/home',label:'Objetivos',icon:House},{to:'/app/agenda',label:'Minha agenda',icon:CalendarDays},{to:'/app/workouts',label:'Fichas',icon:Dumbbell},{to:'/app/progress',label:'Evolução',icon:Activity},{to:'/app/history',label:'Histórico',icon:Layers2},{to:'/app/profile',label:'Perfil',icon:UserRound}];
const dockMotion = [
  { y: [0, -3, 0], scale: [1, 1.12, 1] },
  { rotate: [0, -9, 6, 0], scale: [1, 1.08, 1, 1] },
  { rotate: [0, -18, 10, 0], y: [0, -2, 0, 0] },
  { scale: [1, 1.16, .98, 1] },
  { y: [0, -3, 1, 0], rotate: [0, -7, 3, 0] },
  { rotate: [0, 9, -5, 0], scale: [1, 1.08, 1, 1] },
];
export function OfflineBadge(){const[offline,setOffline]=useState(!navigator.onLine);useEffect(()=>{const off=()=>{setOffline(true);toast('Sem internet. Pode continuar treinando.');};const on=()=>{setOffline(false);toast.success('Conexão restabelecida. Registros salvos neste dispositivo.');};window.addEventListener('offline',off);window.addEventListener('online',on);return()=>{window.removeEventListener('offline',off);window.removeEventListener('online',on);};},[]);return offline?<div className="connection-banner" role="status"><WifiOff size={15}/>Sem internet. Pode continuar treinando.<strong>Offline</strong></div>:null;}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore(state => state.preferences.theme);
  const initialized = useRef(false);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      clearTimeout(timer);
      if (initialized.current && !reduced.matches && root.classList.contains('dark') !== dark) {
        root.classList.add('theme-changing');
        // Establish the current colors before changing the palette.
        getComputedStyle(root).backgroundColor;
        timer = setTimeout(() => root.classList.remove('theme-changing'), 380);
      }
      root.classList.toggle('dark', dark);
      initialized.current = true;
    };
    apply();
    media.addEventListener('change', apply);
    return () => {
      clearTimeout(timer);
      root.classList.remove('theme-changing');
      media.removeEventListener('change', apply);
    };
  }, [theme]);
  return children;
}
function ThemeToggle() {
  const theme = useAppStore(s => s.preferences.theme);
  const setPreferences = useAppStore(s => s.setPreferences);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  return <button type="button" className="app-theme-toggle" aria-label={`Ativar modo ${dark ? 'claro' : 'escuro'}`} onClick={() => setPreferences({ theme: dark ? 'light' : 'dark' })}>
    {dark ? <Sun size={17}/> : <Moon size={17}/>}<span>{dark ? 'Claro' : 'Escuro'}</span>
  </button>;
}
function PageContent({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  useLayoutEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, []);
  return <motion.div initial={reduced ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: reduced ? 0 : .38, ease: [.22, .68, .2, 1] }}>{children}</motion.div>;
}

export default function AppShell() {
  useEffect(() => { useAppStore.setState(addReadyWorkouts); }, []);
  const user = useAppStore(state => state.user);
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const reduced = useReducedMotion();
  useIconMotion();
  if (!user) return <Navigate to="/login" replace />;
  if (location.pathname.startsWith('/app/session/')) return <><OfflineBadge /><Outlet /></>;
  return <div className="app-shell">
    <OfflineBadge />
    <aside className="desktop-sidebar">
      <Link to="/app/home" aria-label="Forma início"><Logo /></Link>
      <nav className="sidebar-nav" aria-label="Principal">
        {links.map(link => <NavLink key={link.to} to={link.to} className={({isActive}) => isActive || link.to === '/app/home' && location.pathname.startsWith('/app/objectives/') ? 'active' : ''}><link.icon size={19} strokeWidth={1.7} />{link.label}</NavLink>)}
        <div className="sidebar-secondary"><p className="sidebar-label">SEU ESPAÇO</p>
          <NavLink to="/app/cycles"><Layers2 size={19} />Meus ciclos</NavLink>
          <NavLink to="/app/settings"><Settings2 size={19} />Preferências</NavLink>
        </div>
      </nav>
      <div className="sidebar-footer"><p className="sidebar-note">Um treino de cada vez.<br />Evolução para a vida toda.</p>
        <Link to="/app/profile" className="sidebar-user"><span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
          <div><strong>{user.name}</strong><small>Seu espaço de treino</small></div><ArrowUpRight size={14} />
        </Link>
      </div>
    </aside>
    <main className="app-main"><div className="desktop-topbar"><ThemeToggle />
      <button type="button" className="app-help-link" aria-label="Ajuda" title="Ajuda" onClick={() => setHelpOpen(true)}><CircleHelp size={18} /></button>
    </div><PageContent key={location.pathname}><Outlet /></PageContent></main>
    <nav className="mobile-bottom-nav" aria-label="Navegação principal">
      {links.map((link, index) => <NavLink key={link.to} to={link.to} className={({isActive}) => isActive || link.to === '/app/home' && location.pathname.startsWith('/app/objectives/') ? 'active' : ''}>
        {({ isActive: routeActive }) => {const isActive=routeActive||link.to==='/app/home'&&location.pathname.startsWith('/app/objectives/');return <>
          {isActive && <motion.span className="dock-selection" aria-hidden="true" layoutId="dock-selection"
            transition={{ duration: reduced ? 0 : .44, ease: [.22, .68, .2, 1] }} />}
          <motion.span className="dock-icon" aria-hidden="true" key={isActive ? location.key : link.to}
            initial={reduced ? false : { y: 0, rotate: 0, scale: 1 }} animate={isActive && !reduced ? dockMotion[index] : { y: 0, rotate: 0, scale: 1 }}
            transition={{ duration: reduced ? 0 : .7, ease: [.22, .68, .2, 1] }}>
            <link.icon strokeWidth={1.8} />
          </motion.span>
          <span className="dock-label">{link.label}</span>
        </>;}}
      </NavLink>)}
    </nav>
    <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} />
  </div>;
}
