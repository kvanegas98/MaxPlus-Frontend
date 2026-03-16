import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { ScrollArea } from "../../components/ui/ScrollArea";
import { ProductGridSkeleton } from "../../components/ui/Skeleton";
import { useMenu } from "../../hooks/useMenu";
import { useAuthContext } from "../../context/AuthContext";
 // import { productService } from "../../services/productService";
import { ModifierModal } from "./ModifierModal";
import { cn } from "../../lib/utils";

// ─── Gradient palettes for product image placeholders ────────────────────────
const CARD_BG = [
  'from-orange-100 to-amber-50',
  'from-violet-100 to-purple-50',
  'from-blue-100 to-indigo-50',
  'from-rose-100 to-pink-50',
  'from-violet-100 to-purple-50',
  'from-cyan-100 to-sky-50',
  'from-amber-100 to-yellow-50',
  'from-fuchsia-100 to-pink-50',
];

function strHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ─── Quantity stepper shown on card when qty > 0 ─────────────────────────────
function CardStepper({ qty, onDecrement, onIncrement, onSetQty }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft(String(qty));
    setEditing(true);
  };

  const commitEdit = () => {
    const n = parseInt(draft, 10);
    setEditing(false);
    if (isNaN(n) || n === qty) return;
    onSetQty(n);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="flex items-center bg-violet-600 rounded-xl overflow-hidden shadow-md shadow-violet-600/30"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onDecrement}
        className="flex items-center justify-center w-7 h-7 text-white hover:bg-violet-700 active:bg-violet-800 transition-colors"
      >
        <Minus size={13} strokeWidth={3} />
      </button>

      {editing ? (
        <input
          autoFocus
          type="number"
          inputMode="numeric"
          min="0"
          max="99"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-9 text-center text-sm font-black text-violet-900 bg-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <motion.span
          key={qty}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.14 }}
          onClick={startEdit}
          title="Click para editar"
          className="w-6 text-center text-sm font-black text-white cursor-pointer select-none hover:bg-violet-700 transition-colors"
        >
          {qty}
        </motion.span>
      )}

      <button
        onClick={onIncrement}
        className="flex items-center justify-center w-7 h-7 text-white hover:bg-violet-700 active:bg-violet-800 transition-colors"
      >
        <Plus size={13} strokeWidth={3} />
      </button>
    </motion.div>
  );
}

