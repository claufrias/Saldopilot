import { ChevronLeft, ChevronRight, CreditCard, CalendarClock, ReceiptText, Repeat, WalletCards, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
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
  const todayKey = today.toISOString().slice(0, 10);
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
  const mobileDays = days.filter((day) => day.date.startsWith(visibleMonthKey));
  const agendaDays = mobileDays
    .map((day) => ({ ...day, events: events.filter((event) => event.date === day.date) }))
    .filter((day) => day.events.length > 0);
  const selectedDayEvents = selectedDay ? events.filter((event) => event.date === selectedDay) : [];
  const monthIncome = events.filter((event) => event.cashFlow === 'income').reduce((total, event) => total + (event.amount ?? 0), 0);
  const monthOut = events.filter((event) => event.cashFlow === 'expense').reduce((total, event) => total + (event.amount ?? 0), 0);

  function moveMonth(offset: number) {
    setSelectedDay(null);
    setVisibleDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <SectionHeader
        title="Calendario financiero"
        description="Vencimientos, gastos fijos, pagos y movimientos importantes organizados por dia."
        action={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button className="icon-button h-10 w-10" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-bold text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-white sm:min-w-40">
              {MONTHS[month - 1]} {year}
            </div>
            <button className="icon-button h-10 w-10" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-3 gap-2 md:hidden">
        <MobileSummary label="Eventos" value={String(events.length)} tone="zinc" />
        <MobileSummary label="Entradas" value={formatCurrency(monthIncome)} tone="emerald" />
        <MobileSummary label="Salidas" value={formatCurrency(monthOut)} tone="rose" />
      </section>

      <section className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        <Legend icon={<CreditCard className="h-4 w-4" />} label="Tarjetas" tone="amber" compact />
        <Legend icon={<Repeat className="h-4 w-4" />} label="Fijos" tone="rose" compact />
        <Legend icon={<WalletCards className="h-4 w-4" />} label="Pagos" tone="emerald" compact />
        <Legend icon={<ReceiptText className="h-4 w-4" />} label="Movimientos" tone="sky" compact />
        <Legend icon={<CalendarClock className="h-4 w-4" />} label="Inicio" tone="zinc" compact />
      </section>

      <section className="hidden gap-3 md:grid md:grid-cols-5">
        <Legend icon={<CreditCard className="h-4 w-4" />} label="Tarjetas" tone="amber" />
        <Legend icon={<Repeat className="h-4 w-4" />} label="Gastos fijos" tone="rose" />
        <Legend icon={<WalletCards className="h-4 w-4" />} label="Pagos" tone="emerald" />
        <Legend icon={<ReceiptText className="h-4 w-4" />} label="Movimientos" tone="sky" />
        <Legend icon={<CalendarClock className="h-4 w-4" />} label="Inicio" tone="zinc" />
      </section>

      <section className="space-y-4 md:hidden">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {mobileDays.map((day) => {
            const dayEvents = events.filter((event) => event.date === day.date);
            const isToday = day.date === todayKey;
            const isSelected = selectedDay === day.date;

            return (
              <button
                key={day.date}
                type="button"
                className={`flex min-h-20 min-w-14 flex-col items-center justify-center rounded-lg border px-2 text-center transition active:scale-95 ${
                  isSelected
                    ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                    : isToday
                      ? 'border-zinc-950 bg-white text-zinc-950 dark:border-white dark:bg-zinc-900 dark:text-white'
                      : 'border-zinc-200 bg-white text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300'
                }`}
                onClick={() => setSelectedDay(day.date)}
                aria-label={`Ver eventos del ${day.date}`}
              >
                <span className="text-[10px] font-bold uppercase">{shortWeekday(day.date)}</span>
                <span className="mt-1 text-lg font-extrabold leading-none">{Number(day.date.slice(-2))}</span>
                <span className={`mt-2 h-1.5 w-1.5 rounded-full ${dayEvents.length > 0 ? 'bg-current' : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-950 dark:text-white">Agenda del mes</h2>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
              {agendaDays.length} dias
            </span>
          </div>

          {agendaDays.length > 0 ? (
            agendaDays.map((day) => (
              <button
                key={day.date}
                type="button"
                className={`panel w-full p-3.5 text-left transition active:scale-[0.99] ${day.date === todayKey ? 'border-zinc-950 dark:border-white' : ''}`}
                onClick={() => setSelectedDay(day.date)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${day.date === todayKey ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200'}`}>
                    <span className="text-xs font-bold uppercase">{shortWeekday(day.date)}</span>
                    <span className="text-lg font-extrabold leading-none">{Number(day.date.slice(-2))}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-950 dark:text-white">{formatMobileDay(dateToLocal(day.date))}</p>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          {day.events.length} evento{day.events.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <DayNet events={day.events} />
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {day.events.slice(0, 2).map((event) => (
                        <EventPill key={event.id} event={event} />
                      ))}
                      {day.events.length > 2 ? (
                        <p className="px-1 text-xs font-semibold text-zinc-400">+{day.events.length - 2} mas</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="panel px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No hay eventos cargados para este mes.
            </div>
          )}
        </div>
      </section>

      <section className="panel hidden overflow-hidden md:block">
        <div className="grid grid-cols-7 border-b border-zinc-200/80 text-center text-xs font-bold uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => (
            <div key={day} className="px-2 py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = events.filter((event) => event.date === day.date);
            const isCurrentMonth = day.date.startsWith(visibleMonthKey);
            const isToday = day.date === todayKey;

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
                  {dayEvents.length > 4 ? <p className="px-1 text-xs text-zinc-400">+{dayEvents.length - 4} mas</p> : null}
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
    <div className="fixed inset-0 z-50 flex items-end bg-zinc-950/45 p-3 backdrop-blur-sm md:items-center md:justify-center md:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[88vh] w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950 md:max-w-2xl md:rounded-xl">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-white/20 md:hidden" />
        <div className="flex min-h-14 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 dark:border-white/10 dark:bg-zinc-900">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Detalle del dia</p>
            <p className="truncate text-sm font-bold text-zinc-700 dark:text-zinc-200">{formatLongDate(date)}</p>
          </div>
          <button className="icon-button h-9 w-9" onClick={onClose} aria-label="Cerrar ventana">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-5">
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <ModalStat label="Eventos" value={String(events.length)} />
            <ModalStat label="Entradas" value={formatCurrency(totalIncome)} tone="emerald" />
            <ModalStat label="Salidas" value={formatCurrency(totalOut)} tone="rose" />
          </div>

          <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1 md:mt-5 md:space-y-3">
            {events.length > 0 ? (
              events.map((event) => (
                <EventDetail key={event.id} event={event} />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-400 dark:border-white/10">
                No hay movimientos para este dia.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSummary({ label, value, tone }: { label: string; value: string; tone: 'zinc' | 'emerald' | 'rose' }) {
  const classes = {
    zinc: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  };

  return (
    <div className={`rounded-lg px-3 py-3 ${classes[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold">{value}</p>
    </div>
  );
}

function DayNet({ events }: { events: CalendarEvent[] }) {
  const total = events.reduce((sum, event) => {
    if (!event.amount || event.cashFlow === 'neutral') {
      return sum;
    }

    return sum + (event.cashFlow === 'income' ? event.amount : -event.amount);
  }, 0);

  if (total === 0) {
    return null;
  }

  return (
    <p className={`shrink-0 text-sm font-extrabold ${total > 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
      {total > 0 ? '+' : '-'}
      {formatCurrency(Math.abs(total))}
    </p>
  );
}

function EventPill({ event }: { event: CalendarEvent }) {
  return (
    <div className={`rounded-lg px-3 py-2 text-sm font-semibold ${eventClassName(event)}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate">{event.title}</span>
        {event.amount ? <span className="shrink-0">{formatEventAmount(event)}</span> : null}
      </div>
    </div>
  );
}

function EventDetail({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-white/10">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-xs font-bold ${eventClassName(event)}`}>{eventLabel(event.kind)}</span>
          <p className="font-semibold text-zinc-950 dark:text-white">{event.title}</p>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{eventDescription(event)}</p>
      </div>
      {event.amount ? (
        <p className={`shrink-0 text-sm font-bold ${event.amountClassName ?? (event.cashFlow === 'income' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}`}>
          {formatEventAmount(event)}
        </p>
      ) : null}
    </div>
  );
}

function ModalStat({ label, value, tone = 'zinc' }: { label: string; value: string; tone?: 'zinc' | 'emerald' | 'rose' }) {
  const classes = {
    zinc: 'text-zinc-950 dark:text-white',
    emerald: 'text-emerald-600 dark:text-emerald-300',
    rose: 'text-rose-600 dark:text-rose-300',
  };

  return (
    <div className="rounded-lg border border-zinc-200 px-3 py-3 dark:border-white/10">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 truncate text-sm font-bold md:text-base ${classes[tone]}`}>{value}</p>
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
    card: 'Vencimiento calculado segun cierre, cuotas y pagos.',
  };

  return descriptions[event.kind] ?? 'Evento financiero.';
}

function Legend({ icon, label, tone, compact = false }: { icon: ReactNode; label: string; tone: CalendarEventTone; compact?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${toneClasses[tone]} ${compact ? 'min-w-max' : ''}`}>
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
