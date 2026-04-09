import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Loader2, AlertCircle, User,
  FileText, Package, Check, Receipt, Tag,
} from 'lucide-react';
import { invoiceService }      from '../../services/invoiceService';
import { serviceTypeService }  from '../../services/serviceTypeService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { customerService }     from '../../services/customerService';
import { useAuthContext }       from '../../context/AuthContext';
import { useToast }             from '../../context/ToastContext';
import { cn, fmtCRD }           from '../../lib/utils';

// ─── Line ID generator ────────────────────────────────────────────────────────
let _lid = 0;
const lid = () => `l${++_lid}`;

// ─── Line factories ───────────────────────────────────────────────────────────
const servicioLine = () => ({
  _id: lid(), type: 'servicio',
  tipoServicioId: '', subscriptionId: '', concept: '',
  quantity: 1, durationMonths: 1, unitPrice: 0, discountAmount: 0, nota: '',
  subscriptions: [], subscriptionsLoading: false,
});

const libreLine = () => ({
  _id: lid(), type: 'libre',
  tipoServicioId: null, subscriptionId: null, concept: '',
  quantity: 1, durationMonths: 1, unitPrice: 0, discountAmount: 0, nota: '',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const lineSubtotal = (l) =>
  Math.max(0, (Number(l.unitPrice) || 0) * (Number(l.quantity) || 1) * (Number(l.durationMonths) || 1) - (Number(l.discountAmount) || 0));

const inputCls = (err) => cn(
  'w-full h-10 px-3 bg-white dark:bg-slate-800 border rounded-xl text-sm',
  'text-slate-800 dark:text-slate-100 placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 transition-all',
  err
    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
    : 'border-slate-200 dark:border-slate-700 focus:ring-violet-500/30 focus:border-violet-400',
);

const fmtExpDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

// ─── CustomerSearch ───────────────────────────────────────────────────────────
function CustomerSearch({ value, customerId, onChange, onSelect, token }) {
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const ref                   = useRef(null);

  useEffect(() => {
    if (!value || value.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      customerService.search(value, token)
        .then(r => setResults(Array.isArray(r) ? r.slice(0, 6) : []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [value, token]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar cliente o escribir nombre..."
          value={value}
          onChange={(e) => { onChange(e.target.value); onSelect(''); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={cn(inputCls(false), 'pl-9')}
        />
        {customerId && (
          <Check size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
        )}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
          >
            {results.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(c.id); onChange(c.name || c.nombre || c.customerName || ''); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-black text-violet-600 shrink-0">
                    {(c.name || c.nombre || c.customerName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{c.name || c.nombre || c.customerName}</p>
                    {(c.phone || c.telefono) && <p className="text-[10px] text-slate-400">{c.phone || c.telefono}</p>}
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ServiceLine ──────────────────────────────────────────────────────────────
function ServiceLine({ line, services, onUpdate, onRemove, errors }) {
  const subtotal = lineSubtotal(line);
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">
          <Package size={10} /> Servicio
        </span>
        <button type="button" onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Service */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Servicio</label>
        <select value={line.tipoServicioId} onChange={(e) => onUpdate('tipoServicioId', e.target.value)}
          className={cn(inputCls(!!errors?.service), 'cursor-pointer')}>
          <option value="">— Selecciona un servicio —</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {errors?.service && <p className="text-[10px] text-red-500 font-bold">{errors.service}</p>}
      </div>

      {/* Subscription */}
      {line.tipoServicioId && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cuenta disponible</label>
          {line.subscriptionsLoading ? (
            <div className="flex items-center gap-2 h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-400">
              <Loader2 size={12} className="animate-spin" /> Cargando cuentas...
            </div>
          ) : line.subscriptions.length === 0 ? (
            <div className="flex items-center gap-2 h-10 px-3 border border-amber-200 dark:border-amber-700 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle size={12} className="shrink-0" /> Sin cuentas disponibles — se registrará sin asignar
            </div>
          ) : (
            <select value={line.subscriptionId} onChange={(e) => onUpdate('subscriptionId', e.target.value)}
              className={cn(inputCls(false), 'cursor-pointer')}>
              <option value="">— Sin asignar cuenta —</option>
              {line.subscriptions.map(s => {
                const label = s.accessUser || s.accessEmail || '—';
                const exp   = fmtExpDate(s.expirationDate);
                return <option key={s.id} value={s.id}>{label}{exp ? ` — vence ${exp}` : ''}</option>;
              })}
            </select>
          )}
        </div>
      )}

      {/* Concept */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concepto</label>
        <input type="text" placeholder="Ej. Netflix Premium x1 mes"
          value={line.concept} onChange={(e) => onUpdate('concept', e.target.value)}
          className={inputCls(false)} />
      </div>

      {/* Months / Price / Discount */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meses</label>
          <select value={line.durationMonths} onChange={(e) => onUpdate('durationMonths', parseInt(e.target.value))}
            className={cn(inputCls(false), 'cursor-pointer')}>
            {Array.from({ length: 24 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Precio/mes</label>
          <input type="number" step="0.01" min="0" placeholder="0.00"
            value={line.unitPrice} onChange={(e) => onUpdate('unitPrice', e.target.value)}
            className={inputCls(false)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descuento</label>
          <input type="number" step="0.01" min="0" placeholder="0.00"
            value={line.discountAmount} onChange={(e) => onUpdate('discountAmount', e.target.value)}
            className={inputCls(false)} />
        </div>
      </div>

      <div className="flex justify-end pt-1 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
          Subtotal: <span className="text-violet-600 dark:text-violet-400">{fmtCRD(subtotal)}</span>
        </p>
      </div>
    </div>
  );
}

// ─── LibreLine ────────────────────────────────────────────────────────────────
function LibreLine({ line, onUpdate, onRemove, errors }) {
  const subtotal = lineSubtotal(line);
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          <FileText size={10} /> Línea libre
        </span>
        <button type="button" onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
          <Trash2 size={12} />
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concepto</label>
        <input type="text" placeholder="Ej. Configuración de dispositivo"
          value={line.concept} onChange={(e) => onUpdate('concept', e.target.value)}
          className={inputCls(!!errors?.concept)} />
        {errors?.concept && <p className="text-[10px] text-red-500 font-bold">{errors.concept}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cantidad</label>
          <input type="number" min="1" step="1"
            value={line.quantity} onChange={(e) => onUpdate('quantity', parseInt(e.target.value) || 1)}
            className={inputCls(false)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Precio</label>
          <input type="number" step="0.01" min="0" placeholder="0.00"
            value={line.unitPrice} onChange={(e) => onUpdate('unitPrice', e.target.value)}
            className={inputCls(false)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descuento</label>
          <input type="number" step="0.01" min="0" placeholder="0.00"
            value={line.discountAmount} onChange={(e) => onUpdate('discountAmount', e.target.value)}
            className={inputCls(false)} />
        </div>
      </div>

      <div className="flex justify-end pt-1 border-t border-slate-200 dark:border-slate-600">
        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
          Subtotal: <span className="text-slate-600 dark:text-slate-400">{fmtCRD(subtotal)}</span>
        </p>
      </div>
    </div>
  );
}

// ─── SuccessScreen ────────────────────────────────────────────────────────────
function SuccessScreen({ invoice, onClose }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 gap-5 text-center">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 400 }}
        className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
      >
        <Check size={32} className="text-emerald-500" />
      </motion.div>
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">¡Factura Creada!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
          {invoice?.numeroOrden || invoice?.id || '—'}
        </p>
        <p className="text-3xl font-black text-violet-600 dark:text-violet-400 mt-3">
          C$ {fmtCRD(invoice?.totalAmount ?? 0)}
        </p>
      </div>
      <button onClick={onClose}
        className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-colors">
        Listo
      </button>
    </div>
  );
}

// ─── DirectInvoiceModal ───────────────────────────────────────────────────────
export function DirectInvoiceModal({ isOpen, onClose, onCreated }) {
  const { token, user } = useAuthContext();
  const { toast }       = useToast();

  const [lines,            setLines]           = useState([]);
  const [customerName,     setCustomerName]    = useState('');
  const [customerId,       setCustomerId]      = useState('');
  const [metodoPagoId,     setMetodoPagoId]    = useState('');
  const [paymentMethod,    setPaymentMethod]   = useState('Efectivo');
  const [paymentReference, setPaymentReference] = useState('');
  const [amountReceived,   setAmountReceived]  = useState('');
  const [nota,             setNota]            = useState('');
  const [services,         setServices]        = useState([]);
  const [paymentMethods,   setPaymentMethods]  = useState([]);
  const [loadingBase,      setLoadingBase]     = useState(false);
  const [apiError,         setApiError]        = useState('');
  const [submitting,       setSubmitting]      = useState(false);
  const [success,          setSuccess]         = useState(null);
  const [errors,           setErrors]          = useState({});

  // Load base data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLines([servicioLine()]);
    setCustomerName(''); setCustomerId('');
    setMetodoPagoId(''); setPaymentMethod('Efectivo');
    setPaymentReference(''); setAmountReceived('');
    setNota(''); setApiError(''); setSuccess(null); setErrors({});

    setLoadingBase(true);
    Promise.all([
      serviceTypeService.getAll(token),
      paymentMethodService.getAll(token),
    ]).then(([svcs, pms]) => {
      setServices(Array.isArray(svcs) ? svcs.filter(s => s.isActive !== false) : []);
      setPaymentMethods(Array.isArray(pms) ? pms.filter(m => m.isActive !== false) : []);
    }).catch(() => {}).finally(() => setLoadingBase(false));
  }, [isOpen, token]);

  // Load subscriptions for a service line
  const loadSubscriptions = useCallback(async (lineId, tipoServicioId) => {
    if (!tipoServicioId) return;
    setLines(prev => prev.map(l =>
      l._id === lineId ? { ...l, subscriptionsLoading: true, subscriptions: [], subscriptionId: '' } : l
    ));
    try {
      const data = await invoiceService.getUnassigned(tipoServicioId, token);
      setLines(prev => prev.map(l =>
        l._id === lineId ? { ...l, subscriptions: data ?? [], subscriptionsLoading: false } : l
      ));
    } catch {
      setLines(prev => prev.map(l =>
        l._id === lineId ? { ...l, subscriptions: [], subscriptionsLoading: false } : l
      ));
    }
  }, [token]);

  const updateLine = useCallback((lineId, field, value) => {
    setLines(prev => prev.map(l => {
      if (l._id !== lineId) return l;
      const updated = { ...l, [field]: value };

      if (field === 'tipoServicioId' && value) {
        const svc = services.find(s => s.id === value);
        if (svc) {
          updated.concept    = `${svc.name} x${l.durationMonths || 1} mes(es)`;
          updated.unitPrice  = svc.price || 0;
        }
        loadSubscriptions(lineId, value);
      }

      if (field === 'durationMonths' && l.tipoServicioId) {
        const svc = services.find(s => s.id === l.tipoServicioId);
        if (svc) updated.concept = `${svc.name} x${value} mes(es)`;
      }

      return updated;
    }));
  }, [services, loadSubscriptions]);

  const addLine    = (type) => setLines(prev => [...prev, type === 'servicio' ? servicioLine() : libreLine()]);
  const removeLine = (id)   => setLines(prev => prev.filter(l => l._id !== id));

  // Totals
  const total         = lines.reduce((acc, l) => acc + lineSubtotal(l), 0);
  const totalDiscount = lines.reduce((acc, l) => acc + (Number(l.discountAmount) || 0), 0);

  const validate = () => {
    const errs = {};
    if (!customerName.trim()) errs.customerName = 'Requerido';
    if (lines.length === 0)   errs.lines = 'Agrega al menos una línea';
    lines.forEach(l => {
      if (l.type === 'libre'    && !l.concept.trim())    errs[`${l._id}_concept`]  = 'Requerido';
      if (l.type === 'servicio' && !l.tipoServicioId)    errs[`${l._id}_service`]  = 'Selecciona un servicio';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setApiError(''); setSubmitting(true);
    try {
      const payload = {
        customerName:     customerName.trim(),
        userId:           user?.id || user?.userId || null,
        customerId:       customerId || null,
        orderType:        'Venta',
        paymentMethod:    paymentMethod || 'Efectivo',
        metodoPagoId:     metodoPagoId || null,
        paymentReference: paymentReference || null,
        amountReceived:   amountReceived !== '' ? parseFloat(amountReceived) : null,
        nota:             nota || null,
        subscriptionId:   null,
        details: lines.map(l => ({
          tipoServicioId: l.tipoServicioId || null,
          subscriptionId: l.subscriptionId || null,
          concept:        l.concept,
          quantity:       parseInt(l.quantity)       || 1,
          durationMonths: parseInt(l.durationMonths) || 1,
          unitPrice:      parseFloat(l.unitPrice)    || 0,
          discountAmount: parseFloat(l.discountAmount) || 0,
          nota:           l.nota || null,
        })),
      };
      const result = await invoiceService.create(payload, token);
      setSuccess(result);
      toast.success('Factura creada correctamente');
      onCreated?.();
    } catch (err) {
      setApiError(err.message || 'Error al crear la factura');
    } finally {
      setSubmitting(false);
    }
  };

  // ESC to close
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-700 flex flex-col max-h-[93vh] sm:max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/25">
              <Receipt size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Nueva Factura Directa</h2>
              <p className="text-[11px] text-slate-400">Múltiples servicios en una sola operación</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <SuccessScreen invoice={success} onClose={onClose} />
        ) : (
          <>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-5">
              {loadingBase ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 size={24} className="animate-spin text-violet-500" />
                </div>
              ) : (
                <>
                  {/* ── Cliente ── */}
                  <section className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                    <CustomerSearch
                      value={customerName} customerId={customerId}
                      onChange={setCustomerName} onSelect={setCustomerId}
                      token={token}
                    />
                    {errors.customerName && <p className="text-[10px] text-red-500 font-bold">{errors.customerName}</p>}
                  </section>

                  {/* ── Pago ── */}
                  <section className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pago</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Método</label>
                        <select
                          value={metodoPagoId}
                          onChange={(e) => {
                            setMetodoPagoId(e.target.value);
                            const pm = paymentMethods.find(m => m.id === e.target.value);
                            setPaymentMethod(pm ? `${pm.banco} — ${pm.nombre}` : 'Efectivo');
                          }}
                          className={cn(inputCls(false), 'cursor-pointer')}
                        >
                          <option value="">Efectivo</option>
                          {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.banco} — {m.nombre}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Referencia</label>
                        <input type="text" placeholder="TRF-001"
                          value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
                          className={inputCls(false)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nota interna</label>
                      <input type="text" placeholder="Observaciones opcionales"
                        value={nota} onChange={(e) => setNota(e.target.value)}
                        className={inputCls(false)} />
                    </div>
                  </section>

                  {/* ── Líneas ── */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Líneas de Factura</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addLine('servicio')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-[11px] font-black rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
                          <Plus size={11} /> Servicio
                        </button>
                        <button type="button" onClick={() => addLine('libre')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          <Plus size={11} /> Libre
                        </button>
                      </div>
                    </div>

                    {errors.lines && <p className="text-[10px] text-red-500 font-bold">{errors.lines}</p>}

                    <div className="space-y-3">
                      {lines.map(line =>
                        line.type === 'servicio' ? (
                          <ServiceLine
                            key={line._id} line={line} services={services}
                            onUpdate={(f, v) => updateLine(line._id, f, v)}
                            onRemove={() => removeLine(line._id)}
                            errors={{ service: errors[`${line._id}_service`] }}
                          />
                        ) : (
                          <LibreLine
                            key={line._id} line={line}
                            onUpdate={(f, v) => updateLine(line._id, f, v)}
                            onRemove={() => removeLine(line._id)}
                            errors={{ concept: errors[`${line._id}_concept`] }}
                          />
                        )
                      )}
                    </div>
                  </section>
                </>
              )}

              {apiError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={13} className="shrink-0" /> {apiError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-3 shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  {totalDiscount > 0 && (
                    <p className="text-xs text-slate-400">
                      Descuento: <span className="font-bold text-amber-500">− C$ {fmtCRD(totalDiscount)}</span>
                    </p>
                  )}
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    Total: <span className="text-violet-600 dark:text-violet-400">C$ {fmtCRD(total)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Recibido C$</label>
                  <input
                    type="number" step="0.01" min="0"
                    placeholder={total.toFixed(2)}
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-28 h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={handleSubmit}
                  disabled={submitting || lines.length === 0}
                  className="flex-[2] h-11 bg-violet-600 hover:bg-violet-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
                  {submitting ? 'Creando...' : 'Crear Factura'}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
