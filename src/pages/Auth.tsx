import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, LockKeyhole, LogIn, PiggyBank, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

const authBackgroundUrl = `${import.meta.env.BASE_URL}auth-background.svg`;

type AuthMode = 'login' | 'register' | 'recover' | 'reset' | 'confirmed';

export function Auth() {
  const {
    users,
    login,
    register,
    recoverPassword,
    updatePassword,
    passwordRecoveryPending,
    emailConfirmationPending,
    continueAfterEmailConfirmation,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(emailConfirmationPending ? 'confirmed' : passwordRecoveryPending ? 'reset' : users.length === 0 ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';
  const isRecover = mode === 'recover';
  const isReset = mode === 'reset';
  const isConfirmed = mode === 'confirmed';

  useEffect(() => {
    if (emailConfirmationPending) {
      setMode('confirmed');
      return;
    }

    if (passwordRecoveryPending) {
      setMode('reset');
    }
  }, [emailConfirmationPending, passwordRecoveryPending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (isConfirmed) {
      continueAfterEmailConfirmation();
      return;
    }

    setLoading(true);

    const result = isReset
      ? await updatePassword(password)
      : isRecover
        ? await recoverPassword(email)
        : isRegister
          ? await register(name, email, password)
          : await login(email, password);

    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? 'No se pudo completar la accion.');
      return;
    }

    if (result.message) {
      setSuccess(result.message);
    }

    if (isRecover) {
      setMode('login');
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
  }

  const title = isConfirmed
    ? 'Email confirmado'
    : isReset
      ? 'Cambiar contraseña'
      : isRecover
        ? 'Recuperar contraseña'
        : isRegister
          ? 'Crear acceso'
          : 'Entrar a Saldopilot';
  const description = isConfirmed
    ? 'Tu correo fue confirmado correctamente. Ya podés entrar a Saldopilot.'
    : isReset
      ? 'Ingresa una nueva contraseña para completar la recuperación por email.'
      : isRecover
      ? 'Te enviaremos un email para confirmar el cambio de contraseña.'
      : isRegister
        ? 'Crea una cuenta sincronizada con Supabase para usar tus datos en varios dispositivos.'
        : 'Usa tu email y contrasena de Supabase.';

  return (
    <main className="grid min-h-screen bg-stone-50 p-4 dark:bg-zinc-950 lg:grid-cols-[1fr_520px]">
      <section
        className="hidden min-h-[calc(100vh-2rem)] flex-col justify-between overflow-hidden rounded-xl bg-zinc-950 bg-cover bg-center p-10 text-white lg:flex"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(9, 9, 11, 0.96) 0%, rgba(9, 9, 11, 0.82) 42%, rgba(9, 9, 11, 0.36) 100%), url(${authBackgroundUrl})`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-zinc-950">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold">Saldopilot</p>
            <p className="text-sm text-zinc-400">Finanzas personales</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Acceso privado</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight">Tu tablero financiero, separado por usuario.</h1>
          <p className="mt-5 text-base leading-7 text-zinc-300">
            Cada perfil guarda movimientos, tarjetas, objetivos y configuracion sincronizados en Supabase.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <AuthPill label="Supabase" />
          <AuthPill label="Sesion persistente" />
          <AuthPill label="Sincronizacion cloud" />
        </div>
      </section>

      <section className="flex items-center justify-center px-0 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-zinc-950 dark:text-white">Saldopilot</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Finanzas personales</p>
            </div>
          </div>

          <div className="panel p-5 sm:p-6">
            {!isReset && !isConfirmed ? (
              <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-white/10">
                <button
                  type="button"
                  className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md text-sm font-bold transition ${
                    mode === 'login' || mode === 'recover'
                      ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white'
                      : 'text-zinc-500 dark:text-zinc-300'
                  }`}
                  onClick={() => changeMode('login')}
                >
                  <LogIn className="h-4 w-4" />
                  Ingresar
                </button>
                <button
                  type="button"
                  className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md text-sm font-bold transition ${
                    isRegister ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white' : 'text-zinc-500 dark:text-zinc-300'
                  }`}
                  onClick={() => changeMode('register')}
                >
                  <UserPlus className="h-4 w-4" />
                  Crear usuario
                </button>
              </div>
            ) : null}

            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                  {isRecover || isReset || isConfirmed ? <KeyRound className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-950 dark:text-white">{title}</h1>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                {isRegister && !isConfirmed ? (
                  <div>
                    <label className="label">Nombre</label>
                    <input className="field mt-2" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
                  </div>
                ) : null}
                {!isReset && !isConfirmed ? (
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="field mt-2"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                    />
                  </div>
                ) : null}
                {!isRecover && !isConfirmed ? (
                  <div>
                    <label className="label">Contraseña</label>
                    <input
                      className="field mt-2"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={isRegister || isReset ? 'new-password' : 'current-password'}
                    />
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {success}
                  </div>
                ) : null}

                <Button className="w-full" icon={isRegister ? <UserPlus className="h-4 w-4" /> : isRecover || isReset || isConfirmed ? <KeyRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />} disabled={loading}>
                  {loading ? 'Procesando...' : isConfirmed ? 'Continuar' : isReset ? 'Guardar contraseña' : isRecover ? 'Enviar email' : isRegister ? 'Crear usuario' : 'Ingresar'}
                </Button>
              </form>

              {!isRegister && !isRecover && !isReset && !isConfirmed ? (
                <button className="mt-4 text-sm font-semibold text-zinc-600 underline dark:text-zinc-300" type="button" onClick={() => changeMode('recover')}>
                  Olvidé mi contraseña
                </button>
              ) : null}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {isSupabaseConfigured
              ? 'Conectado a Supabase: el login y los datos se sincronizan entre dispositivos.'
              : 'Supabase no esta configurado: agrega las variables de entorno y vuelve a desplegar.'}
          </p>
        </div>
      </section>
    </main>
  );
}

function AuthPill({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 font-semibold text-zinc-200">
      {label}
    </div>
  );
}
