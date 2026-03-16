import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Receipt, Calendar, User, Hash, Printer,
  Loader2, AlertCircle, ImageIcon, CreditCard, FileText,
} from 'lucide-react';
import { cn, fmtCRD } from '../../lib/utils';
import { reportService } from '../../services/reportService';

const STATUS_THEMES = {
  'Pagada':     'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50',
  'Completada': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50',
  'Anulada':    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700/50',
  'Pendiente':  'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/50',
};

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function OrderDetailModal({ isOpen, onClose, orderId, token, onVoid }) {
  const [order,       setOrder]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [dlPdf,       setDlPdf]       = useState(false);
  const [dlPng,       setDlPng]       = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [previewLoad, setPreviewLoad] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!orderId) return;
    setLoading(true); setError(''); setOrder(null); setPreviewUrl(null);
    try {
      setOrder(await reportService.getInvoiceDetail(orderId, token));
    } catch (err) {
      setError(err.message || 'Error al cargar el detalle');
    } finally { setLoading(false); }
  }, [orderId, token]);

  const loadPreview = useCallback(async () => {
    if (!orderId || !order) return;
    setPreviewLoad(true);
    try {
      const { blob } = await reportService.downloadInvoicePng(orderId, token);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch { /* silent */ } finally { setPreviewLoad(false); }
  }, [orderId, token, order]);

  useEffect(() => {
    if (isOpen && orderId) loadDetail();
    if (!isOpen) {
      setOrder(null); setError('');
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    }
  }, [isOpen, orderId]); // eslint-disable-line

  useEffect(() => { if (order) loadPreview(); }, [order]); // eslint-disable-line

  const handlePdf = async () => {
    setDlPdf(true);
    try { triggerDownload((await reportService.downloadInvoicePdf(orderId, token)).blob, `${order?.numeroOrden ?? orderId}.pdf`); }
    catch (err) { alert(err.message || 'Error al descargar PDF'); }
    finally { setDlPdf(false); }
  };

  const handlePng = async () => {
    setDlPng(true);
    try { triggerDownload((await reportService.downloadInvoicePng(orderId, token)).blob, `${order?.numeroOrden ?? orderId}.png`); }
    catch (err) { alert(err.message || 'Error al descargar PNG'); }
    finally { setDlPng(false); }
  };

  const handlePrint = () =>
    window.open(`${import.meta.env.VITE_API_URL}/api/pos/invoice/${orderId}/ticket?token=${token}`, '_blank');

  return (
    <AnimatePresence>
      {isOpen && (
        /* Full-screen container: bottom-aligned on mobile, centered on desktop */
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Sheet / Modal */}
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'relative z-10 flex flex-col bg-white dark:bg-slate-800 shadow-2xl overflow-hidden',
              'w-full max-h-[92dvh]',
              'rounded-t-3xl',
              'sm:rounded-[2rem] sm:max-w-xl sm:max-h-[88vh]',
            )}
          >
            {/* Drag handle — mobile only */}
            <div className="sm:hidden flex justify-center pt-3 pb-0 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>

            {/* ── Header ── */}
            <div className="flex items-start gap-3 px-5 pt-4 pb-4 sm:px-8 sm:pt-6 sm:pb-5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex-1 min-w-0">
                {order ? (
                  <>
                    <p className="text-[9px] font-black text-violet-500 uppercase tracking-[0.2em] mb-0.5">Factura</p>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight truncate">
                      {order.numeroOrden}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(order.saleDate).toLocaleDateString('es-NI', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                        STATUS_THEMES[order.status] ?? 'bg-slate-100 text-slate-500 border-slate-200',
                      )}>
                        {order.status}
                      </span>
                    </div>
                  </>
                ) : (
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Detalle de Factura
                  </h3>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0 mt-0.5"
              >
                <X size={17} strokeWidth={2.5} />
              </button>
            </div>

            {/* ── Action bar ── */}
            {order && (
              <div className="flex items-center gap-2 px-5 py-3 sm:px-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20 shrink-0">
                <button onClick={handlePdf} disabled={dlPdf}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 text-[10px] font-black uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {dlPdf ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                  PDF
                </button>
                <button onClick={handlePng} disabled={dlPng}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50 text-[10px] font-black uppercase tracking-wider hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {dlPng ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                  PNG
                </button>
                <button onClick={handlePrint}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[10px] font-black uppercase tracking-wider hover:border-violet-400 hover:text-violet-600 transition-all"
                >
                  <Printer size={12} />
                  Ticket
                </button>
              </div>
            )}

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 space-y-4 scrollbar-hide">
              {loading ? (
                <div className="py-16 flex flex-col items-center gap-4 text-slate-400">
                  <Loader2 size={36} className="animate-spin text-violet-500" />
                  <span className="text-xs font-black uppercase tracking-widest">Cargando...</span>
                </div>
              ) : error ? (
                <div className="py-16 flex flex-col items-center gap-4 text-red-500">
                  <AlertCircle size={44} className="opacity-20" />
                  <p className="text-sm font-bold text-center">{error}</p>
                </div>
              ) : order && (
                <>
                  {/* Cliente */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600/50">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 shrink-0">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cliente</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                        {order.customerName || 'Cliente Final'}
                      </p>
                    </div>
                  </div>

                  {/* Pago */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Método de Pago</p>
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={12} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{order.paymentMethod}</span>
                      </div>
                    </div>

                    {(order.paymentReference || order.amountReceived != null) && (
                      order.paymentReference ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600/50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Referencia</p>
                          <div className="flex items-center gap-1.5">
                            <Hash size={12} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{order.paymentReference}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-700/50">
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Recibido</p>
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">C$ {fmtCRD(order.amountReceived)}</span>
                        </div>
                      )
                    )}

                    {order.paymentReference && order.amountReceived != null && (
                      <div className="col-span-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-700/50">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Monto Recibido</p>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">C$ {fmtCRD(order.amountReceived)}</span>
                      </div>
                    )}
                  </div>

                  {/* Detalle — lista en móvil, tabla en escritorio */}
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Detalle</p>

                    {/* Móvil */}
                    <div className="sm:hidden space-y-2">
                      {order.details?.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600/50">
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase leading-snug flex-1">
                              {item.concepto ?? item.productName}
                            </p>
                            <span className="text-sm font-black text-slate-900 dark:text-white shrink-0">
                              C$ {fmtCRD(item.subTotal)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400">
                              Cant: <span className="text-slate-600 dark:text-slate-300">{item.quantity}</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              P.U: <span className="text-slate-600 dark:text-slate-300">C$ {fmtCRD(item.unitPrice)}</span>
                            </span>
                            {item.discount > 0 && (
                              <span className="text-[10px] font-bold text-red-400">
                                Desc: -C$ {fmtCRD(item.discount)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Escritorio */}
                    <div className="hidden sm:block rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-100 dark:border-slate-700">
                            {['Concepto', 'Cant.', 'P. Unit.', 'Desc.', 'Subtotal'].map(h => (
                              <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest last:text-right">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                          {order.details?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-4 py-3 text-xs font-black text-slate-800 dark:text-slate-100 uppercase">
                                {item.concepto ?? item.productName}
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.quantity}</td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">C$ {fmtCRD(item.unitPrice)}</td>
                              <td className="px-4 py-3 text-xs font-bold text-red-400">
                                {item.discount > 0 ? `-C$ ${fmtCRD(item.discount)}` : '—'}
                              </td>
                              <td className="px-4 py-3 text-right text-xs font-black text-slate-900 dark:text-white">
                                C$ {fmtCRD(item.subTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl px-5 py-4 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-y-0 right-0 w-32 bg-emerald-500/10 blur-3xl" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">
                      Total Facturado
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-display text-emerald-400 tracking-tight relative z-10">
                      C$ {fmtCRD(order.totalAmount)}
                    </span>
                  </div>

                  {/* Vista previa PNG */}
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Vista previa</p>
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 min-h-[90px] flex items-center justify-center">
                      {previewLoad ? (
                        <div className="flex flex-col items-center gap-3 py-8 text-slate-400">
                          <Loader2 size={22} className="animate-spin text-violet-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Generando...</span>
                        </div>
                      ) : previewUrl ? (
                        <img src={previewUrl} alt={`Factura ${order.numeroOrden}`} className="w-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-8 text-slate-300 dark:text-slate-600">
                          <Receipt size={28} className="opacity-30" />
                          <span className="text-[10px] font-black uppercase tracking-widest">No disponible</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            {order && (
              <div className="px-5 py-4 sm:px-8 sm:py-5 border-t border-slate-100 dark:border-slate-700 shrink-0 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 h-11 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cerrar
                </button>
                {order.status !== 'Anulada' && (
                  <button
                    onClick={() => onVoid?.(order)}
                    className="flex-1 h-11 bg-red-50 dark:bg-red-900/20 text-red-600 border-2 border-red-100 dark:border-red-900/30 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                  >
                    <X size={14} strokeWidth={3} />
                    Anular
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
