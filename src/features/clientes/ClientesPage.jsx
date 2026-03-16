import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Phone, MapPin, Edit2, Trash2, Check, X, Loader2, AlertCircle,
  Eye, Copy, ExternalLink, ChevronDown, Clock, RefreshCw,
} from 'lucide-react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import PhoneField from '../../components/ui/PhoneField';
import { useClientes } from '../../hooks/useClientes';
import { useAuthContext } from '../../context/AuthContext';
import { portalService } from '../../services/portalService';
import { useToast } from '../../context/ToastContext';
import { ClientListSkeleton } from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

// ─── Avatar color palette ──────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
];

function nameToColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-slate-300">
      <div className="relative">
         <div className="absolute inset-0 bg-violet-500/10 blur-3xl rounded-full" />
         <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-lg relative z-10 border border-slate-100 dark:border-slate-700/50">
           <Users size={36} className="text-slate-300 dark:text-slate-500" />
         </div>
      </div>
      <div className="text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Directorio Vacío</p>
         <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Comienza a construir tu<br />base de clientes</p>
         <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 px-10 leading-relaxed italic">"El alma de tu negocio son las relaciones que cultivas hoy."</p>
      </div>
    </div>
  );
}

// ─── ClienteForm ──────────────────────────────────────────────────────────────
function ClienteForm({ initial, onSave, onCancel }) {
  const [name,    setName]    = useState(initial?.name    ?? '');
  const [phone,   setPhone]   = useState(initial?.phone   ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [errors,  setErrors]  = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'El nombre es obligatorio';
    if (phone && !isValidPhoneNumber(phone)) e.phone = 'Número inválido — verifica el código de país';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setIsSaving(true);
    setApiError('');
    try {
      await onSave({ name: name.trim(), phone: phone || '', address: address.trim() });
    } catch (err) {
      setApiError(err.message || 'Error al procesar la solicitud');
    } finally {
      setIsSaving(false);
    }
  };

  const INPUT_WRAPPER = "relative group";
  const INPUT_BASE = "w-full h-12 pl-11 pr-4 text-sm font-medium border border-slate-200 dark:border-white/5 rounded-2xl bg-white dark:bg-[#151520] focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100 shadow-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-white dark:bg-[#0A0A0F] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 p-6 sm:p-8 space-y-6 relative overflow-hidden"
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 mb-1 block">Customer Profile</span>
           <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{initial ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
         </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className={INPUT_WRAPPER}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
             <Check size={18} strokeWidth={2.5} />
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: undefined })); }}
            placeholder="Nombre del Cliente *"
            className={cn(INPUT_BASE, errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10' : 'focus:border-violet-500')}
          />
          {errors.name && <p className="text-[10px] font-bold text-red-500 mt-1 ml-4">{errors.name}</p>}
        </div>

        <PhoneField
          label="Teléfono"
          value={phone}
          onChange={(v) => { setPhone(v || ''); setErrors((er) => ({ ...er, phone: undefined })); }}
          error={errors.phone}
          placeholder="8888-0000"
        />

        <div className={INPUT_WRAPPER}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
             <MapPin size={18} strokeWidth={2.5} />
          </div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ubicación o dirección (opcional)"
            className={INPUT_BASE}
          />
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-[11px] font-bold text-red-600 dark:text-red-400 relative z-10">
          <AlertCircle size={16} className="shrink-0" />
          {apiError}
        </div>
      )}

      <div className="flex gap-3 pt-2 relative z-10">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2.5} />}
          {initial ? 'Guardar Cambios' : 'Registrar'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 h-12 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
        >
          Cancelar
        </button>
      </div>
    </motion.div>
  );
}

