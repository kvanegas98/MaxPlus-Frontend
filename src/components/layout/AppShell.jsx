import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Package, Settings, ChevronLeft, ChevronRight,
  Search, Menu, X, MonitorPlay, TrendingUp, Tv,
  Users, LogOut, UserCog, Receipt, PlayCircle, ShoppingBag, Landmark,
  Sun, Moon, RefreshCw, Layers
} from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useAuthContext } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useMenu } from '../../hooks/useMenu';
import { CommandPalette } from '../CommandPalette';
import { cn } from '../../lib/utils';

// ─── Nav config ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/dashboard',         label: 'Dashboard',       icon: TrendingUp,   shortLabel: 'Dashboard' },
  { path: '/dashboard/history', label: 'Ventas',          icon: Receipt,      shortLabel: 'Ventas' },
  { path: '/catalog',           label: 'Servicios',       icon: Package,      shortLabel: 'Servicios' },
  { path: '/clientes',          label: 'Clientes',        icon: Users,        shortLabel: 'Clientes' },
  { path: '/iptv-accounts',     label: 'Suscripciones',   icon: Tv,           shortLabel: 'Suscripc.' },
  { path: '/demos',             label: 'Demos',           icon: PlayCircle,   shortLabel: 'Demos' },
  { path: '/orders',            label: 'Órdenes Web',     icon: ShoppingBag,  shortLabel: 'Órdenes' },
  { path: '/payment-methods',   label: 'Métodos de Pago', icon: Landmark,     shortLabel: 'Pagos' },
  { path: '/menu',              label: 'Menú Digital',    icon: MonitorPlay,  shortLabel: 'Menú' },
  { path: '/plataformas',        label: 'Plataformas',     icon: Layers,       shortLabel: 'Plataf.',  adminOnly: true },
  { path: '/users',             label: 'Usuarios',        icon: UserCog,      shortLabel: 'Usuarios', adminOnly: true },
  { path: '/settings',          label: 'Ajustes',         icon: Settings,     shortLabel: 'Ajustes' },
];

// Route order for directional slide transition
const ROUTE_ORDER = NAV_ITEMS.map(n => n.path);

// ─── useNavDirection ──────────────────────────────────────────────────────────
function useNavDirection(pathname) {
  const [dir, setDir] = useState(0);
  const prev = useRef(pathname);

  useEffect(() => {
    const pi = ROUTE_ORDER.findIndex(r => pathname.startsWith(r));
    const ci = ROUTE_ORDER.findIndex(r => prev.current.startsWith(r));
    if (pi !== -1 && ci !== -1 && pi !== ci) {
      setDir(pi > ci ? 1 : -1);
    } else {
      setDir(0);
    }
    prev.current = pathname;
  }, [pathname]);

  return dir;
}

