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
  Plus,
  ReceiptText,
  Settings,
  Target,
  WalletCards,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { QuickActionSheet } from './QuickActionSheet';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/movimientos', label: 'Movimientos', icon: ReceiptText },
  { to: '/ingresos-esperados', label: 'Ingresos esperados', icon: WalletCards },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/presupuestos', label: 'Presupuestos', icon: Gauge },
  { to: '/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { to: '/gastos-fijos', label: 'Gastos fijos', icon: CalendarClock },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

const mobileNavItems = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/movimientos', label: 'Movimientos', icon: ReceiptText },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/tarjetas', label: 'Tarjetas', icon: CreditCard },
];

export function AppLayout() {
  const { currentUser, logout } = useAuth();
  const { syncCloudStateNow, cloudSyncStatus, usesCreditCards } = useApp();
  const [open, setOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(null);
  const [fabDragging, setFabDragging] = useState(false);
  const fabPressTimer = useRef<number | null>(null);
  const fabPointerOffset = useRef({ x: 0, y: 0 });
  const fabMoved = useRef(false);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    const storedPosition = window.localStorage.getItem('saldopilot-fab-position-v1');

    if (storedPosition) {
      try {
        setFabPosition(clampFabPosition(JSON.parse(storedPosition) as { x: number; y: number }));
        return;
      } catch {
        window.localStorage.removeItem('saldopilot-fab-position-v1');
      }
    }

    setFabPosition(defaultFabPosition());
  }, []);

  useEffect(() => {
    const updatePosition = () => setFabPosition((current) => (current ? clampFabPosition(current) : defaultFabPosition()));
    window.addEventListener('resize', updatePosition);

    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  function clearFabTimer() {
    if (fabPressTimer.current !== null) {
      window.clearTimeout(fabPressTimer.current);
      fabPressTimer.current = null;
    }
  }

  function saveFabPosition(position: { x: number; y: number }) {
    const nextPosition = clampFabPosition(position);
    setFabPosition(nextPosition);
    window.localStorage.setItem('saldopilot-fab-position-v1', JSON.stringify(nextPosition));
  }

  function handleFabPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (window.matchMedia('(min-width: 1280px)').matches) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    fabPointerOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    fabMoved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);

    clearFabTimer();
    fabPressTimer.current = window.setTimeout(() => {
      setFabDragging(true);
    }, 350);
  }

  function handleFabPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!fabDragging) {
      return;
    }

    fabMoved.current = true;
    saveFabPosition({
      x: event.clientX - fabPointerOffset.current.x,
      y: event.clientY - fabPointerOffset.current.y,
    });
  }

  function handleFabPointerUp(event: PointerEvent<HTMLButtonElement>) {
    clearFabTimer();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (fabDragging) {
      setFabDragging(false);
      return;
    }

    if (!fabMoved.current) {
      setQuickActionOpen(true);
    }
  }

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await syncCloudStateNow();
      await logout();
    } catch (error) {
      console.error('No se pudo guardar el estado antes de cerrar sesión.', error);
      window.alert('No se pudieron guardar los datos antes de cerrar sesión. Revisa tu conexión e intenta nuevamente.');
      setLoggingOut(false);
    }
  };

  const visibleNavItems = usesCreditCards ? navItems : navItems.filter((item) => item.to !== '/tarjetas');
  const visibleMobileNavItems = usesCreditCards ? mobileNavItems : mobileNavItems.filter((item) => item.to !== '/tarjetas');

  const nav = (
    <nav className="space-y-1">
      {visibleNavItems.map((item) => (
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
        <SessionCard
          name={currentUser?.name ?? 'Usuario'}
          email={currentUser?.email ?? ''}
          onLogout={handleLogout}
          loggingOut={loggingOut}
          syncStatus={cloudSyncStatus}
          online={online}
        />
      </aside>

      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-stone-50/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl xl:hidden dark:border-white/10 dark:bg-zinc-950/90">
        <div className="flex h-14 items-center justify-between">
          <Brand compact />
          <div className="flex items-center gap-2">
            <SyncIndicator status={cloudSyncStatus} online={online} />
            <button className="icon-button h-9 w-9" onClick={() => setOpen(true)} aria-label="Abrir navegación">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-end bg-zinc-950/40 px-3 pb-3 backdrop-blur-sm xl:hidden">
          <aside className="max-h-[88vh] w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl dark:border-white/10 dark:bg-zinc-950">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-white/20" />
            <div className="flex items-center justify-between">
              <Brand compact />
              <button className="icon-button h-9 w-9" onClick={() => setOpen(false)} aria-label="Cerrar navegación">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5">{nav}</div>
            <SessionCard
              name={currentUser?.name ?? 'Usuario'}
              email={currentUser?.email ?? ''}
              onLogout={handleLogout}
              loggingOut={loggingOut}
              syncStatus={cloudSyncStatus}
              online={online}
            />
          </aside>
        </div>
      ) : null}

      <main className="px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 xl:ml-72 xl:px-10 xl:py-10">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/92 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-10px_30px_rgba(24,24,27,0.08)] backdrop-blur-xl xl:hidden dark:border-white/10 dark:bg-zinc-950/92">
        <div className={`grid gap-1 ${usesCreditCards ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {visibleMobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition ${
                  isActive
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                    : 'text-zinc-500 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-white/10'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="max-w-full truncate px-1">{item.label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold text-zinc-500 transition active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-white/10"
            onClick={() => setOpen(true)}
            aria-label="Abrir más opciones"
          >
            <Menu className="h-5 w-5" />
            <span>Más</span>
          </button>
        </div>
      </nav>

      <button
        type="button"
        className={`fixed z-30 flex h-14 w-14 touch-none items-center justify-center rounded-lg bg-zinc-950 text-white shadow-2xl shadow-zinc-950/30 transition-transform dark:bg-white dark:text-zinc-950 xl:hidden ${fabDragging ? 'scale-110 ring-4 ring-zinc-950/15 dark:ring-white/20' : 'active:scale-95'}`}
        style={fabPosition ? { left: fabPosition.x, top: fabPosition.y } : { right: '1rem', bottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}
        onPointerDown={handleFabPointerDown}
        onPointerMove={handleFabPointerMove}
        onPointerUp={handleFabPointerUp}
        onPointerCancel={() => {
          clearFabTimer();
          setFabDragging(false);
        }}
        aria-label="Abrir acción rápida"
      >
        <Plus className="h-6 w-6" />
      </button>

      <QuickActionSheet open={quickActionOpen} onClose={() => setQuickActionOpen(false)} />
    </div>
  );
}

function SyncIndicator({ status, online }: { status: 'idle' | 'saving' | 'saved' | 'error'; online: boolean }) {
  const label = !online ? 'Sin conexión' : status === 'saving' ? 'Sincronizando' : status === 'error' ? 'Pendiente' : 'Guardado';
  const dotClassName = !online || status === 'error' ? 'bg-amber-500' : status === 'saving' ? 'bg-sky-500' : 'bg-emerald-500';

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white/80 px-2 py-1 text-[11px] font-bold text-zinc-500 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-900/80 dark:text-zinc-300 dark:ring-white/10">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} />
      {label}
    </div>
  );
}

function defaultFabPosition() {
  return clampFabPosition({
    x: window.innerWidth - 72,
    y: window.innerHeight - 156,
  });
}

function clampFabPosition(position: { x: number; y: number }) {
  const size = 56;
  const margin = 12;
  const bottomNavSpace = 88;
  const maxX = Math.max(margin, window.innerWidth - size - margin);
  const maxY = Math.max(margin, window.innerHeight - size - bottomNavSpace);

  return {
    x: Math.min(maxX, Math.max(margin, position.x)),
    y: Math.min(maxY, Math.max(margin, position.y)),
  };
}

function SessionCard({
  name,
  email,
  onLogout,
  loggingOut,
  syncStatus,
  online,
}: {
  name: string;
  email: string;
  onLogout: () => void;
  loggingOut: boolean;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  online: boolean;
}) {
  return (
    <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5 xl:mt-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-sm font-bold text-white dark:bg-white dark:text-zinc-950">
          {name.trim().slice(0, 1).toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-zinc-950 dark:text-white">{name}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
        </div>
      </div>
      <div className="mt-3">
        <SyncIndicator status={syncStatus} online={online} />
      </div>
      <button
        className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
        onClick={onLogout}
        disabled={loggingOut}
        type="button"
      >
        <LogOut className="h-4 w-4" />
        {loggingOut ? 'Guardando...' : 'Cerrar sesión'}
      </button>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950">
        <PiggyBank className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-bold text-zinc-950 dark:text-white">Saldopilot</p>
        {!compact ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Finanzas personales</p> : null}
      </div>
    </div>
  );
}
