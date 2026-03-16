import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, RefreshCw, CheckCircle, XCircle, Clock,
  X, Loader2, AlertCircle, Calendar, Tv,
  Mail, Phone, FileText,
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderService } from '../../services/orderService';
import { iptvAccountService } from '../../services/iptvAccountService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { serviceTypeService } from '../../services/serviceTypeService';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-NI', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CFG = {
  Pending:  { label: 'Pendiente',  color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-700/50',  dot: 'bg-amber-500' },
  Approved: { label: 'Aprobado',   color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-300 dark:ring-emerald-700/50', dot: 'bg-emerald-500' },
  Rejected: { label: 'Rechazado',  color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-300 dark:ring-red-700/50', dot: 'bg-red-500' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.Pending;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', cfg.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Approve Schema ────────────────────────────────────────────────────────────
const approveSchema = z.object({
  iptvAccountId:    z.string().min(1, 'Selecciona una cuenta IPTV'),
  customerId:       z.string().optional().or(z.literal('')),
  expirationDate:   z.string().optional().or(z.literal('')),
  metodoPagoId:     z.string().optional().or(z.literal('')),
  paymentMethod:    z.string().optional().or(z.literal('')),
  paymentReference: z.string().optional().or(z.literal('')),
  amountReceived:   z.coerce.number().min(0).optional(),
  discountAmount:   z.coerce.number().min(0).optional(),
  profileUser:      z.string().optional().or(z.literal('')),
  profilePin:       z.string().optional().or(z.literal('')),
});

// ─── ApproveModal ─────────────────────────────────────────────────────────────
function ApproveModal({ order, onClose, onApproved }) {
  const { token }  = useAuthContext();
  const { toast }  = useToast();
  const [apiError,          setApiError]          = useState('');
  const [paymentMethods,    setPaymentMethods]    = useState([]);
  const [accounts,          setAccounts]          = useState([]);
  const [loadingAccts,      setLoadingAccts]      = useState(true);
  const [configActiva,      setConfigActiva]      = useState(null);
  const [selectedFullAcct,  setSelectedFullAcct]  = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      iptvAccountId: '', customerId: '', expirationDate: '',
      metodoPagoId: '', paymentMethod: '', paymentReference: '',
      amountReceived: '', discountAmount: '',
      profileUser: '', profilePin: '',
    },
  });

  useEffect(() => {
    const acctPromise = order.tipoServicioId
      ? iptvAccountService.getByService(order.tipoServicioId, token)
      : iptvAccountService.getAll(token).then(acc =>
          Array.isArray(acc) ? acc.filter(a => a.isActive !== false && a.availableSlots > 0) : []
        );

    Promise.all([
      paymentMethodService.getAll(token),
      acctPromise,
      order.tipoServicioId ? serviceTypeService.getById(order.tipoServicioId, token) : Promise.resolve(null),
      serviceTypeService.getPlataformasConfig(token),
    ]).then(([pm, acc, svc, pc]) => {
      setPaymentMethods(Array.isArray(pm) ? pm.filter(m => m.isActive !== false) : []);
      setAccounts(Array.isArray(acc) ? acc : []);
      // Derivar config activa de plataforma para etiquetas dinámicas
      if (svc?.plataforma && Array.isArray(pc)) {
        setConfigActiva(pc.find(c => c.plataforma === svc.plataforma) || null);
      }
      if (svc) {
        if (svc.price)        setValue('amountReceived', svc.price);
        if (svc.durationDays) {
          const d = new Date();
          d.setDate(d.getDate() + svc.durationDays);
          setValue('expirationDate', d.toISOString().split('T')[0]);
        }
      }
    }).catch(() => {}).finally(() => setLoadingAccts(false));
  }, [token, order.tipoServicioId, setValue]);

  // Etiquetas dinámicas basadas en la config de la plataforma del servicio
  const labelUsuario = configActiva?.labelUsuario || 'Usuario';
  const tienePin     = configActiva ? !!configActiva.tienePin : true;
  const tieneUrl     = configActiva ? !!configActiva.tieneUrl : true;
  // Netflix/Streaming: labelUsuario === 'Correo' means email-based account → profile fields needed
  const esNetflix    = labelUsuario === 'Correo';

  const selectedAccountId = watch('iptvAccountId');

  // Fetch full account details when selection changes (getByService doesn't return credentials)
  useEffect(() => {
    if (!selectedAccountId) { setSelectedFullAcct(null); return; }
    iptvAccountService.getById(selectedAccountId, token)
      .then(a => setSelectedFullAcct(a || null))
      .catch(() => setSelectedFullAcct(null));
  }, [selectedAccountId, token]);

  const onSubmit = async (data) => {
    setApiError('');
    try {
      await orderService.approve(order.id, {
        iptvAccountId:    data.iptvAccountId,
        customerId:       data.customerId       || null,
        expirationDate:   data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
        metodoPagoId:     data.metodoPagoId     || null,
        paymentMethod:    data.paymentMethod    || null,
        paymentReference: data.paymentReference || null,
        amountReceived:   data.amountReceived   ? Number(data.amountReceived) : null,
        discountAmount:   Number(data.discountAmount) || 0,
        profileUser:      esNetflix ? (data.profileUser || null) : null,
        profilePin:       esNetflix ? (data.profilePin  || null) : null,
      }, token);
      toast.success('Orden aprobada — credenciales enviadas por WhatsApp');
      onApproved();
    } catch (err) {
      setApiError(err.message || 'Error al aprobar');
    }
  };

  const inputCls = (hasError) => cn(
    'w-full h-10 px-3 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-800 dark:text-slate-100',
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
    hasError
      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
      : 'border-slate-200 dark:border-slate-700 focus:ring-violet-500/30 focus:border-violet-400',
  );

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Aprobar Orden</h2>
              <p className="text-[11px] text-slate-400">{order.customerName} · {order.serviceName || 'Sin servicio'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-hide">

          {/* Cuenta IPTV */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuenta IPTV</p>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Tv size={10} /> Seleccionar cuenta con slots libres
            </label>
            {loadingAccts ? (
              <div className="h-10 flex items-center justify-center text-slate-400">
                <Loader2 size={14} className="animate-spin" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle size={13} className="shrink-0" /> No hay cuentas con slots disponibles
              </div>
            ) : (
              <select {...register('iptvAccountId')} className={cn(inputCls(!!errors.iptvAccountId), 'cursor-pointer')}>
                <option value="">— Selecciona una cuenta —</option>
                {accounts.map(a => {
                  const identifier = a.accessEmail || a.accessUser || '—';
                  const slots = `${a.availableSlots} slot${a.availableSlots !== 1 ? 's' : ''} libre${a.availableSlots !== 1 ? 's' : ''}`;
                  const vence = a.expirationDate
                    ? `vence ${new Date(a.expirationDate).toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                    : null;
                  return (
                    <option key={a.id} value={a.id}>
                      {identifier} — {slots}{vence ? ` (${vence})` : ''}
                    </option>
                  );
                })}
              </select>
            )}
            {errors.iptvAccountId && <p className="text-[10px] text-red-500 font-bold">{errors.iptvAccountId.message}</p>}
          </div>

          {/* Preview cuenta seleccionada */}
          {selectedAccountId && (
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800 space-y-1.5">
              <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Credenciales que recibirá el cliente</p>

              {!selectedFullAcct ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Loader2 size={11} className="animate-spin" /> Cargando credenciales...
                </div>
              ) : (
                <>
                  {/* Correo — Netflix/Streaming */}
                  {esNetflix && (
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      <span className="font-bold">Correo:</span> {selectedFullAcct.accessEmail || selectedFullAcct.accessUser}
                    </p>
                  )}

                  {/* Usuario — IPTV/FlujoTV */}
                  {!esNetflix && (
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      <span className="font-bold">{labelUsuario}:</span> {selectedFullAcct.accessUser}
                    </p>
                  )}

                  {/* Contraseña — siempre */}
                  {selectedFullAcct.accessPassword && (
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      <span className="font-bold">Contraseña:</span> {selectedFullAcct.accessPassword}
                    </p>
                  )}

                  {/* PIN de cuenta — solo IPTV/FlujoTV */}
                  {!esNetflix && tienePin && selectedFullAcct.pinCode && (
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      <span className="font-bold">PIN:</span> {selectedFullAcct.pinCode}
                    </p>
                  )}

                  {/* URL — solo si aplica */}
                  {tieneUrl && selectedFullAcct.platformUrl && (
                    <p className="text-xs text-slate-700 dark:text-slate-200 truncate">
                      <span className="font-bold">URL:</span> {selectedFullAcct.platformUrl}
                    </p>
                  )}

                  {/* Netflix/Streaming: indicador de perfil */}
                  {esNetflix && (
                    <p className="text-[10px] text-violet-500 dark:text-violet-400 font-bold uppercase tracking-widest pt-1 border-t border-violet-100 dark:border-violet-700">
                      + Perfil del cliente (a completar abajo)
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Campos de perfil — solo Netflix/Streaming */}
          {esNetflix && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-slate-800">
                Perfil asignado al cliente
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <Tv size={10} /> Usuario de perfil
                  </label>
                  <input {...register('profileUser')} type="text" placeholder="Perfil 1" className={inputCls(!!errors.profileUser)} />
                  {errors.profileUser && <p className="text-[10px] text-red-500 font-bold">{errors.profileUser.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <FileText size={10} /> PIN de perfil
                  </label>
                  <input {...register('profilePin')} type="text" placeholder="1234" className={inputCls(!!errors.profilePin)} />
                  {errors.profilePin && <p className="text-[10px] text-red-500 font-bold">{errors.profilePin.message}</p>}
                </div>
              </div>
            </>
          )}

          {/* Vencimiento */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <Calendar size={10} /> Fecha de vencimiento <span className="normal-case font-medium text-slate-400">(opcional — usa duración del servicio)</span>
            </label>
            <input {...register('expirationDate')} type="date" className={inputCls(false)} />
          </div>

          {/* Pago */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-100 dark:border-slate-800">
            Pago <span className="normal-case font-medium text-slate-300 dark:text-slate-600">(opcional)</span>
          </p>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <FileText size={10} /> Método de pago
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
              <FileText size={10} /> Referencia de pago
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
            <button type="submit" disabled={isSubmitting || accounts.length === 0}
              className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {isSubmitting ? 'Aprobando...' : 'Aprobar y Enviar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── RejectModal ──────────────────────────────────────────────────────────────
function RejectModal({ order, onClose, onRejected }) {
  const { token }  = useAuthContext();
  const { toast }  = useToast();
  const [reason,   setReason]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const handleReject = async () => {
    if (!reason.trim()) return;
    setLoading(true); setApiError('');
    try {
      await orderService.reject(order.id, { reason }, token);
      toast.success('Orden rechazada — cliente notificado por email');
      onRejected();
    } catch (err) {
      setApiError(err.message || 'Error al rechazar');
    } finally {
      setLoading(false);
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
        className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Rechazar Orden</h2>
            <p className="text-[11px] text-slate-400">{order.customerName}</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Motivo del rechazo</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. No hay disponibilidad en este momento."
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none transition-all"
          />
        </div>

        {apiError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600">
            <AlertCircle size={13} className="shrink-0" /> {apiError}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button onClick={handleReject} disabled={loading || !reason.trim()}
            className="flex-[2] h-11 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            {loading ? 'Rechazando...' : 'Rechazar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({ order, onApprove, onReject }) {
  const initial = (order.customerName || '?').charAt(0).toUpperCase();
  const avatarColors = [
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  ];
  const colorIndex = (order.customerName || '').length % avatarColors.length;
  const avatarClass = avatarColors[colorIndex];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all group"
    >
      <div className="p-5 flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shrink-0", avatarClass)}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{order.customerName}</p>
            <p className="text-xs text-violet-600 dark:text-violet-400 font-bold mt-0.5 truncate">{order.serviceName || 'Servicio IPTV'}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="px-5 pb-5 space-y-2">
        {order.customerPhone && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Phone size={12} className="shrink-0 text-slate-400" /> {order.customerPhone}
          </div>
        )}
        {order.customerEmail && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Mail size={12} className="shrink-0 text-slate-400" /> {order.customerEmail}
          </div>
        )}
        {order.notes && (
          <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <FileText size={12} className="shrink-0 mt-0.5 text-slate-400" />
            <span className="italic line-clamp-2 leading-relaxed">{order.notes}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 pt-1">
          <Clock size={10} className="shrink-0" /> {fmtDate(order.createdAt)}
        </div>
      </div>

      {order.status === 'Pending' && (
        <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 mt-auto">
          <button
            onClick={() => onApprove(order)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            <CheckCircle size={14} /> Aprobar
          </button>
          <button
            onClick={() => onReject(order)}
            className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-red-200 dark:hover:border-red-800 transition-colors shrink-0"
            title="Rechazar orden"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── OrdersPage ───────────────────────────────────────────────────────────────
export function OrdersPage() {
  const { token }  = useAuthContext();
  const { toast }  = useToast();

  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('Pending');
  const [approving, setApproving] = useState(null); // order being approved
  const [rejecting, setRejecting] = useState(null); // order being rejected

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAll(filter === 'all' ? '' : filter, token);
      setOrders(data ?? []);
    } catch {
      toast.error('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [filter, token]);

  const TABS = [
    { id: 'Pending',  label: 'Pendientes', icon: Clock,         color: 'text-amber-500'   },
    { id: 'Approved', label: 'Aprobadas',  icon: CheckCircle,   color: 'text-emerald-500' },
    { id: 'Rejected', label: 'Rechazadas', icon: XCircle,       color: 'text-red-500'     },
    { id: 'all',      label: 'Todas',      icon: ShoppingBag,   color: 'text-violet-500'  },
  ];

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full gap-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20 text-white shrink-0">
              <ShoppingBag size={20} strokeWidth={2.5} />
            </div>
            Órdenes de Clientes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Solicitudes de suscripción desde el menú público
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-violet-600 transition-all shadow-sm"
        >
          <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border border-slate-200 dark:border-slate-700",
               filter === t.id 
                 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md border-transparent"
                 : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <t.icon size={13} className={filter === t.id ? (filter === 'Pending' ? 'text-amber-400' : filter === 'Approved' ? 'text-emerald-400' : filter === 'Rejected' ? 'text-red-400' : 'text-violet-400') : 'opacity-50 text-slate-400'} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-violet-500" size={28} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <ShoppingBag size={36} className="opacity-20 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">No hay órdenes {filter !== 'all' ? filter.toLowerCase() : ''}</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {orders.map(o => (
                <OrderCard
                  key={o.id}
                  order={o}
                  onApprove={setApproving}
                  onReject={setRejecting}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Approve Modal */}
      <AnimatePresence>
        {approving && (
          <ApproveModal
            order={approving}
            onClose={() => setApproving(null)}
            onApproved={() => { setApproving(null); loadOrders(); }}
          />
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejecting && (
          <RejectModal
            order={rejecting}
            onClose={() => setRejecting(null)}
            onRejected={() => { setRejecting(null); loadOrders(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
