import { Edit3, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { CategoryIcon, getCategoryColorFor } from '../components/category/CategoryBadge';
import { CategoryPicker } from '../components/category/CategoryPicker';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useApp } from '../context/AppContext';
import type { Category, RecurringExpense } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

const emptyRecurring = {
  category: 'Servicios' as Category,
  description: '',
  amount: '',
  startDate: new Date().toISOString().slice(0, 10),
  active: true,
};

export function RecurringExpenses() {
  const { recurringExpenses, categories, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense } = useApp();
  const [form, setForm] = useState(emptyRecurring);
  const [editingId, setEditingId] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      category: form.category,
      description: form.description.trim(),
      amount: Number(form.amount),
      startDate: form.startDate,
      active: form.active,
    };

    if (!payload.description || payload.amount <= 0) {
      return;
    }

    if (editingId) {
      updateRecurringExpense({ ...payload, id: editingId });
    } else {
      addRecurringExpense(payload);
    }

    setEditingId(null);
    setForm(emptyRecurring);
  }

  function edit(expense: RecurringExpense) {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      startDate: expense.startDate,
      active: expense.active,
    });
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Gastos fijos"
        description="Registra gastos recurrentes. Al abrir la app en un nuevo mes se crea automáticamente el movimiento correspondiente."
      />

      <form className="panel grid gap-4 p-5 lg:grid-cols-6" onSubmit={submit}>
        <div className="lg:col-span-6">
          <label className="label">Categoría</label>
          <div className="mt-2">
            <CategoryPicker value={form.category} onChange={(category) => setForm({ ...form, category })} />
          </div>
        </div>
        <div className="lg:col-span-2">
          <label className="label">Descripción</label>
          <input className="field mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </div>
        <div>
          <label className="label">Monto</label>
          <input className="field mt-2" type="number" min="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        </div>
        <div>
          <label className="label">Desde</label>
          <input className="field mt-2" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
        </div>
        <label className="flex items-end gap-3 pb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <input
            className="h-4 w-4 accent-zinc-950"
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm({ ...form, active: event.target.checked })}
          />
          Activo
        </label>
        <div className="flex gap-3 lg:col-span-6">
          <Button icon={<Plus className="h-4 w-4" />}>{editingId ? 'Guardar cambios' : 'Agregar gasto fijo'}</Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm(emptyRecurring); }}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {recurringExpenses.length > 0 ? recurringExpenses.map((expense) => {
          const categoryTone = getCategoryColorFor(categories, expense.category);

          return (
          <article key={expense.id} className={`panel p-5 ${categoryTone.soft} ${categoryTone.border}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <CategoryIcon category={expense.category} />
                <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-950 dark:text-white">{expense.description}</h2>
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${expense.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400'}`}>
                    {expense.active ? 'Activo' : 'Pausado'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {expense.category} · desde {formatDate(expense.startDate)}
                </p>
                </div>
              </div>
              <p className="text-base font-bold text-rose-600 dark:text-rose-300">{formatCurrency(expense.amount)}</p>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="icon-button" onClick={() => edit(expense)} aria-label="Editar gasto fijo">
                <Edit3 className="h-4 w-4" />
              </button>
              <button className="icon-button" onClick={() => deleteRecurringExpense(expense.id)} aria-label="Eliminar gasto fijo">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
          );
        }) : (
          <div className="panel px-4 py-10 text-center lg:col-span-2">
            <p className="text-sm font-bold text-zinc-950 dark:text-white">Todavía no hay gastos fijos</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Carga alquiler, servicios o suscripciones para anticipar tus salidas mensuales.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white dark:bg-white dark:text-zinc-950"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Agregar gasto fijo
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
