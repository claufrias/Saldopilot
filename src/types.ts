export type MovementType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'credit';
export type MovementKind = 'standard' | 'credit_card_payment' | 'opening_balance';
export type Category = string;
export type ExpectedIncomeSource = 'salary' | 'freelance' | 'sale' | 'rent' | 'aid' | 'other';
export type ExpectedIncomeStatus = 'expected' | 'partial' | 'received' | 'cancelled';
export type ExpectedIncomeRecurrence = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'irregular';

export interface AppCategory {
  id: string;
  name: Category;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Movement {
  id: string;
  type: MovementType;
  category: Category;
  description: string;
  date: string;
  time?: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  movementKind?: MovementKind;
  creditCardId?: string;
  installments?: number;
  location?: MovementLocation;
  recurringExpenseId?: string;
  recurringMonth?: string;
}

export interface MovementLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  lastFour: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  active: boolean;
}

export interface CreditCardPayment {
  id: string;
  creditCardId: string;
  movementId: string;
  description: string;
  date: string;
  amount: number;
}

export interface FinancialStart {
  date: string;
  balance: number;
}

export interface Budget {
  id: string;
  category: Category;
  month: number;
  year: number;
  amount: number;
}

export interface RecurringExpense {
  id: string;
  category: Category;
  description: string;
  amount: number;
  startDate: string;
  active: boolean;
}

export interface ExpectedIncome {
  id: string;
  source: ExpectedIncomeSource;
  category: Category;
  description: string;
  expectedAmount: number;
  expectedDate: string;
  status: ExpectedIncomeStatus;
  receivedAmount?: number;
  receivedDate?: string;
  recurrence?: ExpectedIncomeRecurrence;
  receivedMovementId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  icon: string;
  color: string;
}

export interface Filters {
  month: string;
  year: string;
  category: string;
  type: string;
  query: string;
}

export interface AppState {
  onboardingCompleted: boolean;
  usesCreditCards: boolean;
  movements: Movement[];
  categories: AppCategory[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  expectedIncomes: ExpectedIncome[];
  savingsGoals: SavingsGoal[];
  creditCards: CreditCard[];
  creditCardPayments: CreditCardPayment[];
  financialStart: FinancialStart;
  theme: 'light' | 'dark';
}
