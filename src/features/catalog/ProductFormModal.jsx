import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Upload,
  ImagePlus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign,
  FileText,
  Package,
  Calendar,
  Tag,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { serviceTypeService } from '../../services/serviceTypeService';

// ─── Schema ───────────────────────────────────────────────────────────────────
const PLATAFORMAS = ['IPTV', 'FlujoTV', 'Netflix', 'Streaming'];

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(80, 'Máximo 80'),
  description: z.string().max(300, 'Máximo 300').optional().or(z.literal('')),
  plataforma: z.string().min(1, 'Selecciona una plataforma'),
  price: z
    .string()
    .min(1, 'Requerido')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Número ≥ 0'),
  purchasePrice: z
    .string()
    .min(1, 'Requerido')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Número ≥ 0'),
  durationDays: z
    .string()
    .min(1, 'Requerido')
    .refine((v) => Number.isInteger(Number(v)) && parseInt(v) > 0, 'Entero > 0'),
  category: z.enum(['Paid', 'Demo'], { message: 'Selecciona una categoría' }),
  isActive: z.boolean(),
  imageUrl: z.string().optional().or(z.literal('')),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildDefaults(data) {
  return {
    name:          data?.name          ?? '',
    description:   data?.description   ?? '',
    plataforma:    data?.plataforma    ?? '',
    price:         data?.price         != null ? String(data.price)         : '',
    purchasePrice: data?.purchasePrice != null ? String(data.purchasePrice) : '',
    durationDays:  data?.durationDays  != null ? String(data.durationDays)  : '',
    category:      data?.category      ?? 'Paid',
    isActive:      data?.isActive      ?? true,
    imageUrl:      data?.imageUrl      ?? '',
  };
}

