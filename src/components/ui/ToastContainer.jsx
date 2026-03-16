import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const CONFIGS = {
  success: { icon: CheckCircle2, bg: 'bg-violet-500' },
  error:   { icon: XCircle,      bg: 'bg-red-500'     },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500'  },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = CONFIGS[toast.type] ?? CONFIGS.success;
  const Icon = cfg.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0,  opacity: 1 }}
      exit={{   x: 80, opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`flex items-start gap-3 pl-4 pr-3 py-3 rounded-2xl shadow-2xl min-w-[260px] max-w-[340px] text-white ${cfg.bg}`}
    >
      <Icon size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
      <span className="flex-1 text-sm font-semibold leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity mt-0.5 p-0.5 rounded-lg hover:bg-white/20"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    /* Desktop: esquina inferior derecha  |  Mobile: lo mismo pero full-ancho */
    <div className="fixed bottom-4 right-4 z-[190] flex flex-col gap-2 items-end pointer-events-none sm:bottom-6 sm:right-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
