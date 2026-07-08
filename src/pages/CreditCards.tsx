import { Check, CreditCardIcon, Edit3, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryBadge, getCategoryColorFor } from '../components/category/CategoryBadge';
import { getCardColor, getCardTextColor } from '../components/credit-cards/cardVisuals';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useApp } from '../context/AppContext';
import type { CreditCard, CreditCardPayment, Movement } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { getCreditCardCharges, getCreditCardSummary, getInstallmentAmount, getInstallmentCount, getOperationalMovements } from '../utils/finance';

const cardColors = [
  { value: 'slate', label: 'Grafito', className: 'from-slate-950 to-slate-700', textClassName: 'text-white' },
  { value: 'emerald', label: 'Esmeralda', className: 'from-emerald-700 to-teal-500', textClassName: 'text-white' },
  { value: 'sky', label: 'Atlántico', className: 'from-sky-800 to-cyan-500', textClassName: 'text-white' },
  { value: 'rose', label: 'Rubí', className: 'from-rose-800 to-pink-500', textClassName: 'text-white' },
  { value: 'amber', label: 'Dorado', className: 'from-amber-700 to-yellow-500', textClassName: 'text-white' },
  { value: 'obsidian', label: 'Obsidiana', className: 'from-zinc-950 via-neutral-900 to-stone-800', textClassName: 'text-white' },
  { value: 'platinum', label: 'Platino', className: 'from-zinc-200 via-white to-zinc-400', textClassName: 'text-zinc-950' },
  { value: 'champagne', label: 'Champagne', className: 'from-yellow-100 via-amber-200 to-stone-300', textClassName: 'text-zinc-950' },
  { value: 'sapphire', label: 'Zafiro', className: 'from-blue-950 via-blue-700 to-cyan-500', textClassName: 'text-white' },
  { value: 'amethyst', label: 'Amatista', className: 'from-purple-950 via-violet-700 to-fuchsia-500', textClassName: 'text-white' },
];

const emptyCard = {
  name: '',
  issuer: '',
  lastFour: '',
  limit: '',
  closingDay: 25,
  dueDay: 10,
  color: 'slate',
  active: true,
};

const emptyPayment = {
  creditCardId: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  amount: '',
};

