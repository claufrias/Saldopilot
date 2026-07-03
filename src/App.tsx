import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppProvider } from './context/AppContext';
import { useAuth, userStateStorageKey } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { Budgets } from './pages/Budgets';
import { CreditCards } from './pages/CreditCards';
import { Dashboard } from './pages/Dashboard';
import { FinancialCalendar } from './pages/FinancialCalendar';
import { Goals } from './pages/Goals';
import { Movements } from './pages/Movements';
import { RecurringExpenses } from './pages/RecurringExpenses';
import { Settings } from './pages/Settings';
import { Stats } from './pages/Stats';

export default function App() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <AppProvider key={currentUser.id} storageKey={userStateStorageKey(currentUser.id)} userId={currentUser.id}>
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
    </AppProvider>
  );
}
