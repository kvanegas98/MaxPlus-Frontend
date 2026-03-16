import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search, Plus, Tv, RefreshCw, Calendar, X, Check, Pencil,
  Trash2, Globe, User, Lock, Key, FileText, AlertCircle, Loader2,
  UserPlus, UserCheck, RotateCcw,
} from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { customerService } from '../../services/customerService';
import { serviceTypeService } from '../../services/serviceTypeService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

// ─── Schemas ───────────────────────────────────────────────────────────────────

// Create modal: mode toggles validation rules
const createSchema = z.object({
  mode:             z.enum(['withCustomer', 'unassigned']),
  // Cliente (requerido solo en withCustomer)
  customerId:       z.string().optional().or(z.literal('')),
  customerName:     z.string().optional().or(z.literal('')),
  customerPhone:    z.string().optional().or(z.literal('')),
  customerEmail:    z.string().optional().or(z.literal('')),
  // Servicio
  tipoServicioId:   z.string().min(1, 'Selecciona un servicio'),
  // Credenciales
  platformUrl:      z.string().url('URL inválida').min(1, 'Requerido'),
  accessUser:       z.string().min(1, 'Requerido'),
  accessPassword:   z.string().min(1, 'Requerido'),
  pinCode:          z.string().optional().or(z.literal('')),
  // Pago (solo en withCustomer)
  metodoPagoId:     z.string().optional().or(z.literal('')),
  paymentReference: z.string().optional().or(z.literal('')),
  amountReceived:   z.coerce.number().min(0).optional(),
  discountAmount:   z.coerce.number().min(0).optional(),
}).superRefine((data, ctx) => {
  if (data.mode === 'withCustomer') {
    if (!data.customerId && !data.customerName) {
      ctx.addIssue({ code: 'custom', path: ['customerName'], message: 'Selecciona o ingresa un cliente' });
    }
    const hasPayment = data.paymentReference || (data.amountReceived && data.amountReceived > 0);
    if (hasPayment && !data.metodoPagoId) {
      ctx.addIssue({ code: 'custom', path: ['metodoPagoId'], message: 'Selecciona un método de pago' });
    }
  }
});

// Assign modal: assign customer + optional payment to an Unassigned subscription
const assignSchema = z.object({
  customerId:       z.string().optional().or(z.literal('')),
  customerName:     z.string().optional().or(z.literal('')),
  customerPhone:    z.string().optional().or(z.literal('')),
  customerEmail:    z.string().optional().or(z.literal('')),
  metodoPagoId:     z.string().optional().or(z.literal('')),
  paymentReference: z.string().optional().or(z.literal('')),
  amountReceived:   z.coerce.number().min(0).optional(),
  discountAmount:   z.coerce.number().min(0).optional(),
}).superRefine((data, ctx) => {
  if (!data.customerId && !data.customerName) {
    ctx.addIssue({ code: 'custom', path: ['customerName'], message: 'Selecciona o ingresa un cliente' });
  }
  const hasPayment = data.paymentReference || (data.amountReceived && data.amountReceived > 0);
  if (hasPayment && !data.metodoPagoId) {
    ctx.addIssue({ code: 'custom', path: ['metodoPagoId'], message: 'Selecciona un método de pago' });
  }
});

