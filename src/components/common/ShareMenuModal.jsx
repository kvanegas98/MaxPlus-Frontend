import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Download, 
  Link, 
  Check 
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '../../lib/utils';

export function ShareMenuModal({ isOpen, onClose, businessName }) {
  const [copied, setCopied] = useState(false);
  
  // URL base del menú (asegurándonos de que apunte al menú público)
  const menuUrl = `${window.location.origin}/menu-publico`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("admin-qr-code");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-menu-${businessName?.toLowerCase()?.replace(/\s+/g, '-') || 'digital'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`🍔 ¡Hola! Mira nuestro menú digital de *${businessName || 'nuestro restaurante'}* aquí: \n\n${menuUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Compartir Menú</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 text-center">
              {/* QR CODE CONTAINER */}
              <div className="inline-block p-6 bg-white rounded-[2rem] border-2 border-slate-50 dark:border-slate-700 shadow-inner relative group">
                <div className="absolute inset-0 bg-violet-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white p-2 rounded-xl">
                  <QRCodeCanvas 
                    id="admin-qr-code"
                    value={menuUrl}
                    size={200}
                    level={"H"}
                    includeMargin={true}
                    className="mx-auto"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadQR}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-violet-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-violet-700 shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all"
                >
                  <Download size={16} strokeWidth={3} /> Descargar Imagen QR
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]",
                      copied 
                        ? "bg-slate-900 dark:bg-slate-700 text-white" 
                        : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
                    )}
                  >
                    {copied ? (
                      <><Check size={16} strokeWidth={3} /> ¡Copiado!</>
                    ) : (
                      <><Link size={16} strokeWidth={3} /> Copiar Link</>
                    )}
                  </button>

                  <button
                   onClick={shareWhatsApp}
                   className="w-16 h-14 flex items-center justify-center bg-[#25D366] text-white rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#25D366]/20"
                  >
                    <Send size={20} fill="currentColor" />
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Descarga el QR para imprimirlo en tus mesas o envía el enlace directo a tus clientes.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
