import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-white"
          style={{ blockSize: 'auto' }}
        >
          <WifiOff size={15} strokeWidth={2.5} />
          <span className="text-xs font-semibold tracking-wide">
            Sin conexión — modo offline
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
