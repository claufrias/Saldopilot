import { Check, Edit3, Plus, Trash2, WalletCards } from 'lucide-react';
import { FormEvent, useMemo, useRef, useState } from 'react';
import { CategoryIcon, getCategoryColorFor } from '../components/category/CategoryBadge';
import { CategoryPicker } from '../components/category/CategoryPicker';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useApp } from '../context/AppContext';
import type { Category, ExpectedIncome, ExpectedIncomeRecurrence, ExpectedIncomeSource, ExpectedIncomeStatus } from '../types';
import { confirmDelete } from '../utils/confirm';
import { getCurrentMonth, getCurrentYear, monthKey } from '../utils/date';
import { formatCurrency, formatDate } from '../utils/format';
import { getExpectedIncomePendingAmount } from '../utils/finance';

const sourceOptions: Array<{ value: ExpectedIncomeSource; label: string }> = [
  { value: 'salary', label: 'Sueldo' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'sale', label: 'Venta' },
  { value: 'rent', label: 'Alquiler' },
  { value: 'aid', label: 'Ayuda' },
  { value: 'other', label: 'Otro' },
];

const statusOptions: Array<{ value: ExpectedIncomeStatus; label: string }> = [
  { value: 'expected', label: 'Esperado' },
  { value: 'partial', label: 'Parcial' },
  { value: 'cancelled', label: 'Cancelado' },
];

const recurrenceOptions: Array<{ value: ExpectedIncomeRecurrence; label: string }> = [
  { value: 'none', label: 'No repetir' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'irregular', label: 'Irregular' },
];

function createEmptyForm(category: Category = 'Trabajo') {
  return {
    source: 'salary' as ExpectedIncomeSource,
    category,
    description: '',
    expectedAmount: '',
    expectedDate: new Date().toISOString().slice(0, 10),
    status: 'expected' as ExpectedIncomeStatus,
    receivedAmount: '',
    recurrence: 'none' as ExpectedIncomeRecurrence,
  };
}

