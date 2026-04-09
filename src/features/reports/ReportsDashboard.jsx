import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Tv, Receipt, Award,
  ChevronDown, ChevronUp, Clock,
  RotateCcw, AlertCircle, ShoppingBag,
  CheckCircle, XCircle, Phone, X,
  Wallet, Star, Bell, Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { orderService }  from '../../services/orderService';
import { useAuthContext } from '../../context/AuthContext';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { cn, fmtCRD } from '../../lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cleanDate(iso) {
  if (!iso) return null;
  return iso.replace(/(\.\d{3})\d+/, '$1');
}
function fmtTime(iso) {
  const d = new Date(cleanDate(iso));
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateShort(iso) {
  const d = new Date(cleanDate(iso));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function daysFromNow(iso) {
  const d = new Date(cleanDate(iso));
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}

const TYPE_CONFIG = {
  venta:      { label: 'Nueva Venta', icon: Tv,        color: 'violet' },
  renovacion: { label: 'Renovación',  icon: RotateCcw, color: 'orange' },
};
const PILL = {
  violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-700/50',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-700/50',
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color = 'violet', delay = 0, onClick }) {
  const ring = {
    violet: 'from-violet-500/20 to-violet-600/5 border-violet-100 dark:border-violet-700/30',
    blue:   'from-blue-500/20 to-blue-600/5 border-blue-100 dark:border-blue-700/30',
    amber:  'from-amber-500/20 to-amber-600/5 border-amber-100 dark:border-amber-700/30',
    green:  'from-emerald-500/20 to-emerald-600/5 border-emerald-100 dark:border-emerald-700/30',
    red:    'from-red-500/20 to-red-600/5 border-red-100 dark:border-red-700/30',
    pink:   'from-pink-500/20 to-pink-600/5 border-pink-100 dark:border-pink-700/30',
  };
  const ic = {
    violet: 'text-violet-600 bg-violet-100 dark:bg-violet-900/40',
    blue:   'text-blue-600 bg-blue-100 dark:bg-blue-900/40',
    amber:  'text-amber-600 bg-amber-100 dark:bg-amber-900/40',
    green:  'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40',
    red:    'text-red-600 bg-red-100 dark:bg-red-900/40',
    pink:   'text-pink-600 bg-pink-100 dark:bg-pink-900/40',
  };
  const txt = {
    violet: 'text-violet-700 dark:text-violet-300',
    blue:   'text-blue-700 dark:text-blue-300',
    amber:  'text-amber-700 dark:text-amber-300',
    green:  'text-emerald-700 dark:text-emerald-300',
    red:    'text-red-700 dark:text-red-300',
    pink:   'text-pink-700 dark:text-pink-300',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}
      onClick={onClick}
      className={cn(
        'relative bg-gradient-to-br border rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-all duration-200',
        ring[color] ?? ring.violet,
        onClick && 'cursor-pointer hover:-translate-y-1 hover:shadow-md active:scale-[0.98]',
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</span>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', ic[color] ?? ic.violet)}>
          <Icon size={15} strokeWidth={2.5} />
        </div>
      </div>
      <div className={cn('text-2xl font-black tracking-tight leading-none', txt[color] ?? txt.violet)}>{value}</div>
      {sub && <p className="text-[10px] text-slate-400 font-bold">{sub}</p>}
      {onClick && (
        <div className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest text-slate-400">ver →</div>
      )}
    </motion.div>
  );
}

// ─── Expiring Panel ───────────────────────────────────────────────────────────
function ExpiringPanel({ days, onClose }) {
  const { token } = useAuthContext();
  const navigate  = useNavigate();
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getExpiring(days, token)
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days, token]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative ml-auto w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
              Vencen en {days} días
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{data.length} suscripcion{data.length !== 1 ? 'es' : ''}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <RotateCcw size={20} className="animate-spin text-violet-500" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <CheckCircle size={32} className="opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Sin vencimientos</p>
            </div>
          ) : data.map(s => {
            const remaining = daysFromNow(s.expirationDate);
            const urgency   = remaining <= 3 ? 'red' : remaining <= 7 ? 'amber' : 'blue';
            const urgencyTxt = { red: 'text-red-600', amber: 'text-amber-600', blue: 'text-blue-600' };
            const urgencyBg  = { red: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800', amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800', blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' };
            return (
              <div key={s.id} className={cn('rounded-2xl border p-4 space-y-3', urgencyBg[urgency])}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{s.customerName}</p>
                    <p className="text-[11px] text-violet-600 dark:text-violet-400 font-bold mt-0.5">{s.serviceName}</p>
                    {s.accessUser && <p className="text-[10px] text-slate-400 mt-0.5">{s.accessUser}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-black', urgencyTxt[urgency])}>
                      {remaining != null ? (remaining === 0 ? 'Hoy' : `${remaining}d`) : '—'}
                    </p>
                    <p className="text-[10px] text-slate-400">{fmtDateShort(s.expirationDate)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {s.customerPhone && (
                    <a
                      href={`https://wa.me/${s.customerPhone.replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                    >
                      <Phone size={11} /> WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => { onClose(); navigate(`/clientes/${s.customerId}`); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                  >
                    <RotateCcw size={11} /> Renovar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Hourly Chart ─────────────────────────────────────────────────────────────
function HourlyChart({ data }) {
  const bars = useMemo(() => {
    if (!data?.length) return [];
    const maxVal  = Math.max(...data.map(d => d.totalSales || 0), 1);
    const peakVal = Math.max(...data.map(d => d.totalSales || 0));
    return data.map(d => ({
      h:      d.hour,
      sales:  d.totalSales  || 0,
      orders: d.totalOrders || 0,
      pct:    ((d.totalSales || 0) / maxVal) * 100,
      isPeak: d.totalSales > 0 && d.totalSales === peakVal,
    }));
  }, [data]);

  if (!bars.length) return (
    <div className="flex items-center justify-center h-40 gap-3 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl text-slate-300">
      <Clock size={20} className="opacity-40" />
      <span className="text-xs font-black uppercase tracking-widest">Sin ventas registradas hoy</span>
    </div>
  );

  return (
    <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-44 pt-4 px-1">
      {bars.map(({ h, sales, orders, pct, isPeak }) => (
        <div key={h} className="flex flex-col items-center gap-1.5 flex-1 max-w-[2.5rem] group relative">
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100">
            <div className="bg-slate-900/95 text-white text-[10px] font-black rounded-xl px-3 py-2 whitespace-nowrap shadow-xl ring-1 ring-white/10">
              <span className="text-white/50 block text-[9px] uppercase tracking-widest mb-0.5">{h}:00</span>
              <span className="text-sm">C$ {(sales).toFixed(0)}</span>
              {orders > 0 && <span className="text-white/60 block text-[9px]">{orders} factura{orders !== 1 ? 's' : ''}</span>}
            </div>
            <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
          </div>

          <div className="w-full flex-1 flex items-end">
            <motion.div
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ delay: 0.015 * h, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: `${Math.max(pct, sales > 0 ? 8 : 0)}%`, originY: 1 }}
              className={cn(
                'w-full rounded-t-lg transition-all duration-500 relative overflow-hidden',
                sales > 0
                  ? isPeak
                    ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-[0_-4px_12px_rgba(245,158,11,0.3)]'
                    : 'bg-gradient-to-t from-violet-600 to-purple-400'
                  : 'bg-slate-100 dark:bg-slate-700/50'
              )}
            >
              {sales > 0 && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </motion.div>
          </div>

          <span className={cn('text-[9px] font-black leading-none', isPeak ? 'text-amber-500' : 'text-slate-400')}>
            {h}h
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Top Products ─────────────────────────────────────────────────────────────
function TopProducts({ data }) {
  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-400">
      <Award size={28} className="opacity-20" />
      <p className="text-xs font-bold uppercase tracking-widest">Sin datos</p>
    </div>
  );
  const maxQty = data[0]?.unitsSold || 1;
  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-4">
      {data.map(({ name, unitsSold, totalRevenue }, i) => (
        <div key={name} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-base shrink-0 border border-slate-100 dark:border-slate-700">
            {i < 3 ? MEDALS[i] : <span className="text-xs font-black text-slate-400">{i + 1}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1.5 gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-violet-600 transition-colors">{name}</span>
              <span className="text-[10px] font-black text-slate-400 shrink-0">{unitsSold} uds</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(unitsSold / maxQty) * 100}%` }}
                transition={{ delay: 0.1 * i, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'h-full rounded-full',
                  i === 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                  i === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-300' :
                  i === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                             'bg-gradient-to-r from-violet-600 to-violet-400'
                )}
              />
            </div>
          </div>
          <div className="text-right shrink-0 min-w-[72px]">
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">C$ {fmtCRD(totalRevenue || 0)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────
function OrderRow({ order }) {
  const [expanded, setExpanded] = useState(false);
  const typeKey = (order.orderType || '').toLowerCase();
  const cfg     = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.venta;
  const Icon    = cfg.icon;

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-200 dark:hover:border-slate-600 transition-all group">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
      >
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', PILL[cfg.color])}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{order.numeroOrden}</span>
            <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border', PILL[cfg.color])}>{cfg.label}</span>
            {order.paymentMethod && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{order.paymentMethod}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1"><Clock size={10} />{fmtTime(order.saleDate)}</span>
            <span>·</span>
            <span className="text-violet-600 dark:text-violet-400 font-bold truncate max-w-[140px]">{order.customerName || order.registeredClientName}</span>
            <span>·</span>
            <span>{order.totalProducts} producto{order.totalProducts !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-black text-slate-900 dark:text-white">C$ {fmtCRD(order.totalAmount)}</span>
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
              {(order.details ?? []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-baseline gap-4">
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md mr-2 text-[10px]">{item.quantity}</span>
                    {item.concept}
                    {item.discountAmount > 0 && <span className="ml-2 text-emerald-600 font-bold text-[10px]">-C$ {fmtCRD(item.discountAmount)}</span>}
                  </p>
                  <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">C$ {fmtCRD(item.subTotal)}</span>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-black text-violet-600 dark:text-violet-400">Total: C$ {fmtCRD(order.totalAmount)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ReportsDashboard ─────────────────────────────────────────────────────────
export function ReportsDashboard() {
  const { token, user } = useAuthContext();
  const navigate  = useNavigate();
  const firstName = (user?.fullName || 'Equipo').split(' ')[0];

  const [filter,         setFilter]         = useState('Hoy');
  const [summary,        setSummary]        = useState(null);
  const [dashSummary,    setDashSummary]    = useState(null);
  const [hourlyData,     setHourlyData]     = useState([]);
  const [topProducts,    setTopProducts]    = useState([]);
  const [history,        setHistory]        = useState([]);
  const [pendingCount,   setPendingCount]   = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [expiringPanel,  setExpiringPanel]  = useState(null); // null | 7 | 30

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [s, ds, h, t, hist, pending] = await Promise.all([
        reportService.getSummary(filter, token),
        reportService.getDashboardSummary({}, token),
        reportService.getSalesByHour(token),
        reportService.getTopProducts(filter, 5, token),
        reportService.getOrderHistory({ pageNumber: 1, pageSize: 5 }, token),
        orderService.getAll('Pending', token),
      ]);
      setSummary(s);
      setDashSummary(ds);
      setHourlyData(Array.isArray(h) ? h : []);
      setTopProducts(Array.isArray(t) ? t : []);
      setHistory(Array.isArray(hist) ? hist : (hist?.items ?? hist?.data ?? []));
      setPendingCount(Array.isArray(pending) ? pending.length : 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !summary) return (
    <div className="flex-1 overflow-y-auto scrollbar-hide"><DashboardSkeleton /></div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-6">
      <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
        <AlertCircle size={36} />
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Error al cargar</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">{error}</p>
      </div>
      <button onClick={fetchData}
        className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
        Reintentar
      </button>
    </div>
  );

  // byOrderType breakdown
  const byType = Array.isArray(summary?.byOrderType) ? summary.byOrderType : [];
  const typeBreakdown = byType.map(t => `${t.totalOrders} ${t.orderType.toLowerCase()}${t.totalOrders !== 1 ? 's' : ''}`).join(' · ');

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-slate-50 dark:bg-[#0A0A0F]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-slate-50/90 dark:bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-5 py-4 gap-4 flex-wrap shrink-0">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">Panel de Inicio</p>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Hola, {firstName} 👋</h1>
          <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* HOY / SEMANA */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl gap-0.5">
            {['Hoy', 'Semana'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                  filter === f
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                )}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/dashboard/history')}
            className="hidden sm:flex items-center gap-2 px-4 h-9 rounded-xl bg-violet-600 text-white text-[10px] font-black shadow-lg shadow-violet-500/30 hover:scale-[1.02] transition-all uppercase tracking-widest">
            <Receipt size={14} /> Facturas
          </button>
          <button onClick={fetchData}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-violet-600 transition-colors">
            <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full pb-24">

        {/* ── Fila 1: KPIs ────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard icon={Wallet}     color="blue"   delay={0}    label="Ventas"        value={`C$ ${fmtCRD(summary?.totalSales ?? 0)}`}           sub={typeBreakdown || undefined} />
            <KpiCard icon={TrendingUp} color="violet" delay={0.05} label="Ticket Prom."  value={`C$ ${fmtCRD(summary?.averageTicket ?? 0)}`} />
            <KpiCard icon={ShoppingBag} color="amber" delay={0.1}  label="Pendientes"    value={pendingCount}  onClick={() => navigate('/orders')} />
            <KpiCard icon={Receipt}    color="green"  delay={0.15} label="Facturas"       value={summary?.totalOrders ?? 0} />
            <KpiCard icon={Star}       color="pink"   delay={0.2}  label="Demos Hoy"     value={summary?.totalDemosToday ?? 0} />
          </div>
        </section>

        {/* ── Fila 2: Suscripciones ────────────────────────────────────────── */}
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Estado de Suscripciones</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard icon={CheckCircle} color="green" delay={0.25} label="Activas"        value={dashSummary?.activeSubscriptions ?? 0} />
            <KpiCard icon={XCircle}     color="red"   delay={0.3}  label="Vencidas"       value={dashSummary?.expiredSubscriptions ?? 0} />
            <KpiCard icon={Bell}        color="amber" delay={0.35} label="Vencen en 7d"   value={dashSummary?.expiringIn7Days ?? 0}   onClick={() => setExpiringPanel(7)} />
            <KpiCard icon={Activity}    color="pink"  delay={0.4}  label="Vencen en 30d"  value={dashSummary?.expiringIn30Days ?? 0}  onClick={() => setExpiringPanel(30)} />
          </div>
        </section>

        {/* ── Fila 3: Gráfica + Top Productos ──────────────────────────────── */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Ventas por Hora</h3>
              <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.5)] animate-pulse" />
            </div>
            {filter === 'Semana' ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-xs font-bold gap-2 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                <Clock size={16} className="opacity-40" /> Solo disponible para Hoy
              </div>
            ) : (
              <HourlyChart data={hourlyData} />
            )}
          </div>

          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Más Vendidos</h3>
              <TrendingUp size={15} className="text-slate-400" />
            </div>
            <TopProducts data={topProducts} />
          </div>
        </section>

        {/* ── Fila 4: Últimas Facturas ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Últimas Facturas</h3>
            <button onClick={() => navigate('/dashboard/history')}
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors uppercase tracking-widest">
              Ver todas →
            </button>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 gap-3">
              <Receipt size={32} className="opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Sin transacciones</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(order => <OrderRow key={order.invoiceId || order.id} order={order} />)}
            </div>
          )}
        </section>

      </main>

      {/* ── Expiring Panel ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {expiringPanel && (
          <ExpiringPanel days={expiringPanel} onClose={() => setExpiringPanel(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
