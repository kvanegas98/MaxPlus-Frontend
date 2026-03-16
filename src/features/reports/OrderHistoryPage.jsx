import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Calendar, ChevronLeft, ChevronRight,
  Receipt, Clock, User, Hash, Plus, X,
  AlertCircle, Loader2, Download, ChevronUp, ChevronDown,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn, fmtCRD } from '../../lib/utils';
import { OrderDetailModal } from './OrderDetailModal';
import { VoidReasonModal } from '../../components/ui/VoidReasonModal';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { NuevaVentaPage } from '../pos/NuevaVentaPage';

// ─── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const STATUS_THEMES = {
  'Completada': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-700/50',
  'Pagada':     'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-700/50',
  'Anulada':    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-700/50',
  'Pendiente':  'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-700/50',
};

function cleanDate(iso) {
  if (!iso) return null;
  return iso.replace(/(\.\d{3})\d+/, '$1');
}

function fmtDate(iso) {
  const cleaned = cleanDate(iso);
  if (!cleaned) return '-';
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-NI', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ─── OrderHistoryPage ─────────────────────────────────────────────────────────
export function OrderHistoryPage() {
  const { token } = useAuthContext();
  const { toast } = useToast();
  
  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerName: '',
    orderNumber: '',
  });

  // Sort state
  const [sortField, setSortField] = useState(null);
  const [sortDir,   setSortDir]   = useState('asc');

  // Modal State
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Void Logic
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [orderToVoid, setOrderToVoid] = useState(null);
  const [voidLoading, setVoidLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [nuevaVentaOpen, setNuevaVentaOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reportService.getOrderHistory({
        startDate:    filters.startDate    || undefined,
        endDate:      filters.endDate      || undefined,
        customerName: filters.customerName || undefined,
        orderNumber:  filters.orderNumber  || undefined,
        pageNumber:   page,
        pageSize:     PAGE_SIZE,
      }, token);
      // Handle both array and paged-object responses
      setOrders(Array.isArray(data) ? data : (data?.items ?? data?.data ?? []));
    } catch (err) {
      setError(err.message || 'Error al cargar el historial de facturas.');
    } finally {
      setLoading(false);
    }
  }, [token, filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Pull-to-refresh (mobile gesture from AppShell)
  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('pull-refresh', handler);
    return () => window.removeEventListener('pull-refresh', handler);
  }, [fetchData]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedOrders = useMemo(() => {
    if (!sortField) return orders;
    return [...orders].sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb ?? '').toLowerCase(); }
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [orders, sortField, sortDir]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      customerName: '',
      orderNumber: '',
    });
    setPage(1);
  };

  const handleRowClick = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleVoidRequest = (order) => {
    setOrderToVoid(order);
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoid = async (reason) => {
    setVoidLoading(true);
    const invoiceId = orderToVoid?.invoiceId || orderToVoid?.id || selectedOrderId;
    try {
      await reportService.voidOrder(invoiceId, reason, token);
      setIsVoidModalOpen(false);
      setIsModalOpen(false);
      setIsSuccessModalOpen(true);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error al anular la factura');
    } finally {
      setVoidLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 pt-6 pb-0 shrink-0">
        <div className="flex items-center justify-between gap-4 pb-4">
          <div>
            <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] block mb-0.5">Historial</span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white font-display tracking-tight">Ventas</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(s => !s)}
              className={cn(
                'md:hidden p-2.5 rounded-xl border transition-all',
                showFilters
                  ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 border-violet-200 dark:border-violet-700'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400',
              )}
            >
              <Search size={16} />
            </button>
            <button
              onClick={fetchData}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-violet-600 hover:border-violet-300 dark:hover:border-violet-600 transition-all"
              title="Actualizar"
            >
              <Clock size={16} />
            </button>
            <button
              onClick={() => setNuevaVentaOpen(true)}
              className="flex items-center gap-2 h-10 px-4 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-600/25 transition-all"
            >
              <Plus size={15} strokeWidth={3} />
              <span className="hidden sm:inline">Nueva Venta</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className={cn('mb-4 grid-cols-1 md:grid-cols-4 gap-3', showFilters ? 'grid' : 'hidden md:grid')}>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Fecha Inicio</span>
            <div className="relative group">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full h-11 pl-10 pr-3 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all uppercase"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Fecha Fin</span>
            <div className="relative group">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full h-11 pl-10 pr-3 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all uppercase"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Cliente</span>
            <div className="relative group">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="text"
                placeholder="BUSCAR CLIENTE..."
                value={filters.customerName}
                onChange={(e) => handleFilterChange('customerName', e.target.value)}
                className="w-full h-11 pl-10 pr-3 text-[10px] font-black border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">No. Orden</span>
            <div className="relative group">
              <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="text"
                placeholder="ORD-202X-000..."
                value={filters.orderNumber}
                onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
                className="w-full h-11 pl-10 pr-3 text-[10px] font-black border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700/50 rounded-2xl flex items-center gap-3 text-sm text-red-600 dark:text-red-400 font-bold shadow-sm">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  {[
                    { label: 'Órden',      field: 'numeroOrden',  align: 'left'   },
                    { label: 'Fecha',      field: 'saleDate',     align: 'left'   },
                    { label: 'Cliente',    field: 'customerName', align: 'left'   },
                    { label: 'Tipo/Pago',  field: 'orderType',    align: 'left'   },
                    { label: 'Monto',      field: 'totalAmount',  align: 'right'  },
                    { label: 'Estado',     field: 'status',       align: 'center' },
                  ].map(({ label, field, align }) => {
                    const isActive = sortField === field;
                    const Icon = isActive && sortDir === 'asc' ? ChevronUp : ChevronDown;
                    return (
                      <th
                        key={field}
                        onClick={() => handleSort(field)}
                        className={cn(
                          'px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] cursor-pointer select-none group transition-colors',
                          `text-${align}`,
                          isActive ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          <Icon
                            size={11}
                            className={cn(
                              'transition-opacity',
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                            )}
                          />
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-32 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-violet-500 opacity-60" />
                        <span className="text-xs font-black uppercase tracking-widest">Buscando transacciones...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-32 text-center text-slate-300">
                      <div className="flex flex-col items-center gap-4">
                        <Receipt size={48} className="opacity-10" />
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase tracking-widest">Sin resultados</p>
                          <p className="text-[10px] font-bold">No se encontraron órdenes con estos filtros</p>
                        </div>
                        <button 
                          onClick={clearFilters}
                          className="mt-2 text-xs font-black text-violet-600 uppercase tracking-widest hover:underline"
                        >
                          Limpiar Filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order) => (
                    <tr 
                      key={order.invoiceId} 
                      onClick={() => handleRowClick(order.invoiceId)}
                      className="hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                            <Hash size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white font-display">{order.numeroOrden}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{fmtDate(order.saleDate).split(',')[0]}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{fmtDate(order.saleDate).split(',')[1]}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[180px]">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                            {order.customerName || order.registeredClientName || 'Cliente Final'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {order.totalProducts} {order.totalProducts === 1 ? 'Producto' : 'Productos'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.orderType}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border',
                              order.paymentType === 'Crédito' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-700/50' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                            )}>
                              {order.paymentType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-slate-900 dark:text-white font-display tracking-tight">C$ {fmtCRD(order.totalAmount)}</p>
                        {order.pendingBalance > 0 && (
                          <p className="text-[10px] font-black text-red-500 mt-0.5 uppercase tracking-tighter">Debe: C$ {fmtCRD(order.pendingBalance)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={cn(
                            'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300',
                            STATUS_THEMES[order.status] || 'bg-slate-100 text-slate-500 border-slate-200'
                          )}>
                            {order.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                Página {page}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={orders.length < PAGE_SIZE}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={selectedOrderId}
        token={token}
        onVoid={handleVoidRequest}
      />

      <VoidReasonModal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        onConfirm={handleConfirmVoid}
        loading={voidLoading}
        title="Anular Factura"
        message={`¿Estás seguro que deseas anular la factura ${orderToVoid?.numeroOrden}? Esta acción devolverá los productos al inventario y ajustará las cuentas.`}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="¡Factura Anulada!"
        message="La factura ha sido anulada exitosamente y los saldos han sido actualizados."
      />

      {/* Nueva Venta modal overlay */}
      <AnimatePresence>
        {nuevaVentaOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setNuevaVentaOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-[90] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <NuevaVentaPage onClose={() => { setNuevaVentaOpen(false); fetchData(); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
