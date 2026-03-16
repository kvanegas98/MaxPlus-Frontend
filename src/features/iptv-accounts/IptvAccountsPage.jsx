import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input';
import PhoneField from '../../components/ui/PhoneField';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search, Plus, Edit2, Server, RefreshCw, X, Check,
  Loader2, AlertCircle, Lock, Globe, User, Key, Mail,
  UserPlus, Users, Calendar, DollarSign, FileText,
  ShoppingBag, ChevronLeft, ChevronRight,
  Tv, Trash2, RotateCcw, UserMinus,
} from 'lucide-react';

function WhatsAppIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
import { iptvAccountService } from '../../services/iptvAccountService';
import { subscriptionService } from '../../services/subscriptionService';
import { serviceTypeService } from '../../services/serviceTypeService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { customerService } from '../../services/customerService';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

// ─── Schemas ───────────────────────────────────────────────────────────────────
const accountSchema = z.object({
  tipoServicioId: z.string().optional().or(z.literal('')),
  accessEmail:    z.string().optional().or(z.literal('')),
  accessUser:     z.string().min(1, 'Requerido'),
  accessPassword: z.string().min(1, 'Requerido'),
  platformUrl:    z.string().url('URL inválida').or(z.literal('')).optional(),
  pinCode:        z.string().optional().or(z.literal('')),
  maxSlots:       z.coerce.number().int().min(1, 'Mínimo 1'),
  purchasePrice:  z.coerce.number().min(0, 'Debe ser ≥ 0'),
  expirationDate: z.string().optional().or(z.literal('')),
  notes:          z.string().optional().or(z.literal('')),
});

