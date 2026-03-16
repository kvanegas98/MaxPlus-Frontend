import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv2, WifiOff, ExternalLink, Share2,
  Power, RefreshCw, Monitor,
} from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { settingsService } from '../../services/settingsService';
import { cn } from '../../lib/utils';
import { ShareMenuModal } from '../../components/common/ShareMenuModal';

// ─── Deterministic gradient + icon from product name ──────────────────────────
const PLACEHOLDERS = [
  { grad: 'from-violet-600 via-purple-600 to-indigo-700',  emoji: '📺' },
  { grad: 'from-blue-600 via-indigo-600 to-violet-700',    emoji: '📡' },
  { grad: 'from-purple-600 via-violet-500 to-blue-600',    emoji: '🎬' },
  { grad: 'from-indigo-600 via-blue-500 to-cyan-600',      emoji: '🎥' },
  { grad: 'from-violet-700 via-purple-500 to-pink-600',    emoji: '💎' },
  { grad: 'from-blue-700 via-indigo-500 to-purple-600',    emoji: '🔑' },
  { grad: 'from-cyan-600 via-blue-600 to-indigo-700',      emoji: '📱' },
  { grad: 'from-purple-700 via-violet-600 to-indigo-500',  emoji: '⚡' },
];

function hashName(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return PLACEHOLDERS[h % PLACEHOLDERS.length];
}

// ─── Card skeleton ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 animate-pulse">
      <div className="aspect-[4/3] bg-slate-100 dark:bg-zinc-800" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded-lg w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-lg w-full" />
        <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-lg w-2/3" />
        <div className="h-5 bg-slate-100 dark:bg-zinc-800 rounded-lg w-1/3 mt-2" />
      </div>
    </div>
  );
}

