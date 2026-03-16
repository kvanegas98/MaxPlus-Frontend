import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Tag, X, Check, Loader2, AlertCircle,
  Upload, Link, ImageOff, Trash2,
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
// import { categoryService } from '../../services/categoryService';
import { cn } from '../../lib/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(1, 'Campo requerido'),
  description: z.string().optional(),
  imageUrl:    z.string().url('URL inválida').optional().or(z.literal('')),
});

const INPUT_CLS = 'w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

// ─── ImagePicker ──────────────────────────────────────────────────────────────
function ImagePicker({ currentImageUrl, onFileChange, onUrlChange, imageUrl }) {
  const [tab,     setTab]     = useState(currentImageUrl ? 'url' : 'file');
  const [preview, setPreview] = useState(currentImageUrl || '');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
 
  // Sync preview when props change
  useEffect(() => {
    setPreview(currentImageUrl || imageUrl || '');
  }, [currentImageUrl, imageUrl]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileChange(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUrlBlur = (e) => {
    const val = e.target.value.trim();
    setPreview(val);
    onUrlChange(val);
  };

  const clearImage = () => {
    setPreview('');
    onFileChange(null);
    onUrlChange('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl w-fit">
        {[
          { key: 'file', label: 'Subir archivo', icon: Upload },
          { key: 'url',  label: 'URL de imagen', icon: Link   },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              tab === key
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* File drop zone */}
      {tab === 'file' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all',
            dragging
              ? 'border-violet-400 bg-violet-50'
              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          )}
        >
          <Upload size={20} className="text-slate-300" />
          <p className="text-xs text-slate-400 text-center">
            Arrastra una imagen aquí<br />
            <span className="text-violet-600 font-semibold">o haz clic para seleccionar</span>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* URL input */}
      {tab === 'url' && (
        <div className="relative">
          <Link size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="url"
            defaultValue={imageUrl}
            onBlur={handleUrlBlur}
            placeholder="https://ejemplo.com/imagen.jpg"
            className={cn(INPUT_CLS, 'pl-8')}
          />
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
          <img
            src={preview}
            alt="Vista previa"
            className="w-full h-full object-cover"
            onError={() => setPreview('')}
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-500 hover:text-red-500 shadow-sm transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Empty placeholder */}
      {!preview && (
        <div className="flex items-center justify-center w-full aspect-video rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
          <ImageOff size={24} className="text-slate-300 dark:text-slate-500" />
        </div>
      )}
    </div>
  );
}

// ─── CategoryFormModal ────────────────────────────────────────────────────────
export function CategoryFormModal({ isOpen, onClose, initialData = null, onSaved }) {
  const { token } = useAuthContext();
  const { toast } = useToast();
  const isEdit    = !!initialData;

  const [selectedFile,  setSelectedFile]  = useState(null);
  const [imageUrl,      setImageUrl]      = useState('');
  const [apiError,      setApiError]      = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        '',
      description: '',
      imageUrl:    '',
    },
  });

  // Fetch full data on open if editing
  useEffect(() => {
    if (!isOpen) {
      // Reset state if closed
      reset({ name: '', description: '', imageUrl: '' });
      setSelectedFile(null);
      setImageUrl('');
      setApiError('');
      return;
    }

    if (isEdit && initialData?.id) {
      setIsLoadingData(true);
      setApiError('');
      // categoryService.getById(initialData.id, token)
      //   .then((data) => {
      //     reset({
      //       name:        data.name        || '',
      //       description: data.description || '',
      //       imageUrl:    data.imageUrl    || '',
      //     });
      //     setImageUrl(data.imageUrl || '');
      //   })
      //   .catch((err) => {
      //     if (err.message.includes('404')) {
      //       setApiError('Categoría no encontrada');
      //     } else {
      //       setApiError('Error al cargar datos de la categoría');
      //     }
      //   })
      //   .finally(() => setIsLoadingData(false));
      setIsLoadingData(false);
    }
  }, [isOpen, isEdit, initialData, token, reset]);

  const onSubmit = async (data) => {
    setApiError('');
    const payload = {
      name:        data.name,
      description: data.description || '',
      imageUrl:    imageUrl,
      image:       selectedFile,
    };
    try {
      // const result = isEdit
      //   ? await categoryService.update(initialData.id, payload, token)
      //   : await categoryService.create(payload, token);
      console.log('Dummy category result');
      const result = { id: 1 };
      onSaved?.(result);
      toast.success(isEdit ? 'Categoría actualizada' : 'Categoría creada');
      onClose();
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={  { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <Tag size={15} className="text-slate-500 dark:text-slate-400" />
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

            {/* Scrollable body */}
            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 p-5 space-y-4 scrollbar-hide">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('name')}
                  placeholder="Hamburguesas"
                  className={INPUT_CLS}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Descripción</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder="Descripción opcional de la categoría..."
                  className={cn(INPUT_CLS, 'h-auto py-2 resize-none')}
                />
              </div>

              {/* Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Imagen</label>
                <ImagePicker
                  currentImageUrl={initialData?.imageUrl}
                  imageUrl={imageUrl}
                  onFileChange={setSelectedFile}
                  onUrlChange={setImageUrl}
                />
              </div>

              {apiError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={13} className="shrink-0" />
                  {apiError}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1 pb-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingData}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
                >
                  {(isSubmitting || isLoadingData) ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
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
