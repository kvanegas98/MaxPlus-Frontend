import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Tag,
  ImageOff,
  ChevronRight,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CatalogListSkeleton } from '../../components/ui/Skeleton';
import { serviceTypeService } from '../../services/serviceTypeService';
import { useAuthContext } from '../../context/AuthContext';

// Categorías fijas del API
const CATEGORIES = [
  { id: 'Paid', name: 'Suscripciones IPTV' },
  { id: 'Demo', name: 'Demos Gratuitas' },
];

// ─── helpers ───────────────────────────────────────────────────────────────────
const formatPrice = (p) =>
  new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO', minimumFractionDigits: 2 }).format(p);

// ─── Availability Badge ─────────────────────────────────────────────────────────
function AvailabilityBadge({ available }) {
  const isAvailable = available !== false;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide',
      isAvailable
        ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-1 ring-violet-200 dark:ring-violet-700/50'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-600'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isAvailable ? 'bg-violet-500' : 'bg-slate-400')} />
      {isAvailable ? 'Disponible' : 'Pausado'}
    </span>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────────
function ProductCard({ product, categoryName, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-shadow duration-200 flex flex-col"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-700 overflow-hidden">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={28} className="text-slate-300" />
          </div>
        )}

        {/* Hover actions overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent
                     flex items-end justify-end gap-2 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <button
            onClick={() => onEdit(product)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl shadow-lg hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all"
          >
            <Pencil size={12} />
            Editar
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="flex items-center justify-center w-7 h-7 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 active:scale-95 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </motion.div>

        {/* Category chip */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium rounded-lg">
            {categoryName}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 flex-1">
            {product.name}
          </h3>
        </div>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-base font-bold text-violet-700">{formatPrice(product.price)}</span>
          <AvailabilityBadge available={product.isActive} />
        </div>
      </div>

      {/* Mobile tap actions (always visible, below hover overlay on mobile) */}
      <div className="md:hidden flex border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Pencil size={13} />
          Editar
        </button>
        <div className="w-px bg-slate-100 dark:bg-slate-700" />
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={13} />
          Eliminar
        </button>
      </div>
    </motion.div>
  );
}

// ─── Category Row ───────────────────────────────────────────────────────────────
function CategoryRow({ category, productCount, isSelected, onClick, onEdit }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      onClick={() => onClick(category.id)}
      className={cn(
        'group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150',
        isSelected
          ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-300'
          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
      )}
    >
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors',
        isSelected ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
      )}>
        <Tag size={14} className={isSelected ? 'text-violet-600' : 'text-slate-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{category.name}</p>
        <p className="text-[11px] text-slate-400">{productCount} productos</p>
      </div>
      {isSelected
        ? <ChevronRight size={15} className="text-violet-500 shrink-0" />
        : (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(category); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 transition-all"
          >
            <Pencil size={13} />
          </button>
        )
      }
    </motion.div>
  );
}

// ─── Mobile Tab Button ──────────────────────────────────────────────────────────
function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors duration-200',
        active ? 'text-violet-700 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      )}
    >
      <Icon size={15} />
      {label}
      {count !== undefined && (
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          active ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
        )}>
          {count}
        </span>
      )}
      {active && (
        <motion.span
          layoutId="catalog-tab-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t-full"
        />
      )}
    </button>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