// ─── "Add" pill shown when qty = 0 ───────────────────────────────────────────
function AddButton({ onClick }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      whileTap={{ scale: 0.88 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center justify-center w-7 h-7 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md shadow-violet-600/30 transition-colors"
    >
      <Plus size={15} strokeWidth={3} />
    </motion.button>
  );
}

// ─── PosGrid ─────────────────────────────────────────────────────────────────
export function PosGrid({ onAddToCart, cartItems = [], updateQuantity, removeFromCart }) {
  const { token } = useAuthContext();
  const { categories, selectedCategory, setSelectedCategory, products: allProducts, loading } = useMenu();
  const [searchQuery, setSearchQuery] = useState('');

  // Modifier fetching cache: { [productId]: Modifier[] }
  // null = currently fetching; [] = fetched but empty; [...] = has modifiers
  const [modifiersCache, setModifiersCache] = useState({});

  // Modifier modal state
  const [modifierProduct, setModifierProduct]   = useState(null);  // product pending modifier selection
  const [modifierList,    setModifierList]       = useState(null);  // null = loading, [] = none
  const [modifierModalOpen, setModifierModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase().trim();
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [allProducts, searchQuery]);

  // Total qty across all lines for a product (badge display)
  const getQty = useCallback((productId) =>
    cartItems.filter((i) => i.id === productId).reduce((s, i) => s + i.quantity, 0),
    [cartItems]
  );

  // True only when we've confirmed the product has modifiers
  const hasModifiers = (productId) =>
    Array.isArray(modifiersCache[productId]) && modifiersCache[productId].length > 0;

  // Find the single cart line for a no-modifier product
  const getSimpleCartItem = (productId) =>
    cartItems.find((i) => i.id === productId && !(i.selectedModifiers?.length));

  const openModifierModal = (product, modifiers) => {
    setModifierProduct(product);
    setModifierList(modifiers);
    setModifierModalOpen(true);
  };

  // Normalize API response: backend may return name/price or nombre/precio
  const normalizeModifiers = (mods) =>
    mods.map((m) => ({
      ...m,
      nombre: m.nombre ?? m.name ?? '',
      precio: m.precio ?? m.price ?? 0,
    }));

  const handleAddClick = async (product) => {
    if (!product.isAvailable) return;
    onAddToCart(product, []);
  };

  const handleModifierConfirm = (selectedModifiers) => {
    if (!modifierProduct) return;
    setModifierModalOpen(false);
    onAddToCart(modifierProduct, selectedModifiers);
    setModifierProduct(null);
    setModifierList(null);
  };

  const handleModifierClose = () => {
    setModifierModalOpen(false);
    setModifierProduct(null);
    setModifierList(null);
  };

  const handleDecrement = (product) => {
    if (hasModifiers(product.id)) {
      // Multiple modifier lines: remove the last one added
      const lines = cartItems.filter((i) => i.id === product.id);
      if (!lines.length) return;
      const last = lines[lines.length - 1];
      if (last.quantity <= 1) removeFromCart(last.cartItemId);
      else updateQuantity(last.cartItemId, -1);
    } else {
      const item = getSimpleCartItem(product.id);
      if (!item) return;
      if (item.quantity <= 1) removeFromCart(item.cartItemId);
      else updateQuantity(item.cartItemId, -1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* ── Search & Filter Bar ────────────────────────────────────────── */}
      <div className="shrink-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-20 overflow-hidden">
        <div className="px-4 pt-4 pb-0 md:hidden">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-violet-500 transition-colors" />
            <input
              type="text"
              placeholder="¿QUÉ DESEA EL CLIENTE?..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-100/50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-violet-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 dark:text-white"
            />
          </div>
        </div>

        <div className="relative">
          <ScrollArea>
            <div className="flex gap-3 px-4 py-4 snap-x snap-mandatory overflow-x-auto scrollbar-hide">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'shrink-0 h-11 md:h-10 px-6 md:px-5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 font-display snap-center',
                      isActive
                        ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/40 scale-105 ring-2 ring-violet-500/20'
                        : 'bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50/50 dark:hover:bg-slate-700/50 dark:hover:text-violet-400'
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-10 opacity-0 md:group-hover:opacity-100 transition-opacity" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-10 opacity-0 md:group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* ── Product grid ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6">
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => {
              const qty    = getQty(product.id);
              const inCart = qty > 0;
              const withMods = hasModifiers(product.id);

              return (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  onClick={() => product.isAvailable && handleAddClick(product)}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-[2.5rem] border bg-white dark:bg-slate-800 text-left',
                    'transition-all duration-500 select-none pb-1 md:pb-0',
                    product.isAvailable
                      ? 'border-slate-100 dark:border-slate-700 hover:border-violet-200 hover:shadow-[0_22px_50px_-12px_rgba(16,185,129,0.15)] active:scale-[0.97] cursor-pointer'
                      : 'border-slate-100 dark:border-slate-700 opacity-50 grayscale cursor-not-allowed',
                    inCart && 'border-violet-400/30 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.1)] bg-violet-50/10'
                  )}
                >
                  {/* Product image */}
                  <div className="relative w-full aspect-square md:aspect-[4/3] bg-slate-100/50 dark:bg-slate-700/50 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className={cn('w-full h-full flex items-center justify-center bg-gradient-to-br', CARD_BG[strHash(product.name) % CARD_BG.length])}>
                        <span className="text-5xl select-none filter drop-shadow-sm opacity-40">🍽️</span>
                      </div>
                    )}

                    {/* Unavailable overlay */}
                    {!product.isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white bg-slate-900/80 px-3 py-1 rounded-full border border-white/20">
                          Agotado
                        </span>
                      </div>
                    )}

                    {/* In-cart badge (top-left) */}
                    <AnimatePresence>
                      {inCart && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="absolute top-4 left-4 flex items-center justify-center min-w-[32px] h-8 px-2 bg-slate-900 text-white text-[10px] font-black rounded-2xl shadow-xl shadow-slate-900/20 border border-white/10 z-10"
                        >
                          {qty}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Modifier indicator badge (top-right) */}
                    {withMods && (
                      <span className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full border border-violet-200/50 z-10">
                        + Extras
                      </span>
                    )}
                  </div>

                  {/* Info row: name + stepper/add-button */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 md:p-5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80 leading-none mb-1.5 truncate">
                        {categories.find(c => c.id === selectedCategory)?.name || 'Producto'}
                      </p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 font-display uppercase tracking-tight">
                        {product.name}
                      </p>
                      <p className="text-lg font-black text-violet-600 mt-2 font-display">
                        C$ {product.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Stepper / Add button */}
                    {product.isAvailable && (
                      <div className="shrink-0 self-end md:self-center">
                        <AnimatePresence mode="wait">
                          {/* Products with modifiers: always show Add button */}
                          {withMods ? (
                            <AddButton
                              key="add-mods"
                              onClick={() => handleAddClick(product)}
                            />
                          ) : inCart ? (
                            <CardStepper
                              key="stepper"
                              qty={qty}
                              onDecrement={() => handleDecrement(product)}
                              onIncrement={() => handleAddClick(product)}
                              onSetQty={(n) => {
                                const item = getSimpleCartItem(product.id);
                                if (!item) return;
                                if (n <= 0) removeFromCart(item.cartItemId);
                                else updateQuantity(item.cartItemId, n - item.quantity);
                              }}
                            />
                          ) : (
                            <AddButton
                              key="add"
                              onClick={() => handleAddClick(product)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Interactive flash effect */}
                  <div className="absolute inset-0 rounded-[2rem] ring-4 ring-violet-500/0 group-active:ring-violet-500/30 transition-all duration-300 pointer-events-none" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        )}
      </div>

      {/* ── Modifier modal ──────────────────────────────────────────────── */}
      <ModifierModal
        isOpen={modifierModalOpen}
        product={modifierProduct}
        modifiers={modifierList}
        onConfirm={handleModifierConfirm}
        onClose={handleModifierClose}
      />
    </div>
  );
}
