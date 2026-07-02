import type { Budget, Category, CreditCard, CreditCardPayment, FinancialStart, Filters, Movement, RecurringExpense } from '../types';
import { getCurrentMonth, getCurrentYear, isSameMonth, monthKey, monthStartFromKey, toMonthKey } from './date';

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function applyFilters(movements: Movement[], filters: Filters): Movement[] {
  return movements.filter((movement) => {
    const date = new Date(`${movement.date}T00:00:00`);
    const monthMatches = filters.month === 'all' || date.getMonth() + 1 === Number(filters.month);
    const yearMatches = filters.year === 'all' || date.getFullYear() === Number(filters.year);
    const categoryMatches = filters.category === 'all' || movement.category === filters.category;
    const typeMatches = filters.type === 'all' || movement.type === filters.type;
    const queryMatches = movement.description.toLowerCase().includes(filters.query.trim().toLowerCase());

    return monthMatches && yearMatches && categoryMatches && typeMatches && queryMatches;
  });
}

export function getMonthMovements(movements: Movement[], month = getCurrentMonth(), year = getCurrentYear()): Movement[] {
  return movements.filter((movement) => isSameMonth(movement.date, month, year));
}

export function getOperationalMovements(movements: Movement[], startDate?: string): Movement[] {
  if (!startDate) {
    return movements;
  }

  return movements.filter((movement) => movement.date >= startDate);
}

export function getFinancialStartMovement(financialStart: FinancialStart): Movement | null {
  if (financialStart.balance === 0) {
    return null;
  }

  return {
    id: 'virtual-opening-balance',
    type: financialStart.balance >= 0 ? 'income' : 'expense',
    category: 'Otros',
    description: 'Saldo inicial',
    date: financialStart.date,
    amount: Math.abs(financialStart.balance),
    paymentMethod: 'cash',
    movementKind: 'opening_balance',
  };
}

export function getMovementsWithFinancialStart(movements: Movement[], financialStart: FinancialStart): Movement[] {
  const operationalMovements = getOperationalMovements(movements, financialStart.date);
  const openingMovement = getFinancialStartMovement(financialStart);

  return openingMovement ? [openingMovement, ...operationalMovements] : operationalMovements;
}

export function sumByType(movements: Movement[], type: 'income' | 'expense'): number {
  return movements
    .filter((movement) => movement.type === type && !isCreditCardCharge(movement))
    .reduce((total, movement) => total + movement.amount, 0);
}

export function getBalance(movements: Movement[], openingBalance = 0): number {
  return openingBalance + movements
    .filter((movement) => !isCreditCardCharge(movement))
    .reduce((total, movement) => total + (movement.type === 'income' ? movement.amount : -movement.amount), 0);
}

export function getOperationalBalance(movements: Movement[], financialStart: FinancialStart): number {
  return getBalance(getOperationalMovements(movements, financialStart.date), financialStart.balance);
}

export function expensesByCategory(movements: Movement[], categories?: Category[]): Array<{ category: Category; amount: number }> {
  const categoryNames = categories?.length ? categories : Array.from(new Set(movements.map((movement) => movement.category)));

  return categoryNames.map((category) => ({
    category,
    amount: movements
      .filter((movement) => movement.type === 'expense' && movement.category === category)
      .reduce((total, movement) => total + movement.amount, 0),
  })).filter((item) => item.amount > 0);
}

export function monthlyBars(movements: Movement[], year = getCurrentYear()): Array<{ month: string; ingresos: number; gastos: number }> {
  return Array.from({ length: 12 }, (_, index) => {
    const monthMovements = getMonthMovements(movements, index + 1, year);

    return {
      month: String(index + 1).padStart(2, '0'),
      ingresos: sumByType(monthMovements, 'income'),
      gastos: sumByType(monthMovements, 'expense'),
    };
  });
}

export function yearsFromMovements(movements: Movement[]): number[] {
  const years = new Set(movements.map((movement) => new Date(`${movement.date}T00:00:00`).getFullYear()));
  years.add(getCurrentYear());
  return Array.from(years).sort((a, b) => b - a);
}

export function budgetUsage(budget: Budget, movements: Movement[]): { spent: number; available: number; used: number } {
  const spent = movements
    .filter(
      (movement) =>
        movement.type === 'expense' &&
        movement.category === budget.category &&
        isSameMonth(movement.date, budget.month, budget.year),
    )
    .reduce((total, movement) => total + movement.amount, 0);

  return {
    spent,
    available: budget.amount - spent,
    used: budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0,
  };
}

