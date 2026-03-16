import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, RefreshCw, User, Phone, CreditCard, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const TYPES = [
  { id: 'venta',      label: 'Nueva Venta',  icon: Tv,        color: 'violet' },
  { id: 'renovacion', label: 'Renovación',   icon: RefreshCw, color: 'orange'  },
];

const INPUT_CLS =
  'flex-1 h-10 px-4 text-xs bg-white/50 dark:bg-slate-700/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl ' +
  'focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-slate-700 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium dark:text-white';

export function OrderTypeSelector({ 
  orderType, orderInfo, onTypeChange, onInfoChange, settings,
  paymentType, onPaymentTypeChange, selectedCustomer, onCustomerSelect, clientes = []
}) {
  const filteredTypes = TYPES;

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  const filteredClientes = customerSearch.trim() 
    ? clientes.filter(c => 
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
        c.phone?.includes(customerSearch)
      )
    : [];


  return (
    <div className="px-4 py-4 border-b border-slate-100/50 dark:border-slate-800/50 space-y-4">
      {/* Payment Mode Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => onPaymentTypeChange('contado')}
          className={cn(
            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
            paymentType === 'contado' 
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          )}
        >
          Contado
        </button>
        <button
          onClick={() => onPaymentTypeChange('credito')}
          className={cn(
            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5",
            paymentType === 'credito' 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          )}
        >
          <CreditCard size={12} />
          Crédito
        </button>
      </div>

      {/* Type pills (Para Llevar / Delivery) */}
      <div className="flex gap-2">
        {filteredTypes.map(({ id, label, icon: Icon, color }) => {
          const active = orderType === id;
          return (
            <button
              key={id}
              onClick={() => onTypeChange(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 font-display',
                active
                  ? color === 'violet' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : color === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              )}
            >
              <Icon size={14} strokeWidth={2.5} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Contextual inputs */}
      <AnimatePresence mode="wait">
        {paymentType === 'credito' ? (
          <motion.div
            key="credito-select"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 relative"
          >
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-800 rounded-2xl px-4 py-3 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate">{selectedCustomer.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5">{selectedCustomer.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onCustomerSelect(null)}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente de crédito..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerResults(true);
                  }}
                  onFocus={() => setShowCustomerResults(true)}
                  className={cn(INPUT_CLS, 'pl-10 focus:border-blue-400')}
                />
                
                {showCustomerResults && customerSearch.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 max-h-48 overflow-y-auto scrollbar-hide py-2">
                    {filteredClientes.length === 0 ? (
                      <p className="text-[10px] font-bold text-slate-400 text-center py-4 uppercase">Sin resultados</p>
                    ) : (
                      filteredClientes.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onCustomerSelect(c);
                            setCustomerSearch('');
                            setShowCustomerResults(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-[10px] font-black">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase truncate">{c.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{c.phone}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {showCustomerResults && (
              <div className="fixed inset-0 z-40" onClick={() => setShowCustomerResults(false)} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key={orderType}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-2.5"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                orderType === 'renovacion'
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400'
                  : 'bg-violet-50 dark:bg-violet-900/20 text-violet-500 dark:text-violet-400'
              )}>
                <User size={16} strokeWidth={2.5} />
              </div>
              <input
                type="text" placeholder="Nombre del cliente (opcional)"
                value={orderInfo.customerName}
                onChange={(e) => onInfoChange({ customerName: e.target.value })}
                className={cn(INPUT_CLS, orderType === 'renovacion' ? 'focus:border-orange-400' : 'focus:border-violet-400')}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                orderType === 'renovacion'
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400'
                  : 'bg-violet-50 dark:bg-violet-900/20 text-violet-500 dark:text-violet-400'
              )}>
                <Phone size={16} strokeWidth={2.5} />
              </div>
              <input
                type="tel" inputMode="tel" placeholder="Teléfono del cliente (opcional)"
                value={orderInfo.phone}
                onChange={(e) => onInfoChange({ phone: e.target.value })}
                className={cn(INPUT_CLS, orderType === 'renovacion' ? 'focus:border-orange-400' : 'focus:border-violet-400')}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