export function CreditCards() {
  const {
    creditCards,
    creditCardPayments,
    movements,
    financialStart,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addCreditCardPayment,
    updateCreditCardPayment,
    deleteCreditCardPayment,
  } = useApp();
  const navigate = useNavigate();
  const [cardForm, setCardForm] = useState(emptyCard);
  const operationalMovements = getOperationalMovements(movements, financialStart.date);
  const operationalPayments = creditCardPayments.filter((payment) => payment.date >= financialStart.date);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState('');
  const selectedCard = creditCards.find((card) => card.id === selectedCardId) ?? creditCards[0];
  const [showMobileCardForm, setShowMobileCardForm] = useState(false);
  const [showMobilePaymentForm, setShowMobilePaymentForm] = useState(false);
  const [mobileActivityTab, setMobileActivityTab] = useState<'charges' | 'payments'>('charges');

  useEffect(() => {
    if (!selectedCardId && creditCards[0]) {
      setSelectedCardId(creditCards[0].id);
    }

    if (selectedCardId && !creditCards.some((card) => card.id === selectedCardId)) {
      setSelectedCardId(creditCards[0]?.id ?? '');
    }
  }, [creditCards, selectedCardId]);

  function submitCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      name: cardForm.name.trim(),
      issuer: cardForm.issuer.trim(),
      lastFour: cardForm.lastFour.trim().slice(-4),
      limit: Number(cardForm.limit),
      closingDay: Number(cardForm.closingDay),
      dueDay: Number(cardForm.dueDay),
      color: cardForm.color,
      active: cardForm.active,
    };

    if (!payload.name || payload.limit < 0 || payload.closingDay < 1 || payload.closingDay > 31 || payload.dueDay < 1 || payload.dueDay > 31) {
      return;
    }

    if (editingCardId) {
      updateCreditCard({ ...payload, id: editingCardId });
    } else {
      addCreditCard(payload);
    }

    setEditingCardId(null);
    setCardForm(emptyCard);
    setShowMobileCardForm(false);
  }

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cardId = paymentForm.creditCardId || selectedCard?.id || creditCards[0]?.id;
    const payload = {
      creditCardId: cardId,
      description: paymentForm.description.trim() || `Pago tarjeta ${creditCards.find((card) => card.id === cardId)?.name ?? ''}`.trim(),
      date: paymentForm.date,
      amount: Number(paymentForm.amount),
    };

    if (!payload.creditCardId || payload.amount <= 0) {
      return;
    }

    if (editingPaymentId) {
      const existing = creditCardPayments.find((payment) => payment.id === editingPaymentId);

      if (existing) {
        updateCreditCardPayment({ ...payload, id: existing.id, movementId: existing.movementId });
      }
    } else {
      addCreditCardPayment(payload);
    }

    setEditingPaymentId(null);
    setPaymentForm({ ...emptyPayment, creditCardId: cardId });
    setShowMobilePaymentForm(false);
  }

  function editCard(card: CreditCard) {
    setEditingCardId(card.id);
    setCardForm({
      name: card.name,
      issuer: card.issuer,
      lastFour: card.lastFour,
      limit: String(card.limit),
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      color: card.color,
      active: card.active,
    });
    setShowMobileCardForm(true);
  }

  function editPayment(payment: CreditCardPayment) {
    setEditingPaymentId(payment.id);
    setSelectedCardId(payment.creditCardId);
    setPaymentForm({
      creditCardId: payment.creditCardId,
      description: payment.description,
      date: payment.date,
      amount: String(payment.amount),
    });
    setShowMobilePaymentForm(true);
  }

  const selectedSummary = selectedCard ? getCreditCardSummary(selectedCard, operationalMovements, operationalPayments) : null;
  const selectedPayments = selectedCard
    ? operationalPayments
        .filter((payment) => payment.creditCardId === selectedCard.id)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8)
    : [];
  const selectedCharges = selectedCard
    ? getCreditCardCharges(operationalMovements, selectedCard.id)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8)
    : [];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Tarjetas de crédito"
        description="Anota consumos con tarjeta, pagos realizados y el dinero comprometido para próximos vencimientos."
        action={
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <Button type="button" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/tarjetas/nueva')}>
              Tarjeta
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={<CreditCardIcon className="h-4 w-4" />}
              disabled={!selectedCard}
              onClick={() => {
                if (selectedCard) {
                  setPaymentForm((current) => ({ ...current, creditCardId: selectedCard.id }));
                }
                setShowMobilePaymentForm(true);
              }}
            >
              Pago
            </Button>
          </div>
        }
      />

      <div className="hidden justify-end md:flex">
        <Button type="button" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/tarjetas/nueva')}>
          Crear tarjeta
        </Button>
      </div>

      {editingCardId ? (
      <section>
        <form className="panel hidden gap-4 p-5 md:grid md:grid-cols-4" onSubmit={submitCard}>
          <div className="md:col-span-4">
            <p className="label">{editingCardId ? 'Editar tarjeta' : 'Crear nueva tarjeta'}</p>
          </div>
          <div>
            <label className="label">Nombre</label>
            <input className="field mt-2" value={cardForm.name} onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })} />
          </div>
          <div>
            <label className="label">Banco</label>
            <input className="field mt-2" value={cardForm.issuer} onChange={(event) => setCardForm({ ...cardForm, issuer: event.target.value })} />
          </div>
          <div>
            <label className="label">Últimos 4</label>
            <input className="field mt-2" maxLength={4} value={cardForm.lastFour} onChange={(event) => setCardForm({ ...cardForm, lastFour: event.target.value.replace(/\D/g, '') })} />
          </div>
          <div>
            <label className="label">Límite</label>
            <input className="field mt-2" type="number" min="0" value={cardForm.limit} onChange={(event) => setCardForm({ ...cardForm, limit: event.target.value })} />
          </div>
          <div>
            <label className="label">Cierre</label>
            <input className="field mt-2" type="number" min="1" max="31" value={cardForm.closingDay} onChange={(event) => setCardForm({ ...cardForm, closingDay: Number(event.target.value) })} />
          </div>
          <div>
            <label className="label">Vencimiento</label>
            <input className="field mt-2" type="number" min="1" max="31" value={cardForm.dueDay} onChange={(event) => setCardForm({ ...cardForm, dueDay: Number(event.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Color</label>
            <CardColorPicker value={cardForm.color} onChange={(color) => setCardForm({ ...cardForm, color })} />
          </div>
          <label className="flex items-end gap-3 pb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            <input className="h-4 w-4 accent-zinc-950" type="checkbox" checked={cardForm.active} onChange={(event) => setCardForm({ ...cardForm, active: event.target.checked })} />
            Activa
          </label>
          <div className="flex gap-3 md:col-span-4">
            <Button icon={<Plus className="h-4 w-4" />}>{editingCardId ? 'Guardar tarjeta' : 'Agregar tarjeta'}</Button>
            {editingCardId ? (
              <Button type="button" variant="secondary" onClick={() => { setEditingCardId(null); setCardForm(emptyCard); }}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </section>
      ) : null}

      {showMobileCardForm ? (
        <div className="fixed inset-0 z-40 flex items-end bg-zinc-950/45 px-3 pb-3 backdrop-blur-sm md:hidden" role="dialog" aria-modal="true">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-zinc-950">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-white/20" />
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="label">{editingCardId ? 'Editar' : 'Nueva'}</p>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">{editingCardId ? 'Editar tarjeta' : 'Agregar tarjeta'}</h2>
              </div>
              <button
                className="icon-button h-9 w-9"
                type="button"
                onClick={() => {
                  setShowMobileCardForm(false);
                  setEditingCardId(null);
                  setCardForm(emptyCard);
                }}
                aria-label="Cerrar formulario de tarjeta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="grid gap-4" onSubmit={submitCard}>
              <div>
                <label className="label">Nombre</label>
                <input className="field mt-2" value={cardForm.name} onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Banco</label>
                  <input className="field mt-2" value={cardForm.issuer} onChange={(event) => setCardForm({ ...cardForm, issuer: event.target.value })} />
                </div>
                <div>
                  <label className="label">Últimos 4</label>
                  <input className="field mt-2" maxLength={4} value={cardForm.lastFour} onChange={(event) => setCardForm({ ...cardForm, lastFour: event.target.value.replace(/\D/g, '') })} />
                </div>
              </div>
              <div>
                <label className="label">Límite</label>
                <input className="field mt-2" type="number" min="0" value={cardForm.limit} onChange={(event) => setCardForm({ ...cardForm, limit: event.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cierre</label>
                  <input className="field mt-2" type="number" min="1" max="31" value={cardForm.closingDay} onChange={(event) => setCardForm({ ...cardForm, closingDay: Number(event.target.value) })} />
                </div>
                <div>
                  <label className="label">Vencimiento</label>
                  <input className="field mt-2" type="number" min="1" max="31" value={cardForm.dueDay} onChange={(event) => setCardForm({ ...cardForm, dueDay: Number(event.target.value) })} />
                </div>
              </div>
              <div>
                <label className="label">Color</label>
                <CardColorPicker value={cardForm.color} onChange={(color) => setCardForm({ ...cardForm, color })} compact />
              </div>
              <label className="flex items-center justify-between rounded-lg border border-zinc-200/80 px-3 py-3 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:text-zinc-200">
                Activa
                <input className="h-5 w-5 accent-zinc-950" type="checkbox" checked={cardForm.active} onChange={(event) => setCardForm({ ...cardForm, active: event.target.checked })} />
              </label>
              <Button icon={<Plus className="h-4 w-4" />}>{editingCardId ? 'Guardar tarjeta' : 'Agregar tarjeta'}</Button>
            </form>
          </div>
        </div>
      ) : null}

      {showMobilePaymentForm && selectedCard ? (
        <div className="fixed inset-0 z-40 flex items-end bg-zinc-950/45 px-3 pb-3 backdrop-blur-sm md:hidden" role="dialog" aria-modal="true">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-zinc-950">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-white/20" />
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="label">{editingPaymentId ? 'Editar' : 'Nuevo'}</p>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">{editingPaymentId ? 'Editar pago' : `Pago de ${selectedCard.name}`}</h2>
              </div>
              <button
                className="icon-button h-9 w-9"
                type="button"
                onClick={() => {
                  setShowMobilePaymentForm(false);
                  setEditingPaymentId(null);
                  setPaymentForm({ ...emptyPayment, creditCardId: selectedCard.id });
                }}
                aria-label="Cerrar formulario de pago"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="grid gap-4" onSubmit={submitPayment}>
              <div>
                <label className="label">Descripción</label>
                <input className="field mt-2" value={paymentForm.description} onChange={(event) => setPaymentForm({ ...paymentForm, description: event.target.value, creditCardId: selectedCard.id })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fecha</label>
                  <input className="field mt-2" type="date" value={paymentForm.date} onChange={(event) => setPaymentForm({ ...paymentForm, date: event.target.value, creditCardId: selectedCard.id })} />
                </div>
                <div>
                  <label className="label">Monto</label>
                  <input className="field mt-2" type="number" min="1" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value, creditCardId: selectedCard.id })} />
                </div>
              </div>
              <Button icon={<Plus className="h-4 w-4" />}>{editingPaymentId ? 'Guardar pago' : 'Anotar pago'}</Button>
            </form>
          </div>
        </div>
      ) : null}

      <section className="panel overflow-hidden">
        <div className="border-b border-zinc-200/80 p-5 dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="label">Mis tarjetas</p>
              <h2 className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">
                {selectedCard ? selectedCard.name : 'Sin tarjetas'}
              </h2>
            </div>
            {creditCards.length > 0 ? (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                {creditCards.map((card) => {
                  const usage = Math.min(getCreditCardSummary(card, operationalMovements, operationalPayments).usedLimit, 100);
                  const selected = selectedCard?.id === card.id;

                  return (
                    <button
                      key={card.id}
                      className={`relative inline-flex min-h-[3.25rem] min-w-[9.5rem] shrink-0 items-center gap-2 overflow-hidden rounded-lg border px-3 text-sm font-semibold transition md:min-h-11 md:min-w-0 ${
                        selected
                          ? 'border-zinc-950 text-zinc-950 ring-2 ring-zinc-950/10 dark:border-white dark:text-white dark:ring-white/15'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white'
                      }`}
                      onClick={() => {
                        setSelectedCardId(card.id);
                        setPaymentForm((current) => ({ ...current, creditCardId: card.id }));
                      }}
                      title={`${card.name}: ${usage}% del límite usado`}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getCardColor(card.color)} opacity-20 transition-all dark:opacity-30`}
                        style={{ width: `${usage}%` }}
                      />
                      <span className={`relative h-2.5 w-2.5 rounded-full bg-gradient-to-br ${getCardColor(card.color)}`} />
                      <span className="relative">{card.name}</span>
                      <span className="relative rounded-md bg-white/70 px-1.5 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-300">
                        {usage}%
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {selectedCard && selectedSummary ? (
          <div className="grid gap-0">
            <div className="grid gap-0 xl:grid-cols-[360px_1fr]">
                <div className={`relative min-h-56 bg-gradient-to-br ${getCardColor(selectedCard.color)} ${getCardTextColor(selectedCard.color)} p-5 md:min-h-72 md:p-6`}>
                  <div className="flex h-full min-h-48 flex-col justify-between md:min-h-60">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium opacity-75">{selectedCard.issuer || 'Sin banco'}</p>
                        <h2 className="mt-2 truncate text-2xl font-bold">{selectedCard.name}</h2>
                      </div>
                      <CreditCardIcon className="h-8 w-8 shrink-0 opacity-80" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold tracking-[0.32em]">•••• {selectedCard.lastFour || '0000'}</p>
                      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="opacity-70">Cierre</p>
                          <p className="font-bold">Día {selectedCard.closingDay}</p>
                        </div>
                        <div>
                          <p className="opacity-70">Vence</p>
                          <p className="font-bold">Día {selectedCard.dueDay}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px bg-white/20" />
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="label">Resumen</p>
                      <h3 className="mt-2 text-xl font-bold text-zinc-950 dark:text-white">{formatCurrency(selectedSummary.pending)}</h3>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">pendiente anotado</p>
                    </div>
                    <div className="hidden gap-2 md:flex">
                      <button className="icon-button" onClick={() => editCard(selectedCard)} aria-label="Editar tarjeta">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="icon-button" onClick={() => deleteCreditCard(selectedCard.id)} aria-label="Eliminar tarjeta">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <CardStat label="Pendiente" value={formatCurrency(selectedSummary.pending)} />
                    <CardStat label="Pagos" value={formatCurrency(selectedSummary.totalPayments)} />
                    <CardStat label="Próximo mes" value={formatCurrency(selectedSummary.dueNextMonth)} />
                    <CardStat label="Cuotas pendientes" value={String(selectedSummary.pendingInstallments)} />
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-zinc-600 dark:text-zinc-300">Límite utilizado</span>
                      <span className="font-bold text-zinc-950 dark:text-white">{selectedSummary.usedLimit}%</span>
                    </div>
                    <ProgressBar value={Math.min(selectedSummary.usedLimit, 100)} tone={selectedSummary.usedLimit > 90 ? 'rose' : selectedSummary.usedLimit > 70 ? 'amber' : 'sky'} />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 md:hidden">
                    <Button
                      type="button"
                      className="px-2"
                      icon={<Plus className="h-4 w-4" />}
                      onClick={() => {
                        setPaymentForm((current) => ({ ...current, creditCardId: selectedCard.id }));
                        setShowMobilePaymentForm(true);
                      }}
                    >
                      Pagar
                    </Button>
                    <Button type="button" className="px-2" variant="secondary" icon={<Edit3 className="h-4 w-4" />} onClick={() => editCard(selectedCard)}>
                      Editar
                    </Button>
                    <Button type="button" className="px-2" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => deleteCreditCard(selectedCard.id)}>
                      Borrar
                    </Button>
                  </div>
                </div>
              </div>

            <div className="grid gap-6 border-t border-zinc-200/80 p-4 dark:border-white/10 sm:p-5 lg:grid-cols-[0.8fr_1.2fr]">
              <form className="hidden rounded-lg border border-zinc-200/80 p-4 dark:border-white/10 md:block" onSubmit={submitPayment}>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  {editingPaymentId ? 'Editar pago' : `Registrar pago de ${selectedCard.name}`}
                </h3>
                <div className="mt-4 space-y-4">
                  <input type="hidden" value={selectedCard.id} />
                  <div>
                    <label className="label">Descripción</label>
                    <input className="field mt-2" value={paymentForm.description} onChange={(event) => setPaymentForm({ ...paymentForm, description: event.target.value, creditCardId: selectedCard.id })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Fecha</label>
                      <input className="field mt-2" type="date" value={paymentForm.date} onChange={(event) => setPaymentForm({ ...paymentForm, date: event.target.value, creditCardId: selectedCard.id })} />
                    </div>
                    <div>
                      <label className="label">Monto</label>
                      <input className="field mt-2" type="number" min="1" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value, creditCardId: selectedCard.id })} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button icon={<Plus className="h-4 w-4" />}>{editingPaymentId ? 'Guardar pago' : 'Anotar pago'}</Button>
                    {editingPaymentId ? (
                      <Button type="button" variant="secondary" onClick={() => { setEditingPaymentId(null); setPaymentForm({ ...emptyPayment, creditCardId: selectedCard.id }); }}>
                        Cancelar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </form>

              <div className="md:hidden">
                <div className="mb-4 grid grid-cols-2 rounded-lg bg-zinc-100 p-1 dark:bg-white/10">
                  <button
                    type="button"
                    className={`h-10 rounded-md text-sm font-bold transition ${
                      mobileActivityTab === 'charges'
                        ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-300'
                    }`}
                    onClick={() => setMobileActivityTab('charges')}
                  >
                    Consumos
                  </button>
                  <button
                    type="button"
                    className={`h-10 rounded-md text-sm font-bold transition ${
                      mobileActivityTab === 'payments'
                        ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-300'
                    }`}
                    onClick={() => setMobileActivityTab('payments')}
                  >
                    Pagos
                  </button>
                </div>
                {mobileActivityTab === 'charges' ? (
                  <ActivityList title="Consumos" count={selectedCharges.length}>
                    {selectedCharges.map((charge) => (
                      <ChargeRow key={charge.id} charge={charge} />
                    ))}
                  </ActivityList>
                ) : (
                  <ActivityList title="Pagos" count={selectedPayments.length}>
                    {selectedPayments.map((payment) => (
                      <PaymentRow
                        key={payment.id}
                        payment={payment}
                        onEdit={() => editPayment(payment)}
                        onDelete={() => deleteCreditCardPayment(payment.id)}
                      />
                    ))}
                  </ActivityList>
                )}
              </div>

              <div className="hidden gap-6 md:grid md:grid-cols-2">
                <ActivityList title="Consumos" count={selectedCharges.length}>
                  {selectedCharges.map((charge) => (
                    <ChargeRow key={charge.id} charge={charge} />
                  ))}
                </ActivityList>
                <ActivityList title="Pagos" count={selectedPayments.length}>
                  {selectedPayments.map((payment) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      onEdit={() => editPayment(payment)}
                      onDelete={() => deleteCreditCardPayment(payment.id)}
                    />
                  ))}
                </ActivityList>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-zinc-950 dark:text-white">Todavía no hay tarjetas creadas</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Crea una tarjeta para registrar consumos, pagos y próximos vencimientos.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white dark:bg-white dark:text-zinc-950"
              onClick={() => navigate('/tarjetas/nueva')}
            >
              Crear tarjeta
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function CardColorPicker({ value, onChange, compact = false }: { value: string; onChange: (value: string) => void; compact?: boolean }) {
  return (
    <div className={`mt-2 grid grid-cols-2 gap-2 ${compact ? '' : 'sm:grid-cols-5'}`}>
      {cardColors.map((color) => {
        const selected = value === color.value;

        return (
          <button
            key={color.value}
            type="button"
            className={`group relative flex ${compact ? 'h-12' : 'h-14'} items-end overflow-hidden rounded-lg bg-gradient-to-br p-2 text-left shadow-sm ring-1 transition ${color.className} ${color.textClassName} ${
              selected ? 'ring-2 ring-zinc-950 dark:ring-white' : 'ring-black/10 hover:scale-[1.02]'
            }`}
            onClick={() => onChange(color.value)}
            aria-label={`Elegir color ${color.label}`}
          >
            <span className="truncate text-[11px] font-bold leading-none drop-shadow-sm">{color.label}</span>
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

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200/80 px-3 py-3 dark:border-white/10">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 font-bold text-zinc-950 dark:text-white">{value}</p>
    </div>
  );
}

function ActivityList({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="min-w-0 border-t border-zinc-200/80 pt-4 dark:border-white/10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{title}</h3>
        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
          {count}
        </span>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {count > 0 ? children : <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-400 dark:border-white/10">Sin registros.</p>}
      </div>
    </div>
  );
}

function ChargeRow({ charge }: { charge: Movement }) {
  const { categories } = useApp();
  const categoryTone = getCategoryColorFor(categories, charge.category);
  const installments = getInstallmentCount(charge);

  return (
    <div className={`grid grid-cols-[1fr_auto] gap-3 rounded-lg border px-3 py-2.5 ${categoryTone.border} ${categoryTone.soft}`}>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{charge.description}</p>
          <CategoryBadge category={charge.category} compact />
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {formatDateTime(charge.date, charge.time)}
          {installments > 1 ? ` · ${installments} cuotas de ${formatCurrency(getInstallmentAmount(charge))}` : ''}
        </p>
      </div>
      <p className="self-center text-sm font-bold text-rose-600 dark:text-rose-300">{formatCurrency(charge.amount)}</p>
    </div>
  );
}

function PaymentRow({
  payment,
  onEdit,
  onDelete,
}: {
  payment: CreditCardPayment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-white/5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{payment.description}</p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{formatDate(payment.date)}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-emerald-600">{formatCurrency(payment.amount)}</span>
        <button className="text-zinc-400 hover:text-zinc-950 dark:hover:text-white" onClick={onEdit} aria-label="Editar pago">
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button className="text-zinc-400 hover:text-rose-600" onClick={onDelete} aria-label="Eliminar pago">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
