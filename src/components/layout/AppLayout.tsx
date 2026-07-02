import {
  BarChart3,
  CalendarDays,
  CalendarClock,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  Settings,
  Target,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/movimientos', label: 'Movimientos', icon: ReceiptText },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/presupuestos', label: 'Presupuestos', icon: Gauge },
  { to: '/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { to: '/gastos-fijos', label: 'Gastos fijos', icon: CalendarClock },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export function AppLayout() {
  const { currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
              isActive
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white'
            }`
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-zinc-200/80 bg-white/90 px-5 py-6 backdrop-blur xl:block dark:border-white/10 dark:bg-zinc-950/90">
        <Brand />
        <div className="mt-8">{nav}</div>
        <SessionCard name={currentUser?.name ?? 'Usuario'} email={currentUser?.email ?? ''} onLogout={logout} />
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-stone-50/85 px-4 backdrop-blur xl:hidden dark:border-white/10 dark:bg-zinc-950/85">
        <Brand compact />
        <button className="icon-button" onClick={() => setOpen(true)} aria-label="Abrir navegación">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm xl:hidden">
          <aside className="h-full w-80 max-w-[86vw] bg-white px-5 py-6 shadow-2xl dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <Brand compact />
              <button className="icon-button" onClick={() => setOpen(false)} aria-label="Cerrar navegación">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-8">{nav}</div>
            <SessionCard name={currentUser?.name ?? 'Usuario'} email={currentUser?.email ?? ''} onLogout={logout} />
          </aside>
        </div>
      ) : null}

      <main className="px-4 py-6 sm:px-6 xl:ml-72 xl:px-10 xl:py-10">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SessionCard({ name, email, onLogout }: { name: string; email: string; onLogout: () => void }) {
  return (
    <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-sm font-bold text-white dark:bg-white dark:text-zinc-950">
          {name.trim().slice(0, 1).toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-zinc-950 dark:text-white">{name}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
        </div>
      </div>
      <button
        className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
        onClick={onLogout}
        type="button"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesion
      </button>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
        <PiggyBank className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-bold text-zinc-950 dark:text-white">Saldopilot</p>
        {!compact ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Finanzas personales</p> : null}
      </div>
    </div>
  );
}