// ─── CatalogManager ─────────────────────────────────────────────────────────────
export function CatalogManager({ onOpenProductForm }) {
  const { token } = useAuthContext();
  const [products,   setProducts]   = useState([]);
  const categories = CATEGORIES;
  const [loading,    setLoading]    = useState(true);
  const [apiError,   setApiError]   = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // null = all
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState('products'); // 'products' | 'categories'

  // ── Cargar datos desde el backend ─────────────────────────────────────────
  const fetchData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setApiError('');
    serviceTypeService.getAll(token)
      .then((data) => setProducts(data ?? []))
      .catch((err) => setApiError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Pull-to-refresh (mobile gesture from AppShell)
  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('pull-refresh', handler);
    return () => window.removeEventListener('pull-refresh', handler);
  }, [fetchData]);

  // ─ Filter products
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) list = list.filter((p) => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedCategory, searchQuery]);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Desactivar este servicio?')) return;
    try {
      await serviceTypeService.remove(id, token);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setApiError(err.message);
    }
  };

  const handleEditProduct = (product) => {
    onOpenProductForm?.(product, fetchData);
  };

  const productCountFor = (catId) => products.filter((p) => p.category === catId).length;

  // ─── Header ─────────────────────────────────────────────────────────────────
  const Header = (
    <div className="flex flex-col gap-3 p-4 md:p-6">
      {/* API error banner */}
      {apiError && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl text-xs text-red-700 dark:text-red-400">
          <AlertCircle size={13} className="shrink-0" />
          {apiError}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
            <Layers size={18} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Catálogo</h2>
            <p className="text-[11px] text-slate-400">
              {products.length} servicios · {categories.length} categorías
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenProductForm?.(null, fetchData)}
            className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 active:scale-95 shadow-sm transition-all"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nuevo Servicio</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
        />
      </div>
    </div>
  );

  // ─── Category filter pills (desktop) ────────────────────────────────────────
  const CategoryPills = (
    <div className="flex flex-wrap gap-1.5 px-4 md:px-6 pb-3">
      {[{ id: null, name: 'Todos' }, ...categories].map((cat) => (
        <button
          key={cat.id ?? 'all'}
          onClick={() => setSelectedCategory(cat.id)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150',
            selectedCategory === cat.id
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-600 hover:text-violet-700 dark:hover:text-violet-400'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );

  // ─── Products grid ───────────────────────────────────────────────────────────
  const ProductsGrid = (
    <div className="p-4 md:px-6 md:py-4">
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin productos"
          description="Agrega tu primer producto al catálogo"
          action={
            <button
              onClick={() => onOpenProductForm?.(null)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all"
            >
              <Plus size={15} />
              Nuevo Producto
            </button>
          }
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => {
              const cat = CATEGORIES.find((c) => c.id === product.category);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={cat?.name ?? product.category ?? 'Sin categoría'}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );

  // ─── Categories list ─────────────────────────────────────────────────────────
  const CategoriesList = (
    <div className="p-3 space-y-0.5">
      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Sin categorías"
          description="Crea categorías para organizar tus productos"
        />
      ) : (
        <AnimatePresence>
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              productCount={productCountFor(cat.id)}
              isSelected={selectedCategory === cat.id}
              onClick={(id) => setSelectedCategory((prev) => (prev === id ? null : id))}
              onEdit={() => {}}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );

  if (loading) {
    return <CatalogListSkeleton count={8} />;
  }

  return (
    <div className="h-full">
      {Header}

      {/* ── DESKTOP: two-column layout ──────────────────────────────────────── */}
      <div className="hidden md:flex gap-0 h-[calc(100%-9rem)]">
        {/* Left: Category sidebar */}
        <div className="w-56 lg:w-64 shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto scrollbar-hide">
          <div className="px-3 pt-1 pb-2">
            <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categorías</p>
          </div>
          <div
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'mx-3 flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 mb-1',
              selectedCategory === null
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-300'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'
            )}
          >
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
              selectedCategory === null ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-slate-100 dark:bg-slate-700'
            )}>
              <Package size={14} className={selectedCategory === null ? 'text-violet-600' : 'text-slate-500'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Todos</p>
              <p className="text-[11px] text-slate-400">{products.length} productos</p>
            </div>
          </div>
          {CategoriesList}

        </div>

        {/* Right: Products grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {CategoryPills}
          {ProductsGrid}
        </div>
      </div>

      {/* ── MOBILE: tabbed layout ───────────────────────────────────────────── */}
      <div className="md:hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-4">
          <TabButton
            active={mobileTab === 'products'}
            onClick={() => setMobileTab('products')}
            icon={Package}
            label="Productos"
            count={products.length}
          />
          <TabButton
            active={mobileTab === 'categories'}
            onClick={() => setMobileTab('categories')}
            icon={Tag}
            label="Categorías"
            count={categories.length}
          />
        </div>

        <AnimatePresence mode="wait">
          {mobileTab === 'products' ? (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {CategoryPills}
              {ProductsGrid}
            </motion.div>
          ) : (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-2"
            >
              {CategoriesList}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
