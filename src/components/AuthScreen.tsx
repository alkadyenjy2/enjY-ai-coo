import { FormEvent, useState } from 'react';
import { AlertCircle, LockKeyhole, LogIn, ShieldCheck, UserPlus, Mail } from 'lucide-react';
import { supabase } from '../auth/client';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'recovery';

type AuthScreenProps = {
  initialMode?: AuthMode;
  onRecoveryComplete?: () => void;
};

export const AuthScreen = ({ initialMode = 'sign-in', onRecoveryComplete }: AuthScreenProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      } else if (mode === 'sign-up') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: displayName.trim() ? { display_name: displayName.trim() } : undefined,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage('Account created. Check your email to confirm the account, then sign in.');
          setMode('sign-in');
        }
      } else if (mode === 'forgot-password') {
        const redirectTo = new URL('/?auth=recovery', window.location.origin);
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectTo.toString(),
        });
        if (recoveryError) throw recoveryError;
        setMessage('If an account exists for that email, a password recovery link has been sent. Check your inbox and spam folder.');
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        await supabase.auth.signOut();
        window.history.replaceState({}, document.title, window.location.pathname);
        setPassword('');
        setMode('sign-in');
        setMessage('Password updated. Sign in with your new password.');
        onRecoveryComplete?.();
      }
    } catch (submitError: any) {
      setError(submitError?.message || 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const isPasswordEntry = mode === 'sign-in' || mode === 'sign-up' || mode === 'recovery';
  const heading = mode === 'sign-in' ? 'Sign in to continue'
    : mode === 'sign-up' ? 'Create your operator account'
    : mode === 'forgot-password' ? 'Reset your password'
    : 'Choose a new password';

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4 py-10 font-sans">
      <section className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-7 py-8 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-emerald-400">Protected Operations OS</p>
              <h1 className="text-xl font-bold text-white">CORE AGENT</h1>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">{heading}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {mode === 'recovery' ? 'Set a new password using the secure recovery link sent to your email.'
              : 'Your session and organization access are verified by Supabase Auth.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {mode === 'sign-up' && (
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300">Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="Operations Lead"
              />
            </label>
          )}

          {mode !== 'recovery' && (
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                placeholder="you@company.com"
              />
            </label>
          )}

          {isPasswordEntry && (
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300">{mode === 'recovery' ? 'New password' : 'Password'}</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                  placeholder="At least 6 characters"
                />
              </div>
            </label>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === 'sign-in' ? <LogIn className="w-4 h-4" />
              : mode === 'sign-up' ? <UserPlus className="w-4 h-4" />
              : mode === 'forgot-password' ? <Mail className="w-4 h-4" />
              : <LockKeyhole className="w-4 h-4" />}
            {busy ? 'Working securely…'
              : mode === 'sign-in' ? 'Sign in securely'
              : mode === 'sign-up' ? 'Create account'
              : mode === 'forgot-password' ? 'Send recovery email'
              : 'Update password'}
          </button>

          {mode === 'sign-in' && (
            <button type="button" onClick={() => { setMode('forgot-password'); setError(''); setMessage(''); }}
              className="w-full text-xs text-zinc-400 hover:text-white py-1">Forgot password?</button>
          )}
          {mode !== 'recovery' && (
            <button
              type="button"
              onClick={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setError(''); setMessage(''); }}
              className="w-full text-xs text-zinc-400 hover:text-white py-2"
            >
              {mode === 'sign-up' ? 'Already have an account? Sign in'
                : mode === 'sign-in' ? 'Need an account? Create one'
                : 'Back to sign in'}
            </button>
          )}
        </form>
      </section>
    </main>
  );
};
