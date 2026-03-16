import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShoppingCart, Loader2, Minus, Plus } from 'lucide-react';
import { cn, fmtCRD } from '../../lib/utils';

// ─── ModifierModal ────────────────────────────────────────────────────────────
// Props:
//   isOpen          – boolean
//   product         – { id, name, price, basePrice?, ... }
//   modifiers       – Modifier[] | null (null = loading)
//   onConfirm       – (selected: SelectedModifier[]) => void
//   onClose         – () => void
//   initialSelected – SelectedModifier[]  (pre-selected when editing)
//   confirmLabel    – override button label
//
// SelectedModifier: { id, nombre, precio, isAvailable, quantity }
export function ModifierModal({
  isOpen,
  product,
  modifiers,
  onConfirm,
  onClose,
  initialSelected = [],
  confirmLabel,
}) {
  // selected: array of { ...modifier, quantity: number }
  const [selected, setSelected] = useState([]);

  // Re-populate when modal opens (for edit mode) or resets (for add mode)
  useEffect(() => {
    if (isOpen) {
      setSelected(
        initialSelected.length > 0
          ? initialSelected.map((m) => ({ ...m, quantity: m.quantity ?? 1 }))
          : []
      );
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const getEntry   = (id) => selected.find((m) => m.id === id);
  const isSelected = (id) => Boolean(getEntry(id));
  const getQty     = (id) => getEntry(id)?.quantity ?? 0;

  const toggle = (modifier) => {
    if (!modifier.isAvailable) return;
    setSelected((prev) =>
      prev.find((m) => m.id === modifier.id)
        ? prev.filter((m) => m.id !== modifier.id)
        : [...prev, { ...modifier, quantity: 1 }]
    );
  };

  const changeQty = (modifierId, delta) => {
    setSelected((prev) =>
      prev.map((m) =>
        m.id === modifierId
          ? { ...m, quantity: Math.max(1, (m.quantity ?? 1) + delta) }
          : m
      )
    );
  };

  const modifiersTotal = selected.reduce(
    (s, m) => s + (m.precio ?? m.price ?? 0) * (m.quantity ?? 1),
    0
  );
  const effectivePrice = (product?.basePrice ?? product?.price ?? 0) + modifiersTotal;
  const isLoading      = modifiers === null;
  const isEditMode     = initialSelected.length > 0;
  const btnLabel       = confirmLabel ?? (isEditMode ? 'Actualizar Extras' : 'Añadir al Carrito');

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            style={{ maxBlockSize: '90dvh' }}
          >
            {/* Mobile drag handle */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200/60 dark:bg-slate-600/60 rounded-full sm:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-7 pb-4 shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">
                  {isEditMode ? 'Editar Extras' : 'Extras / Modificadores'}
                </p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display uppercase tracking-tight leading-tight line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm font-bold text-slate-400 mt-1">
                  Base:{' '}
                  <span className="text-slate-700 dark:text-slate-200">
                    C$ {fmtCRD(product.basePrice ?? product.price)}
                  </span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modifiers list */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-2 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                  <Loader2 size={22} className="animate-spin text-violet-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">Cargando extras...</span>
                </div>
              ) : modifiers.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <p className="text-xs font-bold uppercase tracking-widest">Sin extras disponibles</p>
                </div>
              ) : (
                modifiers.map((modifier) => {
                  const sel       = isSelected(modifier.id);
                  const qty       = getQty(modifier.id);
                  const unavail   = !modifier.isAvailable;
                  const unitPrice = modifier.precio ?? modifier.price ?? 0;

                  return (
                    <div
                      key={modifier.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-200',
                        unavail
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-600'
                          : sel
                            ? 'bg-violet-50 border-violet-300 dark:bg-violet-900/20 dark:border-violet-600'
                            : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      )}
                    >
                      {/* Checkbox + Name (clickable area to toggle) */}
                      <button
                        onClick={() => toggle(modifier)}
                        disabled={unavail}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <div className={cn(
                          'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                          sel ? 'bg-violet-500 border-violet-500' : 'border-slate-200 dark:border-slate-500'
                        )}>
                          {sel && <Check size={13} strokeWidth={3} className="text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                            {modifier.nombre ?? modifier.name}
                          </p>
                          {unavail && (
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-0.5">
                              No disponible
                            </p>
                          )}
                        </div>
                      </button>

                      {/* Quantity stepper (only when selected) */}
                      {sel && (
                        <div className="flex items-center bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-xl overflow-hidden shadow-sm shrink-0">
                          <button
                            onClick={() => changeQty(modifier.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                          >
                            <Minus size={11} strokeWidth={3} />
                          </button>
                          <span className="w-5 text-center text-xs font-black text-slate-900 dark:text-white select-none">
                            {qty}
                          </span>
                          <button
                            onClick={() => changeQty(modifier.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-violet-600 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                          >
                            <Plus size={11} strokeWidth={3} />
                          </button>
                        </div>
                      )}

                      {/* Unit price */}
                      <span className={cn(
                        'text-sm font-black shrink-0 min-w-[50px] text-right',
                        sel ? 'text-violet-600' : 'text-slate-400 dark:text-slate-500'
                      )}>
                        {unitPrice > 0
                          ? sel && qty > 1
                            ? `C$${fmtCRD(unitPrice * qty)}`
                            : `+C$${fmtCRD(unitPrice)}`
                          : 'Gratis'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-5 border-t border-slate-100 dark:border-slate-700 space-y-4 bg-white dark:bg-slate-800">
              {/* Price */}
              <div className="flex items-center justify-between px-2">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Precio final
                  </span>
                  {modifiersTotal > 0 && (
                    <span className="text-[10px] font-bold text-violet-600">
                      + C$ {fmtCRD(modifiersTotal)} extras
                    </span>
                  )}
                </div>
                <motion.span
                  key={effectivePrice}
                  initial={{ scale: 1.08, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tighter"
                >
                  C$ {fmtCRD(effectivePrice)}
                </motion.span>
              </div>

              {/* Confirm button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => !isLoading && onConfirm(selected)}
                disabled={isLoading}
                className={cn(
                  'w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm',
                  'flex items-center justify-center gap-2.5 transition-all shadow-lg',
                  isLoading
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                    : isEditMode
                      ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/30'
                      : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/30'
                )}
              >
                <ShoppingCart size={18} strokeWidth={2.5} />
                {btnLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
