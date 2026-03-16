import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Tv, Search, User, X, Check, Loader2, AlertCircle,
  Calendar, DollarSign, FileText, ShoppingCart,
  UserPlus, ChevronRight, Building2,
} from 'lucide-react';
import { serviceTypeService }   from '../../services/serviceTypeService';
import { iptvAccountService }   from '../../services/iptvAccountService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { customerService }      from '../../services/customerService';
import { useAuthContext }        from '../../context/AuthContext';
import { useToast }              from '../../context/ToastContext';
import { cn }                    from '../../lib/utils';
import { isValidPhoneNumber }    from 'react-phone-number-input';
import PhoneField                from '../../components/ui/PhoneField';

// ─── Schema ───────────────────────────────────────────────────────────────────
const saleSchema = z.object({
  tipoServicioId:   z.string().min(1, 'Selecciona un servicio'),
  iptvAccountId:    z.string().min(1, 'Selecciona una cuenta'),
  customerId:       z.string().optional().or(z.literal('')),
  customerName:     z.string().optional().or(z.literal('')),
  customerPhone:    z.string().optional().or(z.literal('')).refine(v => !v || isValidPhoneNumber(v), 'Número inválido — verifica el código de país'),
  customerEmail:    z.string().optional().or(z.literal('')),
  expirationDate:   z.string().optional().or(z.literal('')),
  profileUser:      z.string().optional().or(z.literal('')),
  profilePin:       z.string().optional().or(z.literal('')),
  metodoPagoId:     z.string().optional().or(z.literal('')),
  paymentReference: z.string().optional().or(z.literal('')),
  amountReceived:   z.coerce.number().min(0).optional(),
  discountAmount:   z.coerce.number().min(0).optional(),
}).superRefine((data, ctx) => {
  if (!data.customerId && !data.customerName?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['customerName'], message: 'Nombre del cliente requerido' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = (err) => cn(
  'w-full h-10 px-3 bg-white dark:bg-slate-800 border rounded-xl text-sm',
  'text-slate-800 dark:text-slate-100 placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 transition-all',
  err
    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
    : 'border-slate-200 dark:border-slate-700 focus:ring-violet-500/30 focus:border-violet-400',
);

function SectionLabel({ children, optional }) {
  return (
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100 dark:border-slate-800 first:border-0 first:pt-0">
      {children}
      {optional && <span className="normal-case font-medium text-slate-300 dark:text-slate-600 ml-1">(opcional)</span>}
    </p>
  );
}

// ─── CustomerSearch ───────────────────────────────────────────────────────────
function CustomerSearch({ selected, onSelect, onClear }) {
  const { token } = useAuthContext();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const d = await customerService.search(query, token);
        setResults(Array.isArray(d) ? d : []);
      } catch { setResults([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [query, token]);

  return (
    <div className="relative">
      <div className={cn('flex items-center gap-2 h-10 px-3 border rounded-xl bg-white dark:bg-slate-800',
        'border-slate-200 dark:border-slate-700')}>
        <Search size={13} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o teléfono..."
          value={selected ? (selected.name || selected.fullName) : query}
          onChange={e => { onClear(); setQuery(e.target.value); }}
          className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
        {selected && (
          <button type="button" onClick={() => { onClear(); setQuery(''); }}>
            <X size={13} className="text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>
      {results.length > 0 && !selected && (
        <div className="absolute inset-x-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
          {results.slice(0, 5).map(c => (
            <button key={c.id} type="button"
              onClick={() => { onSelect(c); setResults([]); setQuery(''); }}
              className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name || c.fullName}</p>
              <p className="text-[11px] text-slate-500">{c.phone} · {c.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NuevaVentaPage ───────────────────────────────────────────────────────────
export function NuevaVentaPage({ onClose } = {}) {
  const { token } = useAuthContext();
  const { toast } = useToast();

  const [services,        setServices]        = useState([]);
  const [accounts,        setAccounts]        = useState([]);
  const [loadingAccts,    setLoadingAccts]    = useState(false);
  const [paymentMethods,  setPaymentMethods]  = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [plataformasConfig, setPlataformasConfig] = useState([]);
  const [apiError,        setApiError]        = useState('');
  const [success,         setSuccess]         = useState(null); // { customerName, expirationDate }

  const { register, handleSubmit, watch, setValue, control, reset,
    formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      tipoServicioId: '', iptvAccountId: '',
      customerId: '', customerName: '', customerPhone: '', customerEmail: '',
      expirationDate: '', profileUser: '', profilePin: '',
      metodoPagoId: '', paymentReference: '', amountReceived: '', discountAmount: '',
    },
  });

  // Load services + payment methods + platform configs on mount
  useEffect(() => {
    Promise.all([
      serviceTypeService.getAll(token),
      paymentMethodService.getAll(token),
      serviceTypeService.getPlataformasConfig(token),
    ]).then(([sv, pm, pc]) => {
      setServices(Array.isArray(sv) ? sv.filter(s => s.isActive && s.category !== 'Demo') : []);
      setPaymentMethods(Array.isArray(pm) ? pm.filter(m => m.isActive !== false) : []);
      setPlataformasConfig(Array.isArray(pc) ? pc : []);
    }).catch(() => {});
  }, [token]);

  // Watch fields
  const watchedServiceId  = watch('tipoServicioId');
  const watchedAccountId  = watch('iptvAccountId');
  const watchedMetodoPago = watch('metodoPagoId');

  const selectedService = useMemo(
    () => services.find(s => s.id === watchedServiceId) || null,
    [watchedServiceId, services],
  );

  // Load accounts when service changes
  useEffect(() => {
    if (!watchedServiceId) { setAccounts([]); setValue('iptvAccountId', ''); return; }
    setLoadingAccts(true);
    setValue('iptvAccountId', '');
    iptvAccountService.getByService(watchedServiceId, token)
      .then(d => setAccounts(Array.isArray(d) ? d : []))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccts(false));
  }, [watchedServiceId, token, setValue]);

  // Pre-fill price and expiration when service selected
  useEffect(() => {
    if (!selectedService) return;
    if (selectedService.price) setValue('amountReceived', selectedService.price);
    const d = new Date();
    d.setDate(d.getDate() + (selectedService.durationDays || 30));
    setValue('expirationDate', d.toISOString().split('T')[0]);
  }, [selectedService, setValue]);

  // Sync customer id
  useEffect(() => {
    setValue('customerId', selectedCustomer?.id || '');
  }, [selectedCustomer, setValue]);

  // Derive config activa (for Netflix/Streaming detection)
  const configActiva = useMemo(() => {
    if (!selectedService?.plataforma || !plataformasConfig.length) return null;
    return plataformasConfig.find(c => c.plataforma === selectedService.plataforma) || null;
  }, [selectedService, plataformasConfig]);

  const esNetflix = configActiva?.labelUsuario === 'Correo';

  const selectedAccount    = useMemo(
    () => accounts.find(a => a.id === watchedAccountId) || null,
    [watchedAccountId, accounts],
  );

  const selectedPayMethod  = useMemo(
    () => paymentMethods.find(m => m.id === watchedMetodoPago) || null,
    [watchedMetodoPago, paymentMethods],
  );

  const onSubmit = async (data) => {
    setApiError('');
    try {
      const body = {};
      if (selectedCustomer) {
        body.customerId = selectedCustomer.id;
      } else {
        body.customerName  = data.customerName  || null;
        body.customerPhone = data.customerPhone || null;
        body.customerEmail = data.customerEmail || null;
      }
      body.tipoServicioId   = data.tipoServicioId;
      body.expirationDate   = data.expirationDate ? new Date(data.expirationDate).toISOString() : null;
      body.profileUser      = esNetflix ? (data.profileUser || null) : null;
      body.profilePin       = esNetflix ? (data.profilePin  || null) : null;
      body.metodoPagoId     = data.metodoPagoId     || null;
      body.paymentReference = data.paymentReference || null;
      body.amountReceived   = data.amountReceived   ? Number(data.amountReceived) : null;
      body.discountAmount   = Number(data.discountAmount) || 0;

      const res = await iptvAccountService.assign(data.iptvAccountId, body, token);
      toast.success('Venta registrada — credenciales enviadas por WhatsApp');
      setSuccess({
        customerName:   res.customerName || body.customerName || selectedCustomer?.name || '—',
        expirationDate: res.expirationDate,
      });
    } catch (err) {
      setApiError(err.message || 'Error al registrar la venta');
    }
  };

  const handleNew = () => {
    setSuccess(null);
    setSelectedCustomer(null);
    reset();
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 text-center space-y-5"
        >
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
            <Check size={28} className="text-emerald-500" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">¡Venta registrada!</h2>
            <p className="text-sm text-slate-400 mt-1">Credenciales enviadas por WhatsApp a <span className="font-bold text-slate-600 dark:text-slate-200">{success.customerName}</span></p>
          </div>
          {success.expirationDate && (
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl px-4 py-3 border border-violet-100 dark:border-violet-800">
              <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-0.5">Vence el</p>
              <p className="text-sm font-black text-violet-700 dark:text-violet-300">
                {new Date(success.expirationDate).toLocaleDateString('es-NI', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
          <button onClick={handleNew}
            className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors">
            <ShoppingCart size={15} /> Nueva venta
          </button>
          {onClose && (
            <button onClick={onClose}
              className="w-full h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors">
              Cerrar
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
            <ShoppingCart size={16} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-black text-slate-900 dark:text-white">Nueva Venta</h1>
            <p className="text-[11px] text-slate-400">Asignación directa de suscripción IPTV</p>
          </div>
          {onClose && (
            <button type="button" onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto px-5 py-6 space-y-5">

        {/* ── 1. Servicio ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <SectionLabel>1. Tipo de servicio</SectionLabel>
          <div className="space-y-1">
            <select {...register('tipoServicioId')} className={cn(inputCls(!!errors.tipoServicioId), 'cursor-pointer')}>
              <option value="">— Selecciona un plan —</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — C${s.price} ({s.durationDays}d)
                </option>
              ))}
            </select>
            {errors.tipoServicioId && <p className="text-[10px] text-red-500 font-bold">{errors.tipoServicioId.message}</p>}
          </div>
        </div>

        {/* ── 2. Cuenta disponible ── */}
        {watchedServiceId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          >
            <SectionLabel>2. Cuenta IPTV</SectionLabel>
            {loadingAccts ? (
              <div className="h-10 flex items-center justify-center text-slate-400">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle size={13} className="shrink-0" /> No hay cuentas con slots disponibles para este servicio.
              </div>
            ) : (
              <select {...register('iptvAccountId')} className={cn(inputCls(!!errors.iptvAccountId), 'cursor-pointer')}>
                <option value="">— Selecciona una cuenta —</option>
                {accounts.map(a => {
                  const id  = a.accessEmail || a.accessUser || '—';
                  const sl  = `${a.availableSlots} slot${a.availableSlots !== 1 ? 's' : ''} libres`;
                  const vc  = a.expirationDate
                    ? `vence ${new Date(a.expirationDate).toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                    : null;
                  return (
                    <option key={a.id} value={a.id}>
                      {id} — {sl}{vc ? ` (${vc})` : ''}
                    </option>
                  );
                })}
              </select>
            )}
            {errors.iptvAccountId && <p className="text-[10px] text-red-500 font-bold">{errors.iptvAccountId.message}</p>}
          </motion.div>
        )}

        {/* ── 3. Cliente ── */}
        {watchedAccountId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          >
            <SectionLabel>3. Cliente</SectionLabel>
            <CustomerSearch selected={selectedCustomer} onSelect={setSelectedCustomer} onClear={() => setSelectedCustomer(null)} />
            <input type="hidden" {...register('customerId')} />

            {!selectedCustomer && (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O ingresa cliente nuevo</p>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre *</label>
                  <input {...register('customerName')} type="text" placeholder="Juan Pérez" className={inputCls(!!errors.customerName)} />
                  {errors.customerName && <p className="text-[10px] text-red-500 font-bold">{errors.customerName.message}</p>}
                </div>
                <Controller
                  name="customerPhone"
                  control={control}
                  render={({ field }) => (
                    <PhoneField
                      label="Teléfono"
                      value={field.value}
                      onChange={(v) => field.onChange(v || '')}
                      error={errors.customerPhone?.message}
                      placeholder="8888-0000"
                    />
                  )}
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                  <input {...register('customerEmail')} type="email" placeholder="juan@gmail.com" className={inputCls(!!errors.customerEmail)} />
                  {errors.customerEmail && <p className="text-[10px] text-red-500 font-bold">{errors.customerEmail.message}</p>}
                </div>
              </div>
            )}

            {selectedCustomer && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-sm font-black text-emerald-700">
                  {(selectedCustomer.name || selectedCustomer.fullName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedCustomer.name || selectedCustomer.fullName}</p>
                  <p className="text-[11px] text-slate-400">{selectedCustomer.phone} · {selectedCustomer.email}</p>
                </div>
                <Check size={14} className="text-emerald-500 shrink-0 ml-auto" />
              </div>
            )}
          </motion.div>
        )}

        {/* ── 4. Perfil Netflix/Streaming ── */}
        {watchedAccountId && esNetflix && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-violet-200 dark:border-violet-800/40 p-5 space-y-4"
          >
            <SectionLabel>4. Perfil del cliente</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <User size={10} /> Usuario de perfil
                </label>
                <input {...register('profileUser')} type="text" placeholder="Perfil 1" className={inputCls(false)} />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <FileText size={10} /> PIN de perfil
                </label>
                <input {...register('profilePin')} type="text" placeholder="1234" className={inputCls(false)} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── 5. Fecha de vencimiento ── */}
        {watchedAccountId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          >
            <SectionLabel optional>5. Fecha de vencimiento</SectionLabel>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <Calendar size={10} /> Vence el
                {selectedService && <span className="normal-case font-medium text-slate-400">(pre-calculado: {selectedService.durationDays}d)</span>}
              </label>
              <input {...register('expirationDate')} type="date" className={inputCls(false)} />
            </div>
          </motion.div>
        )}

        {/* ── 6. Pago ── */}
        {watchedAccountId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          >
            <SectionLabel optional>6. Pago</SectionLabel>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <Building2 size={10} /> Método de pago
              </label>
              <select {...register('metodoPagoId')} className={cn(inputCls(false), 'cursor-pointer')}>
                <option value="">— Sin método registrado —</option>
                {paymentMethods.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} — {m.banco}</option>
                ))}
              </select>
            </div>

            {/* Datos bancarios del método seleccionado */}
            {selectedPayMethod && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Datos bancarios</p>
                {[
                  { label: 'Banco',       value: selectedPayMethod.banco        },
                  { label: 'Tipo',        value: selectedPayMethod.tipoCuenta   },
                  { label: 'N° Cuenta',   value: selectedPayMethod.numeroCuenta },
                  { label: 'Titular',     value: selectedPayMethod.titular      },
                ].filter(r => r.value).map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{label}</span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <FileText size={10} /> Referencia de transferencia
              </label>
              <input {...register('paymentReference')} type="text" placeholder="TRF-20260308-001" className={inputCls(false)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <DollarSign size={10} /> Monto recibido (C$)
                </label>
                <input {...register('amountReceived')} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls(false)} />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <DollarSign size={10} /> Descuento (C$)
                </label>
                <input {...register('discountAmount')} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls(false)} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Error + Submit ── */}
        {watchedAccountId && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {apiError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600">
                <AlertCircle size={13} className="shrink-0" /> {apiError}
              </div>
            )}
            <button type="submit" disabled={isSubmitting || accounts.length === 0}
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-lg shadow-violet-600/20">
              {isSubmitting
                ? <><Loader2 size={16} className="animate-spin" /> Procesando...</>
                : <><Check size={16} /> Confirmar Venta</>}
            </button>
          </motion.div>
        )}

      </form>
    </div>
  );
}
