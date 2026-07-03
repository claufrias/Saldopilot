import { Edit3, MapPin, Navigation, Plus, Search, Settings2, SlidersHorizontal, Trash2, X } from 'lucide-react';
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
  const [showMobileForm, setShowMobileForm] = useState(false);
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
  const filteredIncome = filteredMovements
    .filter((movement) => movement.type === 'income')
    .reduce((total, movement) => total + movement.amount, 0);
  const filteredExpenses = filteredMovements
    .filter((movement) => movement.type === 'expense' && movement.movementKind !== 'credit_card_payment')
    .reduce((total, movement) => total + movement.amount, 0);
  const activeFilters = [filters.month, filters.year, filters.category, filters.type].filter((value) => value !== 'all').length + (filters.query ? 1 : 0);

  function openCreateMovement() {
    setEditingId(null);
    setLocationStatus('');
    setForm(createEmptyForm());
    setShowMobileForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyForm());
    setLocationStatus('');
    setShowMobileForm(false);
  }

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

    resetForm();
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Ubicacion no disponible en este navegador.');
      return;
    }

    setLocationStatus('Obteniendo ubicacion...');
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
        setLocationStatus('Ubicacion guardada para este movimiento.');
      },
      () => {
        setLocationStatus('No se pudo obtener la ubicacion.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function startEdit(movement: Movement) {
    if (movement.movementKind === 'opening_balance') {
      return;
    }

    setEditingId(movement.id);
    setShowMobileForm(true);
    setLocationStatus('');
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

  function renderMovementForm(className: string) {
    return (
      <form className={className} onSubmit={handleSubmit}>
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
          <label className="label">Categoria</label>
          <div className="mt-2">
            <CategoryPicker value={form.category} onChange={(category) => setForm({ ...form, category })} />
          </div>
        </div>
        <div className="lg:col-span-2">
          <label className="label">Descripcion</label>
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
            <option value="cash">Efectivo / Debito</option>
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
          <label className="label">Ubicacion</label>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              icon={<Navigation className="h-4 w-4" />}
              onClick={captureLocation}
              disabled={form.type !== 'expense'}
            >
              Usar ubicacion
            </Button>
            {form.location ? (
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setForm({ ...form, location: undefined });
                  setLocationStatus('');
                }}
                aria-label="Quitar ubicacion"
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
          <Button className="flex-1 md:flex-none" icon={<Plus className="h-4 w-4" />}>{editingId ? 'Guardar cambios' : 'Crear movimiento'}</Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <SectionHeader
        title="Movimientos"
        description="Registra ingresos y gastos, editalos cuando cambien y filtra el historial."
        action={
          <div className="flex gap-2">
            <Button type="button" className="md:hidden" icon={<Plus className="h-4 w-4" />} onClick={openCreateMovement}>
              Agregar
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={<Settings2 className="h-4 w-4" />}
              onClick={() => setShowCategoryManager((current) => !current)}
            >
              Categorias
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:hidden">
        <MobileStat label="Ingresos" value={formatCurrency(filteredIncome)} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" />
        <MobileStat label="Gastos" value={formatCurrency(filteredExpenses)} className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" />
      </section>

      {showCategoryManager ? <CategoryManager onClose={() => setShowCategoryManager(false)} /> : null}

      {renderMovementForm('panel hidden gap-4 p-5 md:grid lg:grid-cols-8')}

      {showMobileForm ? (
        <div className="fixed inset-0 z-40 flex items-end bg-zinc-950/45 px-3 pb-3 backdrop-blur-sm md:hidden">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-zinc-950">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-white/20" />
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="label">{editingId ? 'Editar' : 'Nuevo'}</p>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">{editingId ? 'Editar movimiento' : 'Agregar movimiento'}</h2>
              </div>
              <button className="icon-button h-9 w-9" type="button" onClick={resetForm} aria-label="Cerrar formulario">
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderMovementForm('grid gap-4')}
          </div>
        </div>
      ) : null}

      <section className="panel p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
            <p className="text-sm font-bold text-zinc-950 dark:text-white">Filtros</p>
          </div>
          {activeFilters > 0 ? (
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
              {activeFilters}
            </span>
          ) : null}
        </div>
        <div className="grid gap-2.5 md:grid-cols-5 md:gap-3">
          <div className="relative md:order-last">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              className="field pl-9"
              placeholder="Buscar"
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:contents">
            <select className="field" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value })}>
              <option value="all">Todos los meses</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select className="field" value={filters.year} onChange={(event) => setFilters({ ...filters, year: event.target.value })}>
              <option value="all">Todos los anos</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select className="field" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              <option value="all">Todas las categorias</option>
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
          </div>
        </div>
      </section>

      <section className="space-y-2 md:panel md:overflow-hidden md:space-y-0">
        <div className="md:divide-y md:divide-zinc-200/80 md:dark:divide-white/10">
          {filteredMovements.length > 0 ? (
            filteredMovements.map((movement) => (
              <MovementRow
                key={movement.id}
                movement={movement}
                categories={categories}
                creditCards={creditCards}
                onEdit={startEdit}
                onDelete={deleteMovement}
              />
            ))
          ) : (
            <div className="panel px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400 md:border-0 md:shadow-none">
              No hay movimientos para estos filtros.
            </div>
          )}
        </div>
      </section>

      <button
        type="button"
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-2xl shadow-zinc-950/30 active:scale-95 dark:bg-white dark:text-zinc-950 md:hidden"
        style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}
        onClick={openCreateMovement}
        aria-label="Agregar movimiento"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

