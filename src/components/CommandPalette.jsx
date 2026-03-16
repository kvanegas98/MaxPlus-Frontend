import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, X, CornerDownLeft } from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Static nav commands ──────────────────────────────────────────────────────
const NAV_COMMANDS = [
  { id: 'nav-dashboard', label: 'Dashboard',            desc: 'Estadísticas y reportes',        path: '/dashboard',         icon: '📊' },
  { id: 'nav-orders',    label: 'Historial de órdenes', desc: 'Todas las transacciones',        path: '/dashboard/history', icon: '🧾' },
  { id: 'nav-pos',       label: 'Nueva Venta',          desc: 'Registrar venta',                path: '/pos',               icon: '🛒' },
  { id: 'nav-catalog',   label: 'Servicios',            desc: 'Gestionar servicios',            path: '/catalog',           icon: '📦' },
  { id: 'nav-clientes',  label: 'Clientes',             desc: 'Gestionar clientes',             path: '/clientes',          icon: '👥' },
  { id: 'nav-subs',      label: 'Suscripciones',        desc: 'Suscripciones activas',          path: '/subscriptions',     icon: '📺' },
  { id: 'nav-iptv',      label: 'Cuentas IPTV',         desc: 'Cuentas proveedor IPTV',         path: '/iptv-accounts',     icon: '🖥️' },
  { id: 'nav-demos',     label: 'Demos',                desc: 'Solicitudes de demo',            path: '/demos',             icon: '▶️'  },
  { id: 'nav-menu',      label: 'Menú Digital',         desc: 'Menú público para clientes',     path: '/menu',              icon: '📡' },
  { id: 'nav-settings',  label: 'Ajustes',              desc: 'Configuración del sistema',      path: '/settings',          icon: '⚙️'  },
];

// ─── CommandPalette ────────────────────────────────────────────────────────────
export function CommandPalette({ isOpen, onClose, products = [] }) {
  const [query, setQuery]       = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const listRef   = useRef(null);

  // Reset & focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Build result groups
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();

    const navMatches = q
      ? NAV_COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
      : NAV_COMMANDS;

    const prodMatches = q
      ? products
          .filter(p => p.name?.toLowerCase().includes(q) || p.categoryName?.toLowerCase().includes(q))
          .slice(0, 6)
          .map(p => ({
            id:   `prod-${p.id}`,
            label: p.name,
            desc:  `C$ ${Number(p.price ?? 0).toFixed(2)}${p.categoryName ? ` — ${p.categoryName}` : ''}`,
            path:  '/pos',
            icon:  '📺',
          }))
      : [];

    const result = [];
    if (navMatches.length)  result.push({ group: 'Navegación', items: navMatches });
    if (prodMatches.length) result.push({ group: 'Servicios',  items: prodMatches });
    return result;
  }, [query, products]);

  const flat = useMemo(() => groups.flatMap(g => g.items), [groups]);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const selectItem = useCallback((item) => {
    navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape')     { onClose(); return; }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && flat[activeIdx]) selectItem(flat[activeIdx]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-start justify-center px-4" style={{ paddingBlockStart: '14vh' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{   opacity: 0, y: -8,  scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 420 }}
            className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/25 overflow-hidden border border-slate-200/60 dark:border-slate-700/60"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100 dark:border-slate-700/60">
              <Search size={17} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar páginas, productos..."
                className="flex-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:outline-none font-medium"
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd className="px-2 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-600 shrink-0">Esc</kbd>
              )}
            </div>

            {/* Results list */}
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto scrollbar-hide">
              {flat.length === 0 && query ? (
                <div className="py-14 text-center">
                  <p className="text-sm font-medium text-slate-400">Sin resultados para &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                groups.map((grp) => (
                  <div key={grp.group}>
                    <div className="px-4 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/60 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700/60">
                      {grp.group}
                    </div>
                    {grp.items.map((item) => {
                      const idx      = flat.indexOf(item);
                      const isActive = idx === activeIdx;
                      return (
                        <button
                          key={item.id}
                          data-active={isActive}
                          onClick={() => selectItem(item)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                            isActive
                              ? 'bg-violet-50 dark:bg-violet-900/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                          )}
                        >
                          <span className="text-xl w-8 text-center select-none shrink-0">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm font-semibold truncate',
                              isActive ? 'text-violet-700 dark:text-violet-400' : 'text-slate-900 dark:text-slate-100'
                            )}>
                              {item.label}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{item.desc}</p>
                          </div>
                          {isActive && (
                            <div className="flex items-center gap-1 shrink-0">
                              <CornerDownLeft size={13} className="text-violet-500" />
                              <ArrowRight size={13} className="text-violet-500" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Footer hint */}
              <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-700/20">
                {[['↑↓', 'navegar'], ['↵', 'abrir'], ['Esc', 'cerrar']].map(([key, label]) => (
                  <span key={key} className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[9px] font-black">{key}</kbd>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
