import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Tv, Receipt, Award,
  ChevronDown, ChevronUp, Clock,
  RotateCcw, AlertCircle, ShoppingBag,
  CheckCircle, XCircle, Mail, Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { orderService } from '../../services/orderService';
import { useAuthContext } from '../../context/AuthContext';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { cn, fmtCRD } from '../../lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────
const METHOD_LABELS = {
  efectivo_crd: 'Efectivo C$',
  efectivo_usd: 'Efectivo USD',
  transferencia:'Transferencia',
};

const TYPE_CONFIG = {
  venta:      { label: 'Nueva Venta', icon: Tv,        color: 'violet' },
  renovacion: { label: 'Renovación',  icon: RotateCcw, color: 'orange'  },
};

// Limpia fechas con demasiados decimales que pueden confundir al constructor Date
function cleanDate(iso) {
  if (!iso) return null;
  // Si tiene más de 3 decimales en los milisegundos, los recortamos
  return iso.replace(/(\.\d{3})\d+/, '$1');
}

function fmtTime(iso) {
  const cleaned = cleanDate(iso);
  if (!cleaned) return '--:--';
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso) {
  const cleaned = cleanDate(iso);
  if (!cleaned) return '--:--';
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'violet', delay = 0 }) {
  const iconColors = {
    violet: 'text-violet-500 bg-violet-50 dark:bg-violet-900/30',
    blue:   'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
    amber:  'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
    green:  'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
    red:    'text-red-500 bg-red-50 dark:bg-red-900/30'
  };
  const textColors = {
    violet: 'text-violet-600 dark:text-violet-400',
    blue:   'text-blue-600 dark:text-blue-400',
    amber:  'text-amber-600 dark:text-amber-400',
    green:  'text-emerald-600 dark:text-emerald-400',
    red:    'text-red-600 dark:text-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.4 }}
      className="bg-white dark:bg-[#151520] rounded-[1.5rem] p-5 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col justify-between aspect-auto min-h-[110px] hover:-translate-y-1 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={cn("p-2 rounded-xl", iconColors[color] || iconColors.violet)}>
           <Icon size={16} strokeWidth={2.5} />
        </div>
      </div>
      <div className={cn("text-2xl font-black font-display tracking-tight", textColors[color] || "text-slate-900 dark:text-slate-100")}>
        {value}
      </div>
    </motion.div>
  );
}

// ─── Platforms Chips ────────────────────────────────────────────────────────
function PlatformsChips({ topProducts }) {
  if (!topProducts?.length) return null;
  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-violet-500', 'bg-pink-500'];
  return (
    <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 -mx-6 px-6 sm:mx-0 sm:px-0">
      {topProducts.map((p, i) => (
         <div key={p.name || p.productName} className="flex-none bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
            <div className={cn("w-2 h-2 rounded-full", colors[i % colors.length])} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.name || p.productName}</span>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded-md">{p.unitsSold || p.totalQuantity || 0}</span>
         </div>
      ))}
    </div>
  );
}

