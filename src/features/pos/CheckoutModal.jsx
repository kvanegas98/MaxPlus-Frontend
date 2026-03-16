import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Banknote, Smartphone, DollarSign,
  ChevronDown, ChevronUp, Check, RefreshCw,
  ArrowRight, Receipt, Tv, RotateCcw,
  User, Users, Search, CreditCard,
  Loader2, AlertCircle, Plus, MessageSquare
} from 'lucide-react';
import { cn, fmtCRD } from '../../lib/utils';
import { useAuthContext } from '../../context/AuthContext';

// ─── Config ────────────────────────────────────────────────────────────────────
const METODOS = [
  { id: 'efectivo_crd', label: 'Efectivo',  sub: 'Córdobas',    icon: Banknote,    color: 'violet' },
  { id: 'efectivo_usd', label: 'Efectivo',  sub: 'Dólares',     icon: DollarSign,  color: 'blue'    },
  { id: 'transferencia',label: 'Transfer.', sub: 'Banco/Sinpe', icon: Smartphone,  color: 'amber'   },
];

const BILLETES_CRD = [10, 20, 50, 100, 200, 500, 1000];
const BILLETES_USD = [1, 5, 10, 20, 50, 100];

const COLOR_MAP = {
  violet: { tab: 'bg-violet-600 text-white', ring: 'ring-violet-400' },
  blue:    { tab: 'bg-blue-600 text-white',    ring: 'ring-blue-400'    },
  amber:   { tab: 'bg-amber-500 text-white',   ring: 'ring-amber-400'   },
};

