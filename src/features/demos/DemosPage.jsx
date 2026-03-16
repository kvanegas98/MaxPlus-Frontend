import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, RefreshCw, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { demoService } from '../../services/demoService';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';

// ─── Approve Modal ─────────────────────────────────────────────────────────────
const approveSchema = z.object({
  platformUrl:     z.string().url('URL inválida'),
  accessUser:      z.string().min(1, 'Requerido'),
  accessPassword:  z.string().min(1, 'Requerido'),
  expiresAt:       z.string().min(1, 'Requerido'),
});

function ApproveModal({ demo, onClose, onSuccess, token }) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(approveSchema),
  });

  const onSubmit = async (data) => {
    try {
      await demoService.approve(demo.id, data, token);
      toast.success('Demo aprobada correctamente');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al aprobar la demo');
    }
  };

  const inputCls = (hasErr) => cn(
    'w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
    hasErr
      ? 'border-red-400 focus:border-red-500'
      : 'border-slate-200 dark:border-slate-600 focus:border-violet-500',
  );

  return (
    <AnimatePresence>
      {demo && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-full max-w-md bg-white dark:bg-slate-800 z-[201] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Aprobar Demo</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{demo.customerName}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {[
                { name: 'platformUrl',    label: 'URL / HOST',       placeholder: 'http://appv1.xyz', type: 'url'      },
                { name: 'accessUser',     label: 'Usuario',           placeholder: 'usuario123',       type: 'text'     },
                { name: 'accessPassword', label: 'Contraseña',        placeholder: '••••••••',         type: 'text'     },
                { name: 'expiresAt',      label: 'Fecha de Expiración', placeholder: '',               type: 'datetime-local' },
              ].map(({ name, label, placeholder, type }) => (
                <div key={name} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
                  <input
                    {...register(name)}
                    type={type}
                    placeholder={placeholder}
                    className={inputCls(!!errors[name])}
                  />
                  {errors[name] && <p className="text-[10px] text-red-500 font-bold">{errors[name].message}</p>}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-[2] py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                  {isSubmitting
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><CheckCircle size={14} /> APROBAR</>}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Reject Modal ──────────────────────────────────────────────────────────────
const rejectSchema = z.object({
  reason: z.string().min(5, 'Ingresa un motivo válido'),
});

function RejectModal({ demo, onClose, onSuccess, token }) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(rejectSchema),
  });

  const onSubmit = async (data) => {
    try {
      await demoService.reject(demo.id, data, token);
      toast.success('Demo rechazada');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al rechazar la demo');
    }
  };

  return (
    <AnimatePresence>
      {demo && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-full max-w-sm bg-white dark:bg-slate-800 z-[201] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Rechazar Demo</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{demo.customerName}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motivo del rechazo</label>
                <textarea
                  {...register('reason')}
                  rows={3}
                  placeholder="Ej. IP ya tiene una demo activa."
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
                    errors.reason
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-600 focus:border-red-400',
                  )}
                />
                {errors.reason && <p className="text-[10px] text-red-500 font-bold">{errors.reason.message}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-[2] py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                  {isSubmitting
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><XCircle size={14} /> RECHAZAR</>}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function DemosPage() {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  const [approveDemo, setApproveDemo] = useState(null);
  const [rejectDemo,  setRejectDemo]  = useState(null);

  const loadDemos = async () => {
    try {
      setLoading(true);
      const statusParam = filter === 'all' ? '' : filter;
      const data = await demoService.getAll(statusParam, token);
      setDemos(data || []);
    } catch (err) {
      toast.error('Error al cargar demos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDemos(); }, [token, filter]);

  const TABS = [
    { id: 'Pending',  label: 'Pendientes', icon: Clock,        color: 'text-amber-500'  },
    { id: 'Approved', label: 'Aprobados',  icon: CheckCircle,  color: 'text-emerald-500' },
    { id: 'Rejected', label: 'Rechazados', icon: XCircle,      color: 'text-red-500'    },
    { id: 'all',      label: 'Todos',      icon: PlayCircle,   color: 'text-violet-500' },
  ];

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20 text-white">
              <PlayCircle size={20} strokeWidth={2.5} />
            </div>
            Demos Solicitados
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Solicitudes de demostración de clientes</p>
        </div>
        <button onClick={loadDemos} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-violet-600 transition-all shadow-sm">
          <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex items-center gap-2 p-1 bg-slate-200/50 dark:bg-slate-800/80 rounded-2xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              filter === t.id
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            )}
          >
            <t.icon size={14} className={filter === t.id ? t.color : 'opacity-50'} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <RefreshCw className="animate-spin text-violet-500" />
          </div>
        ) : demos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <PlayCircle size={32} className="opacity-20 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">No hay solicitudes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {demos.map(d => (
              <div key={d.id} className="p-5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm">{d.customerName}</h3>
                  <Badge variant={
                    d.status?.toLowerCase() === 'pending'  ? 'warning' :
                    d.status?.toLowerCase() === 'approved' ? 'success' : 'danger'
                  }>
                    {d.status}
                  </Badge>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-1">{d.customerPhone || d.phone}</p>
                <p className="text-xs font-bold text-slate-400 mb-4">{d.customerEmail || d.email}</p>
                {d.serviceName && (
                  <p className="text-xs font-black text-violet-500 uppercase tracking-widest mb-4">{d.serviceName}</p>
                )}
                {d.status?.toLowerCase() === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setApproveDemo(d)}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={12} /> Aprobar
                    </button>
                    <button
                      onClick={() => setRejectDemo(d)}
                      className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-black uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={12} /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ApproveModal demo={approveDemo} token={token} onClose={() => setApproveDemo(null)} onSuccess={loadDemos} />
      <RejectModal  demo={rejectDemo}  token={token} onClose={() => setRejectDemo(null)}  onSuccess={loadDemos} />
    </div>
  );
}