// ─── ClienteRow ───────────────────────────────────────────────────────────────
function ClienteRow({ cliente, balance, onEdit, onDelete, onPortal }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const initials = cliente.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const handleDelete = () => {
    if (confirmDel) { onDelete(); }
    else { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        'bg-white dark:bg-[#151520] rounded-2xl p-4 flex items-center gap-4 border shadow-sm transition-all duration-300 group hover:shadow-md hover:-translate-y-0.5 dark:hover:bg-[#1E1E2C]',
        balance > 0 ? 'border-red-100 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-800/50' : 'border-slate-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-white/10'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-transform group-hover:scale-110',
        nameToColor(cliente.name)
      )}>
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-1 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors uppercase">{cliente.name}</p>
        <div className="flex items-center gap-3">
          {cliente.phone && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Phone size={12} className="text-violet-500" />
              {cliente.phone}
            </span>
          )}
          {cliente.address && (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
              <MapPin size={12} className="text-amber-500" />
              {cliente.address}
            </span>
          )}
        </div>
      </div>

      {/* Balance badge */}
      <div className="shrink-0 flex items-center gap-2">
         {balance > 0 && (
           <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1.5 text-right">
             <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider mb-0.5">Pendiente</p>
             <p className="text-sm font-bold text-red-600 dark:text-red-400 leading-none">C$ {balance.toFixed(0)}</p>
           </div>
         )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
        <button
          onClick={onPortal}
          title="Ver portal del cliente"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#1E1E2C] text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/20 transition-all border border-slate-200 dark:border-white/5 shadow-sm hover:border-violet-200 dark:hover:border-violet-500/30"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={onEdit}
          title="Editar cliente"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#1E1E2C] text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-all border border-slate-200 dark:border-white/5 shadow-sm hover:border-blue-200 dark:hover:border-blue-500/30"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={handleDelete}
          title="Eliminar cliente"
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center transition-all border shadow-sm',
            confirmDel
              ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30'
              : 'bg-white dark:bg-[#1E1E2C] text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 border-slate-200 dark:border-white/5 hover:border-red-200 dark:hover:border-red-500/30'
          )}
        >
          {confirmDel ? <Check size={16} strokeWidth={3} /> : <Trash2 size={16} />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Portal helpers ───────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-700 hover:bg-violet-600 text-slate-400 hover:text-white transition-all shrink-0"
    >
      {copied ? <Check size={10} strokeWidth={3} /> : <Copy size={10} />}
    </button>
  );
}

