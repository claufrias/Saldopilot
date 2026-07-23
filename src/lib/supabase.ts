const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
const AUTH_TOKEN_STORAGE_KEY = 'saldopilot-supabase-session-v1';

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

interface SupabaseSignUpResponse {
  access_token?: string;
  refresh_token?: string;
  user?: SupabaseAuthUser;
  session?: SupabaseAuthSession | null;
}

function normalizeSupabaseUrl(url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return '';
  }

  try {
    const parsedUrl = new URL(trimmedUrl.match(/^https?:\/\//i) ? trimmedUrl : `https://${trimmedUrl}`);
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/(?:rest|auth)\/v1\/?.*$/, '').replace(/\/$/, '');
    parsedUrl.search = '';
    parsedUrl.hash = '';

    return `${parsedUrl.origin}${parsedUrl.pathname === '/' ? '' : parsedUrl.pathname}`;
  } catch {
    return trimmedUrl.replace(/\/(?:rest|auth)\/v1\/?.*$/, '').replace(/\/$/, '');
  }
}

export const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
export const supabaseConfigError = getSupabaseConfigError(supabaseUrl, supabaseKey);
export const isSupabaseConfigured = !supabaseConfigError;

function getStoredSession() {
  try {
    const storedSession = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return storedSession ? (JSON.parse(storedSession) as SupabaseAuthSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: SupabaseAuthSession | null) {
  if (!session) {
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(session));
}

function authHeaders(accessToken?: string) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${accessToken ?? supabaseKey}`,
    'Content-Type': 'application/json',
  };
}

function appRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? safeParseJson(text) : null;

  if (!response.ok) {
    throw new Error(body?.msg || body?.message || body?.error_description || response.statusText || 'No se pudo completar la solicitud.');
  }

  return body as T;
}

async function requestSupabase(path: string, init?: RequestInit) {
  try {
    return await fetch(`${supabaseUrl}${path}`, init);
  } catch {
    throw new Error('No se pudo conectar con Supabase. Revisá que VITE_SUPABASE_URL sea la URL base del proyecto, por ejemplo https://tu-proyecto.supabase.co, y que el proyecto esté activo.');
  }
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getSupabaseConfigError(url: string, key: string) {
  if (!url || !key) {
    return 'El servicio de acceso y sincronización no está configurado. Revisa las variables de entorno y vuelve a desplegar la app.';
  }

  if (url.includes('your-project-ref') || url.includes('tu-proyecto') || key.includes('your_publishable_key') || key.includes('tu_key')) {
    return 'Las variables de Supabase todavía tienen valores de ejemplo. Configura la Project URL y la publishable key reales, y vuelve a desplegar la app.';
  }

  try {
    const parsedUrl = new URL(url);

    if (!/^https?:$/.test(parsedUrl.protocol)) {
      return 'La URL de Supabase debe empezar con https://.';
    }
  } catch {
    return 'La URL de Supabase no es válida. Usa la Project URL base, por ejemplo https://tu-proyecto.supabase.co.';
  }

  return '';
}

export const supabaseApi = isSupabaseConfigured
  ? {
      getSession() {
        return getStoredSession();
      },
      async consumeAuthSessionFromUrl() {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        if (!hash.get('access_token')) {
          return null;
        }

        const accessToken = hash.get('access_token') ?? '';
        const refreshToken = hash.get('refresh_token') ?? undefined;
        const type = hash.get('type') ?? 'session';
        const response = await requestSupabase('/auth/v1/user', {
          headers: authHeaders(accessToken),
        });
        const user = await parseResponse<SupabaseAuthUser>(response);
        const session = { access_token: accessToken, refresh_token: refreshToken, user };
        storeSession(session);
        window.history.replaceState(null, document.title, appRedirectUrl());
        return { session, type };
      },
      async signInWithPassword(email: string, password: string) {
        const response = await requestSupabase('/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ email, password }),
        });
        const session = await parseResponse<SupabaseAuthSession>(response);
        storeSession(session);
        return session;
      },
      async signUp(email: string, password: string, name: string) {
        const response = await requestSupabase(`/auth/v1/signup?redirect_to=${encodeURIComponent(appRedirectUrl())}`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            email,
            password,
            data: { name },
          }),
        });
        const result = await parseResponse<SupabaseAuthSession | SupabaseSignUpResponse | SupabaseAuthUser>(response);

        if ('access_token' in result && result.access_token && result.user) {
          const session = result as SupabaseAuthSession;
          storeSession(session);
          return session;
        }

        if ('session' in result && result.session) {
          storeSession(result.session);
          return result.session;
        }

        if ('user' in result && result.user) {
          return { user: result.user };
        }

        return { user: result as SupabaseAuthUser };
      },
      async recoverPassword(email: string) {
        const response = await requestSupabase(`/auth/v1/recover?redirect_to=${encodeURIComponent(appRedirectUrl())}`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ email }),
        });

        await parseResponse<unknown>(response);
      },
      async updatePassword(password: string) {
        const session = getStoredSession();

        if (!session) {
          throw new Error('No hay una sesión de recuperación activa. Abre el enlace enviado por email nuevamente.');
        }

        const response = await requestSupabase('/auth/v1/user', {
          method: 'PUT',
          headers: authHeaders(session.access_token),
          body: JSON.stringify({ password }),
        });
        const user = await parseResponse<SupabaseAuthUser>(response);
        const nextSession = { ...session, user };
        storeSession(nextSession);
        return nextSession;
      },
      async signOut() {
        const session = getStoredSession();

        if (session) {
          await requestSupabase('/auth/v1/logout', {
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
        const response = await requestSupabase(`/rest/v1/user_app_states?${params.toString()}`, {
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

        const response = await requestSupabase('/rest/v1/user_app_states?on_conflict=user_id,state_key', {
          method: 'POST',
          headers: {
            ...authHeaders(session.access_token),
            Prefer: 'resolution=merge-duplicates,return=minimal',
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
