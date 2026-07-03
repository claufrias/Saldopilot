import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BASE_STORAGE_KEY } from './AppContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isSupabaseConfigured, supabaseApi } from '../lib/supabase';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  users: SessionUser[];
  currentUser: SessionUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

const USERS_STORAGE_KEY = 'saldopilot-users-v1';
const SESSION_STORAGE_KEY = 'saldopilot-session-v1';
const AuthContext = createContext<AuthContextValue | null>(null);

export function userStateStorageKey(userId: string) {
  return `${BASE_STORAGE_KEY}-user-${userId}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useLocalStorage<StoredUser[]>(USERS_STORAGE_KEY, []);
  const [sessionUserId, setSessionUserId] = useLocalStorage<string | null>(SESSION_STORAGE_KEY, null);
  const [supabaseUser, setSupabaseUser] = useState<SessionUser | null>(null);
  const currentStoredUser = users.find((user) => user.id === sessionUserId) ?? null;

  useEffect(() => {
    if (!supabaseApi) {
      return;
    }

    setSupabaseUser(supabaseApi.getSession()?.user ? toSupabaseSessionUser(supabaseApi.getSession()!.user) : null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      users: isSupabaseConfigured ? (supabaseUser ? [supabaseUser] : []) : users.map(toSessionUser),
      currentUser: isSupabaseConfigured ? supabaseUser : currentStoredUser ? toSessionUser(currentStoredUser) : null,
      login: async (email, password) => {
        if (supabaseApi) {
          try {
            const session = await supabaseApi.signInWithPassword(normalizeEmail(email), password);
            setSupabaseUser(toSupabaseSessionUser(session.user));
            return { ok: true };
          } catch (error) {
            return { ok: false, message: error instanceof Error ? error.message : 'No se pudo iniciar sesion.' };
          }
        }

        const normalizedEmail = normalizeEmail(email);
        const user = users.find((item) => item.email === normalizedEmail);

        if (!user) {
          return { ok: false, message: 'No existe un usuario con ese email.' };
        }

        const passwordHash = await hashPassword(password);

        if (passwordHash !== user.passwordHash) {
          return { ok: false, message: 'La contrasena no es correcta.' };
        }

        setSessionUserId(user.id);
        return { ok: true };
      },
      register: async (name, email, password) => {
        const trimmedName = name.trim();
        const normalizedEmail = normalizeEmail(email);

        if (!trimmedName || !normalizedEmail || password.length < 6) {
          return { ok: false, message: 'Completa nombre, email y una contrasena de al menos 6 caracteres.' };
        }

        if (supabaseApi) {
          try {
            const result = await supabaseApi.signUp(normalizedEmail, password, trimmedName);

            if ('access_token' in result) {
              setSupabaseUser(toSupabaseSessionUser(result.user));
              return { ok: true };
            }

            return { ok: true, message: 'Revisa tu email para confirmar la cuenta antes de iniciar sesion.' };
          } catch (error) {
            return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear la cuenta.' };
          }
        }

        if (users.some((user) => user.email === normalizedEmail)) {
          return { ok: false, message: 'Ya existe un usuario con ese email.' };
        }

        const id = generateUserId();
        const nextUser: StoredUser = {
          id,
          name: trimmedName,
          email: normalizedEmail,
          passwordHash: await hashPassword(password),
          createdAt: new Date().toISOString(),
        };

        migrateLegacyStateToFirstUser(id, users.length === 0);
        setUsers((current) => [nextUser, ...current]);
        setSessionUserId(id);

        return { ok: true };
      },
      logout: () => {
        if (supabaseApi) {
          void supabaseApi.signOut();
          setSupabaseUser(null);
          return;
        }

        setSessionUserId(null);
      },
    }),
    [currentStoredUser, setSessionUserId, setUsers, supabaseUser, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function migrateLegacyStateToFirstUser(userId: string, shouldMigrate: boolean) {
  if (!shouldMigrate) {
    return;
  }

  const legacyState = localStorage.getItem(BASE_STORAGE_KEY);
  const userKey = userStateStorageKey(userId);

  if (legacyState && !localStorage.getItem(userKey)) {
    localStorage.setItem(userKey, legacyState);
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toSessionUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function toSupabaseSessionUser(user: { id: string; email?: string; user_metadata?: { name?: string } }): SessionUser {
  const email = user.email ?? '';

  return {
    id: user.id,
    name: user.user_metadata?.name || email.split('@')[0] || 'Usuario',
    email,
  };
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function generateUserId() {
  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }

  return context;
}
