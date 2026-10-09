import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import AppRoutes from './app/router/AppRoutes';
import { ThemeProvider } from './app/layouts/AppShell';
import './styles/index.css';
import CloudGate from './features/auth/CloudGate';
import LoadBoundary from './app/LoadBoundary';
import { recoverUpdate } from './services/update-recovery';

window.addEventListener('vite:preloadError',event=>{
  if(navigator.onLine && recoverUpdate(sessionStorage,()=>window.location.reload()))event.preventDefault();
});

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HashRouter>
          <LoadBoundary><CloudGate><AppRoutes /></CloudGate></LoadBoundary>
        </HashRouter>
        <Toaster position="top-center" toastOptions={{ duration: 2600 }} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
