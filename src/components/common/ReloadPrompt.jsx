import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-10 md:w-96 z-[100]"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-violet-500/20 transition-all" />
            
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-violet-500/20 shadow-inner">
                 <RefreshCcw size={22} className={cn("text-violet-400", needRefresh && "animate-spin-slow")} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white font-display uppercase tracking-wider mb-1">
                  {needRefresh ? 'Nueva Versión Lista' : 'Menú Digital Offline'}
                </p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  {needRefresh 
                    ? 'Hay cambios recientes disponibles. Toca para actualizar y ver las últimas mejoras.' 
                    : 'La aplicación ya está lista para usarse sin conexión a internet.'}
                </p>
                
                {needRefresh && (
                  <button
                    onClick={() => updateServiceWorker(true)}
                    className="mt-4 px-6 py-2.5 bg-violet-500 hover:bg-violet-400 text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-500/20"
                  >
                    Actualizar Ahora
                  </button>
                )}
              </div>

              <button 
                onClick={close}
                className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-500 rounded-xl hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
