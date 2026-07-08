import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  DollarSign,
  Navigation,
  ReceiptText,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryBadge } from '../components/category/CategoryBadge';
import { CategoryIcon } from '../components/category/CategoryBadge';
import { MovementTypePicker } from '../components/movements/MovementTypePicker';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import type { Category, MovementLocation, MovementType, PaymentMethod } from '../types';
import { formatCoordinates, formatCurrency } from '../utils/format';

type StepKey = 'type' | 'category' | 'details' | 'payment' | 'review';

function createEmptyForm(category: Category = 'Comida') {
  const now = new Date();

  return {
    type: 'expense' as MovementType,
    category,
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

export function CreateMovement() {
  const navigate = useNavigate();
  const { addMovement, categories, creditCards, usesCreditCards } = useApp();
  const [form, setForm] = useState(() => createEmptyForm(categories[0]?.name));
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [locationStatus, setLocationStatus] = useState('');

  const steps = useMemo<StepKey[]>(
    () => (form.type === 'expense' && usesCreditCards ? ['type', 'category', 'details', 'payment', 'review'] : ['type', 'category', 'details', 'review']),
    [form.type, usesCreditCards],
  );
  const currentStep = steps[stepIndex] ?? steps[steps.length - 1];
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const selectedCard = creditCards.find((card) => card.id === form.creditCardId);

  useEffect(() => {
    if (categories.length > 0 && !categories.some((category) => category.name === form.category)) {
      setForm((current) => ({ ...current, category: categories[0].name }));
    }
  }, [categories, form.category]);

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(steps.length - 1);
    }
  }, [stepIndex, steps.length]);

  function goToStep(nextIndex: number) {
    const safeIndex = Math.min(Math.max(nextIndex, 0), steps.length - 1);
    setDirection(safeIndex > stepIndex ? 'forward' : 'back');
    setStepIndex(safeIndex);
  }

  function canContinue() {
    if (currentStep === 'category') {
      return Boolean(form.category);
    }

    if (currentStep === 'details') {
      return form.description.trim().length > 0 && Number(form.amount) > 0 && Boolean(form.date);
    }

    if (currentStep === 'payment') {
      return form.paymentMethod !== 'credit' || Boolean(form.creditCardId);
    }

    return true;
  }

  function next() {
    if (!canContinue()) {
      return;
    }

    if (currentStep === 'review') {
      submit();
      return;
    }

    goToStep(stepIndex + 1);
  }

  function submit() {
    const amount = Number(form.amount);

    if (!form.description.trim() || amount <= 0 || (form.paymentMethod === 'credit' && !form.creditCardId)) {
      return;
    }

    addMovement({
      type: form.type,
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      time: form.time,
      amount,
      paymentMethod: form.type === 'expense' ? form.paymentMethod : 'cash',
      creditCardId: form.type === 'expense' && form.paymentMethod === 'credit' ? form.creditCardId : undefined,
      installments: form.type === 'expense' && form.paymentMethod === 'credit' ? Number(form.installments) : undefined,
      location: form.location,
    });
    navigate('/movimientos');
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
        setLocationStatus('Ubicacion guardada.');
      },
      () => {
        setLocationStatus('No se pudo obtener la ubicacion.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button className="icon-button" type="button" onClick={() => navigate('/movimientos')} aria-label="Volver a movimientos">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="label">Movimientos</p>
          <h1 className="truncate text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">Crear movimiento</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="panel overflow-hidden">
          <div className="border-b border-zinc-200/80 px-4 py-4 dark:border-white/10 sm:px-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <StepIcon step={currentStep} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-950 dark:text-white">{stepTitle(currentStep)}</p>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Paso {stepIndex + 1} de {steps.length}
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-zinc-950 transition-all duration-200 ease-out dark:bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="min-h-[25rem] p-4 sm:p-5">
            <div key={currentStep} className={`movement-step movement-step-${direction}`}>
              {currentStep === 'type' ? (
                <StepBlock title="Tipo de movimiento">
                  <MovementTypePicker
                    value={form.type}
                    onChange={(type) =>
                      setForm((current) => ({
                        ...current,
                        type,
                        paymentMethod: type === 'income' ? 'cash' : current.paymentMethod,
                        creditCardId: type === 'income' ? '' : current.creditCardId,
                        location: type === 'income' ? undefined : current.location,
                      }))
                    }
                  />
                </StepBlock>
              ) : null}

              {currentStep === 'category' ? (
                <StepBlock title="Categoria">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                    {categories.map((category) => {
                      const selected = form.category === category.name;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 text-left transition active:scale-[0.98] ${
                            selected
                              ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-950'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/10'
                          }`}
                          onClick={() => setForm((current) => ({ ...current, category: category.name }))}
                          aria-pressed={selected}
                        >
                          <CategoryIcon category={category.name} />
                          <span className="min-w-0 truncate text-sm font-semibold">{category.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </StepBlock>
              ) : null}

              {currentStep === 'details' ? (
                <StepBlock title="Detalles">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Monto">
                      <input
                        className="field mt-2 text-lg font-bold"
                        type="number"
                        min="1"
                        inputMode="decimal"
                        value={form.amount}
                        onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                        autoFocus
                      />
                    </Field>
                    <Field label="Descripcion">
                      <input
                        className="field mt-2"
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      />
                    </Field>
                    <Field label="Fecha">
                      <input className="field mt-2" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
                    </Field>
                    <Field label="Hora">
                      <input className="field mt-2" type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} />
                    </Field>
                  </div>
                  {form.type === 'expense' ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" className="flex-1" icon={<Navigation className="h-4 w-4" />} onClick={captureLocation}>
                          Usar ubicacion
                        </Button>
                        {form.location ? (
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => {
                              setForm((current) => ({ ...current, location: undefined }));
                              setLocationStatus('');
                            }}
                            aria-label="Quitar ubicacion"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                      {form.location ? (
                        <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {formatCoordinates(form.location.latitude, form.location.longitude)}
                        </p>
                      ) : locationStatus ? (
                        <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{locationStatus}</p>
                      ) : null}
                    </div>
                  ) : null}
                </StepBlock>
              ) : null}

              {currentStep === 'payment' ? (
                <StepBlock title="Pago">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <PaymentOption
                      icon={<Wallet className="h-4 w-4" />}
                      title="Efectivo / Debito"
                      selected={form.paymentMethod === 'cash'}
                      onClick={() => setForm((current) => ({ ...current, paymentMethod: 'cash', creditCardId: '' }))}
                    />
                    <PaymentOption
                      icon={<CreditCard className="h-4 w-4" />}
                      title="Tarjeta"
                      selected={form.paymentMethod === 'credit'}
                      onClick={() => setForm((current) => ({ ...current, paymentMethod: 'credit', creditCardId: current.creditCardId || creditCards[0]?.id || '' }))}
                    />
                  </div>
                  {form.paymentMethod === 'credit' ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Tarjeta">
                        <select className="field mt-2" value={form.creditCardId} onChange={(event) => setForm((current) => ({ ...current, creditCardId: event.target.value }))}>
                          <option value="">Elegir tarjeta</option>
                          {creditCards.map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Cuotas">
                        <select className="field mt-2" value={form.installments} onChange={(event) => setForm((current) => ({ ...current, installments: Number(event.target.value) }))}>
                          {[1, 3, 6, 12].map((installments) => (
                            <option key={installments} value={installments}>
                              {installments}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  ) : null}
                </StepBlock>
              ) : null}

              {currentStep === 'review' ? (
                <StepBlock title="Confirmar">
                  <div className="grid gap-3">
                    <ReviewRow label="Tipo" value={form.type === 'expense' ? 'Gasto' : 'Ingreso'} />
                    <ReviewRow label="Categoria" value={form.category} />
                    <ReviewRow label="Descripcion" value={form.description || '-'} />
                    <ReviewRow label="Monto" value={Number(form.amount) > 0 ? formatCurrency(Number(form.amount)) : '-'} />
                    <ReviewRow label="Fecha" value={`${form.date}${form.time ? ` ${form.time}` : ''}`} />
                    {form.type === 'expense' ? <ReviewRow label="Pago" value={form.paymentMethod === 'credit' ? selectedCard?.name ?? 'Tarjeta' : 'Efectivo / Debito'} /> : null}
                    {form.paymentMethod === 'credit' ? <ReviewRow label="Cuotas" value={String(form.installments)} /> : null}
                    {form.location ? <ReviewRow label="Ubicacion" value={formatCoordinates(form.location.latitude, form.location.longitude)} /> : null}
                  </div>
                </StepBlock>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-zinc-200/80 p-4 dark:border-white/10 sm:p-5">
            <Button type="button" variant="secondary" onClick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0} icon={<ArrowLeft className="h-4 w-4" />}>
              Atras
            </Button>
            <Button type="button" onClick={next} disabled={!canContinue()} icon={currentStep === 'review' ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}>
              {currentStep === 'review' ? 'Crear movimiento' : 'Continuar'}
            </Button>
          </div>
        </section>

        <aside className="panel p-4 lg:sticky lg:top-6">
          <p className="label">Resumen</p>
          <div className="mt-4 space-y-3">
            <SummaryItem icon={<ReceiptText className="h-4 w-4" />} label="Tipo" value={form.type === 'expense' ? 'Gasto' : 'Ingreso'} />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                <CategoryIcon category={form.category} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Categoria</p>
                <div className="mt-1">
                  <CategoryBadge category={form.category} />
                </div>
              </div>
            </div>
            <SummaryItem icon={<DollarSign className="h-4 w-4" />} label="Monto" value={Number(form.amount) > 0 ? formatCurrency(Number(form.amount)) : '-'} />
            <SummaryItem icon={<CalendarDays className="h-4 w-4" />} label="Fecha" value={form.date} />
            {form.type === 'expense' && usesCreditCards ? (
              <SummaryItem icon={<CreditCard className="h-4 w-4" />} label="Pago" value={form.paymentMethod === 'credit' ? selectedCard?.name ?? 'Tarjeta' : 'Efectivo / Debito'} />
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function stepTitle(step: StepKey) {
  const titles: Record<StepKey, string> = {
    type: 'Tipo',
    category: 'Categoria',
    details: 'Detalles',
    payment: 'Pago',
    review: 'Confirmar',
  };

  return titles[step];
}

function StepIcon({ step }: { step: StepKey }) {
  const icons: Record<StepKey, ReactNode> = {
    type: <ReceiptText className="h-4 w-4" />,
    category: <ReceiptText className="h-4 w-4" />,
    details: <DollarSign className="h-4 w-4" />,
    payment: <CreditCard className="h-4 w-4" />,
    review: <Check className="h-4 w-4" />,
  };

  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">{icons[step]}</span>;
}

function StepBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-zinc-950 dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function PaymentOption({ icon, title, selected, onClick }: { icon: ReactNode; title: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 text-left transition active:scale-[0.98] ${
        selected
          ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-950'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/10'
      }`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 text-current dark:bg-zinc-950/30">{icon}</span>
      <span className="text-sm font-bold">{title}</span>
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-950">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="truncate text-right text-sm font-bold text-zinc-950 dark:text-white">{value}</span>
    </div>
  );
}

function SummaryItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate text-sm font-bold text-zinc-950 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
