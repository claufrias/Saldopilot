import { Edit3, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { getGoalColor, GoalIconBadge, goalColors, goalIcons } from '../components/goals/GoalVisual';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useApp } from '../context/AppContext';
import type { SavingsGoal } from '../types';
import { formatCurrency, formatDate, percentage } from '../utils/format';

const emptyGoal = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  targetDate: new Date().toISOString().slice(0, 10),
  icon: 'target',
  color: 'emerald',
};

export function Goals() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useApp();
  const [form, setForm] = useState(emptyGoal);
  const [editingId, setEditingId] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount),
      targetDate: form.targetDate,
      icon: form.icon,
      color: form.color,
    };

    if (!payload.name || payload.targetAmount <= 0) {
      return;
    }

    if (editingId) {
      updateSavingsGoal({ ...payload, id: editingId });
    } else {
      addSavingsGoal(payload);
    }

    setEditingId(null);
    setForm(emptyGoal);
  }

  function edit(goal: SavingsGoal) {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate,
      icon: goal.icon,
      color: goal.color,
    });
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="Objetivos" description="Crea metas de ahorro y actualiza el progreso acumulado." />

      <form className="panel grid gap-4 p-5 md:grid-cols-5" onSubmit={submit}>
        <div className="md:col-span-2">
          <label className="label">Nombre</label>
          <input className="field mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </div>
        <div>
          <label className="label">Meta</label>
          <input className="field mt-2" type="number" min="1" value={form.targetAmount} onChange={(event) => setForm({ ...form, targetAmount: event.target.value })} />
        </div>
        <div>
          <label className="label">Ahorrado</label>
          <input className="field mt-2" type="number" min="0" value={form.currentAmount} onChange={(event) => setForm({ ...form, currentAmount: event.target.value })} />
        </div>
        <div>
          <label className="label">Fecha objetivo</label>
          <input className="field mt-2" type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} />
        </div>
        <div className="md:col-span-5">
          <label className="label">Icono</label>
          <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-9 lg:grid-cols-12">
            {goalIcons.map((item) => {
              const Icon = item.icon;
              const selected = form.icon === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  className={`flex h-12 items-center justify-center rounded-lg border transition active:scale-[0.98] ${
                    selected
                      ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10'
                  }`}
                  onClick={() => setForm({ ...form, icon: item.value })}
                  title={item.label}
                  aria-label={`Elegir icono ${item.label}`}
                  aria-pressed={selected}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-5">
          <label className="label">Color</label>
          <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-12">
            {goalColors.map((color) => {
              const selected = form.color === color.value;

              return (
                <button
                  key={color.value}
                  type="button"
                  className={`flex h-11 items-center justify-center rounded-lg border transition active:scale-[0.98] ${
                    selected
                      ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/10'
                  }`}
                  onClick={() => setForm({ ...form, color: color.value })}
                  title={color.label}
                  aria-label={`Elegir color ${color.label}`}
                  aria-pressed={selected}
                >
                  <span className={`h-5 w-5 rounded-full ${color.bar}`} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-3 md:col-span-5">
          <Button icon={<Plus className="h-4 w-4" />}>{editingId ? 'Guardar cambios' : 'Crear objetivo'}</Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm(emptyGoal); }}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {savingsGoals.map((goal) => {
          const progress = percentage(goal.currentAmount, goal.targetAmount);
          const tone = getGoalColor(goal.color);

          return (
            <article key={goal.id} className="panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <GoalIconBadge icon={goal.icon} color={goal.color} />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-zinc-950 dark:text-white">{goal.name}</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Objetivo: {formatDate(goal.targetDate)}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${tone.text}`}>{progress}%</p>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xl font-bold text-zinc-950 dark:text-white">{formatCurrency(goal.currentAmount)}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">de {formatCurrency(goal.targetAmount)}</p>
                </div>
              </div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-5 flex gap-2">
                <button className="icon-button" onClick={() => edit(goal)} aria-label="Editar objetivo">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button className="icon-button" onClick={() => deleteSavingsGoal(goal.id)} aria-label="Eliminar objetivo">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
