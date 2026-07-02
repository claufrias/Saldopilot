import type { AppState } from '../types';
import { DEFAULT_CATEGORIES } from './constants';

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');

export const initialState: AppState = {
  theme: 'light',
  categories: DEFAULT_CATEGORIES,
  movements: [
    {
      id: 'demo-income',
      type: 'income',
      category: 'Trabajo',
      description: 'Sueldo',
      date: `${year}-${month}-01`,
      amount: 1200000,
    },
    {
      id: 'demo-food',
      type: 'expense',
      category: 'Comida',
      description: 'Supermercado',
      date: `${year}-${month}-03`,
      amount: 85000,
    },
    {
      id: 'demo-services',
      type: 'expense',
      category: 'Servicios',
      description: 'Electricidad e internet',
      date: `${year}-${month}-05`,
      amount: 42000,
    },
  ],
  budgets: [
    {
      id: 'budget-food',
      category: 'Comida',
      month: now.getMonth() + 1,
      year,
      amount: 180000,
    },
    {
      id: 'budget-transport',
      category: 'Transporte',
      month: now.getMonth() + 1,
      year,
      amount: 65000,
    },
  ],
  creditCards: [
    {
      id: 'card-demo',
      name: 'Visa Principal',
      issuer: 'Banco demo',
      lastFour: '1234',
      limit: 900000,
      closingDay: 25,
      dueDay: 10,
      color: 'slate',
      active: true,
    },
  ],
  creditCardPayments: [],
  financialStart: {
    date: `${year}-${month}-01`,
    balance: 0,
  },
  recurringExpenses: [
    {
      id: 'rec-streaming',
      category: 'Streaming',
      description: 'Suscripciones',
      amount: 18500,
      startDate: `${year}-${month}-08`,
      active: true,
    },
  ],
  savingsGoals: [
    {
      id: 'goal-emergency',
      name: 'Fondo de emergencia',
      targetAmount: 600000,
      currentAmount: 180000,
      targetDate: `${year}-12-31`,
      icon: 'shield',
      color: 'emerald',
    },
  ],
};
