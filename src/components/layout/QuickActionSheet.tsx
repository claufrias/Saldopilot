import { CalendarClock, CreditCard, Plus, ReceiptText, WalletCards, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import type { ReactNode } from 'react';
import { CategoryPicker } from '../category/CategoryPicker';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import type { Category, MovementType, PaymentMethod } from '../../types';

type QuickActionKind = 'movement' | 'recurring' | 'card' | 'payment';

const now = () => new Date();

function dateToday() {
  return now().toISOString().slice(0, 10);
}

function timeNow() {
  return now().toTimeString().slice(0, 5);
}

function createMovementForm() {
  return {
    type: 'expense' as MovementType,
    category: 'Comida' as Category,
    description: '',
    amount: '',
    date: dateToday(),
    time: timeNow(),
    paymentMethod: 'cash' as PaymentMethod,
    creditCardId: '',
    installments: 1,
  };
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
  const [kind, setKind] = useState<QuickActionKind>('movement');
  const [movementForm, setMovementForm] = useState(createMovementForm);
  const [recurringForm, setRecurringForm] = useState(createRecurringForm);
  const [cardForm, setCardForm] = useState(createCardForm);
  const [paymentForm, setPaymentForm] = useState(createPaymentForm);

  if (!open) {
    return null;
  }

  function finish() {
    setMovementForm(createMovementForm());
    setRecurringForm(createRecurringForm());
    setCardForm(createCardForm());
    setPaymentForm(createPaymentForm());
    onClose();
  }

  function submitMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(movementForm.amount);

    if (!movementForm.description.trim() || amount <= 0) {
      return;
    }

    app.addMovement({
      type: movementForm.type,
      category: movementForm.category,
      description: movementForm.description.trim(),
      date: movementForm.date,
      time: movementForm.time,
      amount,
      paymentMethod: movementForm.type === 'expense' ? movementForm.paymentMethod : 'cash',
      creditCardId: movementForm.type === 'expense' && movementForm.paymentMethod === 'credit' ? movementForm.creditCardId : undefined,
      installments: movementForm.type === 'expense' && movementForm.paymentMethod === 'credit' ? Number(movementForm.installments) : undefined,
    });
    finish();
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
            <p className="label">Acción rápida</p>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Agregar</h2>
          </div>
          <button className="icon-button h-9 w-9" onClick={onClose} type="button" aria-label="Cerrar acción rápida">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <QuickActionTab icon={<ReceiptText className="h-4 w-4" />} label="Mov." selected={kind === 'movement'} onClick={() => setKind('movement')} />
          <QuickActionTab icon={<CalendarClock className="h-4 w-4" />} label="Fijo" selected={kind === 'recurring'} onClick={() => setKind('recurring')} />
          <QuickActionTab icon={<CreditCard className="h-4 w-4" />} label="Tarjeta" selected={kind === 'card'} onClick={() => setKind('card')} />
          <QuickActionTab icon={<WalletCards className="h-4 w-4" />} label="Pago" selected={kind === 'payment'} onClick={() => setKind('payment')} />
        </div>

        {kind === 'movement' ? (
          <form className="mt-4 grid gap-4" onSubmit={submitMovement}>
            <SegmentedType value={movementForm.type} onChange={(type) => setMovementForm({ ...movementForm, type, paymentMethod: type === 'income' ? 'cash' : movementForm.paymentMethod })} />
            <Field label="Categoria">
              <CategoryPicker value={movementForm.category} onChange={(category) => setMovementForm({ ...movementForm, category })} />
            </Field>
            <Field label="Descripcion">
              <input className="field mt-2" value={movementForm.description} onChange={(event) => setMovementForm({ ...movementForm, description: event.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monto">
                <input className="field mt-2" type="number" min="1" value={movementForm.amount} onChange={(event) => setMovementForm({ ...movementForm, amount: event.target.value })} />
              </Field>
              <Field label="Fecha">
                <input className="field mt-2" type="date" value={movementForm.date} onChange={(event) => setMovementForm({ ...movementForm, date: event.target.value })} />
              </Field>
            </div>
            {movementForm.type === 'expense' ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pago">
                  <select className="field mt-2" value={movementForm.paymentMethod} onChange={(event) => setMovementForm({ ...movementForm, paymentMethod: event.target.value as PaymentMethod, creditCardId: '' })}>
                    <option value="cash">Efectivo / Débito</option>
                    <option value="credit">Tarjeta</option>
                  </select>
                </Field>
                <Field label="Tarjeta">
                  <select className="field mt-2" value={movementForm.creditCardId} disabled={movementForm.paymentMethod !== 'credit'} onChange={(event) => setMovementForm({ ...movementForm, creditCardId: event.target.value })}>
                    <option value="">Sin tarjeta</option>
                    {app.creditCards.map((card) => (
                      <option key={card.id} value={card.id}>{card.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
            ) : null}
            <Button icon={<Plus className="h-4 w-4" />}>Crear movimiento</Button>
          </form>
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
              <Field label="Últimos 4">
                <input className="field mt-2" maxLength={4} value={cardForm.lastFour} onChange={(event) => setCardForm({ ...cardForm, lastFour: event.target.value.replace(/\D/g, '') })} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Límite">
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
                  <option key={card.id} value={card.id}>{card.name}</option>
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
            <Button icon={<Plus className="h-4 w-4" />} disabled={app.creditCards.length === 0}>Registrar pago</Button>
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

function SegmentedType({ value, onChange }: { value: MovementType; onChange: (type: MovementType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-white/10">
      {(['expense', 'income'] as MovementType[]).map((type) => (
        <button
          key={type}
          type="button"
          className={`min-h-10 rounded-md text-sm font-bold transition ${
            value === type ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white' : 'text-zinc-500 dark:text-zinc-300'
          }`}
          onClick={() => onChange(type)}
        >
          {type === 'expense' ? 'Gasto' : 'Ingreso'}
        </button>
      ))}
    </div>
  );
}
