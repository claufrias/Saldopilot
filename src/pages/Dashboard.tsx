import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, CreditCard, Gauge, Target, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CategoryIcon } from '../components/category/CategoryBadge';
import { getGoalColor, GoalIconBadge } from '../components/goals/GoalVisual';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useApp } from '../context/AppContext';
import { getCurrentMonth, getCurrentYear } from '../utils/date';
import { formatCurrency, formatDate, formatDateTime, percentage } from '../utils/format';
import {
  getBalance,
  budgetUsage,
  dateFromMonthKey,
  getCreditDueForMonth,
  getExpectedIncomeUntil,
  getMonthMovements,
  getMovementsWithFinancialStart,
  getOperationalMovements,
  getTotalDueNextMonth,
  sumByType,
} from '../utils/finance';

export function Dashboard() {
  const { movements, savingsGoals, creditCards, creditCardPayments, budgets, recurringExpenses, expectedIncomes, financialStart } = useApp();
  const operationalMovements = getOperationalMovements(movements, financialStart.date);
  const displayMovements = getMovementsWithFinancialStart(movements, financialStart);
  const monthMovements = getMonthMovements(displayMovements, getCurrentMonth(), getCurrentYear());
  const totalIncome = sumByType(monthMovements, 'income');
  const totalExpenses = sumByType(monthMovements, 'expense');
  const balance = getBalance(operationalMovements, financialStart.balance);
  const dueNextMonth = getTotalDueNextMonth(creditCards, operationalMovements);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayExpenses = displayMovements
    .filter((movement) => movement.date === todayKey && movement.type === 'expense' && movement.movementKind !== 'credit_card_payment')
    .reduce((total, movement) => total + movement.amount, 0);
  const nextDue = getNextCardDue(creditCards, operationalMovements, creditCardPayments);
  const primaryGoal = savingsGoals[0];
  const goalProgress = primaryGoal ? percentage(primaryGoal.currentAmount, primaryGoal.targetAmount) : 0;
  const goalTone = primaryGoal ? getGoalColor(primaryGoal.color) : getGoalColor('emerald');
  const latest = [...displayMovements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const insights = buildDashboardInsights({
    dueNextMonth,
    movements: monthMovements,
    creditCards,
    creditCardPayments,
    operationalMovements,
  });
  const alerts = buildAlerts({
    balance,
    dueNextMonth,
    creditCards,
    creditCardPayments,
    movements: operationalMovements,
    budgets,
    recurringExpenses,
    expectedIncomes,
    savingsGoals,
  });

  return (
    <div className="space-y-5 sm:space-y-8">
      <SectionHeader
        title="Dashboard"
        description="Una vista clara del mes, tus movimientos recientes y el avance de tus objetivos."
      />

      <MobileTodaySummary
        balance={balance}
        todayExpenses={todayExpenses}
        nextDue={nextDue}
        latestMovement={latest[0]}
      />

      <section className="hidden grid-cols-2 gap-3 sm:grid sm:gap-4 xl:grid-cols-4">
        <Metric title="Saldo actual" value={formatCurrency(balance)} icon={<WalletCards className="h-5 w-5" />} tone="zinc" />
        <Metric title="Ingresos del mes" value={formatCurrency(totalIncome)} icon={<ArrowUpRight className="h-5 w-5" />} tone="emerald" />
        <Metric title="Gastos pagados" value={formatCurrency(totalExpenses)} icon={<ArrowDownRight className="h-5 w-5" />} tone="rose" />
        <Metric title="Tarjetas próximo mes" value={formatCurrency(dueNextMonth)} icon={<CreditCard className="h-5 w-5" />} tone="amber" />
      </section>

      <section className="grid gap-2.5 sm:gap-3 lg:grid-cols-3">
        {insights.map((insight) => (
          <div key={insight.id} className="panel p-3.5 sm:p-4">
            <div className="flex gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${insight.iconClassName}`}>
                {insight.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-950 dark:text-white">{insight.title}</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {alerts.length > 0 ? (
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="label">Alertas inteligentes</p>
              <h2 className="mt-1 text-lg font-bold text-zinc-950 dark:text-white">Atención financiera</h2>
            </div>
            <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {alerts.length}
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex gap-3 rounded-lg border p-3 ${alert.className}`}>
                <div className="mt-0.5">{alert.icon}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{alert.title}</p>
                  <p className="mt-1 text-sm opacity-80">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="label">Objetivo de ahorro</p>
              <h2 className="mt-2 text-xl font-bold text-zinc-950 dark:text-white">
                {primaryGoal ? primaryGoal.name : 'Sin objetivo activo'}
              </h2>
            </div>
            {primaryGoal ? <GoalIconBadge icon={primaryGoal.icon} color={primaryGoal.color} /> : <GoalIconBadge icon="target" color="emerald" />}
          </div>
          {primaryGoal ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-bold text-zinc-950 dark:text-white">
                    {formatCurrency(primaryGoal.currentAmount)}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">de {formatCurrency(primaryGoal.targetAmount)}</p>
                </div>
                <p className={`text-sm font-semibold ${goalTone.text}`}>{goalProgress}%</p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                <div className={`h-full rounded-full ${goalTone.bar}`} style={{ width: `${goalProgress}%` }} />
              </div>
            </div>
          ) : (
            <Link className="mt-6 inline-flex text-sm font-semibold text-zinc-950 underline dark:text-white" to="/objetivos">
              Crear objetivo
            </Link>
          )}
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-zinc-200/80 p-4 sm:p-5 dark:border-white/10">
            <p className="label">Últimos movimientos</p>
          </div>
          <div className="divide-y divide-zinc-200/80 dark:divide-white/10">
            {latest.length > 0 ? latest.map((movement) => {
              const amountClassName = movement.type === 'income' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300';

              return (
              <div key={movement.id} className="flex items-center justify-between gap-3 p-3.5 sm:gap-4 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryIcon category={movement.category} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">{movement.description}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {movement.movementKind === 'opening_balance' ? 'Inicio financiero' : movement.category} · {formatDateTime(movement.date, movement.time)}
                    </p>
                  </div>
                </div>
                <p className={`shrink-0 text-sm font-bold ${amountClassName}`}>
                  {movement.type === 'income' ? '+' : '-'}
                  {formatCurrency(movement.amount)}
                </p>
              </div>
              );
            }) : (
              <EmptyAction
                title="Todavía no hay movimientos"
                description="Carga tu primer ingreso o gasto para que el resumen empiece a tomar forma."
                to="/movimientos"
                label="Agregar primer movimiento"
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MobileTodaySummary({
  balance,
  todayExpenses,
  nextDue,
  latestMovement,
}: {
  balance: number;
  todayExpenses: number;
  nextDue: ReturnType<typeof getNextCardDue>;
  latestMovement?: ReturnType<typeof getMovementsWithFinancialStart>[number];
}) {
  return (
    <section className="panel overflow-hidden md:hidden">
      <div className="bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
        <p className="text-xs font-bold uppercase tracking-wide opacity-70">Hoy</p>
        <p className="mt-2 text-3xl font-extrabold">{formatCurrency(balance)}</p>
        <p className="mt-1 text-sm opacity-70">Saldo actual</p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-zinc-200/80 dark:divide-white/10">
        <MobileTodayItem label="Gasto de hoy" value={formatCurrency(todayExpenses)} tone="rose" />
        <MobileTodayItem
          label="Próximo vencimiento"
          value={nextDue ? formatCurrency(nextDue.amount) : 'Sin vencimientos'}
          tone="amber"
          detail={nextDue ? formatDate(nextDue.date) : undefined}
        />
      </div>
      <div className="border-t border-zinc-200/80 p-4 dark:border-white/10">
        <p className="label">Último movimiento</p>
        {latestMovement ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-950 dark:text-white">{latestMovement.description}</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(latestMovement.date, latestMovement.time)}</p>
            </div>
            <p className={`shrink-0 text-sm font-extrabold ${latestMovement.type === 'income' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
              {latestMovement.type === 'income' ? '+' : '-'}
              {formatCurrency(latestMovement.amount)}
            </p>
          </div>
        ) : (
          <Link className="mt-2 inline-flex text-sm font-bold text-zinc-950 underline dark:text-white" to="/movimientos">
            Agregar primer movimiento
          </Link>
        )}
      </div>
    </section>
  );
}

function MobileTodayItem({ label, value, tone, detail }: { label: string; value: string; tone: 'rose' | 'amber'; detail?: string }) {
  const toneClassName = tone === 'rose' ? 'text-rose-600 dark:text-rose-300' : 'text-amber-600 dark:text-amber-300';

  return (
    <div className="p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 truncate text-base font-extrabold ${toneClassName}`}>{value}</p>
      {detail ? <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p> : null}
    </div>
  );
}

function EmptyAction({ title, description, to, label }: { title: string; description: string; to: string; label: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-bold text-zinc-950 dark:text-white">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      <Link className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white dark:bg-white dark:text-zinc-950" to={to}>
        {label}
      </Link>
    </div>
  );
}

function buildDashboardInsights({
  dueNextMonth,
  movements,
  creditCards,
  creditCardPayments,
  operationalMovements,
}: {
  dueNextMonth: number;
  movements: ReturnType<typeof getMovementsWithFinancialStart>;
  creditCards: ReturnType<typeof useApp>['creditCards'];
  creditCardPayments: ReturnType<typeof useApp>['creditCardPayments'];
  operationalMovements: ReturnType<typeof getOperationalMovements>;
}) {
  const biggestExpense = getBiggestExpenseCategory(movements);
  const nextDue = getNextCardDue(creditCards, operationalMovements, creditCardPayments);

  return [
    {
      id: 'cards-committed',
      title: `Tenés ${formatCurrency(dueNextMonth)} comprometidos en tarjetas`,
      description: dueNextMonth > 0 ? 'Es lo estimado para el próximo mes según vencimientos y cuotas.' : 'No hay cuotas o vencimientos registrados para el próximo mes.',
      icon: <CreditCard className="h-4 w-4" />,
      iconClassName: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    },
    {
      id: 'biggest-expense',
      title: biggestExpense
        ? `Tu mayor gasto del mes fue ${biggestExpense.category}`
        : 'Todavía no hay gastos fuertes este mes',
      description: biggestExpense
        ? `Suma ${formatCurrency(biggestExpense.amount)} en movimientos pagados.`
        : 'Cuando cargues gastos, Saldopilot te muestra la categoría dominante.',
      icon: <ArrowDownRight className="h-4 w-4" />,
      iconClassName: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    },
    {
      id: 'next-due',
      title: nextDue
        ? `Te quedan ${nextDue.days} días hasta ${nextDue.card.name}`
        : 'No hay vencimientos cercanos',
      description: nextDue
        ? `Vence el ${formatDate(nextDue.date)} con ${formatCurrency(nextDue.amount)} pendiente anotado.`
        : 'Agregá tarjetas con vencimiento para anticiparte a pagos.',
      icon: <CalendarClock className="h-4 w-4" />,
      iconClassName: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
    },
  ];
}

function getBiggestExpenseCategory(movements: ReturnType<typeof getMovementsWithFinancialStart>) {
  const totals = new Map<string, number>();

  movements
    .filter((movement) => movement.type === 'expense' && movement.paymentMethod !== 'credit')
    .forEach((movement) => {
      totals.set(movement.category, (totals.get(movement.category) ?? 0) + movement.amount);
    });

  const [category, amount] = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0] ?? [];

  return category ? { category, amount } : null;
}

function getNextCardDue(
  creditCards: ReturnType<typeof useApp>['creditCards'],
  movements: ReturnType<typeof getOperationalMovements>,
  payments: ReturnType<typeof useApp>['creditCardPayments'],
) {
  const today = new Date();
  const candidates = creditCards
    .filter((card) => card.active)
    .map((card) => {
      const currentKey = `${getCurrentYear()}-${String(getCurrentMonth()).padStart(2, '0')}`;
      const thisMonthDate = dateFromMonthKey(currentKey, card.dueDay);
      const thisMonth = new Date(`${thisMonthDate}T00:00:00`);
      const dueDate = thisMonth >= today ? thisMonth : new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, card.dueDay);
      const date = dueDate.toISOString().slice(0, 10);
      const dueMonthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
      const amount = getCreditDueForMonth(card, movements, payments, dueMonthKey);

      return {
        card,
        date,
        amount,
        days: Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / 86400000)),
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => a.days - b.days);

  return candidates[0] ?? null;
}

function buildAlerts({
  balance,
  dueNextMonth,
  creditCards,
  creditCardPayments,
  movements,
  budgets,
  recurringExpenses,
  expectedIncomes,
  savingsGoals,
}: {
  balance: number;
  dueNextMonth: number;
  creditCards: ReturnType<typeof useApp>['creditCards'];
  creditCardPayments: ReturnType<typeof useApp>['creditCardPayments'];
  movements: ReturnType<typeof useApp>['movements'];
  budgets: ReturnType<typeof useApp>['budgets'];
  recurringExpenses: ReturnType<typeof useApp>['recurringExpenses'];
  expectedIncomes: ReturnType<typeof useApp>['expectedIncomes'];
  savingsGoals: ReturnType<typeof useApp>['savingsGoals'];
}) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const currentKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const alerts: Array<{ id: string; title: string; description: string; icon: ReactNode; className: string }> = [];
  const nextDue = getNextCardDue(creditCards, movements, creditCardPayments);

  if (nextDue && balance < nextDue.amount) {
    const expectedBeforeDue = getExpectedIncomeUntil(expectedIncomes, nextDue.date, todayKey);
    const projectedBalance = balance + expectedBeforeDue;

    alerts.push({
      id: 'low-balance',
      title: projectedBalance >= nextDue.amount ? 'Cubierto con ingresos esperados' : 'Riesgo de vencimiento',
      description: projectedBalance >= nextDue.amount
        ? `Hoy no alcanza para ${nextDue.card.name}, pero con ${formatCurrency(expectedBeforeDue)} esperados antes del ${formatDate(nextDue.date)} quedaria cubierto.`
        : `Aun contando ${formatCurrency(expectedBeforeDue)} esperados antes del ${formatDate(nextDue.date)}, faltarian ${formatCurrency(nextDue.amount - projectedBalance)}.`,
      icon: <AlertTriangle className="h-4 w-4" />,
      className: projectedBalance >= nextDue.amount
        ? 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'
        : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    });
  } else if (balance < 0 || (dueNextMonth > 0 && balance < dueNextMonth)) {
    const expectedThisMonth = getExpectedIncomeUntil(expectedIncomes, dateFromMonthKey(currentKey, 31), todayKey);

    alerts.push({
      id: 'low-balance',
      title: 'Saldo comprometido',
      description: expectedThisMonth > 0
        ? `Tu saldo actual queda justo, pero hay ${formatCurrency(expectedThisMonth)} esperados durante el mes.`
        : `Tu saldo actual queda justo frente a ${formatCurrency(dueNextMonth)} de tarjetas proximo mes.`,
      icon: <AlertTriangle className="h-4 w-4" />,
      className: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    });
  }

  creditCards
    .filter((card) => card.active)
    .forEach((card) => {
      const dueDate = new Date(`${dateFromMonthKey(currentKey, card.dueDay)}T00:00:00`);
      const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
      const dueAmount = getCreditDueForMonth(card, movements, creditCardPayments, currentKey);

      if (days >= 0 && days <= 7 && dueAmount > 0) {
        alerts.push({
          id: `card-${card.id}`,
          title: `Vence ${card.name}`,
          description: `Vence en ${days} día${days === 1 ? '' : 's'} con ${formatCurrency(dueAmount)} de este resumen.`,
          icon: <CreditCard className="h-4 w-4" />,
          className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
        });
      }
    });

  budgets
    .filter((budget) => budget.month === currentMonth && budget.year === currentYear)
    .forEach((budget) => {
      const usage = budgetUsage(budget, movements);

      if (usage.used >= 80) {
        alerts.push({
          id: `budget-${budget.id}`,
          title: usage.used > 100 ? `Presupuesto superado: ${budget.category}` : `Presupuesto casi agotado: ${budget.category}`,
          description: `Usaste ${usage.used}% del presupuesto mensual.`,
          icon: <Gauge className="h-4 w-4" />,
          className: usage.used > 100
            ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
            : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
        });
      }
    });

  recurringExpenses
    .filter((expense) => expense.active && expense.startDate.slice(0, 7) <= currentKey)
    .forEach((expense) => {
      const exists = movements.some((movement) => movement.recurringExpenseId === expense.id && movement.recurringMonth === currentKey);

      if (!exists) {
        alerts.push({
          id: `recurring-${expense.id}`,
          title: `Gasto fijo pendiente: ${expense.description}`,
          description: `Esperado este mes por ${formatCurrency(expense.amount)}.`,
          icon: <CalendarClock className="h-4 w-4" />,
          className: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
        });
      }
    });

  savingsGoals
    .filter((goal) => goal.targetDate < todayKey && goal.currentAmount < goal.targetAmount)
    .forEach((goal) => {
      alerts.push({
        id: `goal-${goal.id}`,
        title: `Objetivo atrasado: ${goal.name}`,
        description: `Faltan ${formatCurrency(goal.targetAmount - goal.currentAmount)} para completarlo.`,
        icon: <Target className="h-4 w-4" />,
        className: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200',
      });
    });

  return alerts.slice(0, 6);
}

function Metric({
  title,
  value,
  icon,
  tone,
  className = '',
  featured = false,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: 'zinc' | 'emerald' | 'rose' | 'sky' | 'amber';
  className?: string;
  featured?: boolean;
}) {
  const tones = {
    zinc: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
  };

  return (
    <div className={`panel p-4 sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label">{title}</p>
          <p className={`${featured ? 'mt-3 text-3xl sm:text-2xl' : 'mt-2 text-xl sm:mt-3 sm:text-2xl'} font-bold text-zinc-950 dark:text-white`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}
