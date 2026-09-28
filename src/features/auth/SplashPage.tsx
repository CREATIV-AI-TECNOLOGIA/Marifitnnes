import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../../stores/use-app-store';
import { Logo } from '../../app/layouts/AppShell';

export default function SplashPage() {
  const user = useAppStore(s => s.user);
  const navigate = useNavigate();
  useEffect(() => {
    const id = setTimeout(() => navigate(user ? '/app/home' : '/login', { replace: true }), 1300);
    return () => clearTimeout(id);
  }, [user, navigate]);
  return (
    <div className="splash">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
        <Logo />
      </motion.div>
      <motion.p className="splash-copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .18, duration: .3 }}>
        Seu treino.<br />Seu histórico.<br />Sua evolução.
      </motion.p>
      <div className="splash-line" />
    </div>
  );
}
