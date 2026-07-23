import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { isSupabaseConfigured, supabaseApi, supabaseConfigError } from '../lib/supabase';

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
  logout: () => Promise<void>;
  passwordRecoveryPending: boolean;
  emailConfirmationPending: boolean;
  continueAfterEmailConfirmation: () => void;
  recoverPassword: (email: string) => Promise<{ ok: boolean; message?: string }>;
  updatePassword: (password: string) => Promise<{ ok: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SessionUser | null>(null);
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(false);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);
  const [confirmedUser, setConfirmedUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (!supabaseApi) {
      return;
    }

    if (window.location.hash.includes('access_token')) {
      supabaseApi
        .consumeAuthSessionFromUrl()
        .then((result) => {
          if (!result?.session.user) {
            return;
          }

          if (result.type === 'recovery') {
            setPasswordRecoveryPending(true);
            return;
          }

          setConfirmedUser(toSupabaseSessionUser(result.session.user));
          setEmailConfirmationPending(true);
        })
        .catch(() => {
          setPasswordRecoveryPending(false);
          setEmailConfirmationPending(false);
        });
      return;
    }

    const session = supabaseApi.getSession();
    setSupabaseUser(session?.user ? toSupabaseSessionUser(session.user) : null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      users: supabaseUser ? [supabaseUser] : [],
      currentUser: passwordRecoveryPending || emailConfirmationPending ? null : supabaseUser,
      passwordRecoveryPending,
      emailConfirmationPending,
      login: async (email, password) => {
        if (!supabaseApi) {
          return { ok: false, message: missingSupabaseMessage() };
        }

        try {
          const session = await supabaseApi.signInWithPassword(normalizeEmail(email), password);
          setSupabaseUser(toSupabaseSessionUser(session.user));
          return { ok: true };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? translateSupabaseAuthError(error.message) : 'No se pudo iniciar sesión.' };
        }
      },
      register: async (name, email, password) => {
        if (!supabaseApi) {
          return { ok: false, message: missingSupabaseMessage() };
        }

        const trimmedName = name.trim();
        const normalizedEmail = normalizeEmail(email);

        if (!trimmedName || !normalizedEmail || password.length < 6) {
          return { ok: false, message: 'Completa nombre, email y una contraseña de al menos 6 caracteres.' };
        }

        try {
          const result = await supabaseApi.signUp(normalizedEmail, password, trimmedName);

          if ('access_token' in result) {
            setSupabaseUser(toSupabaseSessionUser(result.user));
            return { ok: true };
          }

          return { ok: true, message: 'Revisa tu email para confirmar la cuenta antes de iniciar sesión.' };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? translateSupabaseAuthError(error.message) : 'No se pudo crear la cuenta.' };
        }
      },
      continueAfterEmailConfirmation: () => {
        setSupabaseUser(confirmedUser);
        setConfirmedUser(null);
        setEmailConfirmationPending(false);
      },
      recoverPassword: async (email) => {
        if (!supabaseApi) {
          return { ok: false, message: missingSupabaseMessage() };
        }

        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail) {
          return { ok: false, message: 'Ingresa tu email para recuperar la contraseña.' };
        }

        try {
          await supabaseApi.recoverPassword(normalizedEmail);
          return { ok: true, message: 'Te enviamos un email para confirmar el cambio de contraseña.' };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? translateSupabaseAuthError(error.message) : 'No se pudo enviar el email.' };
        }
      },
      updatePassword: async (password) => {
        if (!supabaseApi) {
          return { ok: false, message: missingSupabaseMessage() };
        }

        if (password.length < 6) {
          return { ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
        }

        try {
          const session = await supabaseApi.updatePassword(password);
          setPasswordRecoveryPending(false);
          setSupabaseUser(toSupabaseSessionUser(session.user));
          return { ok: true };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? translateSupabaseAuthError(error.message) : 'No se pudo actualizar la contraseña.' };
        }
      },
      logout: async () => {
        await supabaseApi?.signOut();
        setPasswordRecoveryPending(false);
        setEmailConfirmationPending(false);
        setConfirmedUser(null);
        setSupabaseUser(null);
      },
    }),
    [confirmedUser, emailConfirmationPending, passwordRecoveryPending, supabaseUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


function translateSupabaseAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('email signups are disabled')) {
    return 'El registro por email está deshabilitado. Actívalo en la configuración de autenticación.';
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.';
  }

  if (normalizedMessage.includes('user already registered') || normalizedMessage.includes('already registered')) {
    return 'Ya existe un usuario con ese email. Usa Ingresar o recupera la contraseña.';
  }

  return message;
}

function missingSupabaseMessage() {
  return supabaseConfigError || 'El servicio de acceso y sincronización no está configurado. Revisa las variables de entorno y vuelve a desplegar la app.';
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toSupabaseSessionUser(user: { id: string; email?: string; user_metadata?: { name?: string } }): SessionUser {
  const email = user.email ?? '';

  return {
    id: user.id,
    name: user.user_metadata?.name || email.split('@')[0] || 'Usuario',
    email,
  };
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }

  return context;
}

export { isSupabaseConfigured };
