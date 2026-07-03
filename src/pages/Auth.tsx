import { FormEvent, useState } from 'react';
import { LockKeyhole, LogIn, PiggyBank, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

type AuthMode = 'login' | 'register';

export function Auth() {
  const { users, login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>(users.length === 0 ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = isRegister ? await register(name, email, password) : await login(email, password);

    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? 'No se pudo completar la accion.');
      return;
    }

    if (result.message) {
      setSuccess(result.message);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
  }

  return (
    <main className="grid min-h-screen bg-stone-50 p-4 dark:bg-zinc-950 lg:grid-cols-[1fr_520px]">
      <section className="hidden min-h-[calc(100vh-2rem)] flex-col justify-between rounded-xl bg-zinc-950 p-10 text-white lg:flex">
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
            <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-white/10">
              <button
                type="button"
                className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md text-sm font-bold transition ${
                  !isRegister ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white' : 'text-zinc-500 dark:text-zinc-300'
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

            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-950 dark:text-white">
                    {isRegister ? 'Crear acceso' : 'Entrar a Saldopilot'}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {isRegister
                      ? 'Crea una cuenta sincronizada con Supabase para usar tus datos en varios dispositivos.'
                      : 'Usa tu email y contrasena de Supabase.'}
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                {isRegister ? (
                  <div>
                    <label className="label">Nombre</label>
                    <input className="field mt-2" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
                  </div>
                ) : null}
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
                <div>
                  <label className="label">Contrasena</label>
                  <input
                    className="field mt-2"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                  />
                </div>

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

                <Button className="w-full" icon={isRegister ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />} disabled={loading}>
                  {loading ? 'Procesando...' : isRegister ? 'Crear usuario' : 'Ingresar'}
                </Button>
              </form>
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
