import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { categoriasService } from '../../services/categoriasService';
import { cn } from '../../lib/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  nombre:      z.string().min(1, 'Campo requerido').max(80, 'Máximo 80 caracteres'),
  descripcion: z.string().max(300, 'Máximo 300').optional().or(z.literal('')),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido'),
  orden:       z.number().int().min(0, 'Debe ser ≥ 0'),
  activa:      z.boolean(),
});

const INPUT_CLS = 'w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

function buildDefaults(data) {
  return {
    nombre:      data?.nombre ?? data?.name ?? '',
    descripcion: data?.descripcion ?? data?.description ?? '',
    color:       data?.color ?? '#8B5CF6',
    orden:       data?.orden ?? 0,
    activa:      data?.activa ?? true,
  };
}

// ─── CategoryFormModal ────────────────────────────────────────────────────────
export function CategoryFormModal({ isOpen, onClose, initialData = null, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const isEdit = !!initialData?.id;
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(null),
  });

  useEffect(() => {
    if (!isOpen) {
      reset(buildDefaults(null));
      setApiError('');
      return;
    }
    reset(buildDefaults(initialData));
  }, [isOpen, initialData, reset]);

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const onSubmit = async (data) => {
    setApiError('');
    const payload = {
      nombre:      data.nombre,
      descripcion: data.descripcion || '',
      color:       data.color,
      orden:       data.orden,
      ...(isEdit ? { activa: data.activa } : {}),
    };
    try {
      const result = isEdit
        ? await categoriasService.update(initialData.id, payload, token)
        : await categoriasService.create(payload, token);
      onSaved?.(result);
      toast.success(isEdit ? 'Categoría actualizada' : 'Categoría creada');
      onClose();
    } catch (err) {
      setApiError(err.message || 'Error al guardar la categoría');
    }
  };

  const colorValue = watch('color');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: colorValue + '33' }}
                >
                  <Tag size={14} style={{ color: colorValue }} />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isEdit ? 'Editar categoría' : 'Nueva categoría'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('nombre')}
                  placeholder="Ej. Suscripciones IPTV"
                  className={cn(INPUT_CLS, errors.nombre && 'border-red-300 focus:ring-red-500/20 focus:border-red-400')}
                  autoFocus
                />
                {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Descripción</label>
                <textarea
                  {...register('descripcion')}
                  rows={2}
                  placeholder="Descripción opcional de la categoría..."
                  className={cn(INPUT_CLS, 'h-auto py-2 resize-none')}
                />
              </div>

              {/* Color + Orden */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Color</label>
                  <Controller
                    name="color"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2.5 h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 cursor-pointer"
                        onClick={() => document.getElementById('cat-color-input')?.click()}>
                        <input
                          id="cat-color-input"
                          type="color"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-6 h-6 rounded-md border-0 cursor-pointer bg-transparent p-0 shrink-0"
                        />
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 select-none">
                          {field.value}
                        </span>
                      </div>
                    )}
                  />
                  {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Orden <span className="text-slate-400 font-normal">(↑ menor = primero)</span>
                  </label>
                  <Controller
                    name="orden"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        className={cn(INPUT_CLS, '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none')}
                      />
                    )}
                  />
                  {errors.orden && <p className="text-xs text-red-500">{errors.orden.message}</p>}
                </div>
              </div>

              {/* Activa toggle — solo al editar */}
              {isEdit && (
                <Controller
                  name="activa"
                  control={control}
                  render={({ field }) => (
                    <div
                      className={cn(
                        'flex items-center justify-between gap-4 p-3.5 rounded-xl border cursor-pointer transition-all',
                        field.value
                          ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600',
                      )}
                      onClick={() => field.onChange(!field.value)}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Categoría activa</p>
                        <p className="text-xs text-slate-400">Visible en el menú digital</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.value}
                        onClick={(e) => { e.stopPropagation(); field.onChange(!field.value); }}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
                          field.value ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600',
                        )}
                      >
                        <motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 700, damping: 35 }}
                          className={cn('inline-block rounded-full bg-white shadow-md', field.value ? 'translate-x-6' : 'translate-x-1')}
                          style={{ inlineSize: 18, blockSize: 18 }}
                        />
                      </button>
                    </div>
                  )}
                />
              )}

              {apiError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={13} className="shrink-0" />
                  {apiError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-60 transition-colors"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {isEdit ? 'Guardar' : 'Crear categoría'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