export function materializeRecurringExpenses(movements: Movement[], recurringExpenses: RecurringExpense[]): Movement[] {
  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);
  const additions: Movement[] = [];

  // Evita duplicar el gasto fijo si el usuario abre la app varias veces durante el mismo mes.
  recurringExpenses
    .filter((expense) => expense.active && toMonthKey(expense.startDate) <= currentKey)
    .forEach((expense) => {
      const alreadyExists = movements.some(
        (movement) => movement.recurringExpenseId === expense.id && movement.recurringMonth === currentKey,
      );

      if (!alreadyExists) {
        additions.push({
          id: generateId('recurring-movement'),
          type: 'expense',
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          date: monthStartFromKey(currentKey),
          recurringExpenseId: expense.id,
          recurringMonth: currentKey,
        });
      }
    });

  return additions.length > 0 ? [...additions, ...movements] : movements;
}

export function isCreditCardCharge(movement: Movement): boolean {
  return movement.type === 'expense' && movement.paymentMethod === 'credit' && Boolean(movement.creditCardId);
}

export function getCreditCardCharges(movements: Movement[], creditCardId?: string): Movement[] {
  return movements.filter(
    (movement) => isCreditCardCharge(movement) && (!creditCardId || movement.creditCardId === creditCardId),
  );
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function dateFromMonthKey(key: string, day: number): string {
  const [yearText, monthText] = key.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const safeDay = Math.min(day, daysInMonth(year, month));

  return `${key}-${String(safeDay).padStart(2, '0')}`;
}

export function getInstallmentCount(movement: Movement): number {
  return movement.paymentMethod === 'credit' ? Math.max(1, movement.installments ?? 1) : 1;
}

export function getInstallmentAmount(movement: Movement): number {
  return movement.amount / getInstallmentCount(movement);
}

export function getCreditChargeDueMonthKey(card: CreditCard, purchaseDate: string): string {
  const date = new Date(`${purchaseDate}T00:00:00`);
  const monthsToAdd = date.getDate() <= card.closingDay ? 1 : 2;
  const dueMonth = addMonths(date, monthsToAdd);

  return monthKey(dueMonth.getFullYear(), dueMonth.getMonth() + 1);
}

export function getCreditInstallmentSchedule(card: CreditCard, movement: Movement) {
  const firstDueKey = getCreditChargeDueMonthKey(card, movement.date);
  const [yearText, monthText] = firstDueKey.split('-');
  const firstDueMonth = new Date(Number(yearText), Number(monthText) - 1, 1);
  const installments = getInstallmentCount(movement);
  const amount = getInstallmentAmount(movement);

  return Array.from({ length: installments }, (_, index) => {
    const dueMonth = addMonths(firstDueMonth, index);
    const dueKey = monthKey(dueMonth.getFullYear(), dueMonth.getMonth() + 1);

    return {
      installment: index + 1,
      totalInstallments: installments,
      monthKey: dueKey,
      date: dateFromMonthKey(dueKey, card.dueDay),
      amount,
    };
  });
}

export function getCreditDueForMonth(
  card: CreditCard,
  movements: Movement[],
  payments: CreditCardPayment[],
  dueMonthKey: string,
): number {
  const installmentTotal = getCreditCardCharges(movements, card.id)
    .flatMap((movement) => getCreditInstallmentSchedule(card, movement))
    .filter((installment) => installment.monthKey === dueMonthKey)
    .reduce((total, installment) => total + installment.amount, 0);
  const paidThisMonth = payments
    .filter((payment) => payment.creditCardId === card.id && payment.date.startsWith(dueMonthKey))
    .reduce((total, payment) => total + payment.amount, 0);

  return Math.max(0, installmentTotal - paidThisMonth);
}

export function getNextMonthKey(reference = new Date()): string {
  const nextMonth = addMonths(reference, 1);
  return monthKey(nextMonth.getFullYear(), nextMonth.getMonth() + 1);
}

export function getCreditCardSummary(card: CreditCard, movements: Movement[], payments: CreditCardPayment[]) {
  const charges = getCreditCardCharges(movements, card.id);
  const totalCharges = charges.reduce((total, movement) => total + movement.amount, 0);
  const totalPayments = payments
    .filter((payment) => payment.creditCardId === card.id)
    .reduce((total, payment) => total + payment.amount, 0);
  const pending = Math.max(0, totalCharges - totalPayments);
  const nextMonthKey = getNextMonthKey();
  const schedules = charges.flatMap((movement) => getCreditInstallmentSchedule(card, movement));
  const dueNextMonth = getCreditDueForMonth(card, movements, payments, nextMonthKey);
  const currentKey = monthKey(getCurrentYear(), getCurrentMonth());
  const pendingInstallments = schedules.filter((installment) => installment.monthKey >= currentKey).length;

  return {
    charges,
    totalCharges,
    totalPayments,
    pending,
    dueNextMonth,
    pendingInstallments,
    usedLimit: card.limit > 0 ? Math.round((pending / card.limit) * 100) : 0,
  };
}

export function getTotalDueNextMonth(cards: CreditCard[], movements: Movement[]): number {
  return cards
    .filter((card) => card.active)
    .reduce((total, card) => total + getCreditCardSummary(card, movements, []).dueNextMonth, 0);
}
