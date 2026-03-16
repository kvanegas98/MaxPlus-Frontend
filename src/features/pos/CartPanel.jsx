import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, Receipt, ShoppingBag, MessageSquare, X, SlidersHorizontal } from 'lucide-react';
import { cn, fmtCRD } from '../../lib/utils';
import { OrderTypeSelector } from './OrderTypeSelector';
import { ModifierModal } from './ModifierModal';
import { useAuthContext } from '../../context/AuthContext';
// import { productService } from '../../services/productService';

// Normalize API response fields (name/price or nombre/precio)
function normalizeModifiers(mods) {
  return mods.map((m) => ({
    ...m,
    nombre:      m.nombre ?? m.name ?? '',
    precio:      m.precio ?? m.price ?? 0,
    isAvailable: m.isAvailable ?? true,
  }));
}

// ─── Cart item row ─────────────────────────────────────────────────────────────
function CartItem({ item, onUpdateQty, onRemove, onSaveNote, onEditModifiers, onRemoveModifier }) {
  const [noteOpen,   setNoteOpen]   = useState(false);
  const [noteDraft,  setNoteDraft]  = useState(item.note ?? '');
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft,   setQtyDraft]   = useState('');

  const startEditQty = () => {
    setQtyDraft(String(item.quantity));
    setEditingQty(true);
  };

  const commitQty = () => {
    const n = parseInt(qtyDraft, 10);
    setEditingQty(false);
    if (isNaN(n) || n === item.quantity) return;
    if (n <= 0) { onRemove(); return; }
    onUpdateQty(n - item.quantity);
  };

  const hasNote = Boolean(item.note?.trim());
  const hasMods = (item.selectedModifiers?.length ?? 0) > 0;

  const handleSaveNote = () => {
    onSaveNote(noteDraft);
    if (!noteDraft.trim()) setNoteOpen(false);
  };

  const handleClearNote = () => {
    setNoteDraft('');
    onSaveNote('');
    setNoteOpen(false);
  };

  const toggleNote = () => {
    if (!noteOpen) setNoteDraft(item.note ?? '');
    setNoteOpen((v) => !v);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, blockSize: 0 }}
      className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-3">
        {/* Top: Name and Total Price per item group */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
             <p className="text-sm font-black text-slate-800 dark:text-white leading-tight font-display uppercase tracking-tight line-clamp-2">
               {item.name}
             </p>
             {!hasNote && (
               <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                 {item.quantity} x C$ {fmtCRD(item.price)}
               </p>
             )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-base font-black text-slate-900 dark:text-white font-display">
              C$ {(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Middle: Modifier chips */}
        {hasMods && (
          <div className="flex flex-wrap gap-1.5">
            {item.selectedModifiers.map((m) => {
              const qty = m.quantity ?? 1;
              return (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 text-[9px] font-black text-violet-800 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-lg border border-violet-100 dark:border-violet-700/40 shadow-sm"
                >
                  {qty > 1 && <span className="text-violet-500">×{qty}</span>}
                  {m.nombre ?? m.name}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveModifier?.(m.id); }}
                    className="w-4 h-4 flex items-center justify-center rounded-md bg-white dark:bg-violet-800 text-slate-300 hover:text-red-500 transition-colors ml-0.5 shadow-sm border border-slate-100 dark:border-slate-700"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Note preview if any */}
        {hasNote && (
          <p className="text-[10px] text-amber-700 font-bold italic bg-amber-50/50 dark:bg-amber-900/10 px-3 py-1.5 rounded-xl border border-amber-100/50 dark:border-amber-900/30">
            "{item.note}"
          </p>
        )}

        {/* Bottom Actions Row: Qty Stepper and Tools */}
        <div className="flex items-center justify-between pt-1 gap-4">
          {/* Enhanced Qty Stepper */}
          <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-1 shadow-inner">
            <button
              onClick={() => onUpdateQty(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-red-500 active:scale-90 transition-all shadow-sm"
            >
              <Minus size={16} strokeWidth={3} />
            </button>

            {editingQty ? (
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                min="0"
                max="99"
                value={qtyDraft}
                onChange={(e) => setQtyDraft(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={commitQty}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')  { e.preventDefault(); commitQty(); }
                  if (e.key === 'Escape') setEditingQty(false);
                }}
                className="w-10 h-10 text-center text-sm font-black text-slate-900 dark:text-white font-display bg-white dark:bg-slate-700 border-2 border-violet-400 rounded-xl focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none shadow-sm"
              />
            ) : (
              <span
                onClick={startEditQty}
                className="w-8 text-center text-sm font-black text-slate-900 dark:text-white font-display cursor-pointer select-none"
              >
                {item.quantity}
              </span>
            )}

            <button
              onClick={() => onUpdateQty(1)}
              className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-700 rounded-xl text-violet-600 hover:shadow-md active:scale-90 transition-all border border-slate-100 dark:border-slate-600 shadow-sm"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEditModifiers}
              title="Ajustar extras"
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-violet-600 shadow-sm border border-slate-200/50 dark:border-slate-700 transition-all active:scale-90"
            >
              <SlidersHorizontal size={14} strokeWidth={2.5} />
            </button>
            <button
              onClick={toggleNote}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-2xl transition-all shadow-sm border active:scale-90',
                hasNote
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-amber-200 dark:border-amber-900/50'
                  : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200/50 dark:border-slate-700 hover:text-slate-600 dark:hover:text-slate-200'
              )}
            >
              <MessageSquare size={14} strokeWidth={noteOpen ? 2.5 : 2} />
            </button>
            <button
              onClick={onRemove}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-200 hover:text-red-500 shadow-sm border border-slate-200/50 dark:border-slate-700 transition-all active:scale-90"
            >
              <Trash2 size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Note input (animated) ──────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {noteOpen && (
          <motion.div
            initial={{ blockSize: 0, opacity: 0 }}
            animate={{ blockSize: 'auto', opacity: 1 }}
            exit={{ blockSize: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <MessageSquare size={14} className="text-amber-500 shrink-0" />
              <input
                autoFocus
                type="text"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onBlur={handleSaveNote}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSaveNote(); }
                  if (e.key === 'Escape') { setNoteOpen(false); }
                }}
                placeholder="Ej. Sin cebolla..."
                className="flex-1 text-xs bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
              />
              {noteDraft && (
                <button onClick={handleClearNote} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── CartPanel ─────────────────────────────────────────────────────────────────
export function CartPanel({
  cartItems, updateQuantity, removeFromCart, clearCart, total, subtotal, deliveryFee,
  onCheckoutDone, onRequestCheckout, addItemNote,
  updateCartItemModifiers,
  orderType, orderInfo, onOrderTypeChange, onOrderInfoChange,
  paymentType, onPaymentTypeChange, selectedCustomer, onCustomerSelect,
  settings, clientes,
  hideHeader,
}) {
  const { token } = useAuthContext();
  const itemCount  = cartItems.reduce((s, i) => s + i.quantity, 0);

  // Local modifier cache for edit flow: { [productId]: Modifier[] }
  const [modCache,   setModCache]   = useState({});
  // Edit modal state
  const [editOpen,   setEditOpen]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);   // cart item being edited
  const [editMods,   setEditMods]   = useState(null);   // null = loading

  const handleEditModifiers = async (item) => {
    setEditItem(item);
  };

  const handleEditConfirm = (newModifiers) => {
    if (!editItem) return;
    updateCartItemModifiers?.(editItem.cartItemId, newModifiers);
    setEditOpen(false);
    setEditItem(null);
    setEditMods(null);
  };

  const handleRemoveModifier = (item, modifierId) => {
    const newMods = (item.selectedModifiers ?? []).filter((m) => m.id !== modifierId);
    updateCartItemModifiers?.(item.cartItemId, newMods);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditItem(null);
    setEditMods(null);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    onRequestCheckout?.();
    onCheckoutDone?.();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 w-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {!hideHeader && (
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-slate-500 dark:text-slate-400" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Orden Actual</h2>
            {itemCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-violet-100 text-violet-700 text-[11px] font-bold rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          {itemCount > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={12} />
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* ── Order type selector ─────────────────────────────────────────────── */}
      {onOrderTypeChange && (
        <OrderTypeSelector
          orderType={orderType}
          orderInfo={orderInfo}
          onTypeChange={onOrderTypeChange}
          onInfoChange={onOrderInfoChange}
          paymentType={paymentType}
          onPaymentTypeChange={onPaymentTypeChange}
          selectedCustomer={selectedCustomer}
          onCustomerSelect={onCustomerSelect}
          settings={settings}
          clientes={clientes}
        />
      )}

      {/* ── Cart items ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
        <AnimatePresence initial={false}>
          {cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full min-h-[120px] text-slate-400 gap-2 pt-8"
            >
              <Receipt size={36} className="opacity-20" />
              <p className="text-sm">La orden está vacía</p>
            </motion.div>
          ) : (
            cartItems.map((item) => (
              <CartItem
                key={item.cartItemId}
                item={item}
                onUpdateQty={(delta) => updateQuantity(item.cartItemId, delta)}
                onRemove={() => removeFromCart(item.cartItemId)}
                onSaveNote={(note) => addItemNote?.(item.cartItemId, note)}
                onEditModifiers={() => handleEditModifiers(item)}
                onRemoveModifier={(modId) => handleRemoveModifier(item, modId)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Checkout footer ──────────────────────────────────────────────── */}
      <div className="shrink-0 glass-dark bg-slate-900/95 p-6 space-y-5 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] rounded-t-[3rem] relative z-20">
        <div className="space-y-3">
          {cartItems.length > 0 && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                <ShoppingBag size={12} /> {itemCount} Items
              </span>
              <span className="bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                Subtotal: C$ {fmtCRD(subtotal || total)}
              </span>
            </div>
          )}
          {orderType === 'delivery' && deliveryFee > 0 && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-orange-400">
               <span className="px-3 py-1">
                 Costo Delivery
               </span>
               <span className="bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-700/50">
                 + C$ {fmtCRD(deliveryFee)}
               </span>
            </div>
          )}
          <div className="flex items-end justify-between py-1">
            <span className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] font-display">Total a Pagar</span>
            <div className="text-right">
              <motion.p
                key={total}
                initial={{ scale: 1.1, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black tracking-tighter text-white font-display leading-none"
              >
                C$ {fmtCRD(total)}
              </motion.p>
              <p className="text-[10px] font-bold text-violet-400 mt-1 uppercase tracking-widest leading-none">Orden Lista para cobrar</p>
            </div>
          </div>
        </div>

        <button
          disabled={cartItems.length === 0}
          onClick={handleCheckout}
          className={cn(
            'w-full h-16 rounded-[1.75rem] text-sm font-black uppercase tracking-[0.15em] transition-all duration-400 font-display',
            'shadow-2xl active:scale-[0.97] flex items-center justify-center gap-3',
            cartItems.length > 0
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/30'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none border border-slate-700'
          )}
        >
          {cartItems.length === 0 ? 'Vacío' : (
            <>
              Confirmar Venta <Receipt size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>

      {/* ── Edit modifiers modal ─────────────────────────────────────────── */}
      <ModifierModal
        isOpen={editOpen}
        product={editItem}
        modifiers={editMods}
        onConfirm={handleEditConfirm}
        onClose={handleEditClose}
        initialSelected={editItem?.selectedModifiers ?? []}
        confirmLabel="Actualizar Extras"
      />
    </div>
  );
}
