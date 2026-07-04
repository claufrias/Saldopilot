import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { Budgets } from './pages/Budgets';
import { CreditCards } from './pages/CreditCards';
import { Dashboard } from './pages/Dashboard';
import { FinancialCalendar } from './pages/FinancialCalendar';
import { Goals } from './pages/Goals';
import { Movements } from './pages/Movements';
import { Onboarding } from './pages/Onboarding';
import { RecurringExpenses } from './pages/RecurringExpenses';
import { Settings } from './pages/Settings';
import { Stats } from './pages/Stats';

export default function App() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <AppProvider key={currentUser.id} userId={currentUser.id}>
      <AppRoutes />
    </AppProvider>
  );
}

function AppRoutes() {
  const { appReady, onboardingCompleted } = useApp();

  if (!appReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-zinc-200 dark:bg-white/10" aria-label="Cargando" />
      </main>
    );
  }

  if (!onboardingCompleted) {
    return <Onboarding />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="movimientos" element={<Movements />} />
        <Route path="estadisticas" element={<Stats />} />
        <Route path="calendario" element={<FinancialCalendar />} />
        <Route path="presupuestos" element={<Budgets />} />
        <Route path="tarjetas" element={<CreditCards />} />
        <Route path="gastos-fijos" element={<RecurringExpenses />} />
        <Route path="objetivos" element={<Goals />} />
        <Route path="configuracion" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
