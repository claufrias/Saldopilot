import { CreditCard, WalletCards } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

export function Onboarding() {
  const { completeOnboarding } = useApp();
  const [balance, setBalance] = useState('');
  const [usesCreditCards, setUsesCreditCards] = useState(true);
  const numericBalance = Number(balance || 0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    completeOnboarding({
      balance: Number.isFinite(numericBalance) ? numericBalance : 0,
      usesCreditCards,
    });
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-5 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-md flex-col justify-between gap-8 pb-[env(safe-area-inset-bottom)]">
        <div className="pt-6 sm:pt-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-soft dark:bg-white dark:text-zinc-950">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-950 dark:text-white">Saldopilot</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Primer inicio</p>
            </div>
          </div>

          <div className="mt-10">
            <h1 className="text-3xl font-extrabold tracking-normal text-zinc-950 dark:text-white">Prepará tu saldo inicial</h1>
            <p className="mt-3 text-base leading-6 text-zinc-500 dark:text-zinc-400">
              Usamos este monto como punto de partida para calcular tu saldo real desde hoy.
            </p>
          </div>

          <form className="panel mt-7 p-4 shadow-[0_18px_50px_rgba(24,24,27,0.08)] sm:p-5" onSubmit={submit}>
            <div>
              <label className="label">Saldo inicial</label>
              <input
                className="field mt-2 h-14 text-lg font-bold"
                inputMode="decimal"
                type="number"
                placeholder="0"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
              />
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Vista previa: {formatCurrency(Number.isFinite(numericBalance) ? numericBalance : 0)}</p>
            </div>

            <div className="mt-6">
              <p className="label">¿Usás tarjetas?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`min-h-[4.5rem] rounded-lg border p-3 text-left transition ${
                    usesCreditCards
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200'
                  }`}
                  onClick={() => setUsesCreditCards(true)}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="mt-3 block text-sm font-bold">Sí</span>
                  <span className="mt-1 block text-xs opacity-75">Registrar consumos y pagos.</span>
                </button>
                <button
                  type="button"
                  className={`min-h-[4.5rem] rounded-lg border p-3 text-left transition ${
                    !usesCreditCards
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200'
                  }`}
                  onClick={() => setUsesCreditCards(false)}
                >
                  <WalletCards className="h-4 w-4" />
                  <span className="mt-3 block text-sm font-bold">No</span>
                  <span className="mt-1 block text-xs opacity-75">Empezar solo con saldo.</span>
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
              {usesCreditCards
                ? 'Después podés crear tus tarjetas desde el botón + o desde la sección Tarjetas.'
                : 'La sección Tarjetas queda disponible por si querés activarla más adelante.'}
            </div>

            <Button className="mt-5 w-full" type="submit">
              Entrar a Saldopilot
            </Button>
          </form>
        </div>

        <p className="pb-2 text-center text-xs text-zinc-400 dark:text-zinc-500">Podés cambiar el saldo inicial desde Configuración.</p>
      </section>
    </main>
  );
}
