import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Pencil, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { categoriasService } from '../../services/categoriasService';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ cat, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">¿Eliminar categoría?</h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{cat.nombre}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Los servicios asignados quedarán <span className="font-semibold text-slate-700 dark:text-slate-200">sin categoría</span>.{' '}
          <span className="font-semibold text-red-500">Esta acción no se puede deshacer.</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-9 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-9 px-4 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── CategoriasPage ───────────────────────────────────────────────────────────
export function CategoriasPage({ onOpenCategoryForm }) {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setApiError('');
    try {
      const data = await categoriasService.getAll(token);
      setCategorias(data ?? []);
    } catch (err) {
      setApiError(err.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    try {
      await categoriasService.remove(pendingDelete.id, token);
      setCategorias(prev => prev.filter(c => c.id !== pendingDelete.id));
      toast.success('Categoría eliminada');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-4xl mx-auto w-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20 text-white shrink-0">
            <Tag size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Categorías
            </h1>
            <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
              {categorias.length} categorías registradas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-violet-600 transition-all shadow-sm shrink-0"
          >
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => onOpenCategoryForm?.(null, load)}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2.5 bg-violet-600 text-white text-xs md:text-sm font-black rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nueva Categoría</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={15} className="shrink-0" />
          {apiError}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <RefreshCw className="animate-spin text-violet-500" size={20} />
          </div>
        ) : categorias.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <Tag size={32} className="opacity-20 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">Sin categorías</p>
            <p className="text-xs mt-1">Crea la primera categoría</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Color', 'Nombre', 'Descripción', 'Orden', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {categorias.map((cat) => (
                      <motion.tr
                        key={cat.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div
                            className="w-7 h-7 rounded-full shadow-sm border-2 border-white dark:border-slate-700"
                            style={{ backgroundColor: cat.color || '#8B5CF6' }}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{cat.nombre}</span>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <span className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{cat.descripcion || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{cat.orden ?? 0}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                            cat.activa !== false
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                          )}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', cat.activa !== false ? 'bg-emerald-500' : 'bg-red-400')} />
                            {cat.activa !== false ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenCategoryForm?.(cat, load)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-violet-600 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setPendingDelete(cat)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden p-4 space-y-3">
              <AnimatePresence>
                {categorias.map((cat) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border-2 border-white dark:border-slate-600"
                      style={{ backgroundColor: (cat.color || '#8B5CF6') + '22' }}
                    >
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: cat.color || '#8B5CF6' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{cat.nombre}</p>
                        <span className={cn(
                          'shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                          cat.activa !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600',
                        )}>
                          <span className={cn('w-1 h-1 rounded-full', cat.activa !== false ? 'bg-emerald-500' : 'bg-red-400')} />
                          {cat.activa !== false ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      {cat.descripcion && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{cat.descripcion}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">Orden: {cat.orden ?? 0}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onOpenCategoryForm?.(cat, load)}
                        className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-600 text-slate-400 hover:text-violet-600 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setPendingDelete(cat)}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirm */}
      <AnimatePresence>
        {pendingDelete && (
          <DeleteConfirm
            cat={pendingDelete}
            onConfirm={confirmDelete}
            onCancel={() => setPendingDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