// ─── Product card ──────────────────────────────────────────────────────────────
function MenuProductCard({ product, index }) {
  const { grad, emoji } = hashName(product.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.055, 0.55),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden',
        'border border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600',
        'transition-all duration-300',
        'hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/60',
        !product.isActive && 'opacity-50',
      )}
    >
      {/* ── Image ── */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center text-5xl select-none', grad)}>
            {emoji}
          </div>
        )}
        {product.imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        )}
        {!product.isActive && (
          <div className="absolute inset-0 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-700 text-[10px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-[0.22em]">
              Inactivo
            </span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col gap-1.5">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-1">{product.name}</h3>
        {product.description && (
          <p className="text-[11px] text-slate-500 dark:text-zinc-500 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <div className="pt-1.5 flex items-center justify-between">
          <span className="text-violet-400 font-black text-lg tracking-tight leading-none">
            C$ {product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Phone frame preview ───────────────────────────────────────────────────────
function PhonePreview({ menuEnabled }) {
  const iframeRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey(k => k + 1);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor size={13} className="text-slate-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vista previa</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reload}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Recargar preview"
          >
            <RefreshCw size={12} />
          </button>
          <Link
            to="/menu-publico?preview=1"
            target="_blank"
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* Phone frame */}
      <div className="flex-1 relative flex items-start justify-center">
        <div className="w-full max-w-[320px] bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl shadow-slate-900/40 border border-slate-700">
          {/* Notch */}
          <div className="flex justify-center mb-1.5">
            <div className="w-20 h-1.5 bg-slate-800 rounded-full" />
          </div>
          {/* Screen */}
          <div className="relative rounded-[2rem] overflow-hidden bg-white" style={{ aspectRatio: '9/19' }}>
            <iframe
              key={reloadKey}
              ref={iframeRef}
              src="/menu-publico?preview=1"
              title="Vista previa del menú"
              className="absolute inset-0 w-full h-full border-0"
              style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
            />
            {/* Disabled overlay */}
            {!menuEnabled && (
              <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                <Power size={22} className="text-slate-400" />
                <p className="text-[11px] font-bold text-slate-300 text-center px-4">Menú deshabilitado para el público</p>
              </div>
            )}
          </div>
          {/* Home bar */}
          <div className="flex justify-center mt-1.5">
            <div className="w-16 h-1 bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MenuBoard ─────────────────────────────────────────────────────────────────
export function MenuBoard() {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    products,
    loading,
    error,
  } = useMenu();

  const { token } = useAuthContext();
  const { toast }  = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [menuEnabled,      setMenuEnabled]      = useState(true);
  const [togglingMenu,     setTogglingMenu]      = useState(false);

  useEffect(() => {
    settingsService.getSettings(token)
      .then(s => { setCurrentSettings(s); setMenuEnabled(!!s?.publicMenuEnabled); })
      .catch(() => {});
  }, [token]);

  const [currentSettings, setCurrentSettings] = useState(null);

  const handleToggleMenu = async () => {
    const next = !menuEnabled;
    setTogglingMenu(true);
    try {
      const base = currentSettings ?? await settingsService.getSettings(token);
      await settingsService.updateSettings({ ...base, publicMenuEnabled: next }, token);
      setMenuEnabled(next);
      toast.success(next ? 'Menú digital habilitado' : 'Menú digital deshabilitado');
    } catch {
      toast.error('No se pudo actualizar el estado del menú');
    } finally {
      setTogglingMenu(false);
    }
  };

  const availableCount = products.filter(p => p.isActive).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col">

      {/* ── Hero header ── */}
      <header className="relative bg-white dark:bg-zinc-950 overflow-hidden border-b border-slate-200 dark:border-zinc-800/60">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 80% at 50% -10%, rgba(124,58,237,0.10) 0%, transparent 60%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">

            {/* Brand */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Tv2 size={20} className="text-violet-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  MaxPlus IPTV
                </h1>
                <p className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400/70 mt-0.5 font-semibold tracking-widest uppercase">
                  Menú Digital
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">

              {/* Toggle habilitar/deshabilitar */}
              <button
                onClick={handleToggleMenu}
                disabled={togglingMenu}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 disabled:opacity-60',
                  menuEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30',
                )}
              >
                {togglingMenu ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <span className={cn('w-2 h-2 rounded-full', menuEnabled ? 'bg-emerald-500' : 'bg-red-500')} />
                )}
                {menuEnabled ? 'Menú habilitado' : 'Menú deshabilitado'}
                {/* Toggle pill */}
                <span className={cn(
                  'relative inline-flex w-8 h-4 rounded-full transition-colors ml-1',
                  menuEnabled ? 'bg-emerald-500' : 'bg-red-400 dark:bg-red-600',
                )}>
                  <span className={cn(
                    'absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all',
                    menuEnabled ? 'translate-x-4' : 'translate-x-0.5',
                  )} />
                </span>
              </button>

              {/* Ver público */}
              <Link
                to="/menu-publico?preview=1"
                target="_blank"
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg shadow-violet-600/20 transition-all active:scale-95"
              >
                <ExternalLink size={14} />
                <span className="hidden xs:inline">Ver Público</span>
              </Link>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-all active:scale-95"
                title="Compartir Menú"
              >
                <Share2 size={18} />
              </button>

              {/* Status */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full px-3 py-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider hidden xs:inline">
                  En línea
                </span>
                {!loading && !error && (
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 hidden sm:inline">
                    · {availableCount} disponibles
                  </span>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* ── Sticky category nav ── */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              layout
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 outline-none',
                selectedCategory === cat.id
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800',
              )}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Body: grid + preview ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 flex gap-8">

        {/* Products grid */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="popLayout">
            {!loading && !error && (
              <motion.div
                key={selectedCategory + '-label'}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-baseline justify-between mb-6"
              >
                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">
                  {categories.find(c => c.id === selectedCategory)?.name ?? 'Menú'}
                </h2>
                {products.length > 0 && (
                  <span className="text-[10px] font-bold text-zinc-600">
                    {products.length} {products.length === 1 ? 'producto' : 'productos'}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </motion.div>
            )}

            {!loading && error && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center gap-3">
                <WifiOff size={22} className="text-slate-400 dark:text-zinc-600" />
                <p className="text-slate-800 dark:text-zinc-300 font-semibold text-sm">No se pudo cargar el menú</p>
                <p className="text-slate-500 dark:text-zinc-600 text-xs max-w-xs">{error}</p>
              </motion.div>
            )}

            {!loading && !error && products.length === 0 && (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center gap-3">
                <span className="text-5xl mb-2 select-none">📺</span>
                <p className="text-slate-800 dark:text-zinc-300 font-semibold text-sm">Sin servicios</p>
                <p className="text-slate-500 dark:text-zinc-600 text-xs">No hay servicios disponibles en esta categoría.</p>
              </motion.div>
            )}

            {!loading && !error && products.length > 0 && (
              <motion.div key={selectedCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((p, i) => <MenuProductCard key={p.id} product={p} index={i} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Phone preview — sticky sidebar */}
        <aside className="hidden xl:flex flex-col w-80 shrink-0">
          <div className="sticky top-24 h-[calc(100vh-8rem)]">
            <PhonePreview menuEnabled={menuEnabled} />
          </div>
        </aside>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-zinc-800/60 py-6 mt-4">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 font-medium text-sm">
          © {new Date().getFullYear()} MaxPlus IPTV — Todos los derechos reservados
        </div>
      </footer>

      <ShareMenuModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        businessName="MaxPlus IPTV"
      />
    </div>
  );
}
