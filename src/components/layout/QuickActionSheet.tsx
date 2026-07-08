import { CalendarClock, CreditCard, Plus, ReceiptText, WalletCards, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryPicker } from '../category/CategoryPicker';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import type { Category } from '../../types';

type QuickActionKind = 'movement' | 'recurring' | 'card' | 'payment';

const now = () => new Date();

function dateToday() {
  return now().toISOString().slice(0, 10);
}

function createRecurringForm() {
  return {
    category: 'Servicios' as Category,
    description: '',
    amount: '',
    startDate: dateToday(),
  };
}

function createCardForm() {
  return {
    name: '',
    issuer: '',
    lastFour: '',
    limit: '',
    closingDay: 25,
    dueDay: 10,
  };
}

function createPaymentForm() {
  return {
    creditCardId: '',
    description: '',
    amount: '',
    date: dateToday(),
  };
}

export function QuickActionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp();
  const navigate = useNavigate();
  const [kind, setKind] = useState<QuickActionKind>('movement');
  const [recurringForm, setRecurringForm] = useState(createRecurringForm);
  const [cardForm, setCardForm] = useState(createCardForm);
  const [paymentForm, setPaymentForm] = useState(createPaymentForm);

  useEffect(() => {
    if (!app.usesCreditCards && (kind === 'card' || kind === 'payment')) {
      setKind('movement');
    }
  }, [app.usesCreditCards, kind]);

  if (!open) {
    return null;
  }

  function finish() {
    setRecurringForm(createRecurringForm());
    setCardForm(createCardForm());
    setPaymentForm(createPaymentForm());
    onClose();
  }

  function submitRecurring(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(recurringForm.amount);

    if (!recurringForm.description.trim() || amount <= 0) {
      return;
    }

    app.addRecurringExpense({
      category: recurringForm.category,
      description: recurringForm.description.trim(),
      amount,
      startDate: recurringForm.startDate,
      active: true,
    });
    finish();
  }

  function submitCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limit = Number(cardForm.limit);

    if (!cardForm.name.trim() || limit < 0 || cardForm.closingDay < 1 || cardForm.closingDay > 31 || cardForm.dueDay < 1 || cardForm.dueDay > 31) {
      return;
    }

    app.addCreditCard({
      name: cardForm.name.trim(),
      issuer: cardForm.issuer.trim(),
      lastFour: cardForm.lastFour.trim().slice(-4),
      limit,
      closingDay: Number(cardForm.closingDay),
      dueDay: Number(cardForm.dueDay),
      color: 'slate',
      active: true,
    });
    finish();
  }

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cardId = paymentForm.creditCardId || app.creditCards[0]?.id;
    const amount = Number(paymentForm.amount);

    if (!cardId || amount <= 0) {
      return;
    }

    app.addCreditCardPayment({
      creditCardId: cardId,
      description: paymentForm.description.trim() || `Pago tarjeta ${app.creditCards.find((card) => card.id === cardId)?.name ?? ''}`.trim(),
      date: paymentForm.date,
      amount,
    });
    finish();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-zinc-950/45 px-3 pb-3 backdrop-blur-sm xl:hidden" role="dialog" aria-modal="true">
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-white/20" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="label">Accion rapida</p>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Agregar</h2>
          </div>
          <button className="icon-button h-9 w-9" onClick={onClose} type="button" aria-label="Cerrar accion rapida">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`grid gap-2 ${app.usesCreditCards ? 'grid-cols-4' : 'grid-cols-2'}`}>
          <QuickActionTab icon={<ReceiptText className="h-4 w-4" />} label="Mov." selected={kind === 'movement'} onClick={() => setKind('movement')} />
          <QuickActionTab icon={<CalendarClock className="h-4 w-4" />} label="Fijo" selected={kind === 'recurring'} onClick={() => setKind('recurring')} />
          {app.usesCreditCards ? (
            <>
              <QuickActionTab icon={<CreditCard className="h-4 w-4" />} label="Tarjeta" selected={kind === 'card'} onClick={() => setKind('card')} />
              <QuickActionTab icon={<WalletCards className="h-4 w-4" />} label="Pago" selected={kind === 'payment'} onClick={() => setKind('payment')} />
            </>
          ) : null}
        </div>

        {kind === 'movement' ? (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
            <Button
              className="w-full"
              icon={<ReceiptText className="h-4 w-4" />}
              onClick={() => {
                onClose();
                navigate('/movimientos/nuevo');
              }}
            >
              Crear movimiento
            </Button>
          </div>
        ) : null}

        {kind === 'recurring' ? (
          <form className="mt-4 grid gap-4" onSubmit={submitRecurring}>
            <Field label="Categoria">
              <CategoryPicker value={recurringForm.category} onChange={(category) => setRecurringForm({ ...recurringForm, category })} />
            </Field>
            <Field label="Descripcion">
              <input className="field mt-2" value={recurringForm.description} onChange={(event) => setRecurringForm({ ...recurringForm, description: event.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monto">
                <input className="field mt-2" type="number" min="1" value={recurringForm.amount} onChange={(event) => setRecurringForm({ ...recurringForm, amount: event.target.value })} />
              </Field>
              <Field label="Desde">
                <input className="field mt-2" type="date" value={recurringForm.startDate} onChange={(event) => setRecurringForm({ ...recurringForm, startDate: event.target.value })} />
              </Field>
            </div>
            <Button icon={<Plus className="h-4 w-4" />}>Crear gasto fijo</Button>
          </form>
        ) : null}

        {kind === 'card' ? (
          <form className="mt-4 grid gap-4" onSubmit={submitCard}>
            <Field label="Nombre">
              <input className="field mt-2" value={cardForm.name} onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Banco">
                <input className="field mt-2" value={cardForm.issuer} onChange={(event) => setCardForm({ ...cardForm, issuer: event.target.value })} />
              </Field>
              <Field label="Ultimos 4">
                <input className="field mt-2" maxLength={4} value={cardForm.lastFour} onChange={(event) => setCardForm({ ...cardForm, lastFour: event.target.value.replace(/\D/g, '') })} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Limite">
                <input className="field mt-2" type="number" min="0" value={cardForm.limit} onChange={(event) => setCardForm({ ...cardForm, limit: event.target.value })} />
              </Field>
              <Field label="Cierre">
                <input className="field mt-2" type="number" min="1" max="31" value={cardForm.closingDay} onChange={(event) => setCardForm({ ...cardForm, closingDay: Number(event.target.value) })} />
              </Field>
              <Field label="Vence">
                <input className="field mt-2" type="number" min="1" max="31" value={cardForm.dueDay} onChange={(event) => setCardForm({ ...cardForm, dueDay: Number(event.target.value) })} />
              </Field>
            </div>
            <Button icon={<Plus className="h-4 w-4" />}>Crear tarjeta</Button>
          </form>
        ) : null}

        {kind === 'payment' ? (
          <form className="mt-4 grid gap-4" onSubmit={submitPayment}>
            <Field label="Tarjeta">
              <select className="field mt-2" value={paymentForm.creditCardId} onChange={(event) => setPaymentForm({ ...paymentForm, creditCardId: event.target.value })}>
                <option value="">Elegir tarjeta</option>
                {app.creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Descripcion">
              <input className="field mt-2" value={paymentForm.description} onChange={(event) => setPaymentForm({ ...paymentForm, description: event.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monto">
                <input className="field mt-2" type="number" min="1" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} />
              </Field>
              <Field label="Fecha">
                <input className="field mt-2" type="date" value={paymentForm.date} onChange={(event) => setPaymentForm({ ...paymentForm, date: event.target.value })} />
              </Field>
            </div>
            {app.creditCards.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Primero crea una tarjeta.
              </p>
            ) : null}
            <Button icon={<Plus className="h-4 w-4" />} disabled={app.creditCards.length === 0}>
              Registrar pago
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function QuickActionTab({ icon, label, selected, onClick }: { icon: ReactNode; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold transition ${
        selected ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300'
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
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
