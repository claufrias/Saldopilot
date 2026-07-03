import { ChevronLeft, ChevronRight, CreditCard, CalendarClock, ReceiptText, Repeat, WalletCards, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MONTHS } from '../data/constants';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';
import {
  dateFromMonthKey,
  getCreditDueForMonth,
  getMovementsWithFinancialStart,
  getOperationalMovements,
} from '../utils/finance';
import { monthKey, toMonthKey } from '../utils/date';

type CalendarEventTone = 'rose' | 'amber' | 'emerald' | 'sky' | 'zinc';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  amount?: number;
  tone: CalendarEventTone;
  className?: string;
  amountClassName?: string;
  cashFlow: 'income' | 'expense' | 'neutral';
  kind: string;
}

const toneClasses: Record<CalendarEventTone, string> = {
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  zinc: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300',
};

export function FinancialCalendar() {
  const { movements, financialStart, creditCards, creditCardPayments, recurringExpenses } = useApp();
  const today = new Date();
  const [visibleDate, setVisibleDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth() + 1;
  const visibleMonthKey = monthKey(year, month);
  const operationalMovements = getOperationalMovements(movements, financialStart.date);
  const movementsWithStart = getMovementsWithFinancialStart(movements, financialStart);

  const events = useMemo(
    () =>
      buildCalendarEvents({
        monthKey: visibleMonthKey,
        movements: movementsWithStart,
        operationalMovements,
        creditCards,
        creditCardPayments,
        recurringExpenses,
      }),
    [creditCardPayments, creditCards, movementsWithStart, operationalMovements, recurringExpenses, visibleMonthKey],
  );

  const days = buildCalendarDays(year, month);
  const selectedDayEvents = selectedDay ? events.filter((event) => event.date === selectedDay) : [];

  function moveMonth(offset: number) {
    setVisibleDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Calendario financiero"
        description="Vencimientos, gastos fijos, pagos y movimientos importantes organizados por día."
        action={
          <div className="flex items-center gap-2">
            <button className="icon-button" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-40 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-bold text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-white">
              {MONTHS[month - 1]} {year}
            </div>
            <button className="icon-button" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-5">
        <Legend icon={<CreditCard className="h-4 w-4" />} label="Tarjetas" tone="amber" />
        <Legend icon={<Repeat className="h-4 w-4" />} label="Gastos fijos" tone="rose" />
        <Legend icon={<WalletCards className="h-4 w-4" />} label="Pagos" tone="emerald" />
        <Legend icon={<ReceiptText className="h-4 w-4" />} label="Movimientos" tone="sky" />
        <Legend icon={<CalendarClock className="h-4 w-4" />} label="Inicio" tone="zinc" />
      </section>

      <section className="space-y-3 md:hidden">
        {days
          .filter((day) => day.date.startsWith(visibleMonthKey))
          .map((day) => {
            const dayEvents = events.filter((event) => event.date === day.date);
            const isToday = day.date === today.toISOString().slice(0, 10);

            return (
              <button
                key={day.date}
                type="button"
                className={`panel w-full p-4 text-left transition active:scale-[0.99] ${isToday ? 'border-zinc-950 dark:border-white' : ''}`}
                onClick={() => setSelectedDay(day.date)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${isToday ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200'}`}>
                      <span className="text-xs font-bold uppercase">{shortWeekday(day.date)}</span>
                      <span className="text-lg font-extrabold leading-none">{Number(day.date.slice(-2))}</span>
                    </div>
                    <div>
                      <p className="font-bold text-zinc-950 dark:text-white">{formatMobileDay(dateToLocal(day.date))}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {dayEvents.length > 0 ? `${dayEvents.length} evento${dayEvents.length === 1 ? '' : 's'}` : 'Sin movimientos'}
                      </p>
                    </div>
                  </div>
                  {dayEvents.length > 0 ? (
                    <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
                      Ver
                    </span>
                  ) : null}
                </div>
                {dayEvents.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className={`rounded-lg px-3 py-2 text-sm font-semibold ${eventClassName(event)}`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate">{event.title}</span>
                          {event.amount ? <span className="shrink-0">{formatEventAmount(event)}</span> : null}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 ? <p className="px-1 text-sm font-medium text-zinc-400">+{dayEvents.length - 3} más</p> : null}
                  </div>
                ) : null}
              </button>
            );
          })}
      </section>

      <section className="panel hidden overflow-hidden md:block">
        <div className="grid grid-cols-7 border-b border-zinc-200/80 text-center text-xs font-bold uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="px-2 py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = events.filter((event) => event.date === day.date);
            const isCurrentMonth = day.date.startsWith(visibleMonthKey);
            const isToday = day.date === today.toISOString().slice(0, 10);

            return (
              <button
                key={day.date}
                type="button"
                className={`min-h-36 border-b border-r border-zinc-200/80 p-2 text-left transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-300 dark:border-white/10 dark:hover:bg-white/5 dark:focus:ring-white/20 ${isCurrentMonth ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/70 dark:bg-zinc-950'}`}
                onClick={() => setSelectedDay(day.date)}
                aria-label={`Ver movimientos del ${day.date}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold ${isToday ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {Number(day.date.slice(-2))}
                  </span>
                  {dayEvents.length > 0 ? <span className="text-xs font-semibold text-zinc-400">{dayEvents.length}</span> : null}
                </div>
                <div className="space-y-1.5">
                  {dayEvents.slice(0, 4).map((event) => (
                    <div key={event.id} className={`rounded-md px-2 py-1 text-[11px] font-semibold ${eventClassName(event)}`} title={event.title}>
                      <p className="truncate">{event.title}</p>
                      {event.amount ? <p className="truncate opacity-80">{formatEventAmount(event)}</p> : null}
                    </div>
                  ))}
                  {dayEvents.length > 4 ? <p className="px-1 text-xs text-zinc-400">+{dayEvents.length - 4} más</p> : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedDay ? (
        <DayModal
          date={selectedDay}
          events={selectedDayEvents}
          onClose={() => setSelectedDay(null)}
        />
      ) : null}
    </div>
  );
}

function DayModal({ date, events, onClose }: { date: string; events: CalendarEvent[]; onClose: () => void }) {
  const totalIncome = events.filter((event) => event.cashFlow === 'income').reduce((total, event) => total + (event.amount ?? 0), 0);
  const totalOut = events.filter((event) => event.cashFlow === 'expense').reduce((total, event) => total + (event.amount ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950">
        <div className="flex h-11 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <button className="h-3.5 w-3.5 rounded-full bg-rose-500" onClick={onClose} aria-label="Cerrar" />
            <span className="h-3.5 w-3.5 rounded-full bg-amber-400" />
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{formatLongDate(date)}</p>
          <button className="text-zinc-400 transition hover:text-zinc-950 dark:hover:text-white" onClick={onClose} aria-label="Cerrar ventana">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ModalStat label="Eventos" value={String(events.length)} />
            <ModalStat label="Entradas / pagos" value={formatCurrency(totalIncome)} />
            <ModalStat label="Salidas / vencimientos" value={formatCurrency(totalOut)} />
          </div>

          <div className="mt-5 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 p-3 dark:border-white/10">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-1 text-xs font-bold ${eventClassName(event)}`}>{eventLabel(event.kind)}</span>
                      <p className="font-semibold text-zinc-950 dark:text-white">{event.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{eventDescription(event)}</p>
                  </div>
                  {event.amount ? (
                    <p className={`shrink-0 text-sm font-bold ${event.amountClassName ?? (event.cashFlow === 'income' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}`}>
                      {event.cashFlow === 'income' ? '+' : '-'}
                      {formatCurrency(event.amount)}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-400 dark:border-white/10">
                No hay movimientos para este día.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-3 py-3 dark:border-white/10">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 font-bold text-zinc-950 dark:text-white">{value}</p>
    </div>
  );
}

function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function eventLabel(kind: string): string {
  const labels: Record<string, string> = {
    movement: 'Movimiento',
    payment: 'Pago',
    recurring: 'Gasto fijo',
    card: 'Tarjeta',
  };

  return labels[kind] ?? 'Evento';
}

function eventDescription(event: CalendarEvent): string {
  const descriptions: Record<string, string> = {
    movement: 'Movimiento registrado en el historial.',
    payment: 'Pago registrado para una tarjeta.',
    recurring: 'Gasto fijo esperado para este mes.',
    card: 'Vencimiento calculado según cierre, cuotas y pagos.',
  };

  return descriptions[event.kind] ?? 'Evento financiero.';
}

function Legend({ icon, label, tone }: { icon: ReactNode; label: string; tone: CalendarEventTone }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${toneClasses[tone]}`}>
      {icon}
      {label}
    </div>
  );
}

function eventClassName(event: CalendarEvent): string {
  return event.className ?? toneClasses[event.tone];
}

function formatEventAmount(event: CalendarEvent): string {
  const sign = event.cashFlow === 'income' ? '+' : event.cashFlow === 'expense' ? '-' : '';
  return `${sign}${formatCurrency(event.amount ?? 0)}`;
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return { date: date.toISOString().slice(0, 10) };
  });
}

function dateToLocal(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function shortWeekday(date: string): string {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
    .format(dateToLocal(date))
    .slice(0, 3)
    .toUpperCase();
}

function formatMobileDay(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date);
}

function buildCalendarEvents({
  monthKey: selectedMonthKey,
  movements,
  operationalMovements,
  creditCards,
  creditCardPayments,
  recurringExpenses,
}: {
  monthKey: string;
  movements: ReturnType<typeof getMovementsWithFinancialStart>;
  operationalMovements: ReturnType<typeof getOperationalMovements>;
  creditCards: ReturnType<typeof useApp>['creditCards'];
  creditCardPayments: ReturnType<typeof useApp>['creditCardPayments'];
  recurringExpenses: ReturnType<typeof useApp>['recurringExpenses'];
}): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  movements
    .filter((movement) => movement.date.startsWith(selectedMonthKey) && movement.movementKind !== 'credit_card_payment')
    .forEach((movement) => {
      events.push({
        id: `movement-${movement.id}`,
        date: movement.date,
        title: movement.movementKind === 'opening_balance' ? 'Saldo inicial' : movement.description,
        amount: movement.amount,
        tone: movement.type === 'income' ? 'emerald' : 'rose',
        amountClassName: movement.type === 'income' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300',
        cashFlow: movement.type,
        kind: 'movement',
      });
    });

  creditCardPayments
    .filter((payment) => payment.date.startsWith(selectedMonthKey))
    .forEach((payment) => {
      events.push({
        id: `payment-${payment.id}`,
        date: payment.date,
        title: payment.description,
        amount: payment.amount,
        tone: 'emerald',
        cashFlow: 'income',
        kind: 'payment',
      });
    });

  recurringExpenses
    .filter((expense) => expense.active && toMonthKey(expense.startDate) <= selectedMonthKey)
    .forEach((expense) => {
      const day = Number(expense.startDate.slice(-2));

      events.push({
        id: `recurring-${expense.id}`,
        date: dateFromMonthKey(selectedMonthKey, day),
        title: expense.description,
        amount: expense.amount,
        tone: 'rose',
        amountClassName: 'text-rose-600 dark:text-rose-300',
        cashFlow: 'expense',
        kind: 'recurring',
      });
    });

  creditCards
    .filter((card) => card.active)
    .forEach((card) => {
      const amount = getCreditDueForMonth(card, operationalMovements, creditCardPayments, selectedMonthKey);

      events.push({
        id: `card-due-${card.id}-${selectedMonthKey}`,
        date: dateFromMonthKey(selectedMonthKey, card.dueDay),
        title: `Vence ${card.name}`,
        amount,
        tone: 'amber',
        cashFlow: 'expense',
        kind: 'card',
      });
    });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