const editSchema = z.object({
  platformUrl:    z.string().url('URL inválida').min(1, 'Requerido'),
  accessUser:     z.string().min(1, 'Requerido'),
  accessPassword: z.string().min(1, 'Requerido'),
  pinCode:        z.string().optional().or(z.literal('')),
  expirationDate: z.string().min(1, 'Requerido'),
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = (hasError) => cn(
  'w-full h-10 px-3 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-800 dark:text-slate-100',
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
  hasError
    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
    : 'border-slate-200 dark:border-slate-700 focus:ring-violet-500/30 focus:border-violet-400',
);

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isExpiringSoon(iso) {
  if (!iso) return false;
  const diff = new Date(iso) - new Date();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

// ─── CustomerSearch (shared) ──────────────────────────────────────────────────
function CustomerSearch({ selectedCustomer, onSelect, onClear }) {
  const { token } = useAuthContext();
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await customerService.search(query, token);
        setResults(Array.isArray(data) ? data : []);
      } catch { setResults([]); }
    }, 400);
    return () => clearTimeout(t);
  }, [query, token]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o teléfono..."
          value={selectedCustomer ? (selectedCustomer.name || selectedCustomer.fullName) : query}
          onChange={(e) => { onClear(); setQuery(e.target.value); }}
          className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
        {selectedCustomer && (
          <button type="button" onClick={() => { onClear(); setQuery(''); }} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>
      {results.length > 0 && !selectedCustomer && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
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

// ─── PaymentSection (shared) ─────────────────────────────────────────────────
function PaymentSection({ register, errors, paymentMethods }) {
  return (
    <>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-slate-800">
        Pago <span className="text-slate-300 dark:text-slate-600 normal-case font-medium">(opcional — genera factura)</span>
      </p>
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
          <Key size={10} /> Método de pago registrado
        </label>
        <select {...register('metodoPagoId')} className={cn(inputCls(!!errors.metodoPagoId), 'cursor-pointer')}>
          <option value="">— Sin método registrado —</option>
          {paymentMethods.map(m => (
            <option key={m.id} value={m.id}>{m.nombre} — {m.banco}</option>
          ))}
        </select>
        {errors.metodoPagoId && <p className="text-[10px] text-red-500 font-bold">{errors.metodoPagoId.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
          <FileText size={10} /> Referencia de transferencia
        </label>
        <input {...register('paymentReference')} type="text" placeholder="TRF-20260308-001" className={inputCls(false)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
            <FileText size={10} /> Monto recibido (C$)
          </label>
          <input {...register('amountReceived')} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls(false)} />
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
            <FileText size={10} /> Descuento (C$)
          </label>
          <input {...register('discountAmount')} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls(false)} />
        </div>
      </div>
    </>
  );
}

// ─── CreateModal ───────────────────────────────────────────────────────────────
function CreateModal({ onClose, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();

  const [services,        setServices]        = useState([]);
  const [paymentMethods,  setPaymentMethods]  = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedService,  setSelectedService]  = useState(null);
  const [apiError, setApiError] = useState('');

  // mode: 'withCustomer' | 'unassigned'
  const [mode, setMode] = useState('withCustomer');

  useEffect(() => {
    Promise.all([
      serviceTypeService.getAll(token),
      paymentMethodService.getAll(token),
    ]).then(([sv, pm]) => {
      setServices(Array.isArray(sv) ? sv.filter(s => s.isActive && s.category !== 'Demo') : []);
      setPaymentMethods(Array.isArray(pm) ? pm.filter(m => m.isActive !== false) : []);
    }).catch(() => {});
  }, [token]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      mode: 'withCustomer',
      customerId: '', customerName: '', customerPhone: '', customerEmail: '',
      tipoServicioId: '', platformUrl: '', accessUser: '', accessPassword: '',
      pinCode: '', metodoPagoId: '', paymentReference: '', amountReceived: '', discountAmount: '',
    },
  });

  // Keep hidden 'mode' field in sync
  useEffect(() => {
    setValue('mode', mode);
  }, [mode, setValue]);

  // Keep hidden 'customerId' in sync with selectedCustomer
  useEffect(() => {
    setValue('customerId', selectedCustomer?.id || '');
  }, [selectedCustomer, setValue]);

  const watchedServiceId = watch('tipoServicioId');
  useEffect(() => {
    setSelectedService(services.find(s => s.id === watchedServiceId) || null);
  }, [watchedServiceId, services]);

  const expirationPreview = selectedService?.durationDays
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() + selectedService.durationDays);
        return d.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' });
      })()
    : null;

  const onSubmit = async (data) => {
    setApiError('');
    try {
      const body = {
        tipoServicioId:   data.tipoServicioId,
        platformUrl:      data.platformUrl,
        accessUser:       data.accessUser,
        accessPassword:   data.accessPassword,
        pinCode:          data.pinCode          || null,
      };

      if (data.mode === 'withCustomer') {
        if (selectedCustomer) {
          body.customerId = selectedCustomer.id;
        } else {
          body.customerName  = data.customerName  || null;
          body.customerPhone = data.customerPhone || null;
          body.customerEmail = data.customerEmail || null;
        }
        body.metodoPagoId     = data.metodoPagoId     || null;
        body.paymentReference = data.paymentReference || null;
        body.amountReceived   = data.amountReceived   || null;
        body.discountAmount   = data.discountAmount   || 0;
      }
      // mode 'unassigned': no customer fields → backend assigns status "Unassigned"

      await subscriptionService.create(body, token);
      toast.success(
        data.mode === 'unassigned'
          ? 'Suscripción creada (sin asignar)'
          : 'Suscripción creada exitosamente'
      );
      onSaved();
      onClose();
    } catch (err) {
      setApiError(err.message || 'Error al crear la suscripción');
    }
  };

  const tabs = [
    { value: 'withCustomer', label: 'Con cliente',   icon: UserCheck, desc: 'Asigna al cliente ahora' },
    { value: 'unassigned',   label: 'Sin cliente',   icon: UserPlus,  desc: 'Asignar cliente después' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <Tv size={18} className="text-violet-600" />
            </div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Nueva Suscripción</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[76vh] overflow-y-auto scrollbar-hide">

          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = mode === t.value;
              return (
                <button key={t.value} type="button" onClick={() => setMode(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all',
                    active
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                  )}>
                  <Icon size={16} />
                  <span className="text-[11px] font-black">{t.label}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{t.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Hidden mode field */}
          <input type="hidden" {...register('mode')} />

          {/* ── Cliente (only in withCustomer mode) ── */}
          {mode === 'withCustomer' && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
              <CustomerSearch
                selectedCustomer={selectedCustomer}
                onSelect={setSelectedCustomer}
                onClear={() => setSelectedCustomer(null)}
              />
              {/* Hidden customerId */}
              <input type="hidden" {...register('customerId')} />
              {/* New customer fields — shown when no customer selected */}
              {!selectedCustomer && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O ingresa cliente nuevo</p>
                  {[
                    { name: 'customerName',  label: 'Nombre',   placeholder: 'Juan Pérez'    },
                    { name: 'customerPhone', label: 'Teléfono', placeholder: '87654321'       },
                    { name: 'customerEmail', label: 'Email',    placeholder: 'juan@gmail.com' },
                  ].map(({ name, label, placeholder }) => (
                    <div key={name} className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
                      <input {...register(name)} placeholder={placeholder} className={inputCls(!!errors[name])} />
                      {errors[name] && <p className="text-[10px] text-red-500 font-bold">{errors[name].message}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Servicio ── */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-slate-800">Servicio</p>
          <div className="space-y-1">
            <select {...register('tipoServicioId')} className={cn(inputCls(!!errors.tipoServicioId), 'cursor-pointer')}>
              <option value="">— Selecciona un plan —</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} — C$ {s.price} ({s.durationDays}d)</option>
              ))}
            </select>
            {errors.tipoServicioId && <p className="text-[10px] text-red-500 font-bold">{errors.tipoServicioId.message}</p>}
          </div>
          {expirationPreview && (
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
              <Calendar size={12} className="text-violet-500 shrink-0" />
              <p className="text-[11px] font-bold text-violet-700 dark:text-violet-300">
                Vence el <span className="font-black">{expirationPreview}</span>
                {' '}({selectedService.durationDays} días)
              </p>
            </div>
          )}

          {/* ── Credenciales ── */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-slate-800">Credenciales IPTV</p>
          {[
            { name: 'platformUrl',    label: 'URL / HOST',     icon: Globe, placeholder: 'https://appv1.xyz', type: 'url'  },
            { name: 'accessUser',     label: 'Usuario',        icon: User,  placeholder: 'usuario123',        type: 'text' },
            { name: 'accessPassword', label: 'Contraseña',     icon: Lock,  placeholder: 'pass456',           type: 'text' },
            { name: 'pinCode',        label: 'PIN (opcional)', icon: Key,   placeholder: '1234',              type: 'text' },
          ].map(({ name, label, icon: Icon, placeholder, type }) => (
            <div key={name} className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <Icon size={10} /> {label}
              </label>
              <input {...register(name)} type={type} placeholder={placeholder} className={inputCls(!!errors[name])} />
              {errors[name] && <p className="text-[10px] text-red-500 font-bold">{errors[name].message}</p>}
            </div>
          ))}

          {/* ── Pago (solo con cliente) ── */}
          {mode === 'withCustomer' && (
            <PaymentSection register={register} errors={errors} paymentMethods={paymentMethods} />
          )}

          {/* Info card for unassigned mode */}
          {mode === 'unassigned' && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                La suscripción quedará en estado <strong>Sin asignar</strong>. Después podrás asignarle un cliente desde la tabla.
              </p>
            </div>
          )}

          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600">
              <AlertCircle size={13} className="shrink-0" /> {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-11 bg-violet-600 hover:bg-violet-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isSubmitting
                ? 'Creando...'
                : mode === 'unassigned' ? 'Crear sin cliente' : 'Crear Suscripción'
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── AssignModal ───────────────────────────────────────────────────────────────
function AssignModal({ sub, onClose, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();

  const [paymentMethods,   setPaymentMethods]   = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    paymentMethodService.getAll(token)
      .then(pm => setPaymentMethods(Array.isArray(pm) ? pm.filter(m => m.isActive !== false) : []))
      .catch(() => {});
  }, [token]);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      customerId: '', customerName: '', customerPhone: '', customerEmail: '',
      metodoPagoId: '', paymentReference: '', amountReceived: '', discountAmount: '',
    },
  });

  useEffect(() => {
    setValue('customerId', selectedCustomer?.id || '');
  }, [selectedCustomer, setValue]);

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
      body.metodoPagoId     = data.metodoPagoId     || null;
      body.paymentReference = data.paymentReference || null;
      body.amountReceived   = data.amountReceived   || null;
      body.discountAmount   = data.discountAmount   || 0;

      await subscriptionService.assign(sub.id, body, token);
      toast.success('Cliente asignado — suscripción activa');
      onSaved();
      onClose();
    } catch (err) {
      setApiError(err.message || 'Error al asignar cliente');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <UserPlus size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Asignar Cliente</h2>
              <p className="text-[11px] text-slate-400">
                {sub.serviceName || sub.productName || 'Suscripción'} · {sub.accessUser || '—'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[76vh] overflow-y-auto scrollbar-hide">

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
          <CustomerSearch
            selectedCustomer={selectedCustomer}
            onSelect={setSelectedCustomer}
            onClear={() => setSelectedCustomer(null)}
          />
          <input type="hidden" {...register('customerId')} />

          {!selectedCustomer && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O ingresa cliente nuevo</p>
              {[
                { name: 'customerName',  label: 'Nombre',   placeholder: 'Juan Pérez'    },
                { name: 'customerPhone', label: 'Teléfono', placeholder: '87654321'       },
                { name: 'customerEmail', label: 'Email',    placeholder: 'juan@gmail.com' },
              ].map(({ name, label, placeholder }) => (
                <div key={name} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
                  <input {...register(name)} placeholder={placeholder} className={inputCls(!!errors[name])} />
                  {errors[name] && <p className="text-[10px] text-red-500 font-bold">{errors[name].message}</p>}
                </div>
              ))}
            </div>
          )}

          <PaymentSection register={register} errors={errors} paymentMethods={paymentMethods} />

          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600">
              <AlertCircle size={13} className="shrink-0" /> {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
              {isSubmitting ? 'Asignando...' : 'Asignar y Activar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── EditModal ─────────────────────────────────────────────────────────────────
function EditModal({ sub, onClose, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [apiError, setApiError] = useState('');

  const isoToDate = (iso) => iso ? iso.split('T')[0] : '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      platformUrl:    sub.platformUrl    || sub.hostUrl || '',
      accessUser:     sub.accessUser     || sub.username || '',
      accessPassword: sub.accessPassword || sub.password || '',
      pinCode:        sub.pinCode        || '',
      expirationDate: isoToDate(sub.expirationDate || sub.expiresAt || sub.endDate),
    },
  });

  const onSubmit = async (data) => {
    setApiError('');
    try {
      await subscriptionService.update(sub.id, {
        platformUrl:    data.platformUrl,
        accessUser:     data.accessUser,
        accessPassword: data.accessPassword,
        pinCode:        data.pinCode || null,
        expirationDate: new Date(data.expirationDate).toISOString(),
      }, token);
      toast.success('Suscripción actualizada');
      onSaved();
      onClose();
    } catch (err) {
      setApiError(err.message || 'Error al actualizar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <Pencil size={16} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Editar Suscripción</h2>
              <p className="text-[11px] text-slate-400">{sub.customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {[
            { name: 'platformUrl',    label: 'URL / HOST',     icon: Globe, placeholder: 'https://appv1.xyz', type: 'url'  },
            { name: 'accessUser',     label: 'Usuario',        icon: User,  placeholder: 'usuario123',        type: 'text' },
            { name: 'accessPassword', label: 'Contraseña',     icon: Lock,  placeholder: 'pass456',           type: 'text' },
            { name: 'pinCode',        label: 'PIN (opcional)', icon: Key,   placeholder: '1234',              type: 'text' },
          ].map(({ name, label, icon: Icon, placeholder, type }) => (
            <div key={name} className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <Icon size={10} /> {label}
              </label>
              <input {...register(name)} type={type} placeholder={placeholder} className={inputCls(!!errors[name])} />
              {errors[name] && <p className="text-[10px] text-red-500 font-bold">{errors[name].message}</p>}
            </div>
          ))}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Calendar size={10} /> Fecha de vencimiento
            </label>
            <input {...register('expirationDate')} type="date" className={inputCls(!!errors.expirationDate)} />
            {errors.expirationDate && <p className="text-[10px] text-red-500 font-bold">{errors.expirationDate.message}</p>}
          </div>

          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600">
              <AlertCircle size={13} className="shrink-0" /> {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-11 bg-violet-600 hover:bg-violet-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Active:     'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-700/50',
    Unassigned: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-700/50',
    Expired:    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-700/50',
    Cancelled:  'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',
  };
  const label = {
    Active:     'Activo',
    Unassigned: 'Sin asignar',
    Expired:    'Expirado',
    Cancelled:  'Cancelado',
  };
  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-[9px] font-black uppercase border',
      map[status] || map.Cancelled,
    )}>
      {label[status] || status}
    </span>
  );
}

// ─── RenewSchema ───────────────────────────────────────────────────────────────
const renewSchema = z.object({
  newExpiration:    z.string().min(1, 'Fecha requerida'),
  metodoPagoId:     z.string().optional().or(z.literal('')),
  paymentReference: z.string().optional().or(z.literal('')),
  amountReceived:   z.coerce.number().min(0).optional(),
  discountAmount:   z.coerce.number().min(0).optional(),
});

// ─── RenewModal ────────────────────────────────────────────────────────────────
function RenewModal({ sub, onClose, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [apiError,       setApiError]       = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(renewSchema),
    defaultValues: {
      newExpiration: '', metodoPagoId: '', paymentReference: '',
      amountReceived: '', discountAmount: '',
    },
  });

  useEffect(() => {
    Promise.all([
      paymentMethodService.getAll(token),
      sub.tipoServicioId ? serviceTypeService.getById(sub.tipoServicioId, token) : Promise.resolve(null),
    ]).then(([pm, svc]) => {
      setPaymentMethods(Array.isArray(pm) ? pm.filter(m => m.isActive !== false) : []);
      const baseDate = sub.expirationDate && new Date(sub.expirationDate) > new Date()
        ? new Date(sub.expirationDate)
        : new Date();
      if (svc?.durationDays) {
        baseDate.setDate(baseDate.getDate() + svc.durationDays);
        setValue('newExpiration', baseDate.toISOString().split('T')[0]);
      }
      if (svc?.price) setValue('amountReceived', svc.price);
    }).catch(() => {});
  }, [token, sub.tipoServicioId, sub.expirationDate, setValue]);

  const onSubmit = async (data) => {
    setApiError('');
    try {
      await subscriptionService.renew(sub.id, {
        newExpiration:    new Date(data.newExpiration).toISOString(),
        metodoPagoId:     data.metodoPagoId     || null,
        paymentReference: data.paymentReference || null,
        amountReceived:   data.amountReceived   ? Number(data.amountReceived) : null,
        discountAmount:   Number(data.discountAmount) || 0,
      }, token);
      toast.success('Suscripción renovada');
      onSaved();
      onClose();
    } catch (err) {
      setApiError(err.message || 'Error al renovar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <RotateCcw size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Renovar Suscripción</h2>
              <p className="text-[11px] text-slate-400">{sub.customerName} · {sub.serviceName || sub.productName || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[76vh] overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Calendar size={10} /> Nueva fecha de vencimiento
            </label>
            <input {...register('newExpiration')} type="date" className={inputCls(!!errors.newExpiration)} />
            {errors.newExpiration && <p className="text-[10px] text-red-500 font-bold">{errors.newExpiration.message}</p>}
          </div>

          <PaymentSection register={register} errors={errors} paymentMethods={paymentMethods} />

          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600">
              <AlertCircle size={13} className="shrink-0" /> {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              {isSubmitting ? 'Renovando...' : 'Confirmar Renovación'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── SubscriptionsPage ─────────────────────────────────────────────────────────
export function SubscriptionsPage() {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [subs,      setSubs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [tab,       setTab]       = useState('active'); // 'active' | 'unassigned'
  const [creating,  setCreating]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [canceling, setCanceling] = useState(null);
  const [renewing,  setRenewing]  = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const fetcher =
        tab === 'unassigned' ? subscriptionService.getUnassigned
                             : subscriptionService.getActive;
      const data = await fetcher(token);
      setSubs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id) => {
    setCanceling(id);
    try {
      await subscriptionService.cancel(id, token);
      toast.success('Suscripción cancelada');
      setSubs(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error(err.message || 'Error al cancelar');
    } finally {
      setCanceling(null);
    }
  };

  const filtered = subs.filter(s =>
    (s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
     s.username?.toLowerCase().includes(search.toLowerCase()) ||
     s.accessUser?.toLowerCase().includes(search.toLowerCase()) ||
     s.productName?.toLowerCase().includes(search.toLowerCase()) ||
     s.serviceName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20 text-white shrink-0">
              <Tv size={20} strokeWidth={2.5} />
            </div>
            Suscripciones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cuentas IPTV activas por cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-violet-600 transition-all shadow-sm">
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
          </button>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-violet-600/20">
            <Plus size={15} /> Nueva
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start">
        {[
          { value: 'active',     label: 'Activas'     },
          { value: 'unassigned', label: 'Sin asignar' },
        ].map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black transition-all',
              tab === t.value
                ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, usuario o servicio..."
          className="w-full h-11 pl-11 pr-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-violet-500" size={24} />
        </div>
      ) : (
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Servicio</th>
                  <th className="px-5 py-4">Credenciales</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Vencimiento</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.map(s => {
                  const expDate  = s.expirationDate || s.expiresAt || s.endDate;
                  const expiring = isExpiringSoon(expDate);
                  const expired  = expDate && new Date(expDate) < new Date();
                  const isUnassigned = s.status === 'Unassigned' || !s.customerId;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-4">
                        {isUnassigned ? (
                          <span className="text-slate-400 dark:text-slate-500 text-xs italic">— sin asignar —</span>
                        ) : (
                          <>
                            <p className="font-black text-slate-900 dark:text-white text-xs uppercase">{s.customerName || '—'}</p>
                            <p className="text-[11px] text-slate-400">{s.customerPhone || s.customerEmail || ''}</p>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-700/50">
                          {s.productName || s.serviceName || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <code className="text-[11px] font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                          {s.accessUser || s.username || '—'} / {s.accessPassword || s.password || '—'}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          'text-xs font-bold flex items-center gap-1.5',
                          expired  ? 'text-red-500'   :
                          expiring ? 'text-amber-500'  :
                                     'text-slate-600 dark:text-slate-400'
                        )}>
                          <Calendar size={13} />
                          {fmtDate(expDate)}
                          {expiring && !expired && <span className="text-[9px] font-black uppercase text-amber-500">Pronto</span>}
                          {expired  && <span className="text-[9px] font-black uppercase text-red-500">Expirada</span>}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          {isUnassigned ? (
                            <button onClick={() => setAssigning(s)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                              <UserPlus size={12} /> Asignar
                            </button>
                          ) : (
                            <>
                              <button onClick={() => setRenewing(s)} title="Renovar"
                                className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                <RotateCcw size={14} />
                              </button>
                              <button onClick={() => setEditing(s)} title="Editar"
                                className="p-2 rounded-xl text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                                <Pencil size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleCancel(s.id)}
                            disabled={canceling === s.id}
                            className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                            {canceling === s.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Sin suscripciones
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {creating && (
          <CreateModal onClose={() => setCreating(false)} onSaved={load} />
        )}
        {assigning && (
          <AssignModal sub={assigning} onClose={() => setAssigning(null)} onSaved={load} />
        )}
        {editing && (
          <EditModal sub={editing} onClose={() => setEditing(null)} onSaved={load} />
        )}
        {renewing && (
          <RenewModal sub={renewing} onClose={() => setRenewing(null)} onSaved={load} />
        )}
      </AnimatePresence>
    </div>
  );
}
