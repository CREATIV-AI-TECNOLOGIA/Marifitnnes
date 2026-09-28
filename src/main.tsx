import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import AppRoutes from './app/router/AppRoutes';
import { ThemeProvider } from './app/layouts/AppShell';
import './styles/index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
        <Toaster position="top-center" toastOptions={{ duration: 2600 }} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
