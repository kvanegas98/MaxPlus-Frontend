import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function VoidReasonModal({ isOpen, onClose, onConfirm, title, message, loading = false }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">
                  {title || 'Confirmar Anulación'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {message || 'Esta acción no se puede deshacer. Por favor, ingresa el motivo de la anulación.'}
                </p>
              </div>

              <div className="w-full space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left px-1">
                  Motivo de la anulación
                </p>
                <textarea
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Error en el monto, Cliente canceló orden..."
                  className={cn(
                    "w-full h-24 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-100 dark:border-slate-600",
                    "focus:outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 transition-all",
                    "text-sm font-medium resize-none dark:text-white dark:placeholder:text-slate-500"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !reason.trim()}
                  className="h-12 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  ANULAR
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
