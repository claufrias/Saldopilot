const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
const AUTH_TOKEN_STORAGE_KEY = 'saldopilot-supabase-auth-v1';

interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

interface SupabaseAuthSession {
  access_token: string;
  refresh_token?: string;
  user: SupabaseAuthUser;
}

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

export const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

function getStoredSession() {
  try {
    const storedSession = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return storedSession ? (JSON.parse(storedSession) as SupabaseAuthSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: SupabaseAuthSession | null) {
  if (!session) {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(session));
}

function authHeaders(accessToken?: string) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${accessToken ?? supabaseKey}`,
    'Content-Type': 'application/json',
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.msg || body?.message || body?.error_description || 'Supabase request failed');
  }

  return body as T;
}

export const supabaseApi = isSupabaseConfigured
  ? {
      getSession() {
        return getStoredSession();
      },
      async signInWithPassword(email: string, password: string) {
        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ email, password }),
        });
        const session = await parseResponse<SupabaseAuthSession>(response);
        storeSession(session);
        return session;
      },
      async signUp(email: string, password: string, name: string) {
        const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            email,
            password,
            data: { name },
          }),
        });
        const session = await parseResponse<SupabaseAuthSession | SupabaseAuthUser>(response);

        if ('access_token' in session) {
          storeSession(session);
          return session;
        }

        return { user: session };
      },
      async signOut() {
        const session = getStoredSession();

        if (session) {
          await fetch(`${supabaseUrl}/auth/v1/logout`, {
            method: 'POST',
            headers: authHeaders(session.access_token),
          }).catch(() => undefined);
        }

        storeSession(null);
      },
      async getState<T>(userId: string, stateKey: string) {
        const session = getStoredSession();

        if (!session) {
          return null;
        }

        const params = new URLSearchParams({
          select: 'state',
          user_id: `eq.${userId}`,
          state_key: `eq.${stateKey}`,
          limit: '1',
        });
        const response = await fetch(`${supabaseUrl}/rest/v1/user_app_states?${params.toString()}`, {
          headers: authHeaders(session.access_token),
        });
        const rows = await parseResponse<Array<{ state: T }>>(response);
        return rows[0]?.state ?? null;
      },
      async upsertState<T>(userId: string, stateKey: string, state: T) {
        const session = getStoredSession();

        if (!session) {
          return;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/user_app_states`, {
          method: 'POST',
          headers: {
            ...authHeaders(session.access_token),
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: userId,
            state_key: stateKey,
            state,
            updated_at: new Date().toISOString(),
          }),
        });

        await parseResponse<unknown>(response);
      },
    }
  : null;