const ORDER_TYPE_CONFIG = {
  venta:      { label: 'Nueva Venta', Icon: Tv,        color: 'text-violet-600 bg-violet-50'  },
  renovacion: { label: 'Renovación',  Icon: RotateCcw, color: 'text-orange-600 bg-orange-50'  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function getOrderLabel(orderType, orderInfo) {
  if (orderInfo?.customerName) return `${ORDER_TYPE_CONFIG[orderType]?.label ?? orderType} · ${orderInfo.customerName}`;
  return ORDER_TYPE_CONFIG[orderType]?.label ?? 'Venta';
}

// ─── OrderSummary ─────────────────────────────────────────────────────────────
function OrderSummary({ cartItems, total, subtotal, deliveryFee, orderType, orderInfo }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ORDER_TYPE_CONFIG[orderType] ?? ORDER_TYPE_CONFIG.venta;

  return (
    <div className="glass bg-white/40 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-600/60 rounded-[2rem] overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/40 dark:hover:bg-slate-700/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Receipt size={16} strokeWidth={2.5} />
          </div>
          <div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resumen de Orden</span>
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {cartItems.reduce((s, i) => s + i.quantity, 0)} Productos
                </span>
                <span className={cn('flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter', cfg.color)}>
                  <cfg.Icon size={10} strokeWidth={3} />
                  {getOrderLabel(orderType, orderInfo)}
                </span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-black text-slate-900 dark:text-white font-display">C$ {fmtCRD(total)}</span>
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300">
            {expanded ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ blockSize: 0, opacity: 0 }} animate={{ blockSize: 'auto', opacity: 1 }} exit={{ blockSize: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 space-y-3 border-t border-slate-100/50 dark:border-slate-700/50 pt-4">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="space-y-1">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-tight">
                      <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md mr-1.5">{item.quantity}</span>
                      {item.name}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white shrink-0 font-display">
                      C$ {fmtCRD(item.price * item.quantity)}
                    </span>
                  </div>
                  {item.selectedModifiers?.map((m) => (
                    <p key={m.id} className="text-[10px] text-violet-600 font-bold pl-10 leading-none">
                      + {m.nombre ?? m.name}{(m.precio ?? m.price) > 0 ? ` (C$ ${fmtCRD(m.precio ?? m.price)})` : ''}
                    </p>
                  ))}
                  {item.note && (
                    <p className="text-[10px] text-amber-600 font-bold italic pl-10 leading-none">
                      ↳ {item.note}
                    </p>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-600 mt-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal Bruto</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-display">C$ {fmtCRD(subtotal || total)}</span>
              </div>
              {orderType === 'delivery' && deliveryFee > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Costo de Envío</span>
                  <span className="text-sm font-black text-orange-600 font-display">C$ {fmtCRD(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-600 mt-2">
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Total a Pagar</span>
                <span className="text-base font-black text-violet-600 font-display">C$ {fmtCRD(total)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CustomerPicker ───────────────────────────────────────────────────────────
function CustomerPicker({ clientes, selectedCustomer, onSelect, onClear }) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? clientes.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone && c.phone.includes(search))
      )
    : clientes;

  if (selectedCustomer) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/20 border-2 border-blue-200/50 dark:border-blue-700/50 rounded-3xl px-5 py-4 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-lg font-black font-display shadow-lg shadow-blue-600/20">
            {selectedCustomer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white leading-none font-display uppercase tracking-tight">{selectedCustomer.name}</p>
            {selectedCustomer.phone && (
              <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest leading-none">{selectedCustomer.phone}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClear}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 hover:shadow-md transition-all shadow-sm"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente por nombre o tel..."
          className="w-full h-12 pl-12 pr-4 text-sm border-2 border-slate-100 dark:border-slate-600 rounded-2xl bg-slate-50/50 dark:bg-slate-700/50 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all relative z-10 font-medium dark:text-white dark:placeholder:text-slate-500"
        />
      </div>

      {clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-3 glass rounded-3xl border border-dashed border-slate-200 dark:border-slate-600">
          <Users size={32} className="opacity-20 translate-y-1" />
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin Clientes</p>
            <p className="text-[10px] font-bold text-slate-300 mt-1">Registra clientes en el módulo de Clientes</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-xs font-bold text-slate-400 py-6 uppercase tracking-widest">Sin resultados para "{search}"</p>
      ) : (
        <div className="glass border border-slate-100 dark:border-slate-700 rounded-[2rem] overflow-hidden max-h-56 overflow-y-auto scrollbar-hide">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); }}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border-b border-slate-100/50 dark:border-slate-700/50 last:border-0 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-black group-hover:bg-blue-600 group-hover:text-white transition-all font-display">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight group-hover:text-blue-700 transition-colors">{c.name}</p>
                {c.phone && <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest">{c.phone}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SuccessScreen ────────────────────────────────────────────────────────────
function SuccessScreen({ paymentType, method, received, change, total, changeUsd, orderType, orderInfo, customerName, onNewOrder, tasaCambio, saleId, token }) {
  const metodo     = METODOS.find((m) => m.id === method);
  const isCash     = method === 'efectivo_crd' || method === 'efectivo_usd';
  const isUsd      = method === 'efectivo_usd';
  const orderCfg   = ORDER_TYPE_CONFIG[orderType] ?? ORDER_TYPE_CONFIG.llevar;
  const isCredito  = paymentType === 'credito';

  const handlePrintTicket = () => {
    if (!saleId) return;
    const url = `${import.meta.env.VITE_API_URL}/api/pos/invoice/${saleId}/ticket?token=${token}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center px-6 py-10 gap-6"
    >
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
        className={cn(
          'flex items-center justify-center w-24 h-24 rounded-[2rem] shadow-2xl relative',
          isCredito
            ? 'bg-blue-600 shadow-blue-600/30 text-white'
            : 'bg-violet-600 shadow-violet-600/30 text-white'
        )}
      >
        {isCredito
          ? <CreditCard size={44} strokeWidth={2.5} />
          : <Check size={48} strokeWidth={3.5} />
        }
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-[2rem] bg-white opacity-20"
        />
      </motion.div>

      <div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-2xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight"
        >
          {isCredito ? '¡Venta en Cuenta!' : '¡Transacción Exitosa!'}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 mt-2"
        >
          <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', orderCfg.color)}>
            <orderCfg.Icon size={12} strokeWidth={2.5} />
            {getOrderLabel(orderType, orderInfo)}
          </span>
          {isCredito && (
             <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-700/50">
                <User size={12} strokeWidth={2.5} /> {customerName}
             </span>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="w-full glass bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-600/60 rounded-[2rem] p-6 space-y-4"
      >
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Transacción</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-display">C$ {fmtCRD(total)}</span>
        </div>

        {isCredito ? (
          <div className="flex items-start gap-3 px-4 py-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-700/50 rounded-2xl text-left">
            <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-[11px] text-blue-800 dark:text-blue-300 font-bold leading-relaxed">
              La venta ha sido registrada en el saldo pendiente del cliente. Puedes ver los detalles en 'Cuentas por Cobrar'.
            </p>
          </div>
        ) : (
          isCash && (
            <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-600/50">
               <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recibido</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {isUsd ? `$ ${fmtUSD(received)}` : `C$ ${fmtCRD(received)}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Cambio / Vuelto</span>
                <div className="text-right">
                  <p className="text-3xl font-black text-violet-600 font-display leading-none">C$ {fmtCRD(change)}</p>
                  {isUsd && changeUsd > 0.005 && (
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">≈ $ {fmtUSD(changeUsd)} USD</p>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </motion.div>

      <div className="w-full grid grid-cols-2 gap-3 mt-2">
        {saleId && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handlePrintTicket}
            className="h-14 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-black rounded-2xl transition-all flex flex-col items-center justify-center gap-0.5 hover:border-violet-400 hover:text-violet-700"
          >
            <Receipt size={18} strokeWidth={2.5} />
            <span className="text-[9px] uppercase tracking-tighter">IMPRIMIR TICKET</span>
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onNewOrder}
          className={cn(
             "h-14 bg-slate-900 text-white font-black rounded-2xl transition-all flex flex-col items-center justify-center gap-0.5 shadow-xl shadow-slate-900/20",
             !saleId && "col-span-2"
          )}
        >
          <Plus size={18} strokeWidth={3} />
          <span className="text-[9px] uppercase tracking-tighter">NUEVA ORDEN</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── CheckoutModal ─────────────────────────────────────────────────────────────
export function CheckoutModal({
  isOpen, onClose, cartItems, total, subtotal, deliveryFee,
  orderType, orderInfo,
  paymentTypeProp = 'contado', customerProp = null,
  onConfirm, onNewOrder, tasaCambio = 36.5, clientes,
  settings,
  loading = false,
  apiError = ''
}) {
  const [paymentMode, setPaymentMode]         = useState(paymentTypeProp);
  const [selectedCustomer, setSelectedCustomer] = useState(customerProp);
  const [method, setMethod]                   = useState('efectivo_crd');
  const [received, setReceived]               = useState('');
  const [orderNote, setOrderNote]             = useState('');
  const [step, setStep]                       = useState('payment');  // 'payment' | 'success'
  const [lastSaleId, setLastSaleId]           = useState(null);
  const { token } = useAuthContext();

  const filteredMethods = METODOS.filter(m => {
    if (m.id === 'efectivo_crd') return settings?.cashCSEnabled ?? true;
    if (m.id === 'efectivo_usd') return settings?.cashUSDEnabled ?? true;
    if (m.id === 'transferencia') return settings?.transferEnabled ?? true;
    return true;
  });

  // Ajustar método inicial si el default está deshabilitado
  useEffect(() => {
    if (isOpen && settings) {
      if (settings.cashCSEnabled) setMethod('efectivo_crd');
      else if (settings.cashUSDEnabled) setMethod('efectivo_usd');
      else if (settings.transferEnabled) setMethod('transferencia');
    }
  }, [isOpen, settings]);
  const inputRef = useRef(null);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setPaymentMode(paymentTypeProp);
      setSelectedCustomer(customerProp);
      setMethod('efectivo_crd');
      setReceived('');
      setOrderNote('');
      setStep('payment');
      setLastSaleId(null);
    }
  }, [isOpen, paymentTypeProp, customerProp]);

  // Focus al input cuando es efectivo contado
  useEffect(() => {
    if (step === 'payment' && paymentMode === 'contado' && (method === 'efectivo_crd' || method === 'efectivo_usd')) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [method, step, paymentMode]);

  // Escape cierra
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen && step === 'payment') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, step]);

  // ─ Cálculos contado ──────────────────────────────────────────────────────────
  const isUsd         = method === 'efectivo_usd';
  const isCash        = method === 'efectivo_crd' || isUsd;
  const receivedNum   = parseFloat(received) || 0;
  const receivedInCrd = isUsd ? receivedNum * tasaCambio : receivedNum;
  const changeCrd     = Math.max(0, receivedInCrd - total);
  const changeUsd     = changeCrd / tasaCambio;
  const exactCrd      = Math.ceil(total);
  const exactUsd      = parseFloat((total / tasaCambio).toFixed(2));
  const billetes      = isUsd ? BILLETES_USD : BILLETES_CRD;
  const sufficientContado = !isCash || receivedInCrd >= total - 0.001;

  // ─ Can confirm ───────────────────────────────────────────────────────────────
  const canConfirm = paymentMode === 'credito'
    ? selectedCustomer !== null
    : sufficientContado;

  const handleConfirm = async () => {
    const data = paymentMode === 'credito'
      ? { paymentType: 'credito', customerId: selectedCustomer.id, customerName: selectedCustomer.name, orderNote }
      : { paymentType: 'contado', method, received: receivedNum, receivedInCrd, change: changeCrd, changeUsd, orderNote };

    const result = await onConfirm(data);
    if (result) {
      setLastSaleId(result.id || result.invoiceId);
      setStep('success');
    }
  };

  const confirmBtnLabel = () => {
    if (paymentMode === 'credito') return selectedCustomer ? '✓ Registrar a Crédito' : 'Selecciona un cliente';
    if (isCash && !sufficientContado && receivedNum > 0) return `Faltan C$ ${fmtCRD(total - receivedInCrd)}`;
    if (isCash && !sufficientContado) return 'Ingresa el monto recibido';
    return '✓ Confirmar Cobro';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => step === 'payment' && onClose()}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'relative z-10 w-full bg-white dark:bg-slate-800 shadow-2xl overflow-hidden flex flex-col',
              'rounded-t-3xl sm:rounded-2xl',
              'max-h-[95dvh] sm:max-h-[90vh] sm:max-w-md',
            )}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full sm:hidden" />

            <AnimatePresence mode="wait">
              {step === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="overflow-y-auto scrollbar-hide"
                >
                    <SuccessScreen
                    paymentType={paymentMode}
                    method={method}
                    received={receivedNum}
                    change={changeCrd}
                    changeUsd={changeUsd}
                    total={total}
                    tasaCambio={tasaCambio}
                    orderType={orderType}
                    orderInfo={orderInfo}
                    customerName={selectedCustomer?.name}
                    onNewOrder={onNewOrder}
                    saleId={lastSaleId}
                    token={token}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-7 pb-5 shrink-0">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">Finalizar Venta</h2>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Complete los detalles de pago</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-2 space-y-6">

                    {/* Resumen */}
                    <OrderSummary cartItems={cartItems} total={total} subtotal={subtotal} deliveryFee={deliveryFee} orderType={orderType} orderInfo={orderInfo} />

                    {/* Total */}
                    <div className="flex flex-col items-center justify-center py-6 bg-slate-900 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 z-10">Monto Total</span>
                      <motion.span
                        key={total}
                        initial={{ scale: 1.1, opacity: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl font-black text-white tracking-tighter font-display z-10"
                      >
                        C$ {fmtCRD(total)}
                      </motion.span>
                      <div className="mt-2 h-1 w-12 bg-violet-500 rounded-full z-10" />
                    </div>

                    {/* ── Tipo de cobro ───────────────────────────────────── */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                        Modalidad de Pago
                      </p>
                      <div className="flex gap-3">
                        {[
                          { id: 'contado', label: 'Efectivo / Transferencia', icon: Banknote, color: 'violet' },
                          { id: 'credito', label: 'A Cuenta (Crédito)', icon: CreditCard, color: 'blue' },
                        ].map(({ id, label, icon: Icon, color }) => (
                          <button
                            key={id}
                            onClick={() => setPaymentMode(id)}
                            className={cn(
                              'flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-3xl border-2 transition-all duration-300',
                              paymentMode === id
                                ? id === 'contado'
                                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30 active:scale-[0.98]'
                                  : 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30 active:scale-[0.98]'
                                : 'border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-white dark:hover:bg-slate-600'
                            )}
                          >
                            <Icon size={20} strokeWidth={2.5} />
                            <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Crédito: selección de cliente ─────────────────── */}
                    <AnimatePresence mode="wait">
                      {paymentMode === 'credito' && (
                        <motion.div
                          key="credito"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          className="space-y-2"
                        >
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Cliente de crédito
                          </p>
                          <CustomerPicker
                            clientes={clientes}
                            selectedCustomer={selectedCustomer}
                            onSelect={setSelectedCustomer}
                            onClear={() => setSelectedCustomer(null)}
                          />
                        </motion.div>
                      )}

                      {/* ── Contado: métodos de pago ───────────────────── */}
                      {paymentMode === 'contado' && (
                        <motion.div
                          key="contado"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          {/* Métodos */}
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                              Método de Pago
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                              {filteredMethods.map((m) => {
                                const Icon = m.icon;
                                const c = COLOR_MAP[m.color];
                                const isActive = method === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    onClick={() => { setMethod(m.id); setReceived(''); }}
                                    className={cn(
                                      'flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all duration-300',
                                      isActive
                                        ? `${c.tab} border-transparent shadow-lg shadow-${m.color}-600/20 active:scale-[0.98]`
                                        : 'border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'
                                    )}
                                  >
                                    <Icon size={22} strokeWidth={2.5} />
                                    <div className="leading-tight text-center">
                                      <p className="text-[10px] font-black uppercase tracking-tight leading-none">{m.label}</p>
                                      <p className={cn('text-[9px] font-bold mt-1 uppercase', isActive ? 'opacity-80' : 'text-slate-400')}>{m.sub}</p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Efectivo */}
                          <AnimatePresence mode="wait">
                            {isCash ? (
                              <motion.div
                                key={method}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-5"
                              >
                                {isUsd && (
                                  <div className="flex items-center justify-between px-5 py-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700/50 rounded-2xl">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                                      <RefreshCw size={14} />
                                      Tasa de Cambio
                                    </div>
                                    <span className="text-sm font-black text-blue-900 dark:text-blue-200 font-display">
                                      C$ {fmtCRD(tasaCambio)} / USD
                                    </span>
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between px-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Efectivo Recibido {isUsd ? '(USD)' : '(COR)'}
                                    </p>
                                  </div>
                                  <div className="relative group">
                                    <div className="absolute inset-0 bg-violet-500/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 font-display selection:bg-transparent">
                                      {isUsd ? '$' : 'C$'}
                                    </span>
                                    <input
                                      ref={inputRef}
                                      type="number" inputMode="decimal" step="0.01" min="0"
                                      value={received}
                                      onChange={(e) => setReceived(e.target.value)}
                                      placeholder="0.00"
                                      className={cn(
                                        'w-full h-20 rounded-[2rem] border-2 text-4xl font-black text-right pr-8 pl-14 relative z-10',
                                        'focus:outline-none transition-all font-display bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm',
                                        '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
                                        sufficientContado && receivedNum > 0
                                          ? 'border-violet-400 text-violet-700 focus:ring-4 focus:ring-violet-500/10'
                                          : 'border-slate-100 dark:border-slate-600 text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5'
                                      )}
                                    />
                                  </div>
                                  {isUsd && receivedNum > 0 && (
                                    <motion.p
                                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                      className="text-[10px] font-black text-blue-600 text-right pr-4 uppercase tracking-widest"
                                    >
                                      Equivale a C$ {fmtCRD(receivedNum * tasaCambio)} COP
                                    </motion.p>
                                  )}
                                </div>

                                {/* Billetes rápidos */}
                                <div className="space-y-3 pt-2">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    Sugerencias
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {billetes.map((b) => (
                                      <button
                                        key={b}
                                        onClick={() => setReceived(String(b))}
                                        className={cn(
                                          'px-5 py-2.5 rounded-2xl text-[11px] font-black border transition-all duration-300 font-display',
                                          received === String(b)
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-900 dark:hover:border-slate-400 hover:shadow-md'
                                        )}
                                      >
                                        {isUsd ? `$${b}` : `C$${b}`}
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => setReceived(isUsd ? String(exactUsd) : String(exactCrd))}
                                      className={cn(
                                        'px-6 py-2.5 rounded-2xl text-[11px] font-black border transition-all duration-300 font-display uppercase tracking-widest',
                                        received === (isUsd ? String(exactUsd) : String(exactCrd))
                                          ? 'bg-violet-600 text-white border-violet-600 shadow-lg'
                                          : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:border-violet-400'
                                      )}
                                    >
                                      Exacto
                                    </button>
                                  </div>
                                </div>

                                {/* Vuelto */}
                                <AnimatePresence>
                                  {receivedNum > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, blockSize: 0 }}
                                      animate={{ opacity: 1, blockSize: 'auto' }}
                                      exit={{ opacity: 0, blockSize: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className={cn(
                                        'flex items-center justify-between px-4 py-3.5 rounded-2xl',
                                        sufficientContado
                                          ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50'
                                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50'
                                      )}>
                                        <div>
                                          <p className={cn('text-xs font-bold uppercase tracking-wide', sufficientContado ? 'text-violet-700 dark:text-violet-400' : 'text-red-600 dark:text-red-400')}>
                                            {sufficientContado ? 'Vuelto / Cambio' : 'Falta'}
                                          </p>
                                          {isUsd && sufficientContado && changeUsd > 0.005 && (
                                            <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5">≈ $ {fmtUSD(changeUsd)} USD</p>
                                          )}
                                        </div>
                                        <motion.span
                                          key={changeCrd}
                                          initial={{ scale: 1.1 }} animate={{ scale: 1 }}
                                          className={cn('text-2xl font-black', sufficientContado ? 'text-violet-700 dark:text-violet-400' : 'text-red-600 dark:text-red-400')}
                                        >
                                          {sufficientContado
                                            ? `C$ ${fmtCRD(changeCrd)}`
                                            : `C$ ${fmtCRD(total - receivedInCrd)}`}
                                        </motion.span>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ) : (
                              /* Transferencia */
                              <motion.div
                                key="no-cash"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50"
                              >
                                <Smartphone size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                  Verifica la transferencia recibida y confirma.
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── Nota general de orden ───────────────────────── */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        Nota de Orden (opcional)
                      </p>
                      <div className="relative">
                        <MessageSquare size={15} className="absolute left-4 top-3.5 text-slate-300 pointer-events-none" />
                        <textarea
                          value={orderNote}
                          onChange={(e) => setOrderNote(e.target.value)}
                          maxLength={500}
                          rows={2}
                          placeholder="Ej: llamar al cliente cuando esté listo..."
                          className="w-full pl-10 pr-4 py-3 text-sm border-2 border-slate-100 dark:border-slate-600 rounded-2xl bg-slate-50/50 dark:bg-slate-700/50 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 resize-none transition-all font-medium dark:text-white dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 px-6 py-6 border-t border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md relative z-20">
                    {/* API Alert */}
                    <AnimatePresence>
                      {apiError && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className="flex items-start gap-3 px-4 py-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl text-[11px] font-bold text-red-700 dark:text-red-400 shadow-sm"
                        >
                          <AlertCircle size={16} className="shrink-0" />
                          {apiError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileTap={canConfirm && !loading ? { scale: 0.98 } : {}}
                      onClick={(canConfirm && !loading) ? handleConfirm : undefined}
                      disabled={!canConfirm || loading}
                      className={cn(
                        'w-full h-16 rounded-[1.75rem] text-sm font-black uppercase tracking-[0.15em] transition-all duration-400 font-display',
                        'flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden',
                        (canConfirm && !loading)
                          ? paymentMode === 'credito'
                            ? 'bg-blue-600 text-white shadow-blue-600/30'
                            : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/30'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-600 shadow-none'
                      )}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        confirmBtnLabel()
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