// ─── LogoutConfirmModal ───────────────────────────────────────────────────────
function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.94 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{   opacity: 0, y: 14, scale: 0.94 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        className="relative z-10 w-full max-w-xs bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700/60"
      >
        <div className="p-7 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <LogOut size={24} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white font-display">¿Cerrar sesión?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Serás redirigido a la pantalla de inicio</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-11 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-11 rounded-2xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/25"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sidebar item ─────────────────────────────────────────────────────────────
function SidebarItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end
      onClick={onNavigate}
      className={({ isActive }) => cn(
        'group relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-300',
        isActive
          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
      )}
    >
      {({ isActive }) => (
        <>
          <span className={cn(
            'relative flex items-center justify-center w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110',
            isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
          )}>
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            {item.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-black leading-none">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 overflow-hidden whitespace-nowrap font-display"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && item.badge > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black leading-none">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
          {collapsed && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-xl
                            opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200
                            shadow-xl whitespace-nowrap z-50 translate-x-1 group-hover:translate-x-0">
              {item.label}{item.badge > 0 ? ` (${item.badge})` : ''}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar({ collapsed, onToggleCollapse, businessName, onLogout, navItems, isDark, onToggleDark }) {
  return (
    <motion.aside
      animate={{ inlineSize: collapsed ? 80 : 250 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="hidden md:flex flex-col h-screen bg-white/80 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/50 shrink-0 z-30"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 h-[72px]">
        <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shrink-0 shadow-lg shadow-violet-500/20">
          <Tv size={18} className="text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <p className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap leading-none font-display uppercase tracking-wider">{businessName}</p>
            <p className="text-[10px] font-bold text-violet-500 whitespace-nowrap mt-0.5 tracking-tight">IPTV</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <SidebarItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100/60 dark:border-slate-700/50 flex flex-col gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          className={cn(
            'flex items-center gap-3 px-3 h-10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest',
            collapsed ? 'justify-center' : '',
            'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
          )}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </button>
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          {collapsed
            ? <ChevronRight size={18} />
            : <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><ChevronLeft size={16} /> Colapsar</div>}
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 h-11 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all font-bold text-xs uppercase tracking-widest"
        >
          <LogOut size={16} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </motion.aside>
  );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────
function MobileTopbar({ title, onMenuOpen, greeting }) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white/80 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-700/50 shrink-0 z-20 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-xl shadow-md violet-glow-sm">
          <Tv size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          {greeting ? (
            <>
              <span className="font-black text-slate-900 dark:text-white text-sm font-display tracking-tight leading-tight">{greeting}</span>
              <span className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-[0.15em] leading-none mt-0.5">MaxPlus IPTV</span>
            </>
          ) : (
            <span className="font-black text-slate-900 dark:text-white text-sm font-display tracking-tight">{title}</span>
          )}
        </div>
      </div>
      <button
        onClick={onMenuOpen}
        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
      >
        <Menu size={20} />
      </button>
    </header>
  );
}

// ─── Desktop Top Bar ──────────────────────────────────────────────────────────
function DesktopTopbar({ title, cashierName, onPaletteOpen, isDark, onToggleDark }) {
  const initials = cashierName.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || 'A';
  return (
    <header className="hidden md:flex items-center justify-between px-8 h-[72px] bg-white/50 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-700/40 shrink-0">
      <h1 className="text-lg font-black text-slate-900 dark:text-white font-display tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        {/* ⌘K trigger */}
        <button
          onClick={onPaletteOpen}
          className="group flex items-center gap-3 px-4 h-11 bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-sm text-slate-400 w-64 cursor-pointer hover:bg-white dark:hover:bg-slate-700/80 hover:border-violet-300 dark:hover:border-violet-600 transition-all shadow-sm"
        >
          <Search size={16} className="group-hover:text-violet-500 transition-colors" />
          <span className="font-medium">Comando rápido...</span>
          <span className="ml-auto text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg font-bold">⌘ K</span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-600 transition-all"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-200/60 dark:border-slate-700/60">
          <div className="text-right hidden lg:block">
            <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter font-display">{cashierName}</p>
            <p className="text-[9px] font-bold text-violet-600 dark:text-violet-400 mt-1 uppercase tracking-widest">Operador</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-violet-500/20 ring-2 ring-white/50 dark:ring-slate-900/50">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ isOpen, onClose, businessName, cashierName, onLogout, navItems, isDark, onToggleDark }) {
  const initials = cashierName.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || 'A';
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 md:hidden"
          />
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-white/95 dark:bg-slate-900/98 backdrop-blur-2xl z-50 shadow-2xl md:hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-violet-600 rounded-2xl shadow-lg shadow-violet-600/20">
                  <Tv size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white font-display tracking-tight uppercase">{businessName}</p>
                  <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400">MENÚ DE CONTROL</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => (
                <SidebarItem key={item.path} item={item} collapsed={false} onNavigate={onClose} />
              ))}
            </nav>
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              {/* Dark mode toggle */}
              <button
                onClick={onToggleDark}
                className="w-full flex items-center gap-3 px-4 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                {isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-violet-500/20">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate font-display">{cashierName}</p>
                  <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Operador</p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
function BottomNav({ navItems }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
      <div className="flex overflow-x-auto scrollbar-hide items-center px-1 h-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) => cn(
                'flex-none min-w-[72px] px-1 flex flex-col items-center justify-center gap-1.5 relative transition-all duration-300',
                isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-600'
              )}
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                    className={cn('relative p-2 rounded-2xl transition-all duration-300 flex items-center justify-center', isActive ? 'bg-violet-50 dark:bg-violet-900/30 shadow-sm shadow-violet-600/10' : '')}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </motion.div>
                  <span className={cn('text-[9px] font-black uppercase tracking-tighter font-display text-center leading-tight truncate w-full', isActive ? 'opacity-100' : 'opacity-60')}>
                    {item.shortLabel}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute -bottom-1 w-8 h-1 bg-violet-500 dark:bg-violet-400 rounded-t-full nav-indicator"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Pull-to-refresh indicator ────────────────────────────────────────────────
function PullIndicator({ pullY, refreshing }) {
  const THRESHOLD = 70;
  const triggered = pullY >= THRESHOLD || refreshing;
  const visible   = pullY > 0 || refreshing;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.15 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-xl border',
            triggered
              ? 'bg-violet-500 text-white border-violet-400 shadow-violet-500/30'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          )}>
            <RefreshCw size={13} className={cn(refreshing && 'animate-spin')} />
            {refreshing ? 'Actualizando...' : triggered ? 'Soltar para actualizar' : 'Deslizar para actualizar'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
export function AppShell({ children }) {
  const [sidebarCollapsed,   setSidebarCollapsed]   = useState(false);
  const [drawerOpen,         setDrawerOpen]         = useState(false);
  const [paletteOpen,        setPaletteOpen]        = useState(false);
  const [logoutConfirm,      setLogoutConfirm]      = useState(false);
  const [pullY,              setPullY]              = useState(0);
  const [pullRefreshing,     setPullRefreshing]     = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const { pathname }  = useLocation();
  const { settings }  = useSettings();
  const auth          = useAuthContext();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { menuItems }  = useMenu();

  const direction   = useNavDirection(pathname);
  const isAdmin     = auth.user?.roleName === 'Admin';

  // Fetch pending orders count for nav badge
  useEffect(() => {
    if (!auth.token) return;
    const fetch = () => {
      orderService.getAll('Pending', auth.token)
        .then(data => setPendingOrdersCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [auth.token]);

  const visibleNav  = NAV_ITEMS
    .filter(n => !n.adminOnly || isAdmin)
    .map(n => n.path === '/orders' && pendingOrdersCount > 0 ? { ...n, badge: pendingOrdersCount } : n);
  const activeItem  = NAV_ITEMS.find(n => pathname.startsWith(n.path));
  const title       = activeItem?.label ?? 'Panel';
  const businessName = settings.businessName || 'MaxPlus IPTV';
  const cashierName  = auth.user?.fullName || 'Usuario';
  const firstName    = cashierName.split(' ')[0];
  // Greeting shown in mobile topbar only on dashboard
  const mobileGreeting = pathname === '/dashboard' ? `Hola, ${firstName} 👋` : null;

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setLogoutConfirm(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Pull-to-refresh on main scroll area ────────────────────────────────────
  const mainRef   = useRef(null);
  const ptStartY  = useRef(null);
  const ptPulling = useRef(false);
  const THRESHOLD = 70;
  const MAX_PULL  = 100;

  const onTouchStart = useCallback((e) => {
    if ((mainRef.current?.scrollTop ?? 0) > 4) return;
    ptStartY.current  = e.touches[0].clientY;
    ptPulling.current = true;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!ptPulling.current || ptStartY.current === null) return;
    if ((mainRef.current?.scrollTop ?? 0) > 4) {
      ptPulling.current = false; ptStartY.current = null; setPullY(0); return;
    }
    const delta = e.touches[0].clientY - ptStartY.current;
    if (delta > 0) {
      e.preventDefault();
      setPullY(Math.min(delta * 0.45, MAX_PULL));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!ptPulling.current) return;
    ptPulling.current = false;
    const captured = pullY;
    setPullY(0);
    ptStartY.current = null;
    if (captured >= THRESHOLD) {
      setPullRefreshing(true);
      window.dispatchEvent(new CustomEvent('pull-refresh'));
      // Give listeners time to complete; 1.5 s is enough for API calls
      await new Promise(r => setTimeout(r, 1500));
      setPullRefreshing(false);
    }
  }, [pullY]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => setLogoutConfirm(true);
  const confirmLogout = () => { setLogoutConfirm(false); auth.logout(); };

  // ── Route slide variants ───────────────────────────────────────────────────
  const slideVariants = {
    enter:  (d) => ({ x: d !== 0 ? (d > 0 ? 60  : -60) : 0, opacity: 0 }),
    center:         { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d !== 0 ? (d > 0 ? -40 :  40) : 0, opacity: 0 }),
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans selection:bg-violet-100 selection:text-violet-900">

      <DesktopSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        businessName={businessName}
        onLogout={handleLogout}
        navItems={visibleNav}
        isDark={isDark}
        onToggleDark={toggleDark}
      />
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        businessName={businessName}
        cashierName={cashierName}
        onLogout={handleLogout}
        navItems={visibleNav}
        isDark={isDark}
        onToggleDark={toggleDark}
      />

      <div className="flex flex-col flex-1 min-w-0 h-full">
        <MobileTopbar title={title} onMenuOpen={() => setDrawerOpen(true)} greeting={mobileGreeting} />
        <DesktopTopbar
          title={title}
          cashierName={cashierName}
          onPaletteOpen={() => setPaletteOpen(true)}
          isDark={isDark}
          onToggleDark={toggleDark}
        />
        <main
          ref={mainRef}
          className="relative flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 md:pb-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 dark:from-slate-950 via-white dark:via-slate-900 to-slate-100/50 dark:to-slate-900"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <PullIndicator pullY={pullY} refreshing={pullRefreshing} />
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={pathname}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav navItems={visibleNav} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        products={menuItems ?? []}
      />

      {/* Logout confirm modal */}
      <AnimatePresence>
        {logoutConfirm && (
          <LogoutConfirmModal
            onConfirm={confirmLogout}
            onCancel={() => setLogoutConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
