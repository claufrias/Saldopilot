import { Download, Moon, RotateCcw, Sun, Upload, WalletCards } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useApp } from '../context/AppContext';
import type { AppState } from '../types';
import { formatCurrency } from '../utils/format';
import { getOperationalBalance } from '../utils/finance';

export function Settings() {
  const app = useApp();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string>('');
  const [financialForm, setFinancialForm] = useState({
    date: app.financialStart.date,
    balance: String(app.financialStart.balance),
  });
  const operationalBalance = getOperationalBalance(app.movements, app.financialStart);

  useEffect(() => {
    setFinancialForm({
      date: app.financialStart.date,
      balance: String(app.financialStart.balance),
    });
  }, [app.financialStart]);

  function exportData() {
    const snapshot: AppState = {
      movements: app.movements,
      categories: app.categories,
      budgets: app.budgets,
      recurringExpenses: app.recurringExpenses,
      savingsGoals: app.savingsGoals,
      creditCards: app.creditCards,
      creditCardPayments: app.creditCardPayments,
      financialStart: app.financialStart,
      theme: app.theme,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saldopilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Respaldo exportado.');
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as AppState;

      // Validación mínima del respaldo antes de reemplazar el estado sincronizado.
      if (!Array.isArray(parsed.movements) || !Array.isArray(parsed.budgets)) {
        throw new Error('Formato inválido');
      }

      app.importState(parsed);
      setMessage('Respaldo importado correctamente.');
    } catch {
      setMessage('No se pudo importar el archivo JSON.');
    } finally {
      event.target.value = '';
    }
  }

  function resetAll() {
    const confirmed = window.confirm('¿Restablecer todos los datos de Saldopilot?');

    if (confirmed) {
      app.resetState();
      setMessage('Datos restablecidos.');
    }
  }

  function saveFinancialStart() {
    app.updateFinancialStart({
      date: financialForm.date,
      balance: Number(financialForm.balance),
    });
    setMessage('Inicio financiero actualizado.');
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="Configuración" description="Administra apariencia, respaldo y reinicio de datos sincronizados." />

      <section className="panel p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Inicio financiero</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Define desde qué fecha Saldopilot empieza a calcular tu saldo operativo.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Este saldo se muestra como un movimiento virtual en historial y gráficos, pero no se guarda como movimiento editable ni afecta presupuestos.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Saldo operativo</p>
            <p className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">{formatCurrency(operationalBalance)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="label">Fecha de inicio</label>
            <input
              className="field mt-2"
              type="date"
              value={financialForm.date}
              onChange={(event) => setFinancialForm({ ...financialForm, date: event.target.value })}
            />
          </div>
          <div>
            <label className="label">Saldo inicial real</label>
            <input
              className="field mt-2"
              type="number"
              value={financialForm.balance}
              onChange={(event) => setFinancialForm({ ...financialForm, balance: event.target.value })}
            />
          </div>
          <Button onClick={saveFinancialStart}>Guardar inicio</Button>
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Tema</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Cambia entre modo claro y oscuro.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-white/10">
            <button
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${app.theme === 'light' ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white' : 'text-zinc-500 dark:text-zinc-300'}`}
              onClick={() => app.setTheme('light')}
            >
              <Sun className="h-4 w-4" />
              Claro
            </button>
            <button
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${app.theme === 'dark' ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white' : 'text-zinc-500 dark:text-zinc-300'}`}
              onClick={() => app.setTheme('dark')}
            >
              <Moon className="h-4 w-4" />
              Oscuro
            </button>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Datos</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Toda la información se sincroniza con Supabase para tu usuario.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button icon={<Download className="h-4 w-4" />} onClick={exportData}>
            Exportar JSON
          </Button>
          <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => fileInput.current?.click()}>
            Importar JSON
          </Button>
          <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} onClick={resetAll}>
            Restablecer
          </Button>
          <input ref={fileInput} className="hidden" type="file" accept="application/json" onChange={importData} />
        </div>
        {message ? <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">{message}</p> : null}
      </section>
    </div>
  );
}
