import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

export function SuccessModal({ isOpen, onClose, title, message }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-500 shadow-xl shadow-violet-500/10">
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">
                  {title || '¡Completado!'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {message || 'La operación se realizó con éxito.'}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full h-14 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                ENTENDIDO
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