const STATUS_CFG = {
  Active:    { label: 'Activa',    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  Expired:   { label: 'Vencida',   cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
  Cancelled: { label: 'Cancelada', cls: 'bg-slate-600/40 text-slate-400 border-slate-600/30' },
  Renewed:   { label: 'Renovada',  cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  Pending:   { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  Approved:  { label: 'Aprobada',  cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  Rejected:  { label: 'Rechazada', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: 'bg-slate-600/40 text-slate-400 border-slate-600/30' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLeft(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24));
}

// ── Tab 1: Suscripciones ──────────────────────────────────────────────────────
function SubscriptionCard({ sub }) {
  const [open, setOpen] = useState(false);
  const isActive = sub.status === 'Active';
  const days = daysLeft(sub.expirationDate);

  return (
    <div className="rounded-2xl border border-slate-700/60 overflow-hidden bg-slate-800/40">
      <button
        type="button"
        onClick={() => isActive && setOpen(v => !v)}
        className={cn(
          'w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors',
          isActive ? 'cursor-pointer hover:bg-slate-700/30' : 'cursor-default',
        )}
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-white">{sub.serviceName}</span>
            <StatusBadge status={sub.status} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock size={9} /> Vence {fmtDate(sub.expirationDate)}
            </span>
            {days !== null && days >= 0 && days <= 7 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                {days === 0 ? 'Hoy' : `${days}d`}
              </span>
            )}
            {days !== null && days < 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/20 uppercase tracking-widest">
                Vencida hace {Math.abs(days)}d
              </span>
            )}
          </div>
        </div>
        {isActive && (
          <motion.div animate={{ rotate: open ? 180 : 0 }} className="mt-1 shrink-0">
            <ChevronDown size={14} className="text-slate-500" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {open && isActive && (
          <motion.div
            initial={{ blockSize: 0, opacity: 0 }}
            animate={{ blockSize: 'auto', opacity: 1 }}
            exit={{ blockSize: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-700/60"
          >
            <div className="px-4 py-3 space-y-3 bg-slate-900/50">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Credenciales</p>
              {[
                { label: 'Usuario',    value: sub.accessUser },
                { label: 'Contraseña', value: sub.accessPassword },
                { label: 'PIN',        value: sub.pinCode },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-20 shrink-0">{r.label}</span>
                  <span className="flex-1 text-xs font-mono text-white bg-slate-800 rounded-lg px-2 py-1 truncate">{r.value}</span>
                  <CopyBtn text={r.value} />
                </div>
              ))}
              {sub.platformUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-20 shrink-0">URL</span>
                  <span className="flex-1 text-xs font-mono text-slate-300 bg-slate-800 rounded-lg px-2 py-1 truncate">{sub.platformUrl}</span>
                  <a href={sub.platformUrl} target="_blank" rel="noopener noreferrer"
                    className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-700 hover:bg-violet-600 text-slate-400 hover:text-white transition-all shrink-0">
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
              {(sub.profileUser || sub.profilePin) && (
                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                  <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Perfil</p>
                  {sub.profileUser && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-20 shrink-0">Perfil</span>
                      <span className="flex-1 text-xs font-mono text-white bg-slate-800 rounded-lg px-2 py-1">{sub.profileUser}</span>
                      <CopyBtn text={sub.profileUser} />
                    </div>
                  )}
                  {sub.profilePin && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-20 shrink-0">PIN Perfil</span>
                      <span className="flex-1 text-xs font-mono text-white bg-slate-800 rounded-lg px-2 py-1">{sub.profilePin}</span>
                      <CopyBtn text={sub.profilePin} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab 2: Demos ──────────────────────────────────────────────────────────────
function DemoRow({ demo }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-700/40 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{demo.serviceName}</p>
        <p className="text-[10px] text-slate-500">
          {fmtDate(demo.createdAt)}{demo.expiresAt ? ` · vence ${fmtDate(demo.expiresAt)}` : ''}
        </p>
      </div>
      <StatusBadge status={demo.status} />
    </div>
  );
}

// ── Tab 3: Facturas ───────────────────────────────────────────────────────────
function InvoiceRow({ inv }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-700/60 overflow-hidden bg-slate-800/40">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-violet-400 font-mono">{inv.numeroOrden}</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Pagada</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-slate-400">{fmtDate(inv.saleDate)}</span>
            {inv.paymentMethod && <span className="text-[10px] text-slate-500">{inv.paymentMethod}</span>}
            {inv.paymentReference && <span className="text-[10px] text-slate-500 font-mono">Ref: {inv.paymentReference}</span>}
            <span className="text-sm font-black text-emerald-400 ml-auto">C$ {Number(inv.totalAmount || 0).toLocaleString('es-NI')}</span>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} className="mt-1 shrink-0">
          <ChevronDown size={14} className="text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ blockSize: 0, opacity: 0 }}
            animate={{ blockSize: 'auto', opacity: 1 }}
            exit={{ blockSize: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-700/60"
          >
            <div className="px-4 py-3 bg-slate-900/50">
              {Array.isArray(inv.details) && inv.details.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left pb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Concepto</th>
                      <th className="text-center pb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Cant.</th>
                      <th className="text-right pb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.details.map((d, i) => (
                      <tr key={i} className="border-t border-slate-700/30">
                        <td className="py-1.5 text-slate-200">{d.concept || d.serviceName || '—'}</td>
                        <td className="py-1.5 text-center text-slate-400">{d.quantity ?? 1}</td>
                        <td className="py-1.5 text-right text-emerald-400 font-bold">C$ {Number(d.subtotal || 0).toLocaleString('es-NI')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[11px] text-slate-500">Sin detalle de líneas.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ClientePortalDrawer ──────────────────────────────────────────────────────
function ClientePortalDrawer({ cliente, token, onClose }) {
  const [tab,      setTab]      = useState('subs');
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [notFound, setNotFound] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const res = await portalService.lookup(cliente.id, token);
      setData(res);
    } catch (err) {
      if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        setError(err.message || 'Error al cargar el portal');
      }
    } finally {
      setLoading(false);
    }
  }, [cliente.id, token]);

  useEffect(() => { loadData(); }, [loadData]);

  const initials = cliente.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const TABS = [
    { id: 'subs',     label: 'Suscripciones', count: data?.subscriptions?.length },
    { id: 'demos',    label: 'Demos',         count: data?.demos?.length },
    { id: 'invoices', label: 'Facturas',       count: data?.invoices?.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative z-10 w-full max-w-xl bg-slate-900 border-l border-slate-700/50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60 shrink-0">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0',
            nameToColor(cliente.name)
          )}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Portal del Cliente</p>
            <p className="text-sm font-black text-white truncate">{cliente.name}</p>
          </div>
          <button type="button" onClick={loadData} disabled={loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-40"
            title="Actualizar">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/60 shrink-0 px-2">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all',
                tab === t.id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              )}
            >
              {t.label}
              {t.count != null && (
                <span className={cn(
                  'inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black',
                  tab === t.id ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-700 text-slate-500'
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-slate-800/60 animate-pulse" />
            ))
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800/40 rounded-2xl text-red-400 text-xs font-bold">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          ) : notFound ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Users size={24} className="text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-300">Sin actividad registrada</p>
                <p className="text-xs text-slate-500 mt-1">Este cliente aún no tiene actividad en el portal.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Suscripciones */}
              {tab === 'subs' && (
                !data?.subscriptions?.length
                  ? <p className="text-xs text-slate-500 text-center py-10">Sin suscripciones registradas.</p>
                  : data.subscriptions.map(s => <SubscriptionCard key={s.id} sub={s} />)
              )}

              {/* Demos */}
              {tab === 'demos' && (
                !data?.demos?.length
                  ? <p className="text-xs text-slate-500 text-center py-10">Este cliente no tiene demos solicitadas.</p>
                  : (
                    <div className="rounded-2xl border border-slate-700/60 overflow-hidden bg-slate-800/40">
                      {data.demos.map(d => <DemoRow key={d.id} demo={d} />)}
                    </div>
                  )
              )}

              {/* Facturas */}
              {tab === 'invoices' && (
                !data?.invoices?.length
                  ? <p className="text-xs text-slate-500 text-center py-10">Este cliente no tiene facturas registradas.</p>
                  : data.invoices.map(inv => <InvoiceRow key={inv.id} inv={inv} />)
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── ClientesPage ─────────────────────────────────────────────────────────────
export function ClientesPage() {
  const { clientes, loading, error, saveCliente, deleteCliente } = useClientes();
  const { token } = useAuthContext();
  const { toast } = useToast();

  const [search,        setSearch]        = useState('');
  const [formOpen,      setFormOpen]      = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [portalCliente, setPortalCliente] = useState(null);

  const filtered = clientes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const handleSave = async (data) => {
    if (editingId) {
      await saveCliente({ ...clientes.find((c) => c.id === editingId), ...data });
      toast.success('Cliente actualizado');
      setEditingId(null);
    } else {
      await saveCliente(data);
      toast.success('Cliente registrado');
      setFormOpen(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCliente(id);
      toast.success('Cliente eliminado');
    } catch (err) {
      toast.error(err.message ?? 'No se pudo eliminar el cliente');
    }
  };

  const handleEdit = (id) => {
    setFormOpen(false);
    setEditingId(id);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-[#F8F9FC] dark:bg-[#0A0A0F]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#F8F9FC]/90 dark:bg-[#0A0A0F]/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 shrink-0 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">Clientes</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingId(null); setFormOpen((v) => !v); }}
            className={cn(
              'flex items-center justify-center rounded-full h-10 w-10 transition-all shadow-sm',
              formOpen
                ? 'bg-slate-100 dark:bg-[#151520] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-[#1E1E2C]'
                : 'bg-violet-600 text-white shadow-violet-600/20 hover:bg-violet-700'
            )}
            title={formOpen ? "Cerrar" : "Agregar Cliente"}
          >
            {formOpen ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-4">
        {/* API Error General */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs font-medium text-red-600 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Nuevo form */}
        <AnimatePresence>
          {formOpen && !editingId && (
            <ClienteForm
              onSave={handleSave}
              onCancel={() => setFormOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Search */}
        {clientes.length > 0 && (
          <div className="relative group">
            <div className="flex w-full items-stretch rounded-full h-12 bg-white dark:bg-[#151520] border border-slate-200 dark:border-white/5 focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all shadow-sm">
              <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center pl-4 pr-2 group-focus-within:text-violet-500 transition-colors">
                <Search size={20} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="flex w-full min-w-0 flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-0 px-2 text-base outline-none"
              />
            </div>
          </div>
        )}

        {/* List Header Strip */}
        {clientes.length > 0 && (
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="flex items-center justify-center rounded-full bg-white dark:bg-[#151520] h-8 w-8 shrink-0 border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse"></div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex-1">
              {clientes.length} clientes · Directorio
            </p>
          </div>
        )}

        {/* List */}
        {loading ? (
          <ClientListSkeleton count={5} />
        ) : filtered.length === 0 && !formOpen ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3">
            <AnimatePresence initial={false}>
              {filtered.map((cliente) => (
                editingId === cliente.id ? (
                  <ClienteForm
                    key={`form-${cliente.id}`}
                    initial={cliente}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <ClienteRow
                    key={cliente.id}
                    cliente={cliente}
                    balance={cliente.pendingBalance ?? 0}
                    onEdit={() => handleEdit(cliente.id)}
                    onDelete={() => handleDelete(cliente.id)}
                    onPortal={() => setPortalCliente(cliente)}
                  />
                )
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Portal drawer */}
      <AnimatePresence>
        {portalCliente && (
          <ClientePortalDrawer
            key={portalCliente.id}
            cliente={portalCliente}
            token={token}
            onClose={() => setPortalCliente(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
