import React, { useEffect, useState } from 'react';
import { apiFetch, getSession, supabase, supabaseConfigured } from '../auth/client';

interface AuthGateProps {
  children: React.ReactNode;
  onAuthenticated: (organizationId: string) => void;
}

export function AuthGate({ children, onAuthenticated }: AuthGateProps) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resolveSession = async () => {
    if (!supabase || !supabaseConfigured) {
      setError('Supabase authentication is not configured in this deployment.');
      setReady(false);
      return;
    }

    const session = await getSession();
    if (!session?.access_token) {
      setReady(false);
      return;
    }

    const response = await apiFetch('/api/auth/me');
    const data = await response.json().catch(() => ({}));
    const organizationId = data?.organizations?.[0]?.id;
    if (!response.ok || !organizationId) {
      await supabase.auth.signOut();
      setReady(false);
      setError(response.ok ? 'Authenticated user has no authorized organization.' : (data?.error || 'Authentication verification failed.'));
      return;
    }

    onAuthenticated(String(organizationId));
    setError('');
    setReady(true);
  };

  useEffect(() => {
    void resolveSession();
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setReady(false);
        setError('');
        return;
      }
      void resolveSession();
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) setError(signInError.message);
    setLoading(false);
    if (!signInError) await resolveSession();
  };

  if (ready) return <>{children}</>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <form onSubmit={handleSignIn} className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-zinc-900 p-6 shadow-2xl space-y-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400">JARVIS • AUTHENTICATION</div>
          <h1 className="mt-2 text-2xl font-bold">Sign in to AI Operations</h1>
          <p className="mt-2 text-sm text-zinc-400">Your command and operational history require an authenticated Supabase session.</p>
        </div>
        <label className="block text-sm text-zinc-300">
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-emerald-400" />
        </label>
        <label className="block text-sm text-zinc-300">
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-emerald-400" />
        </label>
        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{error}</div>}
        <button disabled={loading || !supabaseConfigured} className="w-full rounded-xl bg-emerald-400 px-4 py-2.5 font-bold text-zinc-950 disabled:opacity-50">
          {loading ? 'Authenticating…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
