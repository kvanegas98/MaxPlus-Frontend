import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Edit2, RefreshCw, X, Check,
  Loader2, AlertCircle, Trash2, Layers,
} from 'lucide-react';
import { plataformasConfigService } from '../../services/plataformasConfigService';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

// ─── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(1, 'Requerido').max(100),
  description: z.string().max(300).optional().or(z.literal('')),
  baseUrl:     z.string().url('URL inválida').or(z.literal('')).optional(),
  isActive:    z.boolean(),
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = (hasError) => cn(
  'w-full h-10 px-3 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-800 dark:text-slate-100',
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
  hasError
    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
    : 'border-slate-200 dark:border-slate-700 focus:ring-violet-500/30 focus:border-violet-400',
);

// ─── PlataformaFormModal ───────────────────────────────────────────────────────
function PlataformaFormModal({ editing, onClose, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        editing?.name        || '',
      description: editing?.description || '',
      baseUrl:     editing?.baseUrl     || '',
      isActive:    editing?.isActive    ?? true,
    },
  });

  const onSubmit = async (data) => {
    setApiError('');
    try {
      const body = {
        name:        data.name,
        description: data.description || null,
        baseUrl:     data.baseUrl     || null,
        isActive:    data.isActive,
      };
      if (editing) {
        await plataformasConfigService.update(editing.id, body, token);
        toast.success('Plataforma actualizada');
      } else {
        await plataformasConfigService.create(body, token);
        toast.success('Plataforma creada');
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
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <Layers size={16} className="text-violet-600" />
            </div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {editing ? 'Editar Plataforma' : 'Nueva Plataforma'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nombre *</label>
            <input {...register('name')} type="text" placeholder="Ej. MaxPlus IPTV" className={inputCls(!!errors.name)} />
            {errors.name && <p className="text-[10px] text-red-500 font-bold">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Descripción (opcional)</label>
            <input {...register('description')} type="text" placeholder="Descripción breve" className={inputCls(false)} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">URL Base (opcional)</label>
            <input {...register('baseUrl')} type="url" placeholder="https://..." className={inputCls(!!errors.baseUrl)} />
            {errors.baseUrl && <p className="text-[10px] text-red-500 font-bold">{errors.baseUrl.message}</p>}
          </div>

          <label className={cn(
            'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
            'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600',
          )}>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Activa</span>
            <input {...register('isActive')} type="checkbox" className="w-4 h-4 accent-violet-600 rounded" />
          </label>

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
              {isSubmitting ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Plataforma'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── PlataformasPage ───────────────────────────────────────────────────────────
export function PlataformasPage() {
  const { token } = useAuthContext();
  const { toast } = useToast();

  const [plataformas, setPlataformas] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [deleting,    setDeleting]    = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await plataformasConfigService.getAll(token);
      setPlataformas(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar plataformas');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await plataformasConfigService.remove(id, token);
      toast.success('Plataforma eliminada');
      load();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-4xl mx-auto w-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20 text-white shrink-0">
              <Layers size={20} strokeWidth={2.5} />
            </div>
            Plataformas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configuración de plataformas de streaming</p>
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

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-violet-500" />
        </div>
      ) : plataformas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
          <Layers size={32} className="opacity-30" />
          <p className="text-sm font-bold">No hay plataformas configuradas</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plataformas.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-start justify-between gap-3 hover:border-violet-200 dark:hover:border-violet-700 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                  <Layers size={16} className="text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 dark:text-white text-sm truncate">{p.name}</p>
                  {p.description && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{p.description}</p>}
                  {p.baseUrl && (
                    <p className="text-[10px] text-violet-500 mt-0.5 truncate">{p.baseUrl}</p>
                  )}
                  <span className={cn(
                    'inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border',
                    p.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-700'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600',
                  )}>
                    {p.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing(p)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-violet-600 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors disabled:opacity-50">
                  {deleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <PlataformaFormModal
            editing={editing}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
