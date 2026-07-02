import { Edit3, MapPin, Navigation, Plus, Search, Settings2, Trash2, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { CategoryBadge, getCategoryColorFor } from '../components/category/CategoryBadge';
import { CategoryManager } from '../components/category/CategoryManager';
import { CategoryPicker } from '../components/category/CategoryPicker';
import { MovementTypePicker } from '../components/movements/MovementTypePicker';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MONTHS } from '../data/constants';
import { useApp } from '../context/AppContext';
import type { Category, Filters, Movement, MovementLocation, MovementType, PaymentMethod } from '../types';
import { getCurrentMonth, getCurrentYear } from '../utils/date';
import { formatCoordinates, formatCurrency, formatDateTime } from '../utils/format';
import { applyFilters, getMovementsWithFinancialStart, yearsFromMovements } from '../utils/finance';

function createEmptyForm() {
  const now = new Date();

  return {
    type: 'expense' as MovementType,
    category: 'Comida' as Category,
    description: '',
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    amount: '',
    paymentMethod: 'cash' as PaymentMethod,
    creditCardId: '',
    installments: 1,
    location: undefined as MovementLocation | undefined,
  };
}

export function Movements() {
  const { movements, creditCards, categories, financialStart, addMovement, updateMovement, deleteMovement } = useApp();
  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    month: String(getCurrentMonth()),
    year: String(getCurrentYear()),
    category: 'all',
    type: 'all',
    query: '',
  });

  const displayMovements = useMemo(
    () => getMovementsWithFinancialStart(movements, financialStart),
    [financialStart, movements],
  );
  const years = yearsFromMovements(displayMovements);
  const filteredMovements = useMemo(() => applyFilters(displayMovements, filters), [displayMovements, filters]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      type: form.type,
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      time: form.time,
      amount: Number(form.amount),
      paymentMethod: form.type === 'expense' ? form.paymentMethod : 'cash',
      creditCardId: form.type === 'expense' && form.paymentMethod === 'credit' ? form.creditCardId : undefined,
      installments: form.type === 'expense' && form.paymentMethod === 'credit' ? Number(form.installments) : undefined,
      location: form.location,
    };

    if (!payload.description || payload.amount <= 0 || (payload.paymentMethod === 'credit' && !payload.creditCardId)) {
      return;
    }

    if (editingId) {
      updateMovement({ ...payload, id: editingId });
    } else {
      addMovement(payload);
    }

    setEditingId(null);
    setForm(createEmptyForm());
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Ubicación no disponible en este navegador.');
      return;
    }

    setLocationStatus('Obteniendo ubicación...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            capturedAt: new Date().toISOString(),
          },
        }));
        setLocationStatus('Ubicación guardada para este movimiento.');
      },
      () => {
        setLocationStatus('No se pudo obtener la ubicación.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function startEdit(movement: Movement) {
    if (movement.movementKind === 'opening_balance') {
      return;
    }

    setEditingId(movement.id);
    setForm({
      type: movement.type,
      category: movement.category,
      description: movement.description,
      date: movement.date,
      time: movement.time ?? '',
      amount: String(movement.amount),
      paymentMethod: movement.paymentMethod === 'credit' ? 'credit' : 'cash',
      creditCardId: movement.creditCardId ?? '',
      installments: movement.installments ?? 1,
      location: movement.location,
    });
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Movimientos"
        description="Registra ingresos y gastos, edítalos cuando cambien y filtra el historial."
        action={
          <Button
            type="button"
            variant="secondary"
            icon={<Settings2 className="h-4 w-4" />}
            onClick={() => setShowCategoryManager((current) => !current)}
          >
            Categorías
          </Button>
        }
      />

      {showCategoryManager ? <CategoryManager onClose={() => setShowCategoryManager(false)} /> : null}

      <form className="panel grid gap-4 p-5 lg:grid-cols-8" onSubmit={handleSubmit}>
        <div className="lg:col-span-3">
          <label className="label">Tipo</label>
          <div className="mt-2">
            <MovementTypePicker
              value={form.type}
              onChange={(type) =>
                setForm({
                  ...form,
                  type,
                  paymentMethod: type === 'income' ? 'cash' : form.paymentMethod,
                  creditCardId: type === 'income' ? '' : form.creditCardId,
                })
              }
            />
          </div>
        </div>
        <div className="lg:col-span-8">
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
          <label className="label">Fecha</label>
          <input className="field mt-2" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        </div>
        <div>
          <label className="label">Hora</label>
          <input className="field mt-2" type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
        </div>
        <div>
          <label className="label">Monto</label>
          <input className="field mt-2" type="number" min="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        </div>
        <div>
          <label className="label">Pago</label>
          <select
            className="field mt-2"
            value={form.paymentMethod}
            disabled={form.type === 'income'}
            onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as PaymentMethod, creditCardId: '' })}
          >
            <option value="cash">Efectivo / Débito</option>
            <option value="credit">Tarjeta</option>
          </select>
        </div>
        <div>
          <label className="label">Tarjeta</label>
          <select
            className="field mt-2"
            value={form.creditCardId}
            disabled={form.type === 'income' || form.paymentMethod !== 'credit'}
            onChange={(event) => setForm({ ...form, creditCardId: event.target.value })}
          >
            <option value="">Sin tarjeta</option>
            {creditCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Cuotas</label>
          <select
            className="field mt-2"
            value={form.installments}
            disabled={form.type === 'income' || form.paymentMethod !== 'credit'}
            onChange={(event) => setForm({ ...form, installments: Number(event.target.value) })}
          >
            {[1, 3, 6, 12].map((installments) => (
              <option key={installments} value={installments}>
                {installments}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="label">Ubicación</label>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              icon={<Navigation className="h-4 w-4" />}
              onClick={captureLocation}
              disabled={form.type !== 'expense'}
            >
              Usar ubicación
            </Button>
            {form.location ? (
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setForm({ ...form, location: undefined });
                  setLocationStatus('');
                }}
                aria-label="Quitar ubicación"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {form.location ? (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {formatCoordinates(form.location.latitude, form.location.longitude)}
            </p>
          ) : locationStatus ? (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{locationStatus}</p>
          ) : null}
        </div>
        <div className="flex gap-3 lg:col-span-8">
          <Button icon={<Plus className="h-4 w-4" />}>{editingId ? 'Guardar cambios' : 'Crear movimiento'}</Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm(createEmptyForm()); }}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <section className="panel p-5">
        <div className="grid gap-3 md:grid-cols-5">
          <select className="field" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value })}>
            <option value="all">Todos los meses</option>
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          <select className="field" value={filters.year} onChange={(event) => setFilters({ ...filters, year: event.target.value })}>
            <option value="all">Todos los años</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select className="field" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            <option value="all">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <select className="field" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              className="field pl-9"
              placeholder="Buscar"
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="divide-y divide-zinc-200/80 dark:divide-white/10">
          {filteredMovements.map((movement) => {
            const categoryTone = getCategoryColorFor(categories, movement.category);
            const amountClassName = movement.type === 'income' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300';

            return (
            <div
              key={movement.id}
              className={`grid gap-4 border-l-4 p-4 md:grid-cols-[1fr_auto_auto] md:items-center ${
                movement.type === 'expense' ? `${categoryTone.border} ${categoryTone.soft}` : 'border-emerald-200 dark:border-emerald-500/30'
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-950 dark:text-white">{movement.description}</p>
                  <CategoryBadge category={movement.category} />
                  {movement.paymentMethod === 'credit' ? (
                    <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                      {creditCards.find((card) => card.id === movement.creditCardId)?.name ?? 'Tarjeta'}
                    </span>
                  ) : null}
                  {movement.movementKind === 'credit_card_payment' ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      Pago de tarjeta
                    </span>
                  ) : null}
                  {movement.movementKind === 'opening_balance' ? (
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      Inicio financiero
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>{formatDateTime(movement.date, movement.time)}</span>
                  {movement.location ? (
                    <a
                      className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline dark:text-sky-300"
                      href={`https://www.google.com/maps?q=${movement.location.latitude},${movement.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Ver ubicación
                    </a>
                  ) : null}
                </div>
              </div>
              <p className={`text-base font-bold ${amountClassName}`}>
                {movement.type === 'income' ? '+' : '-'}
                {formatCurrency(movement.amount)}
              </p>
              {movement.movementKind === 'opening_balance' ? (
                <p className="text-xs font-medium text-zinc-400">Configurable</p>
              ) : (
                <div className="flex gap-2">
                  <button className="icon-button" onClick={() => startEdit(movement)} aria-label="Editar movimiento">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button className="icon-button" onClick={() => deleteMovement(movement.id)} aria-label="Eliminar movimiento">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
