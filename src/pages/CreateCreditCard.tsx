import { ArrowLeft, ArrowRight, CalendarDays, Check, CreditCardIcon, Landmark, Palette, WalletCards } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { cardColors, getCardColor, getCardColorLabel, getCardTextColor } from '../components/credit-cards/cardVisuals';
import { formatCurrency } from '../utils/format';

type CardStep = 'identity' | 'limit' | 'dates' | 'style' | 'review';

const steps: CardStep[] = ['identity', 'limit', 'dates', 'style', 'review'];

function createEmptyCardForm() {
  return {
    name: '',
    issuer: '',
    lastFour: '',
    limit: '',
    closingDay: 25,
    dueDay: 10,
    color: 'slate',
    active: true,
  };
}

export function CreateCreditCard() {
  const navigate = useNavigate();
  const { addCreditCard } = useApp();
  const [form, setForm] = useState(createEmptyCardForm);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const currentStep = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;

  function goToStep(nextIndex: number) {
    const safeIndex = Math.min(Math.max(nextIndex, 0), steps.length - 1);
    setDirection(safeIndex > stepIndex ? 'forward' : 'back');
    setStepIndex(safeIndex);
  }

  function canContinue() {
    if (currentStep === 'identity') {
      return form.name.trim().length > 0;
    }

    if (currentStep === 'limit') {
      return Number(form.limit) >= 0 && form.limit !== '';
    }

    if (currentStep === 'dates') {
      return form.closingDay >= 1 && form.closingDay <= 31 && form.dueDay >= 1 && form.dueDay <= 31;
    }

    return true;
  }

  function next() {
    if (!canContinue()) {
      return;
    }

    if (currentStep === 'review') {
      addCreditCard({
        name: form.name.trim(),
        issuer: form.issuer.trim(),
        lastFour: form.lastFour.trim().slice(-4),
        limit: Number(form.limit),
        closingDay: Number(form.closingDay),
        dueDay: Number(form.dueDay),
        color: form.color,
        active: form.active,
      });
      navigate('/tarjetas');
      return;
    }

    goToStep(stepIndex + 1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button className="icon-button" type="button" onClick={() => navigate('/tarjetas')} aria-label="Volver a tarjetas">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="label">Tarjetas</p>
          <h1 className="truncate text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">Crear tarjeta</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="panel overflow-hidden">
          <div className="border-b border-zinc-200/80 px-4 py-4 dark:border-white/10 sm:px-5">
            <div className="mb-3 flex min-w-0 items-center gap-2">
              <StepIcon step={currentStep} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-950 dark:text-white">{stepTitle(currentStep)}</p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Paso {stepIndex + 1} de {steps.length}
                </p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-zinc-950 transition-all duration-200 ease-out dark:bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="min-h-[25rem] p-4 sm:p-5">
            <div key={currentStep} className={`guided-step guided-step-${direction}`}>
              {currentStep === 'identity' ? (
                <StepBlock title="Datos de la tarjeta">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nombre">
                      <input
                        className="field mt-2 text-lg font-bold"
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Ej: Visa principal"
                        autoFocus
                      />
                    </Field>
                    <Field label="Banco">
                      <input className="field mt-2" value={form.issuer} onChange={(event) => setForm((current) => ({ ...current, issuer: event.target.value }))} />
                    </Field>
                    <Field label="Ultimos 4">
                      <input
                        className="field mt-2"
                        maxLength={4}
                        inputMode="numeric"
                        value={form.lastFour}
                        onChange={(event) => setForm((current) => ({ ...current, lastFour: event.target.value.replace(/\D/g, '') }))}
                      />
                    </Field>
                  </div>
                </StepBlock>
              ) : null}

              {currentStep === 'limit' ? (
                <StepBlock title="Limite">
                  <Field label="Limite disponible">
                    <input
                      className="field mt-2 text-lg font-bold"
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={form.limit}
                      onChange={(event) => setForm((current) => ({ ...current, limit: event.target.value }))}
                      autoFocus
                    />
                  </Field>
                </StepBlock>
              ) : null}

              {currentStep === 'dates' ? (
                <StepBlock title="Fechas">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Dia de cierre">
                      <input
                        className="field mt-2"
                        type="number"
                        min="1"
                        max="31"
                        value={form.closingDay}
                        onChange={(event) => setForm((current) => ({ ...current, closingDay: Number(event.target.value) }))}
                      />
                    </Field>
                    <Field label="Dia de vencimiento">
                      <input
                        className="field mt-2"
                        type="number"
                        min="1"
                        max="31"
                        value={form.dueDay}
                        onChange={(event) => setForm((current) => ({ ...current, dueDay: Number(event.target.value) }))}
                      />
                    </Field>
                  </div>
                </StepBlock>
              ) : null}

              {currentStep === 'style' ? (
                <StepBlock title="Apariencia">
                  <CardColorGrid value={form.color} onChange={(color) => setForm((current) => ({ ...current, color }))} />
                  <label className="flex items-center justify-between rounded-lg border border-zinc-200/80 px-3 py-3 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:text-zinc-200">
                    Activa
                    <input className="h-5 w-5 accent-zinc-950" type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
                  </label>
                </StepBlock>
              ) : null}

              {currentStep === 'review' ? (
                <StepBlock title="Confirmar">
                  <div className="grid gap-3">
                    <ReviewRow label="Nombre" value={form.name.trim() || '-'} />
                    <ReviewRow label="Banco" value={form.issuer.trim() || '-'} />
                    <ReviewRow label="Ultimos 4" value={form.lastFour || '-'} />
                    <ReviewRow label="Limite" value={form.limit ? formatCurrency(Number(form.limit)) : '-'} />
                    <ReviewRow label="Cierre" value={`Dia ${form.closingDay}`} />
                    <ReviewRow label="Vence" value={`Dia ${form.dueDay}`} />
                    <ReviewRow label="Color" value={getCardColorLabel(form.color)} />
                    <ReviewRow label="Estado" value={form.active ? 'Activa' : 'Inactiva'} />
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
              {currentStep === 'review' ? 'Crear tarjeta' : 'Continuar'}
            </Button>
          </div>
        </section>

        <aside className="panel p-4 lg:sticky lg:top-6">
          <p className="label">Vista previa</p>
          <CreditCardPreview form={form} />
          <div className="mt-4 space-y-3">
            <SummaryItem icon={<Landmark className="h-4 w-4" />} label="Banco" value={form.issuer.trim() || '-'} />
            <SummaryItem icon={<WalletCards className="h-4 w-4" />} label="Limite" value={form.limit ? formatCurrency(Number(form.limit)) : '-'} />
            <SummaryItem icon={<CalendarDays className="h-4 w-4" />} label="Cierre y vence" value={`${form.closingDay} / ${form.dueDay}`} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function stepTitle(step: CardStep) {
  const titles: Record<CardStep, string> = {
    identity: 'Datos',
    limit: 'Limite',
    dates: 'Fechas',
    style: 'Apariencia',
    review: 'Confirmar',
  };

  return titles[step];
}

function StepIcon({ step }: { step: CardStep }) {
  const icons: Record<CardStep, ReactNode> = {
    identity: <CreditCardIcon className="h-4 w-4" />,
    limit: <WalletCards className="h-4 w-4" />,
    dates: <CalendarDays className="h-4 w-4" />,
    style: <Palette className="h-4 w-4" />,
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

function CardColorGrid({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {cardColors.map((color) => {
        const selected = value === color.value;

        return (
          <button
            key={color.value}
            type="button"
            className={`group relative flex h-16 items-end overflow-hidden rounded-lg bg-gradient-to-br p-2 text-left shadow-sm ring-1 transition ${color.className} ${color.textClassName} ${
              selected ? 'ring-2 ring-zinc-950 dark:ring-white' : 'ring-black/10 hover:scale-[1.02]'
            }`}
            onClick={() => onChange(color.value)}
            aria-pressed={selected}
            aria-label={`Elegir color ${color.label}`}
          >
            <span className="truncate text-xs font-bold leading-none drop-shadow-sm">{color.label}</span>
            {selected ? (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-zinc-950 shadow-sm">
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function CreditCardPreview({ form }: { form: ReturnType<typeof createEmptyCardForm> }) {
  return (
    <div className={`mt-4 min-h-48 rounded-lg bg-gradient-to-br ${getCardColor(form.color)} ${getCardTextColor(form.color)} p-5 shadow-soft`}>
      <div className="flex h-full min-h-40 flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium opacity-75">{form.issuer.trim() || 'Banco'}</p>
            <h2 className="mt-2 truncate text-2xl font-bold">{form.name.trim() || 'Nombre de tarjeta'}</h2>
          </div>
          <CreditCardIcon className="h-8 w-8 shrink-0 opacity-80" />
        </div>

        <div>
          <p className="text-sm font-semibold tracking-[0.32em]">.... {form.lastFour || '0000'}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="opacity-70">Cierre</p>
              <p className="font-bold">Dia {form.closingDay}</p>
            </div>
            <div>
              <p className="opacity-70">Vence</p>
              <p className="font-bold">Dia {form.dueDay}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
