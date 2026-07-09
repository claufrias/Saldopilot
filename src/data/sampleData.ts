import type { AppState } from '../types';
import { DEFAULT_CATEGORIES } from './constants';

const today = new Date().toISOString().slice(0, 10);

export const initialState: AppState = {
  onboardingCompleted: false,
  usesCreditCards: true,
  theme: 'light',
  categories: DEFAULT_CATEGORIES,
  movements: [],
  budgets: [],
  creditCards: [],
  creditCardPayments: [],
  financialStart: {
    date: today,
    balance: 0,
  },
  recurringExpenses: [],
  expectedIncomes: [],
  savingsGoals: [],
};
