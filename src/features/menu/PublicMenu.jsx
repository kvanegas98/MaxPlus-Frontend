import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Plus, X, Check, Send,
  Search, MapPin, Clock, Phone, Info,
  Tv2, Wifi, Shield, Zap, Building2, CreditCard,
  ShoppingCart, Trash2, Minus,
} from 'lucide-react';
import { cn, fmtCRD } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { usePublicMenu } from '../../hooks/usePublicMenu';
import { demoService } from '../../services/demoService';
import { orderService } from '../../services/orderService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input';
import PhoneField from '../../components/ui/PhoneField';

// Normaliza un número de teléfono para WhatsApp (siempre con código de país)
function waPhone(raw, defaultCountry = '505') {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return defaultCountry + '77026450'; // fallback admin
  if (digits.startsWith(defaultCountry)) return digits;
  return defaultCountry + digits;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden animate-pulse">
      <div className="h-44 bg-zinc-800" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-zinc-800 rounded-lg w-2/3" />
        <div className="h-3 bg-zinc-800 rounded-lg w-full" />
        <div className="h-3 bg-zinc-800 rounded-lg w-4/5" />
        <div className="h-3 bg-zinc-800 rounded-lg w-3/5" />
        <div className="h-10 bg-zinc-800 rounded-2xl mt-6" />
      </div>
    </div>
  );
}

