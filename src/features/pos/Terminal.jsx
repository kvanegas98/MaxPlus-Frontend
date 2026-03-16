import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X } from 'lucide-react';
import { usePosCart } from "../../hooks/usePosCart";
import { useSettings } from "../../hooks/useSettings";
import { useClientes } from "../../hooks/useClientes";
import { PosGrid } from "./PosGrid";
import { CartPanel } from "./CartPanel";
import { CheckoutModal } from "./CheckoutModal";
import { cn, fmtCRD } from '../../lib/utils';
// import { posService, TIPO_ORDEN, METODO_PAGO } from '../../services/posService';
const TIPO_ORDEN = { venta: 'Venta' };
const METODO_PAGO = { efectivo_crd: 'Efectivo C$', efectivo_usd: 'USD', transferencia: 'Transferencia' };
import { useAuthContext } from '../../context/AuthContext';

// ─── Mobile cart bottom sheet ────────────────────────────────────────────────
function MobileCartSheet({ isOpen, onClose, cartProps, onRequestCheckout }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 md:hidden"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/98 backdrop-blur-2xl rounded-t-[2.5rem] shadow-2xl border-t border-slate-200/50 dark:border-slate-700/50"
            style={{ maxBlockSize: '92dvh' }}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-full" />
              <span className="text-base font-black text-slate-900 dark:text-white font-display tracking-tight">Tu Orden</span>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto scrollbar-hide px-2" style={{ maxBlockSize: 'calc(92dvh - 72px)' }}>
              <CartPanel
                {...cartProps}
                onCheckoutDone={onClose}
                onRequestCheckout={onRequestCheckout}
                hideHeader
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Mobile floating cart bar ────────────────────────────────────────────────
function MobileCartBar({ cartItems, total, onClick }) {
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  if (itemCount === 0) return null;

  const lastItem = cartItems[cartItems.length - 1];

  return (
    <motion.div
      initial={{ y: 100, scale: 0.9, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ y: 100, scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 180 }}
      className="md:hidden fixed bottom-[90px] left-4 right-4 z-30"
    >
      <button
        onClick={onClick}
        className="glass w-full flex items-center justify-between px-5 py-4 bg-slate-900 text-white rounded-[2rem] shadow-2xl shadow-slate-900/40 active:scale-[0.98] transition-all border border-white/10"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative shrink-0 w-11 h-11 bg-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <ShoppingCart size={22} className="text-white" />
            <motion.span
              key={itemCount}
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 bg-white text-violet-700 text-[11px] font-black rounded-full shadow-md"
            >
              {itemCount}
            </motion.span>
          </div>
          <div className="text-left truncate">
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-none">Mi Orden</p>
             <p className="text-sm font-black font-display mt-0.5 truncate uppercase">
               {lastItem ? `+ ${lastItem.name}` : 'REVISAR PEDIDO'}
             </p>
          </div>
        </div>
        <div className="text-right shrink-0 border-l border-white/10 pl-4">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-none mb-0.5">Total</p>
          <p className="text-lg font-black font-display text-violet-400 leading-tight">C$ {fmtCRD(total)}</p>
        </div>
      </button>
    </motion.div>
  );
}

// ─── Terminal ────────────────────────────────────────────────────────────────
export function Terminal() {
  const { token } = useAuthContext();
  const {
    cartItems, addToCart, updateQuantity, removeFromCart, addItemNote,
    updateCartItemModifiers,
    clearCart, resetOrder, total,
    orderType, setOrderType, orderInfo, updateOrderInfo,
    selectedCustomer, setSelectedCustomer,
  } = usePosCart();

  const { settings }  = useSettings(token);
  const { clientes }  = useClientes();
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [checkoutOpen,  setCheckoutOpen]  = useState(false);
  const [saleError,     setSaleError]     = useState('');
  const [saleLoading,   setSaleLoading]   = useState(false);

  const handleRequestCheckout = () => {
    setCartSheetOpen(false);
    setCheckoutOpen(true);
  };

  const handleConfirmPayment = async (paymentData) => {
    setSaleError('');
    setSaleLoading(true);

    try {
      // ── Armar items ────────────────────────────────────────────────────────
      const details = cartItems.map((i) => ({
        productId:      i.id,
        quantity:       i.quantity,
        unitPrice:      i.basePrice ?? i.price,
        discountAmount: 0,
        nota:           i.note ?? '',
        modifiers:      (i.selectedModifiers ?? []).map(
          (m) => ({ id: m.id, cantidad: m.quantity ?? 1 })
        ),
      }));

      // ── Armar payload (solo contado, sin crédito ni delivery) ──────────────
      const payload = {
        orderType:     TIPO_ORDEN[orderType] ?? 'Venta',
        paymentType:   'Contado',
        paymentMethod: METODO_PAGO[paymentData.method] ?? 'Efectivo',
        nota:          paymentData.orderNote ?? '',
        details,
        customerName:  orderInfo.customerName ?? '',
        phone:         orderInfo.phone ?? '',
        ...(selectedCustomer ? { customerId: selectedCustomer.id } : {}),
        ...(paymentData.subscriptionId ? { subscriptionId: paymentData.subscriptionId } : {}),
      };

      // const result = await posService.processSale(payload, token);
      console.log('Dummy Process Sale');
      const result = { success: true };
      return result;
    } catch (err) {
      setSaleError(err.message);
      return null;
    } finally {
      setSaleLoading(false);
    }
  };

  const handleNewOrder = () => {
    resetOrder();
    setCheckoutOpen(false);
  };

  // Props compartidas para todas las instancias de CartPanel
  const cartProps = {
    cartItems, updateQuantity, removeFromCart, clearCart, total,
    addItemNote, updateCartItemModifiers,
    orderType, orderInfo,
    onOrderTypeChange: setOrderType,
    onOrderInfoChange: updateOrderInfo,
    selectedCustomer,
    onCustomerSelect: setSelectedCustomer,
    settings,
    clientes,
  };

  return (
    <>
      {/* ── LAYOUT ───────────────────────────────────────────────────────── */}
      <div className="flex h-full w-full overflow-hidden bg-slate-50/50 text-slate-900">
        <div className={cn('flex-1 h-full min-w-0', 'md:max-w-[75%] md:shrink-0')}>
          <PosGrid
            onAddToCart={addToCart}
            cartItems={cartItems}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />
        </div>
        <div className="hidden md:flex md:w-[25%] h-full shrink-0 border-l border-slate-200/60 shadow-[0_0_40px_rgba(0,0,0,0.03)] z-10 glass rounded-l-[3rem]">
          <CartPanel {...cartProps} onRequestCheckout={handleRequestCheckout} />
        </div>
      </div>

      {/* ── MOBILE CART ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!cartSheetOpen && (
          <MobileCartBar
            cartItems={cartItems} total={total}
            onClick={() => setCartSheetOpen(true)}
          />
        )}
      </AnimatePresence>

      <MobileCartSheet
        isOpen={cartSheetOpen}
        onClose={() => setCartSheetOpen(false)}
        cartProps={cartProps}
        onRequestCheckout={handleRequestCheckout}
      />

      {/* ── CHECKOUT MODAL ───────────────────────────────────────────────── */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cartItems}
        total={total}
        orderType={orderType}
        orderInfo={orderInfo}
        customerProp={selectedCustomer}
        onConfirm={handleConfirmPayment}
        onNewOrder={handleNewOrder}
        tasaCambio={settings.exchangeRateUSD}
        settings={settings}
        clientes={clientes}
        loading={saleLoading}
        apiError={saleError}
      />
    </>
  );
}
