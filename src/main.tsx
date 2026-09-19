import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthScreen } from './components/AuthScreen';
import { getSession, supabase } from './auth/client';
import './index.css';

function AppRoot() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof getSession>>>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    let mounted = true;

    const resolveSession = async () => {
      const currentSession = await getSession();
      if (mounted) {
        setSession(currentSession);
        setSessionResolved(true);
      }
    };

    void resolveSession();

    if (!supabase) {
      setSessionResolved(true);
      return () => {
        mounted = false;
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!sessionResolved) return null;
  if (!session) return <AuthScreen />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