const assignSchema = z.object({
  customerId:       z.string().optional().or(z.literal('')),
  customerName:     z.string().optional().or(z.literal('')),
  customerPhone:    z.string().optional().or(z.literal('')).refine(v => !v || isValidPhoneNumber(v), 'Número inválido — verifica el código de país'),
  customerEmail:    z.string().optional().or(z.literal('')),
  tipoServicioId:   z.string().optional().or(z.literal('')),
  expirationDate:   z.string().optional().or(z.literal('')),
  paymentMethod:    z.string().optional().or(z.literal('')),
  metodoPagoId:     z.string().optional().or(z.literal('')),
  paymentReference: z.string().optional().or(z.literal('')),
  amountReceived:   z.coerce.number().min(0).optional(),
  discountAmount:   z.coerce.number().min(0).optional(),
}).superRefine((data, ctx) => {
  if (!data.customerId && !data.customerName) {
    ctx.addIssue({ code: 'custom', path: ['customerName'], message: 'Selecciona o ingresa un cliente' });
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = (hasError) => cn(
  'w-full h-12 px-4 bg-white dark:bg-[#1E1E2C] border rounded-2xl text-sm font-medium text-slate-900 dark:text-slate-100',
  'placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 transition-all duration-300',
  hasError
    ? 'border-red-500/40 focus:ring-red-500/15 focus:border-red-500/50 bg-red-500/5'
    : 'border-slate-200 dark:border-white/5 focus:ring-violet-500/15 focus:border-violet-500/40',
);

function isoToDateInput(iso) {
  return iso ? iso.split('T')[0] : '';
}

// Days chip — >15d green · 6-14d amber · ≤5d red · ≤0 "Vencido" red
function DaysChip({ days, label }) {
  if (days === null || days === undefined) return null;
  const expired = days <= 0;
  const isRed   = days <= 5;
  const isAmber = days >= 6 && days <= 14;
  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-[9px] font-black uppercase border whitespace-nowrap',
      (expired || isRed) ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-700'
      : isAmber           ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-700'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-700',
    )}>
      {expired ? (label || 'Vencido') : `${days}d`}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

function waReminder(phone, name, days) {
  const clean = (phone || '').replace(/\D/g, '');
  if (!clean) return null;
  const text = days <= 0
    ? `Hola ${name}, tu suscripción IPTV ha vencido. Por favor renueva.`
    : `Hola ${name}, tu suscripción IPTV vence en ${days} día${days !== 1 ? 's' : ''}. ¡Renueva ahora!`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

// ─── CustomerSearch ────────────────────────────────────────────────────────────
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
      <div className="flex items-center gap-3 h-12 px-4 bg-white dark:bg-[#1E1E2C] border border-slate-200 dark:border-white/5 rounded-2xl focus-within:ring-4 focus-within:ring-violet-500/15 focus-within:border-violet-500/40 transition-all duration-300">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o teléfono..."
          value={selectedCustomer ? (selectedCustomer.name || selectedCustomer.fullName) : query}
          onChange={(e) => { onClear(); setQuery(e.target.value); }}
          className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        {selectedCustomer && (
          <button type="button" onClick={() => { onClear(); setQuery(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={15} />
          </button>
        )}
      </div>
      {results.length > 0 && !selectedCustomer && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#151520] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl z-10 overflow-hidden">
          {results.slice(0, 5).map(c => (
            <button key={c.id} type="button"
              onClick={() => { onSelect(c); setResults([]); setQuery(''); }}
              className="w-full px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-[#1E1E2C] transition-colors border-b border-slate-50 dark:border-white/5 last:border-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name || c.fullName}</p>
              <p className="text-[11px] text-slate-500">{c.phone} · {c.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AccountFormModal ──────────────────────────────────────────────────────────
function AccountFormModal({ editing, onClose, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [apiError,         setApiError]         = useState('');
  const [services,         setServices]         = useState([]);
  const [plataformasConfig, setPlataformasConfig] = useState([]);

  useEffect(() => {
    Promise.all([
      serviceTypeService.getAll(token),
      serviceTypeService.getPlataformasConfig(token),
    ]).then(([sv, pc]) => {
      setServices(Array.isArray(sv) ? sv.filter(s => s.isActive) : []);
      setPlataformasConfig(Array.isArray(pc) ? pc : []);
    }).catch(() => {});
  }, [token]);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      tipoServicioId: editing?.tipoServicioId ? String(editing.tipoServicioId) : '',
      accessEmail:    editing?.accessEmail    || '',
      accessUser:     editing?.accessUser     || '',
      accessPassword: editing?.accessPassword || '',
      platformUrl:    editing?.platformUrl    || '',
      pinCode:        editing?.pinCode        || '',
      maxSlots:       editing?.maxSlots       ?? 1,
      purchasePrice:  editing?.purchasePrice  ?? 0,
      expirationDate: isoToDateInput(editing?.expirationDate),
      notes:          editing?.notes          || '',
    },
  });

  const watchedServiceId = watch('tipoServicioId');

  // Derive active platform config from selected service type
  const configActiva = useMemo(() => {
    if (!watchedServiceId || !services.length || !plataformasConfig.length) return null;
    const tipo = services.find(s => String(s.id) === watchedServiceId);
    if (!tipo?.plataforma) return null;
    return plataformasConfig.find(c => c.plataforma === tipo.plataforma) || null;
  }, [watchedServiceId, services, plataformasConfig]);

  // Defaults when no config is active: show all fields
  const labelUsuario  = configActiva?.labelUsuario || 'Usuario';
  const mostrarPin    = configActiva ? configActiva.tienePin    : true;
  const mostrarUrl    = configActiva ? configActiva.tieneUrl    : true;
  const mostrarCorreo = configActiva ? !!configActiva.tieneCorreo : false;

  const onSubmit = async (data) => {
    setApiError('');
    try {
      const body = {
        tipoServicioId: data.tipoServicioId || null,
        accessEmail:    mostrarCorreo ? (data.accessEmail || null) : null,
        accessUser:     data.accessUser,
        accessPassword: data.accessPassword,
        platformUrl:    mostrarUrl ? (data.platformUrl || null) : null,
        pinCode:        mostrarPin ? (data.pinCode     || null) : null,
        maxSlots:       data.maxSlots,
        purchasePrice:  data.purchasePrice,
        expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
        notes:          data.notes          || null,
      };
      if (editing) {
        await iptvAccountService.update(editing.id, body, token);
        toast.success('Cuenta actualizada');
      } else {
        await iptvAccountService.create(body, token);
        toast.success('Cuenta creada');
      }
      onSaved();
      onClose();
    } catch (err) {
      setApiError(err.message || 'Error al guardar');
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
        className="relative z-10 w-full max-w-md bg-white dark:bg-[#0A0A0F] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center border border-violet-100 dark:border-violet-500/20">
              <Server size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {editing ? 'Editar Cuenta' : 'Nueva Cuenta IPTV'}
            </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-[#151520] transition-colors border border-transparent dark:hover:border-white/5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5 max-h-[76vh] overflow-y-auto scrollbar-hide">

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Tv size={10} /> Tipo de Servicio (opcional)
            </label>
            <select {...register('tipoServicioId')} className={inputCls(false)}>
              <option value="">— Sin asignar —</option>
              {services.map(s => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credenciales del proveedor</p>

          {/* Correo — condicional según config */}
          {mostrarCorreo && (
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <Mail size={10} /> Correo (accessEmail)
              </label>
              <input {...register('accessEmail')} type="email" placeholder="cuenta@netflix.com" className={inputCls(!!errors.accessEmail)} />
              {errors.accessEmail && <p className="text-[10px] text-red-500 font-bold">{errors.accessEmail.message}</p>}
            </div>
          )}

          {/* URL — condicional según config */}
          {mostrarUrl && (
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <Globe size={10} /> URL / HOST (opcional)
              </label>
              <input {...register('platformUrl')} type="url" placeholder="https://appv1.xyz" className={inputCls(!!errors.platformUrl)} />
              {errors.platformUrl && <p className="text-[10px] text-red-500 font-bold">{errors.platformUrl.message}</p>}
            </div>
          )}

          {/* Usuario — label dinámico */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <User size={10} /> {labelUsuario}
            </label>
            <input {...register('accessUser')} type="text" placeholder={labelUsuario === 'Correo' ? 'usuario@correo.com' : 'usuario123'} className={inputCls(!!errors.accessUser)} />
            {errors.accessUser && <p className="text-[10px] text-red-500 font-bold">{errors.accessUser.message}</p>}
          </div>

          {/* Contraseña — siempre */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Lock size={10} /> Contraseña
            </label>
            <input {...register('accessPassword')} type="password" placeholder="pass456" className={inputCls(!!errors.accessPassword)} />
            {errors.accessPassword && <p className="text-[10px] text-red-500 font-bold">{errors.accessPassword.message}</p>}
          </div>

          {/* PIN — condicional según config */}
          {mostrarPin && (
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <Key size={10} /> PIN {configActiva?.tienePin ? '' : '(opcional)'}
              </label>
              <input {...register('pinCode')} type="text" placeholder="1234" className={inputCls(!!errors.pinCode)} />
              {errors.pinCode && <p className="text-[10px] text-red-500 font-bold">{errors.pinCode.message}</p>}
            </div>
          )}

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-slate-800">Configuración</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <Users size={10} /> Slots (max clientes)
              </label>
              <input {...register('maxSlots')} type="number" min="1" placeholder="3" className={inputCls(!!errors.maxSlots)} />
              {errors.maxSlots && <p className="text-[10px] text-red-500 font-bold">{errors.maxSlots.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <DollarSign size={10} /> Precio compra (C$)
              </label>
              <input {...register('purchasePrice')} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls(!!errors.purchasePrice)} />
              {errors.purchasePrice && <p className="text-[10px] text-red-500 font-bold">{errors.purchasePrice.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Calendar size={10} /> Vencimiento cuenta proveedor (opcional)
            </label>
            <input {...register('expirationDate')} type="date" className={inputCls(false)} />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <FileText size={10} /> Notas (opcional)
            </label>
            <input {...register('notes')} type="text" placeholder="Cuenta principal, etc." className={inputCls(false)} />
          </div>

          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600">
              <AlertCircle size={13} className="shrink-0" /> {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 h-14 bg-slate-50 dark:bg-[#151520] text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-[#1E1E2C] transition-colors border border-slate-200 dark:border-white/5">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-14 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-[0_4px_15px_rgba(124,59,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,59,237,0.4)] cursor-pointer">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
              {isSubmitting ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── AssignModal ───────────────────────────────────────────────────────────────
function AssignModal({ account, onClose, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [services,         setServices]         = useState([]);
  const [paymentMethods,   setPaymentMethods]   = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedService,  setSelectedService]  = useState(null);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    Promise.all([
      serviceTypeService.getAll(token),
      paymentMethodService.getAll(token),
    ]).then(([sv, pm]) => {
      setServices(Array.isArray(sv) ? sv.filter(s => s.isActive) : []);
      setPaymentMethods(Array.isArray(pm) ? pm.filter(m => m.isActive !== false) : []);
    }).catch(() => {});
  }, [token]);

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      customerId: '', customerName: '', customerPhone: '', customerEmail: '',
      tipoServicioId: '', expirationDate: '',
      paymentMethod: '', metodoPagoId: '', paymentReference: '',
      amountReceived: '', discountAmount: '',
    },
  });

  useEffect(() => { setValue('customerId', selectedCustomer?.id || ''); }, [selectedCustomer, setValue]);

  const watchedServiceId = watch('tipoServicioId');
  useEffect(() => {
    setSelectedService(services.find(s => s.id === watchedServiceId) || null);
  }, [watchedServiceId, services]);

  // Preview expiration from service
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
      const body = {};
      if (selectedCustomer) {
        body.customerId = selectedCustomer.id;
      } else {
        body.customerName  = data.customerName  || null;
        body.customerPhone = data.customerPhone || null;
        body.customerEmail = data.customerEmail || null;
      }
      if (data.tipoServicioId) body.tipoServicioId   = data.tipoServicioId;
      if (data.expirationDate) body.expirationDate   = new Date(data.expirationDate).toISOString();
      if (data.paymentMethod)  body.paymentMethod    = data.paymentMethod;
      if (data.metodoPagoId)   body.metodoPagoId     = data.metodoPagoId;
      if (data.paymentReference) body.paymentReference = data.paymentReference;
      if (data.amountReceived)  body.amountReceived  = Number(data.amountReceived);
      body.discountAmount = Number(data.discountAmount) || 0;

      await iptvAccountService.assign(account.id, body, token);
      toast.success('Cliente asignado al slot');
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
        className="relative z-10 w-full max-w-md bg-white dark:bg-[#0A0A0F] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <UserPlus size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Asignar cliente al slot</h2>
              <p className="text-xs text-slate-500 font-medium">{account.accessUser} · {account.availableSlots} slot{account.availableSlots !== 1 ? 's' : ''} libre{account.availableSlots !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-[#151520] transition-colors border border-transparent dark:hover:border-white/5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5 max-h-[76vh] overflow-y-auto scrollbar-hide">

          {/* Cliente */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
          <CustomerSearch selectedCustomer={selectedCustomer} onSelect={setSelectedCustomer} onClear={() => setSelectedCustomer(null)} />
          <input type="hidden" {...register('customerId')} />

          {!selectedCustomer && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O ingresa cliente nuevo</p>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre</label>
                <input {...register('customerName')} placeholder="Juan Pérez" className={inputCls(!!errors.customerName)} />
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
                <input {...register('customerEmail')} placeholder="juan@gmail.com" className={inputCls(!!errors.customerEmail)} />
                {errors.customerEmail && <p className="text-[10px] text-red-500 font-bold">{errors.customerEmail.message}</p>}
              </div>
            </div>
          )}

          {/* Servicio */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-slate-800">
            Servicio <span className="normal-case font-medium text-slate-300 dark:text-slate-600">(opcional — calcula duración)</span>
          </p>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Tv size={10} /> Plan IPTV
            </label>
            <select {...register('tipoServicioId')} className={cn(inputCls(false), 'cursor-pointer')}>
              <option value="">— Sin plan específico —</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} — C${s.price} ({s.durationDays}d)</option>
              ))}
            </select>
          </div>

          {/* Expiration preview from service */}
          {expirationPreview && (
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
              <Calendar size={12} className="text-violet-500 shrink-0" />
              <p className="text-[11px] font-bold text-violet-700 dark:text-violet-300">
                Vence el <span className="font-black">{expirationPreview}</span> ({selectedService.durationDays} días)
              </p>
            </div>
          )}

          {/* Manual expiry override */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Calendar size={10} /> Fecha de vencimiento manual <span className="normal-case font-medium text-slate-400">(opcional)</span>
            </label>
            <input {...register('expirationDate')} type="date" className={inputCls(false)} />
          </div>

          {/* Pago */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-slate-800">
            Pago <span className="normal-case font-medium text-slate-300 dark:text-slate-600">(opcional — genera factura)</span>
          </p>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <ShoppingBag size={10} /> Método de pago
            </label>
            <select {...register('metodoPagoId')} className={cn(inputCls(false), 'cursor-pointer')}>
              <option value="">— Sin método registrado —</option>
              {paymentMethods.map(m => (
                <option key={m.id} value={m.id}>{m.nombre} — {m.banco}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <FileText size={10} /> Referencia
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

          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600">
              <AlertCircle size={13} className="shrink-0" /> {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 h-14 bg-slate-50 dark:bg-[#151520] text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-[#1E1E2C] transition-colors border border-slate-200 dark:border-white/5">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] cursor-pointer">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} strokeWidth={2.5} />}
              {isSubmitting ? 'Asignando...' : 'Asignar slot'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── ReleaseSlotDialog ────────────────────────────────────────────────────────
function ReleaseSlotDialog({ slot, onClose, onConfirm, releasing }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={!releasing ? onClose : undefined}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-[#0A0A0F] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center shrink-0">
              <UserMinus size={24} className="text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">¿Liberar este slot?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                El cliente <span className="font-bold text-slate-900 dark:text-slate-200">{slot.customerName}</span> perderá
                acceso al servicio. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose} disabled={releasing}
              className="flex-1 h-14 bg-slate-50 dark:bg-[#151520] text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-[#1E1E2C] transition-colors border border-slate-200 dark:border-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button" onClick={onConfirm} disabled={releasing}
              className="flex-[2] h-14 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              {releasing ? <Loader2 size={18} className="animate-spin" /> : <UserMinus size={18} strokeWidth={2.5} />}
              {releasing ? 'Liberando...' : 'Liberar slot'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── AccountCard ───────────────────────────────────────────────────────────────
function AccountCard({ account, onEdit, onDeactivate, onAssign, onRenew, onReleaseSlot, isAdmin, deactivating }) {
  const { usedSlots, availableSlots, maxSlots, clients = [] } = account;
  const accountExpiringSoon = account.daysRemaining !== null && account.daysRemaining <= 7;
  const isExpired = account.daysRemaining !== null && account.daysRemaining <= 0;

  const slotStatusColor = {
    Active:    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    Expired:   'bg-red-50 dark:bg-red-900/20 text-red-500',
    Cancelled: 'bg-slate-100 dark:bg-slate-700 text-slate-400',
    Available: 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600',
  };

  const service = account.serviceName || 'Servicio IPTV';
  const sLower = service.toLowerCase();
  let logoColor = 'bg-violet-100 dark:bg-violet-900/30 text-violet-600';
  let initial = service.charAt(0).toUpperCase();

  if (sLower.includes('netflix')) { logoColor = 'bg-[#E50914] text-white'; initial = 'N'; }
  else if (sLower.includes('disney')) { logoColor = 'bg-[#113CCF] text-white'; initial = 'D'; }
  else if (sLower.includes('max') || sLower.includes('hbo')) { logoColor = 'bg-[#002BE7] text-white'; initial = 'M'; }
  else if (sLower.includes('prime')) { logoColor = 'bg-[#00A8E1] text-white'; initial = 'P'; }

  return (
    <div className={cn(
      'bg-white dark:bg-[#151520] border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
      accountExpiringSoon
        ? 'border-amber-200 dark:border-amber-700/50'
        : 'border-slate-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/30',
    )}>
      {/* Account-level expiry warning */}
      {accountExpiringSoon && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
          <AlertCircle size={12} className="text-amber-500 shrink-0" />
          <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wide">
            {account.daysRemaining <= 0 ? 'Cuenta vencida — renovar con proveedor' : `Cuenta vence en ${account.daysRemaining} días`}
          </p>
        </div>
      )}

      {/* Card Header Premium Style */}
      <div className="p-5 border-b border-slate-50 dark:border-slate-700/50">
         <div className="flex justify-between items-start gap-3">
            <div className="flex gap-3 min-w-0">
               <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm", logoColor)}>
                  {initial}
               </div>
               <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{service}</p>
                  <p className="text-xs font-bold text-slate-500 truncate mt-0.5">{account.accessUser}</p>
                  {account.daysRemaining !== null && !isExpired && (
                     <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={10} /> {account.daysRemaining} días restantes
                     </p>
                  )}
               </div>
            </div>
             <div className="shrink-0 flex flex-col items-end gap-1.5">
               <span className={cn(
                 "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                 isExpired ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-100 dark:border-red-500/20" : accountExpiringSoon ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
               )}>
                 {isExpired ? 'Vencida' : 'Activa'}
               </span>
               <div className="bg-slate-50 dark:bg-[#1E1E2C] px-2.5 py-1 rounded-lg mt-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#252536] transition-colors border border-slate-100 dark:border-white/5" title="Copiar contraseña">
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">{account.accessPassword}</span>
               </div>
            </div>
         </div>

         {/* Slots Progress bar */}
         <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
               <span className="text-slate-400">Ocupación</span>
               <span className="text-slate-700 dark:text-slate-300">{usedSlots} <span className="text-slate-400">/ {maxSlots}</span></span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
               <div
                 className={cn("h-full rounded-full transition-all", usedSlots === maxSlots ? 'bg-red-400' : usedSlots >= maxSlots * 0.75 ? 'bg-amber-400' : 'bg-emerald-400')}
                 style={{ inlineSize: `${(usedSlots / maxSlots) * 100}%` }}
               />
            </div>
         </div>
      </div>

      {/* Clients list */}
      <div className="divide-y divide-slate-50 dark:divide-white/5 bg-slate-50/50 dark:bg-[#1E1E2C]/30">
        {clients.map((client, i) => {
          if (client.status === 'Available') {
            return (
              <div key={`slot-${i}`} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                    <UserPlus size={12} className="text-slate-300 dark:text-slate-500" />
                  </div>
                  <button onClick={() => onAssign(account)}
                    className="flex-1 text-left text-xs font-bold text-slate-400 hover:text-violet-600 transition-colors">
                    Asignar cliente a este slot...
                  </button>
                </div>
              </div>
            );
          }

          const waLink = waReminder(client.customerPhone, client.customerName, client.daysRemaining);
          return (
            <div key={client.subscriptionId || i} className="px-5 py-3 flex items-center justify-between gap-2 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  'w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm',
                  client.status === 'Expired' ? 'bg-red-500' : 'bg-slate-800 dark:bg-[#252536]',
                )}>
                  {(client.customerName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{client.customerName || '—'}</p>
                  {client.expirationDate ? (
                     <p className="text-[10px] font-medium text-slate-400">Vence: {fmtDate(client.expirationDate)}</p>
                  ) : client.customerPhone ? (
                     <p className="text-[10px] font-medium text-slate-400">{client.customerPhone}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg p-1 shadow-sm">
                   <button
                     onClick={() => onRenew({
                       id:             client.subscriptionId,
                       customerName:   client.customerName,
                       serviceName:    account.serviceName,
                       tipoServicioId: account.tipoServicioId,
                       expirationDate: client.expirationDate,
                     })}
                     title="Renovar"
                     className="w-7 h-7 flex items-center justify-center rounded-md text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/40 transition-colors">
                     <RotateCcw size={12} strokeWidth={2.5} />
                   </button>
                   {waLink && (
                     <a href={waLink} target="_blank" rel="noopener noreferrer"
                       title="Recordatorio WhatsApp"
                       className="w-7 h-7 flex items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors">
                       <WhatsAppIcon size={14} />
                     </a>
                   )}
                   {isAdmin && (
                     <button
                       onClick={() => onReleaseSlot({ subscriptionId: client.subscriptionId, customerName: client.customerName })}
                       title="Liberar slot"
                       className="w-7 h-7 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors">
                       <UserMinus size={12} strokeWidth={2.5} />
                     </button>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 p-3 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#151520]">
        <button onClick={() => onEdit(account)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1E1E2C] hover:bg-slate-100 dark:hover:bg-[#252536] transition-colors border border-transparent dark:border-white/5">
          <Edit2 size={14} /> Editar Cuenta
        </button>
        <button onClick={() => onDeactivate(account.id)} disabled={deactivating === account.id}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50 shrink-0 border border-transparent dark:border-red-500/10">
          {deactivating === account.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── RenewModal ────────────────────────────────────────────────────────────────
const renewSchema = z.object({
  newExpiration:    z.string().min(1, 'Fecha requerida'),
  metodoPagoId:     z.string().optional().or(z.literal('')),
  paymentReference: z.string().optional().or(z.literal('')),
  amountReceived:   z.coerce.number().min(0).optional(),
  discountAmount:   z.coerce.number().min(0).optional(),
});

function RenewModal({ sub, onClose, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [apiError,       setApiError]       = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(renewSchema),
    defaultValues: { newExpiration: '', metodoPagoId: '', paymentReference: '', amountReceived: '', discountAmount: '' },
  });

  useEffect(() => {
    Promise.all([
      paymentMethodService.getAll(token),
      sub.tipoServicioId ? serviceTypeService.getById(sub.tipoServicioId, token) : Promise.resolve(null),
    ]).then(([pm, svc]) => {
      setPaymentMethods(Array.isArray(pm) ? pm.filter(m => m.isActive !== false) : []);
      const base = sub.expirationDate && new Date(sub.expirationDate) > new Date()
        ? new Date(sub.expirationDate) : new Date();
      if (svc?.durationDays) {
        base.setDate(base.getDate() + svc.durationDays);
        setValue('newExpiration', base.toISOString().split('T')[0]);
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

  const iCls = (e) => cn(
    'w-full h-10 px-3 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-800 dark:text-slate-100',
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
    e ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-violet-500/30 focus:border-violet-400',
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-[#0A0A0F] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <RotateCcw size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Renovar Suscripción</h2>
              <p className="text-xs text-slate-500 font-medium">{sub.customerName} · {sub.serviceName || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-[#151520] transition-colors border border-transparent dark:hover:border-white/5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5 max-h-[76vh] overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Calendar size={10} /> Nueva fecha de vencimiento
            </label>
            <input {...register('newExpiration')} type="date" className={iCls(!!errors.newExpiration)} />
            {errors.newExpiration && <p className="text-[10px] text-red-500 font-bold">{errors.newExpiration.message}</p>}
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-slate-800">
            Pago <span className="text-slate-300 dark:text-slate-600 normal-case font-medium">(opcional — genera factura)</span>
          </p>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Key size={10} /> Método de pago
            </label>
            <select {...register('metodoPagoId')} className={cn(iCls(false), 'cursor-pointer')}>
              <option value="">— Sin método registrado —</option>
              {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.nombre} — {m.banco}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <FileText size={10} /> Referencia de transferencia
            </label>
            <input {...register('paymentReference')} type="text" placeholder="TRF-20260308-001" className={iCls(false)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <DollarSign size={10} /> Monto (C$)
              </label>
              <input {...register('amountReceived')} type="number" step="0.01" min="0" placeholder="0.00" className={iCls(false)} />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <DollarSign size={10} /> Descuento (C$)
              </label>
              <input {...register('discountAmount')} type="number" step="0.01" min="0" placeholder="0.00" className={iCls(false)} />
            </div>
          </div>

          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600">
              <AlertCircle size={13} className="shrink-0" /> {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 h-14 bg-slate-50 dark:bg-[#151520] text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-[#1E1E2C] transition-colors border border-slate-200 dark:border-white/5 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] cursor-pointer">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} strokeWidth={2.5} />}
              {isSubmitting ? 'Renovando...' : 'Confirmar Renovación'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── IptvAccountsPage ─────────────────────────────────────────────────────────
export function IptvAccountsPage() {
  const { token, user } = useAuthContext();
  const { toast } = useToast();
  const isAdmin = user?.roleName === 'Admin';

  const PAGE_SIZE = 10;

  const [stats,        setStats]        = useState(null);
  const [accounts,     setAccounts]     = useState([]);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [hasNext,      setHasNext]      = useState(false);
  const [hasPrev,      setHasPrev]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [creating,     setCreating]     = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [assigning,    setAssigning]    = useState(null);
  const [renewing,     setRenewing]     = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const [releaseTarget, setReleaseTarget] = useState(null); // { subscriptionId, customerName }
  const [releasingSlot, setReleasingSlot] = useState(false);

  const load = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const [statsData, viewData] = await Promise.all([
        iptvAccountService.getStats(token),
        iptvAccountService.getView(token, p, PAGE_SIZE),
      ]);
      setStats(statsData);
      setAccounts(Array.isArray(viewData.data) ? viewData.data : []);
      setPage(viewData.page       ?? p);
      setTotalPages(viewData.totalPages ?? 1);
      setTotal(viewData.total      ?? 0);
      setHasNext(viewData.hasNext  ?? false);
      setHasPrev(viewData.hasPrev  ?? false);
    } catch {
      toast.error('Error al cargar cuentas IPTV');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(1); }, [load]);

  const goToPage = useCallback((p) => load(p), [load]);

  const handleDeactivate = async (id) => {
    setDeactivating(id);
    try {
      await iptvAccountService.deactivate(id, token);
      toast.success('Cuenta desactivada');
      load(page);
    } catch (err) {
      toast.error(err.message || 'Error al desactivar');
    } finally {
      setDeactivating(null);
    }
  };

  const handleReleaseSlot = async () => {
    if (!releaseTarget) return;
    setReleasingSlot(true);
    try {
      await subscriptionService.cancel(releaseTarget.subscriptionId, token);
      toast.success('Slot liberado correctamente');
      setReleaseTarget(null);
      load(page);
    } catch (err) {
      toast.error(err.message || 'Error al liberar slot');
    } finally {
      setReleasingSlot(false);
    }
  };

  const [selectedPlatform, setSelectedPlatform] = useState('Todas');
  const platforms = useMemo(() => {
    const names = accounts.map(a => {
      const s = a.serviceName || '';
      if (s.toLowerCase().includes('netflix')) return 'Netflix';
      if (s.toLowerCase().includes('disney')) return 'Disney+';
      if (s.toLowerCase().includes('max') || s.toLowerCase().includes('hbo')) return 'Max';
      if (s.toLowerCase().includes('prime')) return 'Prime';
      return s.split(' ')[0] || 'Otro';
    });
    return ['Todas', ...Array.from(new Set(names.filter(n => n !== 'Otro' && n)))];
  }, [accounts]);

  const filtered = accounts.filter(a => {
    const sLower = (a.serviceName || '').toLowerCase();
    const matchPlat = selectedPlatform === 'Todas' ||
      (selectedPlatform === 'Netflix' && sLower.includes('netflix')) ||
      (selectedPlatform === 'Disney+' && sLower.includes('disney')) ||
      (selectedPlatform === 'Max' && (sLower.includes('max') || sLower.includes('hbo'))) ||
      (selectedPlatform === 'Prime' && sLower.includes('prime')) ||
      (sLower.includes(selectedPlatform.toLowerCase()));
      
    return matchPlat && (!search ||
      a.accessUser?.toLowerCase().includes(search.toLowerCase()) ||
      a.platformUrl?.toLowerCase().includes(search.toLowerCase()) ||
      a.notes?.toLowerCase().includes(search.toLowerCase()));
  });

  const kpis = stats ? [
    { label: 'Cuentas activas', value: stats.totalAccounts,  color: 'text-slate-700 dark:text-slate-200'    },
    { label: 'Total slots',     value: stats.totalSlots,     color: 'text-violet-600 dark:text-violet-400'  },
    { label: 'Ocupados',        value: stats.usedSlots,      color: 'text-amber-600 dark:text-amber-400'    },
    { label: 'Libres',          value: stats.availableSlots, color: 'text-emerald-600 dark:text-emerald-400'},
  ] : [];

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full gap-5 bg-slate-50 dark:bg-[#0A0A0F] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20 text-white shrink-0">
              <Tv size={20} strokeWidth={2.5} />
            </div>
            Suscripciones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cuentas IPTV con slots por cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(page)}
            className="p-3 rounded-[1rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151520] text-slate-500 hover:text-violet-600 transition-all shadow-sm">
            <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
          </button>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-[1rem] transition-all shadow-[0_4px_15px_rgba(124,59,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,59,237,0.4)]">
            <Plus size={18} strokeWidth={2.5} /> Nueva Cuenta
          </button>
        </div>
      </div>

      {/* KPIs */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-white dark:bg-[#151520] rounded-[2rem] border border-slate-100 dark:border-white/5 p-6 text-center shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <p className={cn('text-3xl font-black font-display tracking-tight', k.color)}>{k.value}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters (Chips & Search) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {platforms.map(p => (
               <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={cn(
                     "px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border border-transparent dark:border-white/5",
                     selectedPlatform === p 
                       ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[0_4px_15px_rgba(255,255,255,0.15)]"
                       : "bg-white dark:bg-[#151520] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E1E2C]"
                  )}
               >
                  {p}
               </button>
            ))}
         </div>
         <div className="relative shrink-0 sm:w-72 mt-2 sm:mt-0">
           <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input
             value={search} onChange={(e) => setSearch(e.target.value)}
             placeholder="Buscar cuentas..."
             className="w-full h-12 pl-12 pr-4 text-sm bg-white dark:bg-[#151520] border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15 transition-all font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
           />
         </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-violet-500" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <Server size={32} className="mb-3 opacity-40 text-slate-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Sin cuentas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
              onEdit={setEditing}
              onDeactivate={handleDeactivate}
              onAssign={setAssigning}
              onRenew={setRenewing}
              onReleaseSlot={setReleaseTarget}
              isAdmin={isAdmin}
              deactivating={deactivating}
            />
          ))}
        </div>
      )}

      {/* Pagination — always visible when there are results */}
      {total > 0 && (
        <div className="flex items-center justify-between gap-3 pt-6 rounded-2xl">
          <p className="text-xs text-slate-400 font-bold">
            Página {page} de {totalPages} · {total} cuenta{total !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={!hasPrev || loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#151520] border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-[#1E1E2C] hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasNext || loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#151520] border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-[#1E1E2C] hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {creating      && <AccountFormModal onClose={() => setCreating(false)} onSaved={() => load(1)} />}
        {editing       && <AccountFormModal editing={editing} onClose={() => setEditing(null)} onSaved={() => load(page)} />}
        {assigning     && <AssignModal account={assigning} onClose={() => setAssigning(null)} onSaved={() => load(page)} />}
        {renewing      && <RenewModal  sub={renewing}      onClose={() => setRenewing(null)}  onSaved={() => load(page)} />}
        {releaseTarget && <ReleaseSlotDialog slot={releaseTarget} onClose={() => setReleaseTarget(null)} onConfirm={handleReleaseSlot} releasing={releasingSlot} />}
      </AnimatePresence>
    </div>
  );
}