function RecentActivity({ orders }) {
  if (!orders?.length) return null;
  return (
    <div className="bg-white dark:bg-[#151520] rounded-3xl border border-slate-100 dark:border-white/5 p-3 space-y-2 shadow-sm">
      {orders.map((o, i) => {
         const isPending = o.status === 'Pending' || !o.status;
         const isPaid = (o.paymentType || '').toLowerCase() === 'contado' || o.paymentMethod || o.status === 'Approved';
         const badgeColor = isPending ? 'bg-amber-100/50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' : (isPaid ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-blue-100/50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400');
         const badgeText = isPending ? 'Pendiente' : (isPaid ? 'Pagado' : 'Resuelto');
         const typeText = (o.orderType || '').toLowerCase() === 'venta' ? 'Nueva Venta' : 'Renovación';
         const initial = (o.customerName || o.registeredClientName || 'C')[0].toUpperCase();

         return (
           <div key={o.id || `activity-${i}`} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-[#1E1E2C] rounded-2xl transition-colors shrink-0">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-primary/20 text-slate-600 dark:text-violet-400 flex items-center justify-center font-bold text-base shrink-0 border border-slate-200 dark:border-white/5 shadow-sm">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                   {typeText} - {o.customerName || o.registeredClientName}
                 </p>
                 <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                   {o.serviceName || (o.details?.[0]?.productName) || 'Servicio'} • {fmtDate(o.createdAt || o.saleDate || o.timestamp)}
                 </p>
              </div>
              <div className="shrink-0">
                 <span className={cn("text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full", badgeColor)}>
                   {badgeText}
                 </span>
              </div>
           </div>
         );
      })}
    </div>
  );
}

// ─── Hourly bar chart (CSS-only) ─────────────────────────────────────────────
function HourlyChart({ data }) {
  const bars = useMemo(() => {
    if (!data) return [];
    const maxTotal = Math.max(...data.map(d => d.totalSales || d.total || 0), 1);
    const peakTotal = Math.max(...data.map(d => d.totalSales || d.total || 0));
    
    return data.map(d => {
      const val = d.totalSales || d.total || 0;
      const hourStr = String(d.hour ?? '0').split(':')[0]; 
      return {
        h: hourStr,
        total: val,
        pct: (val / maxTotal) * 100,
        isPeak: val > 0 && val === peakTotal
      };
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-300 gap-3 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
        <Clock size={24} className="opacity-20" />
        <span className="text-xs font-black uppercase tracking-widest">Sin ventas registradas</span>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-1.5 sm:gap-2 h-44 pt-6 px-1">
      {bars.map(({ h, total, pct, isPeak }) => (
        <div key={h} className="flex flex-col items-center gap-2 flex-1 max-w-[3rem] group relative">
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 translate-y-2 group-hover:translate-y-0">
             <div className="bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-black rounded-xl px-3 py-2 whitespace-nowrap shadow-2xl ring-1 ring-white/20">
                <span className="text-white/60 block mb-1 uppercase tracking-widest">{h}:00 h</span>
                <span className="text-sm font-display">C$ {(total || 0).toFixed(0)}</span>
             </div>
             <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
          </div>
          
          <div className="w-full flex-1 flex items-end">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.02 * parseInt(h), duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ blockSize: `${Math.max(pct, total > 0 ? 10 : 0)}%`, originY: 1 }}
              className={cn(
                'w-full rounded-t-xl transition-all duration-500 relative overflow-hidden',
                total > 0
                  ? isPeak
                    ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-[0_-4px_12px_rgba(245,158,11,0.3)]'
                    : 'bg-gradient-to-t from-violet-600 to-purple-400 shadow-[0_-4px_12px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-100/50 dark:bg-slate-700/50'
              )}
            >
               {total > 0 && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </motion.div>
          </div>
          
          <span className={cn('text-[9px] font-black uppercase tracking-tighter leading-none transition-colors', isPeak ? 'text-amber-600' : 'text-slate-400')}>
            {h}h
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Top products ─────────────────────────────────────────────────────────────
function TopProducts({ data }) {
  const top = data || [];

  if (top.length === 0)  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3 border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem]">
       <Award size={32} className="opacity-20 text-slate-400" />
       <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sin datos de productos</p>
    </div>
  );

  const maxQty = top[0]?.unitsSold || top[0]?.unitsSold || 1;
  const ICONS = ['🏆', '🥈', '🥉'];

  return (
    <div className="space-y-5 px-1 py-2">
      {top.map(({ name, unitsSold, totalQuantity, revenue, totalRevenue }, i) => (
        <div key={name} className="group">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#151520] border border-slate-100 dark:border-white/5 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 group-hover:bg-slate-50 dark:group-hover:bg-[#1E1E2C] transition-all duration-300">
               {i < 3 ? ICONS[i] : <span className="text-[12px] font-bold text-slate-400">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors font-display w-full sm:flex-1">
                    {name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0 self-start sm:pt-0.5">
                    {unitsSold || totalQuantity || 0} unidades
                  </span>
               </div>
               <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ inlineSize: 0 }}
                    animate={{ inlineSize: `${((unitsSold || totalQuantity || 0) / maxQty) * 100}%` }}
                    transition={{ delay: 0.1 * i, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      i === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                      i === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-300' :
                      i === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                      'bg-gradient-to-r from-violet-600 to-violet-400'
                    )}
                  />
               </div>
            </div>
            <div className="text-right shrink-0 min-w-[80px]">
               <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  C$ {fmtCRD(revenue || totalRevenue || 0)}
               </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Order type breakdown (API can be used later, keeping local for orders) ─
function TypeBreakdown({ orders }) {
  const breakdown = useMemo(() => {
    const map = { venta: 0, renovacion: 0 };
    orders.forEach((o) => {
      const type = (o.orderType || '').toLowerCase();
      if (type === 'venta' || type === 'nueva venta') map.venta++;
      else if (type === 'renovacion' || type === 'renovación') map.renovacion++;
    });
    return Object.entries(map).map(([type, count]) => ({ type, count })).filter(t => t.count > 0);
  }, [orders]);

  if (breakdown.length === 0) return null;

  const COLOR = { violet: 'bg-violet-500', blue: 'bg-blue-500', orange: 'bg-orange-500' };

  return (
    <div className="flex gap-2 flex-wrap">
      {breakdown.map(({ type, count }) => {
        const cfg = TYPE_CONFIG[type] ?? { label: type, color: 'violet' };
        const Icon = cfg.icon;
        return (
          <div key={type} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold',
            COLOR[cfg.color]
          )}>
            <Icon size={12} />
            {cfg.label}
            <span className="bg-white/25 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Order row ────────────────────────────────────────────────────────────────
function OrderRow({ order }) {
  const [expanded, setExpanded] = useState(false);
  const typeKey = (order.orderType || '').toLowerCase();
  const cfg     = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.llevar;
  const Icon    = cfg.icon;
  const PILL    = { violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-700/50', blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-700/50', orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-700/50' };
  
  // Soporte para API real (totalProducts) o mock (items)
  const itemCount = order.totalProducts ?? (order.items ?? []).reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="bg-white/40 dark:bg-[#151520]/70 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm group hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/60 dark:hover:bg-[#1E1E2C] transition-colors"
      >
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-[1.05]', PILL[cfg.color])}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              {order.numeroOrden || `Orden ${order.invoiceId || order.id}`}
            </span>
            <div className="flex gap-1.5">
               {(order.paymentType || '').toLowerCase() === 'credito' ? (
                 <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Crédito</span>
               ) : (
                 <span className="bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Contado</span>
               )}
               <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-transparent', PILL[cfg.color])}>
                 {cfg.label}
               </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 leading-none">
             <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-slate-400" />
                {fmtTime(order.saleDate || order.timestamp)}
             </div>
             <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
             <span>{itemCount} {itemCount === 1 ? 'Producto' : 'Productos'}</span>
             {(order.customerName || order.registeredClientName) && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-violet-600 dark:text-violet-400 font-semibold truncate max-w-[120px]">
                    {order.customerName || order.registeredClientName}
                  </span>
                </>
             )}
          </div>
        </div>
         <div className="flex items-center gap-3 shrink-0">
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display tracking-tight">
            C$ {fmtCRD(order.totalAmount ?? order.total)}
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#252535] flex items-center justify-center text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-[#2A2A3A] transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ blockSize: 0, opacity: 0 }} animate={{ blockSize: 'auto', opacity: 1 }} exit={{ blockSize: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-slate-100/50 dark:border-slate-700/50 space-y-3">
              {(order.details ?? []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                        <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md mr-1.5">{item.quantity}</span>
                        {item.productName || item.name}
                     </p>
                     {item.note && <p className="text-[10px] text-amber-600 font-bold italic pl-10 mt-1">↳ {item.note}</p>}
                  </div>
                  <span className="text-xs font-black text-slate-900 font-display shrink-0">C$ {fmtCRD(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700 mt-2">
                <div className="flex items-center gap-3">
                   {order.paymentType === 'credito' ? (
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</span>
                        <span className="text-xs font-black text-blue-600 font-display">Cliente: {order.customerName}</span>
                     </div>
                   ) : (
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Método de Pago</span>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-display uppercase">{METHOD_LABELS[order.paymentMethod?.toLowerCase()] ?? 'Personalizado'}</span>
                     </div>
                   )}
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Transacción</p>
                   <p className="text-lg font-black text-violet-600 font-display leading-none">C$ {fmtCRD(order.totalAmount)}</p>
                </div>
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
  const [filter,       setFilter]       = useState('Hoy'); // 'Hoy' | 'Semana'
  const [summary,      setSummary]      = useState(null);
  const [hourlyData,   setHourlyData]   = useState([]);
  const [topProducts,  setTopProducts]  = useState([]);
  const [history,      setHistory]      = useState([]);
  const [pendingOrders,setPendingOrders]= useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, h, t, hist, pending] = await Promise.all([
        reportService.getSummary(filter, token),
        reportService.getSalesByHour(token),
        reportService.getTopProducts(filter, 5, token),
        reportService.getOrderHistory({ pageNumber: 1, pageSize: 8 }, token),
        orderService.getAll('Pending', token),
      ]);
      setSummary(s);
      setHourlyData(Array.isArray(h) ? h : []);
      setTopProducts(Array.isArray(t) ? t : []);
      setHistory(Array.isArray(hist) ? hist : (hist?.items ?? hist?.data ?? []));
      setPendingOrders(Array.isArray(pending) ? pending : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !summary) return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <DashboardSkeleton />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-6">
      <div className="w-24 h-24 rounded-[2.5rem] bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
         <AlertCircle size={40} />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">Análisis Bloqueado</h2>
        <p className="text-sm font-bold text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">{error}</p>
      </div>
      <button 
        onClick={fetchData}
        className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all"
      >
        Reintentar Conexión
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-[#F8F9FC] dark:bg-[#0A0A0F]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[#F8F9FC]/80 dark:bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 py-5 shrink-0 gap-4 flex-wrap">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-1 block">Panel de Inicio</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display tracking-tight">Dashboard General</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Hola, {firstName} 👋 &nbsp;·&nbsp; {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Hoy / Semana toggle */}
          <div className="flex items-center p-1 bg-white dark:bg-[#151520] border border-slate-200 dark:border-white/5 rounded-xl gap-1 shadow-sm">
            {['Hoy', 'Semana'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                  filter === f
                    ? 'bg-slate-100 dark:bg-[#1E1E2C] text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/dashboard/history')}
            className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-xl bg-violet-600 text-white text-[10px] font-bold shadow-[0_4px_10px_rgba(124,59,237,0.3)] hover:scale-[1.02] transition-all uppercase tracking-widest"
          >
            <Receipt size={16} /> Facturas
          </button>
          <button
            onClick={fetchData}
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#151520] border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-200 dark:hover:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all shadow-sm"
            title="Actualizar"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-8 max-w-5xl mx-auto w-full pb-20">
        {/* ── Stat cards ─────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={CheckCircle} label="VENTAS" color="blue" delay={0}
            value={`C$ ${fmtCRD(summary?.totalSales ?? 0)}`}
          />
          <StatCard
            icon={AlertCircle} label="TICKET PROMEDIO" color="red" delay={0.1}
            value={`C$ ${fmtCRD(summary?.averageTicket ?? summary?.avgTicket ?? 0)}`}
          />
          <StatCard
            icon={ShoppingBag} label="PENDIENTES" color="amber" delay={0.2}
            value={pendingOrders.length}
          />
          <StatCard
            icon={TrendingUp} label="FACTURAS" color="green" delay={0.3}
            value={summary?.totalOrders ?? 0}
          />
        </section>

        {/* ── Plataformas ──────────────────────────────────────────────── */}
        <section className="py-2">
           <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase mb-4">Plataformas</h3>
           <PlatformsChips topProducts={topProducts} />
        </section>

        {/* ── Actividad Reciente ───────────────────────────────────────── */}
        <section className="py-2">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase">Actividad Reciente</h3>
              <button
                 onClick={() => navigate('/dashboard/history')}
                 className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors"
              >
                 Ver todo
              </button>
           </div>
           {/* Combine latest pending orders and latest history for rich feed */}
           <RecentActivity orders={[...pendingOrders, ...history].slice(0, 5)} />
        </section>

        <div className="grid lg:grid-cols-12 gap-8">
           {/* Left Column: Data Visuals */}
           <div className="lg:col-span-12 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                 {/* Hourly Sales */}
                 <motion.section
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                    className="bg-white/40 dark:bg-[#151520]/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-white/5 shadow-sm"
                 >
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 font-display">Ventas por Hora (24h)</h3>
                       <div className="min-w-[8px] min-h-[8px] w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(124,59,237,0.5)] animate-pulse" />
                    </div>
                    <HourlyChart data={hourlyData} />
                 </motion.section>

                 {/* Top Products Detailed */}
                 <motion.section
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    className="bg-white/40 dark:bg-[#151520]/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-white/5 shadow-sm"
                 >
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 font-display">Productos Más Vendidos</h3>
                       <TrendingUp size={18} className="text-slate-400" />
                    </div>
                    <TopProducts data={topProducts} />
                 </motion.section>
              </div>

              {/* Pending Orders */}
              {pendingOrders.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display tracking-tight uppercase">Órdenes Pendientes</h3>
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{pendingOrders.length}</span>
                    </div>
                    <button
                      onClick={() => navigate('/orders')}
                      className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest hover:text-violet-700 transition-colors"
                    >
                      Ver todas →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {pendingOrders.slice(0, 6).map(o => (
                      <div key={o.id} className="bg-white dark:bg-[#151520] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{o.customerName}</p>
                            <p className="text-[11px] font-medium text-violet-600 dark:text-violet-400 truncate mt-0.5">{o.serviceName}</p>
                          </div>
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full uppercase tracking-widest shrink-0 border border-amber-200 dark:border-amber-500/20">Pendiente</span>
                        </div>
                        <div className="space-y-1">
                          {o.customerPhone && (
                            <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                              <Phone size={10} className="shrink-0" /> {o.customerPhone}
                            </p>
                          )}
                          {o.customerEmail && (
                            <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                              <Mail size={10} className="shrink-0" /> {o.customerEmail}
                            </p>
                          )}
                          <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Clock size={10} className="shrink-0" /> {fmtDate(o.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate('/orders')}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={11} /> Revisar
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Invoice History */}
              <motion.section
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                 className="space-y-6"
              >
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display tracking-tight uppercase">Últimas Facturas</h3>
                    <button
                      onClick={() => navigate('/dashboard/history')}
                      className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest hover:text-violet-700 transition-colors"
                    >
                      Ver todas →
                    </button>
                 </div>
                 
                 {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-[#151520]/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10 text-slate-400 gap-4">
                       <Receipt size={64} className="opacity-20" />
                       <div className="text-center">
                          <p className="text-sm font-bold uppercase tracking-widest">Sin transacciones hoy</p>
                          <p className="text-[11px] font-medium mt-1 text-slate-500">Las órdenes aparecerán aquí al ser procesadas.</p>
                       </div>
                    </div>
                 ) : (
                    <div className="grid gap-4">
                       {history.map((order, idx) => (
                          <OrderRow key={order.id} order={order} />
                       ))}
                    </div>
                 )}
              </motion.section>
           </div>
        </div>
      </main>
    </div>
  );
}
