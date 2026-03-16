import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input';
import PhoneField from '../../components/ui/PhoneField';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2, FileText, MonitorPlay,
  Info, LogOut, Check, AlertCircle, Loader2,
  QrCode
} from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useAuthContext } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { ShareMenuModal } from '../../components/common/ShareMenuModal';

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  businessName:     z.string().min(1, 'Campo requerido'),
  description:      z.string().optional(),
  phone:            z.string().optional().refine(v => !v || isValidPhoneNumber(v), 'Número inválido — verifica el código de país'),
  address:          z.string().optional(),
  publicMenuEnabled: z.boolean(),
});


// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
        checked && !disabled ? 'bg-violet-500' : disabled ? 'bg-slate-100 dark:bg-slate-700' : 'bg-slate-200 dark:bg-slate-600'
      )}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
      />
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
        <Icon size={14} className="text-slate-500 dark:text-slate-400" />
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-700/50">{children}</div>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────
function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Text field ───────────────────────────────────────────────────────────────
function Field({ label, sub, error, children }) {
  return (
    <div className="px-4 py-3.5 space-y-1.5">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const INPUT_CLS = 'w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

// ─── SettingsPage ─────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { token, logout } = useAuthContext();
  const { settings, updateSettings, loading: settingsLoading } = useSettings(token);
  const [saved, setSaved] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isDirty }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: settings,
  });

  // Re-sync form when settings load from API
  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data) => {
    try {
      setErrorStatus('');
      await updateSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setErrorStatus(err.message);
    }
  };

  if (settingsLoading) return (
    <div className="flex items-center justify-center h-full text-slate-400 gap-2">
      <Loader2 size={24} className="animate-spin" />
      <span className="text-sm font-medium">Cargando ajustes...</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-slate-50 dark:bg-slate-950">
      {/* ── Sticky header ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-black text-slate-900 dark:text-white">Ajustes</h1>
          <p className="text-xs text-slate-400">Configura tu negocio</p>
        </div>
        <motion.button
          type="button"
          onClick={handleSubmit(onSubmit)}
          whileTap={{ scale: 0.96 }}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all',
            saved
              ? 'bg-violet-100 text-violet-700'
              : isDirty
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-default'
          )}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                <Check size={14} /> Guardado
              </motion.span>
            ) : (
              <motion.span key="save" className="flex items-center gap-1.5">
                Guardar
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 pb-12">
        {errorStatus && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium">
            <AlertCircle size={14} />
            {errorStatus}
          </div>
        )}

        {/* ── 1. Negocio ─────────────────────────────────────────────── */}
        <Section title="Negocio" icon={Building2}>
          <Field label="Nombre del negocio" error={errors.businessName?.message}>
            <div>
              <input {...register('businessName')} className={INPUT_CLS} placeholder="MaxPlus IPTV" />
              {errors.businessName && <p className="text-red-500 text-xs mt-1 font-bold">{errors.businessName.message}</p>}
            </div>
          </Field>
          <Field label="Teléfono" sub="Opcional · para comprobantes" error={errors.phone?.message}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneField
                  value={field.value}
                  onChange={(v) => field.onChange(v || '')}
                  error={errors.phone?.message}
                  placeholder="8888-0000"
                />
              )}
            />
          </Field>
          <Field label="Descripción corta" sub="Opcional · Breve eslogan o descripción">
            <input {...register('description')} className={INPUT_CLS} placeholder="Las mejores hamburguesas a la parrilla..." />
          </Field>
          <Field label="Dirección / Slogan" sub="Visible en tickets" error={errors.address?.message}>
            <div className="relative">
              <FileText size={13} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                {...register('address')}
                rows={2}
                className={cn(INPUT_CLS, 'pl-8 h-auto pt-2 resize-none')}
                placeholder="Bo. San Judas, de la iglesia..."
              />
            </div>
          </Field>
        </Section>

        {/* ── 2. Público & Menú Digital ──────────────────────────────── */}
        <Section title="Público & Menú Digital" icon={MonitorPlay}>
          <div className="px-4 py-3.5">
            <div className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all',
              watch('publicMenuEnabled') ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700 opacity-60'
            )}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Habilitar Menú Público</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Permite que tus clientes vean el menú digital</p>
              </div>
              <Toggle
                checked={watch('publicMenuEnabled')}
                onChange={(val) => setValue('publicMenuEnabled', val, { shouldDirty: true })}
              />
            </div>
          </div>
          <div className="px-4 py-3.5 border-t border-slate-50 dark:border-slate-700/50 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.open('/menu-publico?preview=1', '_blank')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all border border-emerald-100 dark:border-emerald-800/50"
            >
              <MonitorPlay size={16} />
              Vista Previa del Menú
            </button>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all border border-violet-100 dark:border-violet-800/50"
            >
              <QrCode size={16} />
              Generar Código QR y Compartir
            </button>
          </div>
        </Section>

        {/* ── 3. Cuenta ─────────────────────────────────────────────── */}
        <Section title="Cuenta" icon={LogOut}>
          <Row label="Cerrar sesión" sub="Vuelve a la pantalla de login">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-700 text-red-500 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={12} />
              Cerrar sesión
            </button>
          </Row>

          <div className="px-4 py-3 flex items-center gap-2">
            <Info size={12} className="text-slate-300 shrink-0" />
            <span className="flex items-center gap-1.5">
              MaxPlus IPTV · v0.1.0 · Configuración sincronizada con el servidor
            </span>
          </div>
        </Section>
      </form>

      <ShareMenuModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        businessName={settings?.businessName}
      />
    </div>
  );
}
