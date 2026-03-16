import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, RefreshCw, Pencil, Trash2, X, Check, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { paymentMethodService } from '../../services/paymentMethodService';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

// ─── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  nombre:       z.string().min(1, 'Requerido'),
  banco:        z.string().min(1, 'Requerido'),
  tipoCuenta:   z.string().min(1, 'Requerido'),
  numeroCuenta: z.string().min(1, 'Requerido'),
  titular:      z.string().min(1, 'Requerido'),
});

// ─── FormModal ─────────────────────────────────────────────────────────────────
function FormModal({ method, onClose, onSaved, token }) {
  const { toast } = useToast();
  const isEditing = !!method;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: method ? {
      nombre:       method.nombre,
      banco:        method.banco,
      tipoCuenta:   method.tipoCuenta,
      numeroCuenta: method.numeroCuenta,
      titular:      method.titular,
    } : { nombre: '', banco: '', tipoCuenta: 'Corriente', numeroCuenta: '', titular: '' },
  });

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await paymentMethodService.update(method.id, data, token);
        toast.success('Método de pago actualizado');
      } else {
        await paymentMethodService.create(data, token);
        toast.success('Método de pago creado');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
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
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-full max-w-md bg-white dark:bg-slate-900 z-[51] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <CreditCard size={18} className="text-violet-600" />
            </div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {isEditing ? 'Editar Método' : 'Nuevo Método de Pago'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {[
            { name: 'nombre',       label: 'Nombre / Alias',   placeholder: 'BAC Corriente'       },
            { name: 'banco',        label: 'Banco',             placeholder: 'BAC Nicaragua'        },
            { name: 'numeroCuenta', label: 'Número de Cuenta',  placeholder: '357-123456-7'         },
            { name: 'titular',      label: 'Titular',           placeholder: 'MaxPlus IPTV'         },
          ].map(({ name, label, placeholder }) => (
            <div key={name} className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
              <input {...register(name)} placeholder={placeholder} className={inputCls(!!errors[name])} />
              {errors[name] && <p className="text-[10px] text-red-500 font-bold">{errors[name].message}</p>}
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Cuenta</label>
            <select {...register('tipoCuenta')} className={cn(inputCls(false), 'cursor-pointer')}>
              <option value="Corriente">Corriente</option>
              <option value="Ahorro">Ahorro</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-11 bg-violet-600 hover:bg-violet-700 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {isSubmitting
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Check size={16} /> {isEditing ? 'Guardar Cambios' : 'Crear Método'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── PaymentMethodsPage ────────────────────────────────────────────────────────
export function PaymentMethodsPage() {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [methods,  setMethods]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);   // method to edit
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);   // id being deleted

  const load = async () => {
    try {
      setLoading(true);
      const data = await paymentMethodService.getAll(token);
      setMethods(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Error al cargar métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await paymentMethodService.remove(id, token);
      toast.success('Método eliminado');
      setMethods(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const TIPO_COLOR = {
    Corriente: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    Ahorro:    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    Otro:      'bg-slate-100 dark:bg-slate-700 text-slate-500',
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-4xl mx-auto w-full gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20 text-white shrink-0">
              <CreditCard size={20} strokeWidth={2.5} />
            </div>
            Métodos de Pago
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cuentas bancarias para recibir transferencias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-violet-600 transition-all shadow-sm">
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
          </button>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-violet-600/20">
            <Plus size={15} /> Nuevo
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-violet-500" size={24} />
        </div>
      ) : methods.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
          <CreditCard size={36} className="opacity-20 mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest">Sin métodos de pago</p>
          <button onClick={() => setCreating(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-black uppercase rounded-xl hover:bg-violet-700 transition-colors">
            <Plus size={13} /> Agregar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {methods.map(m => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className={cn(
                  'bg-white dark:bg-slate-800 rounded-2xl border p-5 flex flex-col gap-4 shadow-sm transition-opacity',
                  !m.isActive && 'opacity-50',
                  m.isActive
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-slate-200/50 dark:border-slate-700/50',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">{m.nombre}</p>
                      <p className="text-[11px] font-bold text-slate-500 truncate">{m.banco}</p>
                    </div>
                  </div>
                  <span className={cn('text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shrink-0', TIPO_COLOR[m.tipoCuenta] ?? TIPO_COLOR.Otro)}>
                    {m.tipoCuenta}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">N° Cuenta</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{m.numeroCuenta}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Titular</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[60%] text-right">{m.titular}</span>
                  </div>
                  {!m.isActive && (
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Inactivo</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={() => setEditing(m)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors">
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deleting === m.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {deleting === m.id
                      ? <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 size={12} />}
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Modal */}
      {(creating || editing) && (
        <FormModal
          method={editing}
          token={token}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