export function ExpectedIncomes() {
  const {
    categories,
    expectedIncomes,
    addExpectedIncome,
    updateExpectedIncome,
    deleteExpectedIncome,
    markExpectedIncomeReceived,
  } = useApp();
  const [form, setForm] = useState(() => createEmptyForm(categories.find((category) => category.name === 'Trabajo')?.name ?? categories[0]?.name));
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const currentKey = monthKey(getCurrentYear(), getCurrentMonth());

  const orderedIncomes = useMemo(
    () => [...expectedIncomes].sort((a, b) => a.expectedDate.localeCompare(b.expectedDate)),
    [expectedIncomes],
  );
  const pendingTotal = expectedIncomes.reduce((total, income) => total + getExpectedIncomePendingAmount(income), 0);
  const monthTotal = expectedIncomes
    .filter((income) => income.expectedDate.startsWith(currentKey))
    .reduce((total, income) => total + getExpectedIncomePendingAmount(income), 0);

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyForm(categories.find((category) => category.name === 'Trabajo')?.name ?? categories[0]?.name));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      source: form.source,
      category: form.category,
      description: form.description.trim(),
      expectedAmount: Number(form.expectedAmount),
      expectedDate: form.expectedDate,
      status: form.status,
      receivedAmount: form.status === 'partial' ? Number(form.receivedAmount) : undefined,
      recurrence: form.recurrence,
    };

    if (!payload.description || payload.expectedAmount <= 0 || !payload.expectedDate) {
      return;
    }

    if (payload.status === 'partial' && ((payload.receivedAmount ?? 0) <= 0 || (payload.receivedAmount ?? 0) >= payload.expectedAmount)) {
      return;
    }

    if (editingId) {
      const existing = expectedIncomes.find((income) => income.id === editingId);

      if (existing) {
        updateExpectedIncome({
          ...existing,
          ...payload,
        });
      }
    } else {
      addExpectedIncome(payload);
    }

    resetForm();
  }

  function edit(income: ExpectedIncome) {
    setEditingId(income.id);
    setForm({
      source: income.source,
      category: income.category,
      description: income.description,
      expectedAmount: String(income.expectedAmount),
      expectedDate: income.expectedDate,
      status: income.status === 'received' ? 'expected' : income.status,
      receivedAmount: income.receivedAmount ? String(income.receivedAmount) : '',
      recurrence: income.recurrence ?? 'none',
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function receive(income: ExpectedIncome) {
    const pending = getExpectedIncomePendingAmount(income);
    const amountText = window.prompt('Monto cobrado', String(pending || income.expectedAmount));

    if (!amountText) {
      return;
    }

    const amount = Number(amountText);

    if (amount <= 0) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const date = window.prompt('Fecha de cobro', today) || today;
    markExpectedIncomeReceived(income.id, { amount, date });
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <SectionHeader
        title="Ingresos esperados"
        description="Anota cobros futuros para que las alertas puedan proyectar si llegas a cubrir vencimientos."
      />

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryStat label="Pendiente total" value={formatCurrency(pendingTotal)} tone="emerald" />
        <SummaryStat label="Esperado este mes" value={formatCurrency(monthTotal)} tone="sky" />
        <SummaryStat label="Registros" value={String(expectedIncomes.length)} tone="zinc" />
      </section>

      <form ref={formRef} className="panel grid gap-4 p-5 lg:grid-cols-6" onSubmit={submit}>
        <div className="lg:col-span-6">
          <label className="label">Categoria</label>
          <div className="mt-2">
            <CategoryPicker value={form.category} onChange={(category) => setForm({ ...form, category })} />
          </div>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="field mt-2" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value as ExpectedIncomeSource })}>
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="label">Descripcion</label>
          <input className="field mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </div>
        <div>
          <label className="label">Monto esperado</label>
          <input className="field mt-2" type="number" min="1" value={form.expectedAmount} onChange={(event) => setForm({ ...form, expectedAmount: event.target.value })} />
        </div>
        <div>
          <label className="label">Fecha esperada</label>
          <input className="field mt-2" type="date" value={form.expectedDate} onChange={(event) => setForm({ ...form, expectedDate: event.target.value })} />
        </div>
        <div>
          <label className="label">Repeticion</label>
          <select className="field mt-2" value={form.recurrence} onChange={(event) => setForm({ ...form, recurrence: event.target.value as ExpectedIncomeRecurrence })}>
            {recurrenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="field mt-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ExpectedIncomeStatus })}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {form.status === 'partial' ? (
          <div>
            <label className="label">Ya cobrado</label>
            <input className="field mt-2" type="number" min="1" value={form.receivedAmount} onChange={(event) => setForm({ ...form, receivedAmount: event.target.value })} />
          </div>
        ) : null}
        <div className="flex gap-3 lg:col-span-6">
          <Button icon={<Plus className="h-4 w-4" />}>{editingId ? 'Guardar cambios' : 'Agregar ingreso esperado'}</Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <section className="grid gap-3 lg:grid-cols-2">
        {orderedIncomes.length > 0 ? (
          orderedIncomes.map((income) => (
            <ExpectedIncomeCard
              key={income.id}
              income={income}
              categories={categories}
              onEdit={() => edit(income)}
              onDelete={() => confirmDelete(`el ingreso esperado "${income.description}"`) && deleteExpectedIncome(income.id)}
              onReceive={() => receive(income)}
            />
          ))
        ) : (
          <div className="panel px-4 py-10 text-center lg:col-span-2">
            <p className="text-sm font-bold text-zinc-950 dark:text-white">Todavia no hay ingresos esperados</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Carga un cobro futuro para que Saldopilot pueda cruzarlo con vencimientos de tarjetas.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'sky' | 'zinc' }) {
  const classes = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    zinc: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200',
  };

  return (
    <div className={`rounded-lg px-4 py-3 ${classes[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 truncate text-lg font-extrabold">{value}</p>
    </div>
  );
}

function ExpectedIncomeCard({
  income,
  categories,
  onEdit,
  onDelete,
  onReceive,
}: {
  income: ExpectedIncome;
  categories: ReturnType<typeof useApp>['categories'];
  onEdit: () => void;
  onDelete: () => void;
  onReceive: () => void;
}) {
  const categoryTone = getCategoryColorFor(categories, income.category);
  const pending = getExpectedIncomePendingAmount(income);
  const canReceive = pending > 0 && !income.receivedMovementId;

  return (
    <article className={`panel p-5 ${categoryTone.soft} ${categoryTone.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <CategoryIcon category={income.category} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-zinc-950 dark:text-white">{income.description}</h2>
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClassName(income.status)}`}>
                {statusLabel(income.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {sourceLabel(income.source)} - esperado {formatDate(income.expectedDate)}
            </p>
            {income.status === 'partial' ? (
              <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Cobrado {formatCurrency(income.receivedAmount ?? 0)} de {formatCurrency(income.expectedAmount)}
              </p>
            ) : null}
            {income.receivedDate ? (
              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                Cobrado el {formatDate(income.receivedDate)}
              </p>
            ) : null}
          </div>
        </div>
        <p className="shrink-0 text-base font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(pending || income.receivedAmount || income.expectedAmount)}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {canReceive ? (
          <button className="icon-button" onClick={onReceive} aria-label="Marcar ingreso cobrado">
            <Check className="h-4 w-4" />
          </button>
        ) : null}
        <button className="icon-button" onClick={onEdit} aria-label="Editar ingreso esperado">
          <Edit3 className="h-4 w-4" />
        </button>
        <button className="icon-button" onClick={onDelete} aria-label="Eliminar ingreso esperado">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function sourceLabel(source: ExpectedIncomeSource): string {
  return sourceOptions.find((option) => option.value === source)?.label ?? 'Otro';
}

function statusLabel(status: ExpectedIncomeStatus): string {
  const labels: Record<ExpectedIncomeStatus, string> = {
    expected: 'Esperado',
    partial: 'Parcial',
    received: 'Cobrado',
    cancelled: 'Cancelado',
  };

  return labels[status];
}

function statusClassName(status: ExpectedIncomeStatus): string {
  const classes: Record<ExpectedIncomeStatus, string> = {
    expected: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    partial: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    received: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    cancelled: 'bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400',
  };

  return classes[status];
}
