import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { initialState } from '../data/sampleData';
import { isSupabaseConfigured, supabaseApi } from '../lib/supabase';
import type {
  AppCategory,
  AppState,
  Budget,
  CreditCard,
  CreditCardPayment,
  ExpectedIncome,
  FinancialStart,
  Movement,
  RecurringExpense,
  SavingsGoal,
} from '../types';
import { DEFAULT_CATEGORIES } from '../data/constants';
import { generateId, materializeRecurringExpenses } from '../utils/finance';

type CloudSyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AppContextValue extends AppState {
  addMovement: (movement: Omit<Movement, 'id'>) => void;
  updateMovement: (movement: Movement) => void;
  deleteMovement: (id: string) => void;
  addCategory: (category: Omit<AppCategory, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => void;
  updateRecurringExpense: (expense: RecurringExpense) => void;
  deleteRecurringExpense: (id: string) => void;
  addExpectedIncome: (income: Omit<ExpectedIncome, 'id'>) => void;
  updateExpectedIncome: (income: ExpectedIncome) => void;
  deleteExpectedIncome: (id: string) => void;
  markExpectedIncomeReceived: (id: string, received: { amount: number; date: string }) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCreditCard: (card: CreditCard) => void;
  deleteCreditCard: (id: string) => void;
  addCreditCardPayment: (payment: Omit<CreditCardPayment, 'id' | 'movementId'>) => void;
  updateCreditCardPayment: (payment: CreditCardPayment) => void;
  deleteCreditCardPayment: (id: string) => void;
  updateFinancialStart: (financialStart: FinancialStart) => void;
  completeOnboarding: (setup: { balance: number; usesCreditCards: boolean }) => void;
  setUsesCreditCards: (usesCreditCards: boolean) => void;
  setTheme: (theme: AppState['theme']) => void;
  importState: (state: AppState) => void;
  resetState: () => void;
  syncCloudStateNow: () => Promise<void>;
  cloudSyncStatus: CloudSyncStatus;
  appReady: boolean;
}

const CLOUD_STATE_KEY = 'default';
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [state, setState] = useState<AppState>(initialState);
  const [cloudStateLoaded, setCloudStateLoaded] = useState(!isSupabaseConfigured || !userId);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('idle');
  const lastSyncedState = useRef<string | null>(null);
  const syncTimeout = useRef<number | null>(null);
  const currentState = normalizeState(state);

  const syncCloudStateNow = useCallback(async () => {
    if (!supabaseApi || !userId || !cloudStateLoaded) {
      setCloudSyncStatus('saved');
      return;
    }

    if (syncTimeout.current !== null) {
      window.clearTimeout(syncTimeout.current);
      syncTimeout.current = null;
    }

    const normalizedState = normalizeState(state);
    const serializedState = JSON.stringify(normalizedState);

    if (lastSyncedState.current === serializedState) {
      setCloudSyncStatus('saved');
      return;
    }

    setCloudSyncStatus('saving');

    try {
      await supabaseApi.upsertState(userId, CLOUD_STATE_KEY, normalizedState);
      lastSyncedState.current = serializedState;
      setCloudSyncStatus('saved');
    } catch (error) {
      setCloudSyncStatus('error');
      throw error;
    }
  }, [cloudStateLoaded, state, userId]);

  useEffect(() => {
    if (!supabaseApi || !userId) {
      setCloudStateLoaded(true);
      setCloudSyncStatus('saved');
      return;
    }

    let active = true;
    setCloudSyncStatus('saving');

    supabaseApi
      .getState<AppState>(userId, CLOUD_STATE_KEY)
      .then((cloudState) => {
        if (!active) {
          return;
        }

        if (cloudState) {
          const normalizedCloudState = normalizeState(cloudState);
          lastSyncedState.current = JSON.stringify(normalizedCloudState);
          setState(normalizedCloudState);
        }

        setCloudStateLoaded(true);
        setCloudSyncStatus('saved');
      })
      .catch((error) => {
        console.error('No se pudo cargar el estado sincronizado.', error);
        setCloudStateLoaded(true);
        setCloudSyncStatus('error');
      });

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!supabaseApi || !userId || !cloudStateLoaded) {
      return;
    }

    const api = supabaseApi;
    const normalizedState = normalizeState(state);
    const serializedState = JSON.stringify(normalizedState);

    if (lastSyncedState.current === serializedState) {
      setCloudSyncStatus('saved');
      return;
    }

    setCloudSyncStatus('saving');

    const nextSyncTimeout = window.setTimeout(() => {
      syncTimeout.current = null;
      api
        .upsertState(userId, CLOUD_STATE_KEY, normalizedState)
        .then(() => {
          lastSyncedState.current = serializedState;
          setCloudSyncStatus('saved');
        })
        .catch((error) => {
          console.error('No se pudo sincronizar el estado.', error);
          setCloudSyncStatus('error');
        });
    }, 400);
    syncTimeout.current = nextSyncTimeout;

    return () => {
      if (syncTimeout.current === nextSyncTimeout) {
        window.clearTimeout(nextSyncTimeout);
        syncTimeout.current = null;
      }
    };
  }, [cloudStateLoaded, state, userId]);

  // Al abrir la app, los gastos fijos activos se transforman en movimientos del mes actual.
  useEffect(() => {
    setState((current) => {
      const normalized = normalizeState(current);

      return {
        ...normalized,
        movements: materializeRecurringExpenses(normalized.movements, normalized.recurringExpenses),
      };
    });
  }, [setState, state.recurringExpenses]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', currentState.theme === 'dark');
  }, [currentState.theme]);

  // Todas las mutaciones pasan por este contexto y se sincronizan en la nube.
  const value = useMemo<AppContextValue>(
    () => ({
      ...currentState,
      addMovement: (movement) =>
        setState((current) => {
          const normalized = normalizeState(current);

          return {
            ...normalized,
            movements: [{ ...movement, id: generateId('movement') }, ...normalized.movements],
          };
        }),
      updateMovement: (movement) =>
        setState((current) => {
          const normalized = normalizeState(current);

          return {
            ...normalized,
            movements: normalized.movements.map((item) => (item.id === movement.id ? movement : item)),
          };
        }),
      deleteMovement: (id) =>
        setState((current) => {
          const normalized = normalizeState(current);

          return {
            ...normalized,
            movements: normalized.movements.filter((movement) => movement.id !== id),
            creditCardPayments: normalized.creditCardPayments.filter((payment) => payment.movementId !== id),
          };
        }),
      addCategory: (category) =>
        setState((current) => {
          const normalized = normalizeState(current);
          const exists = normalized.categories.some(
            (item) => item.name.trim().toLowerCase() === category.name.trim().toLowerCase(),
          );

          if (exists) {
            return normalized;
          }

          return {
            ...normalized,
            categories: [{ ...category, id: generateId('category') }, ...normalized.categories],
          };
        }),
      deleteCategory: (id) =>
        setState((current) => {
          const normalized = normalizeState(current);
          const category = normalized.categories.find((item) => item.id === id);
          const isUsed = category
            ? normalized.movements.some((movement) => movement.category === category.name) ||
              normalized.budgets.some((budget) => budget.category === category.name) ||
              normalized.recurringExpenses.some((expense) => expense.category === category.name) ||
              normalized.expectedIncomes.some((income) => income.category === category.name)
            : false;

          if (!category || category.isDefault || isUsed) {
            return normalized;
          }

          return {
            ...normalized,
            categories: normalized.categories.filter((item) => item.id !== id),
          };
        }),
      addBudget: (budget) =>
        setState((current) => ({
          ...current,
          budgets: [{ ...budget, id: generateId('budget') }, ...current.budgets],
        })),
      updateBudget: (budget) =>
        setState((current) => ({
          ...current,
          budgets: current.budgets.map((item) => (item.id === budget.id ? budget : item)),
        })),
      deleteBudget: (id) =>
        setState((current) => ({
          ...current,
          budgets: current.budgets.filter((budget) => budget.id !== id),
        })),
      addRecurringExpense: (expense) =>
        setState((current) => ({
          ...current,
          recurringExpenses: [{ ...expense, id: generateId('recurring') }, ...current.recurringExpenses],
        })),
      updateRecurringExpense: (expense) =>
        setState((current) => ({
          ...current,
          recurringExpenses: current.recurringExpenses.map((item) => (item.id === expense.id ? expense : item)),
        })),
      deleteRecurringExpense: (id) =>
        setState((current) => ({
          ...current,
          recurringExpenses: current.recurringExpenses.filter((expense) => expense.id !== id),
        })),
      addExpectedIncome: (income) =>
        setState((current) => {
          const normalized = normalizeState(current);

          return {
            ...normalized,
            expectedIncomes: [{ ...income, id: generateId('expected-income') }, ...normalized.expectedIncomes],
          };
        }),
      updateExpectedIncome: (income) =>
        setState((current) => {
          const normalized = normalizeState(current);

          return {
            ...normalized,
            expectedIncomes: normalized.expectedIncomes.map((item) => (item.id === income.id ? income : item)),
          };
        }),
      deleteExpectedIncome: (id) =>
        setState((current) => {
          const normalized = normalizeState(current);

          return {
            ...normalized,
            expectedIncomes: normalized.expectedIncomes.filter((income) => income.id !== id),
          };
        }),
      markExpectedIncomeReceived: (id, received) =>
        setState((current) => {
          const normalized = normalizeState(current);
          const income = normalized.expectedIncomes.find((item) => item.id === id);

          if (!income || income.receivedMovementId || received.amount <= 0) {
            return normalized;
          }

          const movementId = generateId('expected-income-movement');
          const totalReceived = (income.receivedAmount ?? 0) + received.amount;

          return {
            ...normalized,
            expectedIncomes: normalized.expectedIncomes.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: 'received',
                    receivedAmount: totalReceived,
                    receivedDate: received.date,
                    receivedMovementId: movementId,
                  }
                : item,
            ),
            movements: [
              {
                id: movementId,
                type: 'income',
                category: income.category,
                description: income.description,
                date: received.date,
                amount: received.amount,
                paymentMethod: 'cash',
              },
              ...normalized.movements,
            ],
          };
        }),
      addSavingsGoal: (goal) =>
        setState((current) => ({
          ...current,
          savingsGoals: [{ ...goal, id: generateId('goal') }, ...current.savingsGoals],
        })),
      updateSavingsGoal: (goal) =>
        setState((current) => ({
          ...current,
          savingsGoals: current.savingsGoals.map((item) => (item.id === goal.id ? goal : item)),
        })),
      deleteSavingsGoal: (id) =>
        setState((current) => ({
          ...current,
          savingsGoals: current.savingsGoals.filter((goal) => goal.id !== id),
        })),
      addCreditCard: (card) =>
        setState((current) => {
          const normalized = normalizeState(current);

          return {
            ...normalized,
            creditCards: [{ ...card, id: generateId('card') }, ...normalized.creditCards],
          };
        }),
      updateCreditCard: (card) =>
        setState((current) => {
          const normalized = normalizeState(current);

          return {
            ...normalized,
            creditCards: normalized.creditCards.map((item) => (item.id === card.id ? card : item)),
          };
        }),
      deleteCreditCard: (id) =>
        setState((current) => {
          const normalized = normalizeState(current);
          const paymentMovementIds = new Set(
            normalized.creditCardPayments.filter((payment) => payment.creditCardId === id).map((payment) => payment.movementId),
          );

          return {
            ...normalized,
            creditCards: normalized.creditCards.filter((card) => card.id !== id),
            creditCardPayments: normalized.creditCardPayments.filter((payment) => payment.creditCardId !== id),
            movements: normalized.movements
              .filter((movement) => !paymentMovementIds.has(movement.id))
              .map((movement) =>
                movement.creditCardId === id
                  ? {
                      ...movement,
                      paymentMethod: 'cash',
                      creditCardId: undefined,
                    }
                  : movement,
              ),
          };
        }),
      addCreditCardPayment: (payment) =>
        setState((current) => {
          const normalized = normalizeState(current);
          const card = normalized.creditCards.find((item) => item.id === payment.creditCardId);
          const movementId = generateId('card-payment-movement');
          const description = payment.description || `Pago tarjeta ${card?.name ?? ''}`.trim();

          return {
            ...normalized,
            creditCardPayments: [
              { ...payment, description, id: generateId('card-payment'), movementId },
              ...normalized.creditCardPayments,
            ],
            movements: [
              {
                id: movementId,
                type: 'expense',
                category: 'Otros',
                description,
                date: payment.date,
                amount: payment.amount,
                paymentMethod: 'cash',
                movementKind: 'credit_card_payment',
                creditCardId: payment.creditCardId,
              },
              ...normalized.movements,
            ],
          };
        }),
      updateCreditCardPayment: (payment) =>
        setState((current) => {
          const normalized = normalizeState(current);

          return {
            ...normalized,
            creditCardPayments: normalized.creditCardPayments.map((item) => (item.id === payment.id ? payment : item)),
            movements: normalized.movements.map((movement) =>
              movement.id === payment.movementId
                ? {
                    ...movement,
                    creditCardId: payment.creditCardId,
                    description: payment.description,
                    date: payment.date,
                    amount: payment.amount,
                  }
                : movement,
            ),
          };
        }),
      deleteCreditCardPayment: (id) =>
        setState((current) => {
          const normalized = normalizeState(current);
          const payment = normalized.creditCardPayments.find((item) => item.id === id);

          return {
            ...normalized,
            creditCardPayments: normalized.creditCardPayments.filter((item) => item.id !== id),
            movements: normalized.movements.filter((movement) => movement.id !== payment?.movementId),
          };
        }),
      updateFinancialStart: (financialStart) =>
        setState((current) => ({
          ...normalizeState(current),
          financialStart,
        })),
      completeOnboarding: ({ balance, usesCreditCards }) =>
        setState((current) => ({
          ...normalizeState(current),
          onboardingCompleted: true,
          usesCreditCards,
          financialStart: {
            date: new Date().toISOString().slice(0, 10),
            balance,
          },
        })),
      setUsesCreditCards: (usesCreditCards) =>
        setState((current) => ({
          ...normalizeState(current),
          usesCreditCards,
        })),
      setTheme: (theme) => setState((current) => ({ ...normalizeState(current), theme })),
      importState: (nextState) => setState(normalizeState(nextState)),
      resetState: () => setState(initialState),
      syncCloudStateNow,
      cloudSyncStatus,
      appReady: cloudStateLoaded,
    }),
    [cloudStateLoaded, cloudSyncStatus, currentState, setState, syncCloudStateNow],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function normalizeState(state: AppState): AppState {
  const categories = normalizeCategories(state);
  const hasExistingData =
    (state.movements?.length ?? 0) > 0 ||
    (state.creditCards?.length ?? 0) > 0 ||
    (state.creditCardPayments?.length ?? 0) > 0 ||
    (state.budgets?.length ?? 0) > 0 ||
    (state.recurringExpenses?.length ?? 0) > 0 ||
    (state.expectedIncomes?.length ?? 0) > 0 ||
    (state.savingsGoals?.length ?? 0) > 0 ||
    Math.abs(state.financialStart?.balance ?? 0) > 0;
  const onboardingCompleted = typeof state.onboardingCompleted === 'boolean' ? state.onboardingCompleted : hasExistingData;
  const usesCreditCards = typeof state.usesCreditCards === 'boolean' ? state.usesCreditCards : (state.creditCards?.length ?? 0) > 0;

  return {
    ...initialState,
    ...state,
    onboardingCompleted,
    usesCreditCards,
    movements: (state.movements ?? []).map((movement) => ({
      ...movement,
      paymentMethod: movement.paymentMethod === 'credit' ? 'credit' : 'cash',
      installments: movement.paymentMethod === 'credit' ? movement.installments ?? 1 : undefined,
    })),
    categories,
    budgets: state.budgets ?? [],
    recurringExpenses: state.recurringExpenses ?? [],
    expectedIncomes: (state.expectedIncomes ?? []).map((income) => ({
      ...income,
      category: income.category ?? 'Trabajo',
      source: income.source ?? 'other',
      status: income.status ?? 'expected',
      recurrence: income.recurrence ?? 'none',
    })),
    savingsGoals: (state.savingsGoals ?? []).map((goal) => ({
      ...goal,
      icon: goal.icon ?? 'target',
      color: goal.color ?? 'emerald',
    })),
    creditCards: state.creditCards ?? [],
    creditCardPayments: state.creditCardPayments ?? [],
    financialStart: state.financialStart ?? initialState.financialStart,
    theme: state.theme ?? initialState.theme,
  };
}

function normalizeCategories(state: AppState): AppCategory[] {
  const source = state.categories?.length ? state.categories : DEFAULT_CATEGORIES;
  const movementCategories = new Set((state.movements ?? []).map((movement) => movement.category));
  (state.expectedIncomes ?? []).forEach((income) => movementCategories.add(income.category));
  const all = [...source];

  movementCategories.forEach((name) => {
    if (!all.some((category) => category.name === name)) {
      all.push({
        id: `category-imported-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        icon: 'shapes',
        color: 'slate',
      });
    }
  });

  return all.map((category) => ({
    ...category,
    icon: category.icon ?? 'shapes',
    color: category.color ?? 'slate',
  }));
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp debe utilizarse dentro de AppProvider');
  }

  return context;
}