function MobileStat({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className={`rounded-lg px-4 py-3 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}

function MovementRow({
  movement,
  categories,
  creditCards,
  onEdit,
  onDelete,
}: {
  movement: Movement;
  categories: ReturnType<typeof useApp>['categories'];
  creditCards: ReturnType<typeof useApp>['creditCards'];
  onEdit: (movement: Movement) => void;
  onDelete: (id: string) => void;
}) {
  const categoryTone = getCategoryColorFor(categories, movement.category);
  const isIncome = movement.type === 'income';
  const amountClassName = isIncome ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300';
  const cardName = creditCards.find((card) => card.id === movement.creditCardId)?.name ?? 'Tarjeta';

  return (
    <article
      className={`panel border-l-4 p-3.5 md:grid md:gap-4 md:border-x-0 md:border-b-0 md:border-r-0 md:p-4 md:grid-cols-[1fr_auto_auto] md:items-center md:rounded-none md:shadow-none ${
        movement.type === 'expense' ? `${categoryTone.border} ${categoryTone.soft}` : 'border-emerald-200 dark:border-emerald-500/30'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3 md:hidden">
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-950 dark:text-white">{movement.description}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(movement.date, movement.time)}</p>
          </div>
          <p className={`shrink-0 text-base font-extrabold ${amountClassName}`}>
            {isIncome ? '+' : '-'}
            {formatCurrency(movement.amount)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-0">
          <p className="hidden font-semibold text-zinc-950 dark:text-white md:block">{movement.description}</p>
          <CategoryBadge category={movement.category} />
          {movement.paymentMethod === 'credit' ? (
            <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
              {cardName}
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

        <div className="mt-2 hidden flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400 md:flex">
          <span>{formatDateTime(movement.date, movement.time)}</span>
          {movement.location ? <LocationLink movement={movement} /> : null}
        </div>
        {movement.location ? (
          <div className="mt-3 md:hidden">
            <LocationLink movement={movement} />
          </div>
        ) : null}
      </div>

      <p className={`hidden text-base font-bold md:block ${amountClassName}`}>
        {isIncome ? '+' : '-'}
        {formatCurrency(movement.amount)}
      </p>

      {movement.movementKind === 'opening_balance' ? (
        <p className="mt-3 text-xs font-medium text-zinc-400 md:mt-0">Configurable</p>
      ) : (
        <div className="mt-3 flex justify-end gap-2 md:mt-0">
          <button className="icon-button h-9 w-9" onClick={() => onEdit(movement)} aria-label="Editar movimiento">
            <Edit3 className="h-4 w-4" />
          </button>
          <button className="icon-button h-9 w-9" onClick={() => onDelete(movement.id)} aria-label="Eliminar movimiento">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </article>
  );
}

function LocationLink({ movement }: { movement: Movement }) {
  if (!movement.location) {
    return null;
  }

  return (
    <a
      className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline dark:text-sky-300"
      href={`https://www.google.com/maps?q=${movement.location.latitude},${movement.location.longitude}`}
      target="_blank"
      rel="noreferrer"
    >
      <MapPin className="h-3.5 w-3.5" />
      Ver ubicacion
    </a>
  );
}