// ─── Animation variants ───────────────────────────────────────────────────────
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const panelVariants = {
  hidden:  { opacity: 0, y: 40, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring', damping: 28, stiffness: 320 } },
  exit:    { opacity: 0, y: 24, scale: 0.97, transition: { duration: 0.18 } },
};

// ─── FieldError ───────────────────────────────────────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5"
    >
      <AlertCircle size={11} className="shrink-0" />
      {message}
    </motion.p>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, children, error, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      <AnimatePresence mode="wait">
        {error && <FieldError key="err" message={error} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────
function ImageUploadZone({ value, onChange, onFileChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview]       = useState(value || '');
  const [imgError, setImgError]     = useState(false);
  const fileInputRef                = useRef(null);

  useEffect(() => { setPreview(value || ''); setImgError(false); }, [value]);

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url); setImgError(false);
    onChange(url); onFileChange?.(file);
  }, [onChange, onFileChange]);

  const handleClear = () => { setPreview(''); setImgError(false); onChange(''); onFileChange?.(null); };
  const hasImage = preview && !imgError;

  return (
    <div className="relative">
      {hasImage ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="group relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100"
        >
          <img src={preview} alt="Preview" onError={() => setImgError(true)} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2 bg-white text-slate-900 text-xs font-semibold rounded-xl shadow-lg hover:bg-slate-50">
              <RefreshCw size={13} /> Cambiar
            </button>
            <button type="button" onClick={handleClear}
              className="flex items-center gap-2 px-3.5 py-2 bg-red-500 text-white text-xs font-semibold rounded-xl shadow-lg hover:bg-red-600">
              <Trash2 size={13} /> Quitar
            </button>
          </div>
          <div className="md:hidden absolute bottom-2 right-2 flex gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 text-slate-900 text-[11px] font-semibold rounded-lg shadow">
              <RefreshCw size={11} /> Cambiar
            </button>
            <button type="button" onClick={handleClear}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/90 text-white text-[11px] font-semibold rounded-lg shadow">
              <Trash2 size={11} /> Quitar
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          animate={isDragging ? { scale: 1.015 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files?.[0]); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative w-full aspect-video rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
            'flex flex-col items-center justify-center gap-3 select-none',
            isDragging
              ? 'border-violet-500 bg-violet-50 shadow-inner'
              : 'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/40',
          )}
        >
          {isDragging && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 rounded-2xl ring-4 ring-violet-500/20 pointer-events-none" />
          )}
          <motion.div
            animate={isDragging ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn('flex items-center justify-center w-12 h-12 rounded-2xl', isDragging ? 'bg-violet-100' : 'bg-slate-200')}
          >
            {isDragging ? <Upload size={22} className="text-violet-600" /> : <ImagePlus size={22} className="text-slate-500" />}
          </motion.div>
          <div className="text-center px-4">
            <p className={cn('text-sm font-semibold', isDragging ? 'text-violet-700' : 'text-slate-600')}>
              {isDragging ? 'Suelta la imagen aquí' : 'Arrastra o haz clic para subir'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, WEBP · Máx. 5 MB</p>
          </div>
        </motion.div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { processFile(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div
      className={cn('flex items-center justify-between gap-4 p-4 rounded-xl border transition-all cursor-pointer',
        checked ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked}
        onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
        className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-violet-500' : 'bg-slate-300')}
      >
        <motion.span layout transition={{ type: 'spring', stiffness: 700, damping: 35 }}
          className={cn('inline-block rounded-full bg-white shadow-md', checked ? 'translate-x-6' : 'translate-x-1')}
          style={{ inlineSize: 18, blockSize: 18 }} />
      </button>
    </div>
  );
}

// ─── Price input helper ───────────────────────────────────────────────────────
function PriceInput({ register, name, prefix, placeholder, error, step = '0.01', min = '0' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 select-none">{prefix}</span>
      <input
        {...register(name)}
        type="number" step={step} min={min} placeholder={placeholder}
        className={cn(
          'w-full h-10 pl-9 pr-3 bg-white border rounded-xl text-sm text-slate-800 font-medium',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
          error
            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
            : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-400',
        )}
      />
    </div>
  );
}

// ─── ProductFormModal ─────────────────────────────────────────────────────────
export function ProductFormModal({ isOpen, onClose, initialData, onSaved }) {
  const { token }  = useAuthContext();
  const { toast }  = useToast();
  const isEditing  = Boolean(initialData?.id);

  const [selectedFile,  setSelectedFile]  = useState(null);
  const [apiError,      setApiError]      = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(initialData),
  });

  // Reset al abrir el modal
  useEffect(() => {
    if (!isOpen) return;
    setSelectedFile(null);
    setApiError('');
    setSubmitSuccess(false);
    if (initialData?.id) {
      serviceTypeService.getById(initialData.id, token)
        .then((s) => reset(buildDefaults(s)))
        .catch(() => reset(buildDefaults(initialData)));
    } else {
      reset(buildDefaults(initialData));
    }
  }, [isOpen, initialData, reset, token]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleFormSubmit = async (data) => {
    setApiError('');
    try {
      // 1. Subir imagen si hay archivo nuevo
      let finalImageUrl = data.imageUrl || null;
      if (selectedFile) {
        const uploaded = await serviceTypeService.uploadImage(selectedFile, token);
        finalImageUrl = uploaded.imageUrl;
        setValue('imageUrl', finalImageUrl);
      }

      const payload = {
        name:          data.name,
        description:   data.description || '',
        plataforma:    data.plataforma,
        price:         parseFloat(data.price),
        purchasePrice: parseFloat(data.purchasePrice),
        durationDays:  parseInt(data.durationDays, 10),
        category:      data.category,
        imageUrl:      finalImageUrl,
      };

      // 2. Crear o actualizar
      let result;
      if (isEditing) {
        await serviceTypeService.update(initialData.id, payload, token);
        result = { id: initialData.id };
      } else {
        result = await serviceTypeService.create(payload, token);
      }

      onSaved?.(result);
      toast.success(isEditing ? 'Servicio actualizado' : 'Servicio creado');
      setSubmitSuccess(true);
      setTimeout(() => { setSubmitSuccess(false); onClose(); }, 900);
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          <motion.div
            variants={panelVariants} initial="hidden" animate="visible" exit="exit"
            className={cn(
              'relative z-10 w-full bg-white shadow-2xl overflow-hidden',
              'rounded-t-3xl sm:rounded-2xl max-h-[92dvh] sm:max-h-[90vh]',
              'sm:max-w-2xl lg:max-w-3xl flex flex-col',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 rounded-full sm:hidden" />
              <div className="flex items-center gap-3">
                <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl', isEditing ? 'bg-amber-50' : 'bg-violet-50')}>
                  <Package size={18} className={isEditing ? 'text-amber-600' : 'text-violet-600'} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                  <p className="text-xs text-slate-400">{isEditing ? 'Modifica los datos del servicio IPTV' : 'Completa la información del servicio IPTV'}</p>
                </div>
              </div>
              <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="p-5 lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">

                {/* Imagen + estado */}
                <div className="space-y-4">
                  <Field label="Imagen" icon={ImagePlus}>
                    <Controller
                      name="imageUrl" control={control}
                      render={({ field }) => (
                        <ImageUploadZone
                          value={field.value}
                          onChange={(url) => { field.onChange(url); setValue('imageUrl', url, { shouldDirty: true }); }}
                          onFileChange={setSelectedFile}
                        />
                      )}
                    />
                  </Field>
                  <input
                    {...register('imageUrl')}
                    type="text"
                    placeholder="…o pega una URL de imagen"
                    className="w-full h-9 pl-3 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                  />
                  <Controller
                    name="isActive" control={control}
                    render={({ field }) => (
                      <ToggleSwitch
                        checked={field.value} onChange={field.onChange}
                        label="Servicio activo"
                        description="Visible en el menú público"
                      />
                    )}
                  />
                </div>

                {/* Datos */}
                <div className="space-y-4">
                  <Field label="Nombre" required icon={FileText} error={errors.name?.message}>
                    <input
                      {...register('name')}
                      type="text"
                      placeholder="Ej. Plan Premium 1 Mes"
                      className={cn(
                        'w-full h-10 px-3 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
                        errors.name ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-400',
                      )}
                    />
                  </Field>

                  <Field label="Descripción" icon={FileText} error={errors.description?.message}>
                    <textarea
                      {...register('description')}
                      rows={3}
                      placeholder="Canales incluidos, calidad, dispositivos..."
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all resize-none"
                    />
                  </Field>

                  <Field label="Categoría" required icon={Tag} error={errors.category?.message}>
                    <Controller
                      name="category" control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'Paid', label: 'Suscripción', desc: 'Con precio de venta' },
                            { value: 'Demo', label: 'Demo Gratis', desc: 'Precio = 0' },
                          ].map(({ value, label, desc }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className={cn(
                                'flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all',
                                field.value === value ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-slate-300',
                              )}
                            >
                              <span className={cn('text-xs font-bold', field.value === value ? 'text-violet-700' : 'text-slate-700')}>{label}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">{desc}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </Field>

                  <Field label="Plataforma" required icon={Tag} error={errors.plataforma?.message}>
                    <select
                      {...register('plataforma')}
                      className={cn(
                        'w-full h-10 px-3 bg-white border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all',
                        errors.plataforma ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-400',
                      )}
                    >
                      <option value="">— Seleccionar —</option>
                      {PLATAFORMAS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Precio Venta" required icon={DollarSign} error={errors.price?.message}>
                      <PriceInput register={register} name="price" prefix="C$" placeholder="0.00" error={errors.price} />
                    </Field>
                    <Field label="Costo Proveedor" required icon={DollarSign} error={errors.purchasePrice?.message}>
                      <PriceInput register={register} name="purchasePrice" prefix="C$" placeholder="0.00" error={errors.purchasePrice} />
                    </Field>
                  </div>

                  <Field label="Duración (días)" required icon={Calendar} error={errors.durationDays?.message}>
                    <PriceInput register={register} name="durationDays" prefix="📅" placeholder="30" error={errors.durationDays} step="1" min="1" />
                  </Field>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4 flex flex-col gap-3 shrink-0">
                {apiError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                    <AlertCircle size={13} className="shrink-0" /> {apiError}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={onClose}
                    className="flex-1 sm:flex-none h-10 px-5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || submitSuccess}
                    whileTap={!isSubmitting ? { scale: 0.97 } : {}}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold transition-all',
                      submitSuccess ? 'bg-violet-500 text-white'
                        : isEditing ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-violet-600 hover:bg-violet-700 text-white',
                      (isSubmitting || submitSuccess) && 'opacity-90 cursor-not-allowed',
                    )}
                  >
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                      : submitSuccess ? <><CheckCircle2 size={16} /> ¡Guardado!</>
                      : isEditing ? 'Guardar Cambios' : 'Crear Servicio'}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