// ─── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ p, onSelect, addToCart, removeFromCart, inCart, isFeatured }) {
  const isAvailable = p.isActive !== false;

  // Parse description into feature bullets
  const features = p.description
    ? p.description.split(/[,\n•|·]/).map(f => f.trim()).filter(Boolean).slice(0, 5)
    : [];

  return (
    <motion.div
      layout
      whileHover={isAvailable ? { y: -6 } : {}}
      onClick={() => isAvailable && onSelect(p)}
      className={cn(
        'group relative flex flex-col bg-zinc-900 rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer',
        isAvailable
          ? 'border-zinc-800 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10'
          : 'border-zinc-800/50 opacity-50 cursor-not-allowed',
        isFeatured && isAvailable && 'ring-1 ring-violet-500/40 border-violet-500/30',
      )}
    >
      {/* Badges */}
      {isFeatured && isAvailable && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-violet-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-500/40">
          <Star size={9} fill="currentColor" /> Popular
        </div>
      )}

      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5">
        {p.price === 0 ? (
          <span className="bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30">
            Gratis
          </span>
        ) : (
          <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-black ring-1 ring-white/10 shadow-xl">
            C$ {fmtCRD(p.price)}
          </span>
        )}
        {!isAvailable && (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Inactivo
          </span>
        )}
      </div>

      {/* Image / Banner */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-violet-950 via-zinc-900 to-zinc-950 shrink-0">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            onClick={(e) => {
              if (isAvailable) { e.stopPropagation(); onSelect(p, true); }
            }}
            className={cn(
              'w-full h-full object-cover transition-transform duration-700 cursor-zoom-in',
              isAvailable ? 'group-hover:scale-110' : 'scale-105',
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tv2
              size={64}
              className="text-violet-500/20 group-hover:text-violet-500/30 transition-colors duration-500"
              strokeWidth={1}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/10 to-transparent" />

        {/* Live indicator */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">IPTV</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className={cn(
          'text-base font-black mb-3 leading-tight transition-colors font-sans',
          isAvailable ? '!text-white group-hover:!text-violet-300' : '!text-zinc-500',
        )}>
          {p.name}
        </h3>

        {/* Feature list */}
        {features.length > 0 ? (
          <ul className="space-y-2 mb-5 flex-1">
            {features.map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-400 font-medium leading-snug">
                <Check size={12} className="text-violet-400 shrink-0 mt-0.5" strokeWidth={3} />
                {feat}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex-1 mb-5" />
        )}

        {/* Price */}
        <div className="mb-4 flex items-baseline gap-2">
          {p.price > 0 ? (
            <>
              <span className="text-2xl font-black text-white">C$ {fmtCRD(p.price)}</span>
              <span className="text-xs text-zinc-500 font-medium">/ mes</span>
            </>
          ) : (
            <span className="text-xl font-black text-emerald-400">DEMO GRATIS</span>
          )}
        </div>

        {/* CTA */}
        {isAvailable ? (
          p.price === 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(p); }}
              className="w-full py-3.5 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
            >
              <Star size={14} strokeWidth={3} /> Solicitar Demo
            </button>
          ) : inCart ? (
            <div className="flex gap-2">
              <div className="flex-1 py-3.5 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 uppercase tracking-widest">
                <Check size={14} strokeWidth={3} /> En carrito
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFromCart(p.id); }}
                className="w-12 h-12 rounded-2xl bg-zinc-800 hover:bg-red-900/40 hover:text-red-400 text-zinc-500 flex items-center justify-center transition-all border border-zinc-700 hover:border-red-700/50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(p); }}
              className="w-full py-3.5 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest bg-violet-600 text-white hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
            >
              <ShoppingCart size={14} strokeWidth={2.5} /> Agregar al carrito
            </button>
          )
        ) : (
          <div className="w-full py-3.5 rounded-2xl text-[11px] font-black flex items-center justify-center bg-zinc-800 text-zinc-600 cursor-not-allowed uppercase tracking-widest">
            Temporalmente Inactivo
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── ProductDetailModal ────────────────────────────────────────────────────────
function ProductDetailModal({ product, isOpen, onClose, addToCart }) {
  if (!product) return null;

  const features = product.description
    ? product.description.split(/[,\n•|·]/).map(f => f.trim()).filter(Boolean)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="fixed inset-x-0 bottom-0 top-12 sm:top-24 sm:inset-x-auto sm:right-0 sm:w-full sm:max-w-xl bg-zinc-900 z-[111] rounded-t-[3rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-800"
          >
            <div className="relative h-64 sm:h-80 shrink-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => addToCart(null, product.imageUrl)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-950 to-zinc-900 flex items-center justify-center">
                  <Tv2 size={80} className="text-violet-500/30" strokeWidth={1} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-12 h-12 bg-zinc-800/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-xl border border-zinc-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 scrollbar-hide">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white">{product.name}</h2>
                {product.price > 0 ? (
                  <p className="text-2xl font-black text-violet-400">C$ {fmtCRD(product.price)} <span className="text-sm font-medium text-zinc-500">/ mes</span></p>
                ) : (
                  <p className="text-xl font-black text-emerald-400">DEMO GRATIS</p>
                )}
              </div>

              {features.length > 0 && (
                <ul className="space-y-3">
                  {features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 font-medium leading-snug">
                      <Check size={14} className="text-violet-400 shrink-0 mt-0.5" strokeWidth={3} />
                      {feat}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-8 bg-zinc-950 border-t border-zinc-800">
              <button
                onClick={() => { addToCart(product); onClose(); }}
                className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black shadow-xl hover:bg-violet-500 hover:shadow-violet-500/20 transition-all active:scale-95"
              >
                {product.price === 0 ? 'SOLICITAR DEMO' : 'SOLICITAR PLAN'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Demo Request Modal ────────────────────────────────────────────────────────
const demoSchema = z.object({
  customerName:  z.string().min(3, 'Nombre muy corto'),
  customerEmail: z.string().email('Email inválido'),
  customerPhone: z.string().optional().refine(
    v => !v || isValidPhoneNumber(v),
    'Número inválido — verifica el código de país'
  ),
});

function DemoRequestModal({ product, settings, isOpen, onClose }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm({ resolver: zodResolver(demoSchema), mode: 'onChange' });

  if (!product) return null;

  const handleClose = () => {
    setDone(false);
    form.reset();
    onClose();
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await demoService.request({
        customerName:   data.customerName,
        customerEmail:  data.customerEmail,
        customerPhone:  data.customerPhone || undefined,
        tipoServicioId: product.id,
      });

      setDone(true);
      toast.success('¡Solicitud enviada! Nos pondremos en contacto por WhatsApp.');

      if (true) {
        const phone = waPhone(settings?.phone);
        const msg = [
          `🆓 *Nueva Solicitud de Demo*`,
          ``,
          `👤 *Cliente:* ${data.customerName}`,
          data.customerPhone ? `📱 *Teléfono:* ${data.customerPhone}` : '',
          `📧 *Email:* ${data.customerEmail}`,
          `📺 *Plan:* ${product.name}`,
          ``,
          `_Enviado desde el Menú Digital_`,
        ].filter(Boolean).join('\n');
        window.open(`https://api.whatsapp.com/send?phone=${waPhone(settings?.phone)}&text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
      toast.error(err.message || 'Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-full max-w-md bg-zinc-900 z-[151] rounded-[2.5rem] shadow-2xl p-8 overflow-hidden border border-zinc-800"
          >
            {done ? (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Check size={28} className="text-emerald-400" strokeWidth={3} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">¡Solicitud Enviada!</h2>
                  <p className="text-sm text-zinc-400">Tu demo fue solicitada. Te contactaremos por WhatsApp a la brevedad.</p>
                </div>
                <button onClick={handleClose}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20">
                  ENTENDIDO
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 mx-auto mb-4">
                    <Star size={28} fill="currentColor" />
                  </div>
                  <h2 className="text-2xl font-black text-white">Solicitar Demo Gratis</h2>
                  <p className="text-sm text-zinc-400 font-medium">
                    Acceso temporal a <span className="text-violet-400 font-bold">{product.name}</span> sin costo.
                  </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nombre Completo</label>
                    <input
                      {...form.register('customerName')}
                      placeholder="Ej. Juan Pérez"
                      className={cn(
                        'w-full px-6 py-4 bg-zinc-800 border-2 rounded-2xl font-bold outline-none transition-all text-white placeholder:text-zinc-600',
                        form.formState.errors.customerName ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-violet-500',
                      )}
                    />
                    {form.formState.errors.customerName && <p className="text-[10px] text-red-400 font-black ml-4 uppercase">{form.formState.errors.customerName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Correo Electrónico</label>
                    <input
                      {...form.register('customerEmail')}
                      placeholder="ejemplo@correo.com"
                      className={cn(
                        'w-full px-6 py-4 bg-zinc-800 border-2 rounded-2xl font-bold outline-none transition-all text-white placeholder:text-zinc-600',
                        form.formState.errors.customerEmail ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-violet-500',
                      )}
                    />
                    {form.formState.errors.customerEmail && <p className="text-[10px] text-red-400 font-black ml-4 uppercase">{form.formState.errors.customerEmail.message}</p>}
                  </div>
                  <Controller
                    name="customerPhone"
                    control={form.control}
                    render={({ field }) => (
                      <PhoneField
                        dark
                        label="Teléfono / WhatsApp (opcional)"
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.customerPhone?.message}
                        placeholder="8888-0000"
                      />
                    )}
                  />
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={handleClose} className="flex-1 py-4 bg-zinc-800 text-zinc-300 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-zinc-700 hover:bg-zinc-700 transition-all">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20">
                      {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>SOLICITAR <Send size={14} /></>}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Order Request Modal ───────────────────────────────────────────────────────
const orderSchema = z.object({
  customerName:  z.string().min(3, 'Nombre muy corto'),
  customerPhone: z.string().min(1, 'Teléfono requerido').refine(
    v => isValidPhoneNumber(v),
    'Número inválido — verifica el código de país'
  ),
  customerEmail: z.string().email('Email inválido'),
  notes:         z.string().optional(),
});

function OrderRequestModal({ product, settings, isOpen, onClose }) {
  const { toast } = useToast();
  const [submitting,    setSubmitting]    = useState(false);
  const [orderId,       setOrderId]       = useState(null);
  const [numeroOrden,   setNumeroOrden]   = useState(null);

  const form = useForm({ resolver: zodResolver(orderSchema) });

  const handleClose = () => {
    form.reset();
    setOrderId(null);
    onClose();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await orderService.create({
        customerName:   data.customerName,
        customerPhone:  data.customerPhone,
        customerEmail:  data.customerEmail,
        tipoServicioId: product.id,
        notes:          data.notes || '',
      });
      setOrderId(res.id);
      setNumeroOrden(res.numeroOrden || res.id);
      toast.success('¡Orden recibida! Te enviaremos las credenciales por WhatsApp.');

      // Enviar notificación por WhatsApp al negocio con el número de orden
      if (true) {
        const msg = [
          `🛒 *Nueva Orden ${res.numeroOrden || res.id}*`,
          ``,
          `👤 *Cliente:* ${data.customerName}`,
          `📱 *Teléfono:* ${data.customerPhone}`,
          `📧 *Email:* ${data.customerEmail}`,
          `📺 *Plan:* ${product.name} — C$ ${product.price}`,
          data.notes ? `📝 *Nota:* ${data.notes}` : '',
          ``,
          `_Enviado desde el Menú Digital_`,
        ].filter(Boolean).join('\n');
        window.open(`https://api.whatsapp.com/send?phone=${waPhone(settings?.phone)}&text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
      toast.error(err.message || 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const inputCls = (hasErr) => cn(
    'w-full px-6 py-4 bg-zinc-800 border-2 rounded-2xl font-bold outline-none transition-all text-white placeholder:text-zinc-600',
    hasErr ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-violet-500',
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150]" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-full max-w-md bg-zinc-900 z-[151] rounded-[2.5rem] shadow-2xl p-8 overflow-hidden border border-zinc-800"
          >
            {orderId ? (
              // ── Success ──
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Check size={28} className="text-emerald-400" strokeWidth={3} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">¡Solicitud Enviada!</h2>
                  <p className="text-sm text-zinc-400">Tu orden fue registrada. Te enviaremos las credenciales por email cuando sea aprobada.</p>
                </div>
                <div className="bg-zinc-800 rounded-2xl px-6 py-4 border border-zinc-700 space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Número de Orden</p>
                  <p className="text-lg font-black text-violet-400 font-mono">{numeroOrden || orderId}</p>
                </div>
                <p className="text-xs text-zinc-500">La notificación de WhatsApp fue enviada al negocio.</p>
                <button onClick={handleClose}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20">
                  ENTENDIDO
                </button>
              </div>
            ) : (
              // ── Form ──
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Send size={26} className="text-violet-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white">Solicitar Plan</h2>
                  <p className="text-sm text-zinc-400">
                    Completa tus datos para activar <span className="text-violet-400 font-bold">{product.name}</span>.
                  </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Nombre */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nombre Completo</label>
                    <input
                      {...form.register('customerName')}
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      className={inputCls(!!form.formState.errors.customerName)}
                    />
                    {form.formState.errors.customerName && (
                      <p className="text-[10px] text-red-400 font-black ml-4 uppercase">{form.formState.errors.customerName.message}</p>
                    )}
                  </div>

                  {/* Teléfono con bandera */}
                  <Controller
                    name="customerPhone"
                    control={form.control}
                    render={({ field }) => (
                      <PhoneField
                        dark
                        label="Teléfono / WhatsApp"
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.customerPhone?.message}
                        placeholder="8888-0000"
                      />
                    )}
                  />

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Correo Electrónico</label>
                    <input
                      {...form.register('customerEmail')}
                      type="email"
                      placeholder="ejemplo@correo.com"
                      className={inputCls(!!form.formState.errors.customerEmail)}
                    />
                    {form.formState.errors.customerEmail && (
                      <p className="text-[10px] text-red-400 font-black ml-4 uppercase">{form.formState.errors.customerEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nota <span className="text-zinc-600 normal-case">(opcional)</span></label>
                    <textarea
                      {...form.register('notes')}
                      rows={2}
                      placeholder="Alguna indicación especial..."
                      className="w-full px-6 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-2xl font-bold outline-none transition-all text-white placeholder:text-zinc-600 focus:border-violet-500 resize-none text-sm"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button type="button" onClick={handleClose}
                      className="flex-1 py-4 bg-zinc-800 text-zinc-300 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-zinc-700 hover:bg-zinc-700 transition-all">
                      Cancelar
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20">
                      {submitting
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Send size={14} /> SOLICITAR</>}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Image Lightbox ────────────────────────────────────────────────────────────
function ImageLightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-12 cursor-zoom-out"
      >
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-colors border border-white/10"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <X size={24} />
        </motion.button>
        <motion.img
          layoutId={`img-${imageUrl}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          src={imageUrl}
          className="max-w-full max-h-full rounded-3xl shadow-2xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// ─── CartDrawer ────────────────────────────────────────────────────────────────
const cartSchema = z.object({
  customerName:  z.string().min(3, 'Nombre muy corto'),
  customerPhone: z.string().min(1, 'Teléfono requerido').refine(
    v => v && v.replace(/\D/g, '').length >= 8,
    'Número inválido — verifica el código de país'
  ),
  customerEmail: z.string().email('Email inválido'),
  notes:         z.string().optional(),
});

const MONTH_CHIPS = [1, 2, 3, 6, 12, 24];

function Stepper({ value, min = 1, max = 10, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center transition-colors disabled:opacity-30 active:scale-95"
      >
        <Minus size={14} />
      </button>
      <span className="w-7 text-center text-sm font-black text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center transition-colors disabled:opacity-30 active:scale-95"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function CartDrawer({ cart, onRemove, onUpdate, onClear, onClose, settings }) {
  const { toast }               = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(null);
  const [step,       setStep]       = useState('cart'); // 'cart' | 'form'

  const total = cart.reduce((acc, c) => acc + c.product.price * (c.quantity || 1) * (c.durationMonths || 1), 0);

  const form = useForm({ resolver: zodResolver(cartSchema) });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await orderService.create({
        customerName:  data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        notes:         data.notes || '',
        items: cart.map(c => ({
          tipoServicioId: c.product.id,
          cantidad:       c.quantity       || 1,
          durationMonths: c.durationMonths || 1,
        })),
      });

      setSuccess({ numeroOrden: res.numeroOrden || res.id });
      onClear();

      if (true) {
        const lines = cart.map(c =>
          `  • ${c.product.name} — ${c.durationMonths || 1} mes(es) × ${c.quantity || 1} — C$ ${(c.product.price * (c.quantity || 1) * (c.durationMonths || 1)).toFixed(2)}`
        );
        const msg = [
          `🛒 *Nueva Orden Carrito ${res.numeroOrden || res.id}*`,
          ``,
          `👤 *Cliente:* ${data.customerName}`,
          `📱 *Teléfono:* ${data.customerPhone}`,
          `📧 *Email:* ${data.customerEmail}`,
          ``,
          `📺 *Servicios:*`,
          ...lines,
          ``,
          `💰 *Total:* C$ ${total.toFixed(2)}`,
          data.notes ? `📝 *Nota:* ${data.notes}` : '',
          `_Enviado desde el Menú Digital_`,
        ].filter(Boolean).join('\n');
        window.open(`https://api.whatsapp.com/send?phone=${waPhone(settings?.phone)}&text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
      toast.error(err.message || 'Error al enviar la orden');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[140]"
      />

      {/* Sheet — bottom on mobile, right panel on md+ */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 380 }}
        className="fixed bottom-0 left-0 right-0 md:left-auto md:top-0 md:w-[400px] bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 z-[141] flex flex-col shadow-2xl rounded-t-3xl md:rounded-none"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            {step === 'form' && (
              <button
                onClick={() => setStep('cart')}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                <Plus size={16} className="rotate-45" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <ShoppingCart size={14} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">
                {step === 'form' ? 'Tus datos' : 'Tu Carrito'}
              </h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {step === 'form' ? 'Último paso' : `${cart.length} servicio${cart.length !== 1 ? 's' : ''} · C$ ${total.toFixed(2)}`}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {success ? (
            /* ── Success ── */
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 400, delay: 0.1 }}
                className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center"
              >
                <Check size={36} className="text-emerald-400" strokeWidth={2.5} />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">¡Orden Enviada!</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Te contactaremos por WhatsApp con las credenciales una vez aprobada.
                </p>
              </div>
              <div className="w-full bg-zinc-800 rounded-2xl px-6 py-4 border border-zinc-700">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Número de Orden</p>
                <p className="text-xl font-black text-violet-400 font-mono mt-1">{success.numeroOrden}</p>
              </div>
              <button onClick={onClose}
                className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-violet-500 active:scale-[0.98] transition-all">
                Entendido
              </button>
            </motion.div>

          ) : step === 'cart' ? (
            /* ── Cart items ── */
            <motion.div key="cart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col min-h-0">

              <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <ShoppingCart size={48} className="text-zinc-700" />
                    <p className="text-zinc-500 font-bold">Tu carrito está vacío</p>
                    <p className="text-zinc-600 text-xs">Agrega servicios desde el catálogo</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const months   = item.durationMonths || 1;
                    const qty      = item.quantity || 1;
                    const subtotal = item.product.price * qty * months;
                    return (
                      <div key={item.product.id}
                        className="p-4 bg-zinc-800/80 rounded-2xl border border-zinc-700/60 space-y-4">

                        {/* Name + remove */}
                        <div className="flex items-start gap-3">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-700" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-800/40 flex items-center justify-center shrink-0">
                              <Tv2 size={18} className="text-violet-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white leading-tight">{item.product.name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">C$ {item.product.price.toFixed(2)} / mes</p>
                          </div>
                          <button onClick={() => onRemove(item.product.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-all shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Month chips */}
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Meses de suscripción</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {MONTH_CHIPS.map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => onUpdate(item.product.id, 'durationMonths', n)}
                                className={cn(
                                  'px-3 py-1.5 rounded-xl text-[11px] font-black transition-all active:scale-95',
                                  months === n
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-white',
                                )}
                              >
                                {n === 1 ? '1 mes' : `${n}m`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quantity stepper + subtotal */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cantidad</p>
                            <Stepper
                              value={qty} min={1} max={5}
                              onChange={(v) => onUpdate(item.product.id, 'quantity', v)}
                            />
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Subtotal</p>
                            <p className="text-lg font-black text-violet-400">C$ {subtotal.toFixed(2)}</p>
                            <p className="text-[9px] text-zinc-600">{qty} × {months} mes{months !== 1 ? 'es' : ''}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t border-zinc-800 p-4 shrink-0 space-y-3 bg-zinc-950/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total estimado</span>
                    <span className="text-2xl font-black text-white">C$ {total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setStep('form')}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25"
                  >
                    <Send size={16} /> Continuar
                  </button>
                </div>
              )}
            </motion.div>

          ) : (
            /* ── Checkout form ── */
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }} className="flex-1 flex flex-col min-h-0">

              <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                {/* Order summary */}
                <div className="mb-5 p-4 bg-zinc-800/60 rounded-2xl border border-zinc-700/60 space-y-2">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Resumen</p>
                  {cart.map(c => (
                    <div key={c.product.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300 truncate flex-1 mr-2">{c.product.name}</span>
                      <span className="text-zinc-500 text-xs shrink-0">
                        {c.durationMonths || 1}m × {c.quantity || 1}
                      </span>
                      <span className="text-violet-400 font-black ml-3 shrink-0">
                        C$ {(c.product.price * (c.quantity || 1) * (c.durationMonths || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-700/60">
                    <span className="text-sm font-black text-white">Total</span>
                    <span className="text-lg font-black text-violet-400">C$ {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Form */}
                <form id="cart-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div className="space-y-1">
                    <input
                      {...form.register('customerName')}
                      placeholder="Nombre completo"
                      className={cn(
                        'w-full px-5 py-4 bg-zinc-800 border-2 rounded-2xl text-sm font-bold outline-none transition-all text-white placeholder:text-zinc-600',
                        form.formState.errors.customerName ? 'border-red-500/60 focus:border-red-500' : 'border-zinc-700 focus:border-violet-500',
                      )}
                    />
                    {form.formState.errors.customerName && (
                      <p className="text-[10px] text-red-400 font-black ml-1">{form.formState.errors.customerName.message}</p>
                    )}
                  </div>

                  <Controller
                    name="customerPhone"
                    control={form.control}
                    render={({ field }) => (
                      <PhoneField
                        dark label=""
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.customerPhone?.message}
                        placeholder="Teléfono / WhatsApp"
                      />
                    )}
                  />

                  <div className="space-y-1">
                    <input
                      {...form.register('customerEmail')}
                      type="email"
                      placeholder="Correo electrónico"
                      className={cn(
                        'w-full px-5 py-4 bg-zinc-800 border-2 rounded-2xl text-sm font-bold outline-none transition-all text-white placeholder:text-zinc-600',
                        form.formState.errors.customerEmail ? 'border-red-500/60 focus:border-red-500' : 'border-zinc-700 focus:border-violet-500',
                      )}
                    />
                    {form.formState.errors.customerEmail && (
                      <p className="text-[10px] text-red-400 font-black ml-1">{form.formState.errors.customerEmail.message}</p>
                    )}
                  </div>

                  <textarea
                    {...form.register('notes')}
                    rows={2}
                    placeholder="Nota (opcional)"
                    className="w-full px-5 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-2xl text-sm font-bold outline-none text-white placeholder:text-zinc-600 focus:border-violet-500 resize-none transition-all"
                  />
                </form>
              </div>

              <div className="border-t border-zinc-800 p-4 shrink-0 bg-zinc-950/80">
                <button
                  type="submit" form="cart-form" disabled={submitting}
                  className="w-full py-4 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60"
                >
                  {submitting
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Send size={16} /> Enviar orden · {cart.length} servicio{cart.length !== 1 ? 's' : ''}</>
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ─── Main PublicMenu ───────────────────────────────────────────────────────────
export function PublicMenu() {
  const { toast } = useToast();
  const { settings, categories, topSellers, search, loading, error } = usePublicMenu();
  const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
  const [previewBypass, setPreviewBypass] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lightboxedImage, setLightboxedImage] = useState(null);

  const [isDemoModalOpen,  setIsDemoModalOpen]  = useState(false);
  const [demoProduct,      setDemoProduct]      = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderProduct,     setOrderProduct]     = useState(null);
  const [paymentMethods,   setPaymentMethods]   = useState([]);
  const [cart,             setCart]             = useState(() => {
    try {
      const saved = localStorage.getItem('maxplus_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [cartOpen,         setCartOpen]         = useState(false);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('maxplus_cart', JSON.stringify(cart));
  }, [cart]);

  // Load public payment methods
  useEffect(() => {
    paymentMethodService.getAllPublic()
      .then(data => setPaymentMethods(Array.isArray(data) ? data.filter(m => m.isActive !== false) : []))
      .catch(() => {});
  }, []);

  // Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        const results = await search(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const scrollToCategory = (id) => {
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementPosition = el.getBoundingClientRect().top - bodyRect;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const onSelectProduct = (product, directToLightbox = false) => {
    if (directToLightbox) setLightboxedImage(product.imageUrl);
    else setSelectedProduct(product);
  };

  // Cart helpers
  const addToCart = (product, lightboxUrl = null) => {
    if (lightboxUrl) { setLightboxedImage(lightboxUrl); return; }
    if (product.isAvailable === false && product.isActive === false) { toast.error('Este servicio no está disponible'); return; }

    if (product.price === 0) {
      setDemoProduct(product);
      setIsDemoModalOpen(true);
    } else {
      setCart(prev => prev.find(c => c.product.id === product.id) ? prev : [...prev, { product, quantity: 1 }]);
      toast.success(`${product.name} agregado al carrito`);
    }
  };

  const removeFromCart   = (productId) => setCart(prev => prev.filter(c => c.product.id !== productId));
  const updateCartItem   = (productId, field, value) =>
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, [field]: value } : c));
  const cartCount = cart.length;


  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          <div className="h-52 bg-zinc-900 rounded-3xl animate-pulse border border-zinc-800" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-28 bg-zinc-900 rounded-full shrink-0 animate-pulse border border-zinc-800" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Disabled (not an error — intentional) ──
  if (!error && settings && !settings.publicMenuEnabled && (!isPreview || !previewBypass)) {
    const biz = settings.businessName || 'MaxPlus IPTV';
    const wa  = settings.whatsappNumber
      ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`
      : null;
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 65%)' }} />

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative z-10">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Tv2 size={22} className="text-violet-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-lg leading-none">{biz}</p>
              <p className="text-violet-400/70 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Menú Digital</p>
            </div>
          </div>

          {/* Main card */}
          <div className="max-w-sm w-full bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl shadow-black/60 space-y-5">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
              <Clock size={28} className="text-violet-400" />
            </div>

            <div className="space-y-2">
              <p className="text-violet-400 text-[10px] font-black uppercase tracking-widest">
                Temporalmente deshabilitado
              </p>
              <h1 className="text-xl font-black text-white leading-tight">
                Menú en mantenimiento
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Nuestro catálogo de servicios está temporalmente deshabilitado.
                Pronto estará disponible nuevamente.
              </p>
            </div>

            <div className="h-px bg-zinc-800" />

            <div className="space-y-3">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                ¿Necesitas ayuda ahora?
              </p>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-violet-500/20 active:scale-95">
                  <Phone size={15} /> Contáctanos por WhatsApp
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs">
                  <Info size={13} /> Consulta nuestras redes sociales
                </div>
              )}
            </div>
          </div>

          <p className="text-zinc-700 text-xs mt-6">
            © {new Date().getFullYear()} {biz} · Todos los derechos reservados
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <Info className="text-red-400" size={40} />
          </div>
          <h1 className="text-2xl font-black text-white">Error al cargar</h1>
          <p className="text-zinc-400 text-sm">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-3 bg-violet-600 text-white rounded-full font-bold shadow-lg shadow-violet-500/20 hover:bg-violet-500 transition-all">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">

      {/* ── HEADER ── */}
      <header className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Tv2 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-none tracking-tight">{settings?.businessName || 'MaxPlus IPTV'}</h1>
              <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mt-0.5">Menú Digital</p>
            </div>
          </div>

          {/* Search — desktop */}
          <div className="hidden md:flex flex-1 max-w-sm relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Buscar plan o servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none text-white placeholder:text-zinc-600 transition-all"
            />
          </div>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all hover:bg-violet-500"
          >
            <ShoppingCart size={15} />
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-amber-400 text-zinc-900 text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                {cartCount}
              </span>
            )}
          </button>

          {/* WhatsApp contact */}
          {settings?.phone && (
            <a
              href={`https://api.whatsapp.com/send?phone=${waPhone(settings.phone)}&text=${encodeURIComponent('Hola, me interesa un plan IPTV.')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-500"
            >
              <Phone size={15} /> Contactar
            </a>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/60">
        {/* Glow orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] font-black text-violet-400 uppercase tracking-widest">Streaming 24/7</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              {settings?.description || 'Tu entretenimiento\nsin límites'}
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base font-medium mb-8 max-w-lg leading-relaxed">
              Elige tu plan IPTV y solicita tu acceso en línea. Activación en minutos, credenciales por email.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Tv2, label: 'Miles de canales' },
                { icon: Wifi, label: 'Alta velocidad' },
                { icon: Shield, label: 'Señal estable' },
                { icon: Zap, label: 'Activación rápida' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-zinc-300">
                  <Icon size={13} className="text-violet-400" /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 pb-28">

        {/* Mobile search */}
        <div className="md:hidden relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="¿Qué plan buscas?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-sm font-medium text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search results OR menu */}
        {searchResults ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Resultados para "{searchQuery}"</h2>
              <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-violet-400 uppercase hover:text-violet-300 transition-colors">Ver todo</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map(p => (
                <ProductCard
                  key={p.id}
                  p={p}
                  onSelect={onSelectProduct}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  inCart={!!cart.find(c => c.product.id === p.id)}
                />
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="py-20 text-center space-y-3 opacity-40">
                <div className="text-6xl">🔍</div>
                <p className="font-black text-white">No encontramos lo que buscas</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Top sellers */}
            {topSellers?.length > 0 && (
              <div className="mb-14">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="text-violet-400 fill-violet-400" size={18} />
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Más Populares</h2>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                  {topSellers.map(p => (
                    <div key={p.id} className="min-w-[280px] sm:min-w-[320px]">
                      <ProductCard
                        p={p}
                        onSelect={onSelectProduct}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        inCart={!!cart.find(c => c.product.id === p.id)}
                        isFeatured
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category nav */}
            {categories.length > 1 && (
              <div className="sticky top-[57px] z-20 -mx-4 px-4 py-3 bg-zinc-950/90 backdrop-blur-md flex gap-2.5 overflow-x-auto scrollbar-hide mb-10 border-b border-zinc-800/60">
                {categories.map((cat) => {
                  const id = cat.id ?? cat.categoryId;
                  const name = cat.name ?? cat.categoryName;
                  return (
                    <button
                      key={id}
                      onClick={() => scrollToCategory(id)}
                      className="flex-shrink-0 px-5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-2xl text-[12px] font-black text-zinc-300 hover:border-violet-500 hover:text-violet-300 hover:bg-zinc-800 transition-all active:scale-95 whitespace-nowrap"
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Categories & products */}
            <div className="space-y-16">
              {categories.map((cat) => {
                const id = cat.id ?? cat.categoryId;
                const name = cat.name ?? cat.categoryName;
                const products = cat.products ?? [];
                return (
                  <section key={id} id={`cat-${id}`} className="scroll-mt-32">
                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-px flex-1 bg-zinc-800" />
                      <div className="flex items-center gap-2 px-5 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl">
                        <Tv2 size={14} className="text-violet-400" />
                        <h2 className="text-xs font-black text-white uppercase tracking-widest">{name}</h2>
                      </div>
                      <div className="h-px flex-1 bg-zinc-800" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((p) => (
                        <ProductCard
                          key={p.id}
                          p={p}
                          onSelect={onSelectProduct}
                          addToCart={addToCart}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ── CART DRAWER ── */}
      <AnimatePresence>
        {cartOpen && (
          <CartDrawer
            cart={cart}
            onRemove={removeFromCart}
            onUpdate={updateCartItem}
            onClear={() => setCart([])}
            onClose={() => setCartOpen(false)}
            settings={settings}
          />
        )}
      </AnimatePresence>

      {/* ── ORDER REQUEST MODAL (planes pagados — legacy, solo si se usa directamente) ── */}
      <OrderRequestModal
        product={orderProduct}
        settings={settings}
        isOpen={isOrderModalOpen}
        onClose={() => { setIsOrderModalOpen(false); setOrderProduct(null); }}
      />

      {/* ── FOOTER ── */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-14 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-8 text-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
              <Tv2 size={20} className="text-violet-400" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">{settings?.businessName}</span>
          </div>

          {/* Payment methods */}
          {paymentMethods.length > 0 && (
            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-3 mb-5">
                <CreditCard size={16} className="text-violet-400" />
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Transferencias Bancarias</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map(m => (
                  <div key={m.id} className="p-5 bg-zinc-800/50 border border-zinc-800 rounded-2xl text-left space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white leading-none">{m.nombre}</p>
                        <p className="text-[11px] font-bold text-zinc-500 mt-0.5">{m.banco}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-[12px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-500 font-bold">Tipo</span>
                        <span className="text-zinc-300 font-bold">{m.tipoCuenta}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-500 font-bold">N° Cuenta</span>
                        <span className="text-zinc-100 font-mono font-black">{m.numeroCuenta}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-500 font-bold">Titular</span>
                        <span className="text-zinc-300 font-bold text-right">{m.titular}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
            <div className="p-6 bg-zinc-800/50 border border-zinc-800 rounded-3xl space-y-2">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Contacto</p>
              <div className="flex items-center justify-center gap-2 text-zinc-300 font-bold text-sm"><Phone size={15} className="text-violet-400" /> <span>{settings?.phone}</span></div>
              <div className="flex items-center justify-center gap-2 text-zinc-300 font-bold text-sm"><MapPin size={15} className="text-violet-400" /> <span>{settings?.address || 'Managua, Nicaragua'}</span></div>
            </div>
            <div className="p-6 bg-zinc-800/50 border border-zinc-800 rounded-3xl space-y-2">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Atención</p>
              <div className="flex items-center justify-center gap-2 text-zinc-300 font-bold text-sm"><Clock size={15} className="text-violet-400" /> <span>Lunes a Domingo</span></div>
              <p className="text-zinc-300 font-bold text-sm">11:00 AM — 10:00 PM</p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-medium">
            © {new Date().getFullYear()} {settings?.businessName} — Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* ── MODALS ── */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        addToCart={addToCart}
      />
      <ImageLightbox
        imageUrl={lightboxedImage}
        onClose={() => setLightboxedImage(null)}
      />
      <DemoRequestModal
        isOpen={isDemoModalOpen}
        onClose={() => { setIsDemoModalOpen(false); setDemoProduct(null); }}
        product={demoProduct}
        settings={settings}
      />
    </div>
  );
}
