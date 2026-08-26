import { createClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const supabasePublishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey && supabaseUrl.startsWith('http'));

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface AuthenticatedUserSummary {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AuthorizedOrganization {
  id: string;
  role: string;
  name: string | null;
  slug: string | null;
}

export interface AuthMeResponse {
  authenticated: true;
  user: AuthenticatedUserSummary;
  organizations: AuthorizedOrganization[];
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const session = await getSession();
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);

  return fetch(input, { ...init, headers });
}
