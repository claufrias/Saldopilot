import { AlertTriangle, Edit3, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { CategoryIcon } from '../components/category/CategoryBadge';
import { CategoryPicker } from '../components/category/CategoryPicker';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MONTHS } from '../data/constants';
import { useApp } from '../context/AppContext';
import type { Budget, Category } from '../types';
import { confirmDelete } from '../utils/confirm';
import { getCurrentMonth, getCurrentYear } from '../utils/date';
import { formatCurrency } from '../utils/format';
import { budgetUsage, getOperationalMovements } from '../utils/finance';

const emptyBudget = {
  category: 'Comida' as Category,
  month: getCurrentMonth(),
  year: getCurrentYear(),
  amount: '',
};

export function Budgets() {
  const { budgets, movements, financialStart, addBudget, updateBudget, deleteBudget } = useApp();
  const operationalMovements = getOperationalMovements(movements, financialStart.date);
  const [form, setForm] = useState(emptyBudget);
  const [editingId, setEditingId] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      category: form.category,
      month: Number(form.month),
      year: Number(form.year),
      amount: Number(form.amount),
    };

    if (payload.amount <= 0) {
      return;
    }

    if (editingId) {
      updateBudget({ ...payload, id: editingId });
    } else {
      addBudget(payload);
    }

    setEditingId(null);
    setForm(emptyBudget);
  }

  function editBudget(budget: Budget) {
    setEditingId(budget.id);
    setForm({ category: budget.category, month: budget.month, year: budget.year, amount: String(budget.amount) });
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="Presupuestos" description="Define límites mensuales por categoría y controla alertas de exceso." />

      <form className="panel grid gap-4 p-5 md:grid-cols-5" onSubmit={submit}>
        <div className="md:col-span-5">
          <label className="label">Categoría</label>
          <div className="mt-2">
            <CategoryPicker value={form.category} onChange={(category) => setForm({ ...form, category })} />
          </div>
        </div>
        <div>
          <label className="label">Mes</label>
          <select className="field mt-2" value={form.month} onChange={(event) => setForm({ ...form, month: Number(event.target.value) })}>
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Año</label>
          <input className="field mt-2" type="number" value={form.year} onChange={(event) => setForm({ ...form, year: Number(event.target.value) })} />
        </div>
        <div>
          <label className="label">Monto</label>
          <input className="field mt-2" type="number" min="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        </div>
        <div className="flex items-end">
          <Button className="w-full" icon={<Plus className="h-4 w-4" />}>
            {editingId ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {budgets.map((budget) => {
          const usage = budgetUsage(budget, operationalMovements);
          const overBudget = usage.used > 100;

          return (
            <article key={budget.id} className={`panel p-5 ${overBudget ? 'border-rose-300 dark:border-rose-500/40' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <CategoryIcon category={budget.category} />
                  <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-950 dark:text-white">{budget.category}</h2>
                    {overBudget ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Superado
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {MONTHS[budget.month - 1]} {budget.year}
                  </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="icon-button" onClick={() => editBudget(budget)} aria-label="Editar presupuesto">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button className="icon-button" onClick={() => confirmDelete(`el presupuesto de ${budget.category}`) && deleteBudget(budget.id)} aria-label="Eliminar presupuesto">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <BudgetStat label="Gastado" value={formatCurrency(usage.spent)} />
                <BudgetStat label="Disponible" value={formatCurrency(usage.available)} />
                <BudgetStat label="Uso" value={`${usage.used}%`} />
              </div>
              <div className="mt-5">
                <ProgressBar value={Math.min(usage.used, 100)} tone={overBudget ? 'rose' : usage.used > 80 ? 'amber' : 'emerald'} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function BudgetStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 font-semibold text-zinc-950 dark:text-white">{value}</p>
    </div>
  );
}
