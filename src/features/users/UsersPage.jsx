import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserCog, Plus, Search, Edit2, KeyRound, X,
  Check, Loader2, Shield, AlertCircle, Eye, EyeOff,
  RefreshCw, UserX, Users,
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import { cn } from '../../lib/utils';

const ROLE_STYLE = {
  Admin:    { bg: 'bg-violet-50 dark:bg-violet-500/10',  text: 'text-violet-700 dark:text-violet-400',  border: 'border-violet-100 dark:border-violet-500/20' },
  Operator: { bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-700 dark:text-blue-400',       border: 'border-blue-100 dark:border-blue-500/20'    },
};

const AVATAR_GRADIENTS = [
  'from-violet-400 to-violet-600',
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-pink-400 to-pink-600',
  'from-amber-400 to-amber-500',
  'from-cyan-400 to-cyan-600',
];

const inputCls = (hasError) => cn(
  'w-full h-12 px-4 bg-white dark:bg-[#1E1E2C] border rounded-2xl text-sm font-medium text-slate-900 dark:text-slate-100',
  'placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 transition-all duration-200',
  hasError
    ? 'border-red-500/40 focus:ring-red-500/15 focus:border-red-500/50 bg-red-500/5'
    : 'border-slate-200 dark:border-white/5 focus:ring-violet-500/15 focus:border-violet-500/40',
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || '?';
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }) {
  const grad = AVATAR_GRADIENTS[hashStr(name) % AVATAR_GRADIENTS.length];
  return (
    <div className={cn(
      'w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center',
      'text-white text-sm font-bold shrink-0 shadow-sm',
      grad,
    )}>
      {getInitials(name)}
    </div>
  );
}

// ─── RoleBadge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const s = ROLE_STYLE[role] ?? { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500', border: 'border-slate-200 dark:border-slate-600' };
  return (
    <span className={cn('px-2 py-0.5 rounded-lg text-[11px] font-bold border', s.bg, s.text, s.border)}>
      {role || 'Sin rol'}
    </span>
  );
}

// ─── PasswordInput ────────────────────────────────────────────────────────────
function PasswordInput({ registration, placeholder = '••••••••', error }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          {...registration}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className={cn(inputCls(!!error), 'pr-12')}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-red-500 pl-1">{error}</p>}
    </div>
  );
}

// ─── ApiError ─────────────────────────────────────────────────────────────────
function ApiError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={15} className="shrink-0" />
      {message}
    </div>
  );
}

// ─── Schemas ──────────────────────────────────────────────────────────────────
const createSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  roleId:   z.string().min(1, 'Selecciona un rol'),
});

const editSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('Email inválido'),
  roleId:   z.string().min(1, 'Selecciona un rol'),
  isActive: z.boolean(),
});

const passSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword:     z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Requerido'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// ─── UserModal (create / edit) ────────────────────────────────────────────────
function UserModal({ mode, user, token, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [apiError, setApiError] = useState('');
  const [roles,    setRoles]    = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    roleService.getAll(token)
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, [token]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: isEdit
      ? { fullName: user.fullName, email: user.email, roleId: user.roleId, isActive: user.isActive }
      : { fullName: '', email: '', password: '', roleId: '' },
  });

  const onSubmit = async (data) => {
    setApiError('');
    try {
      const result = isEdit
        ? await userService.update(user.id, data, token)
        : await userService.create(data, token);
      onSaved(result);
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-[#0A0A0F] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center border border-violet-100 dark:border-violet-500/20">
              <UserCog size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-[#151520] transition-colors border border-transparent dark:hover:border-white/5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre completo</label>
            <input {...register('fullName')} placeholder="Juan García" className={inputCls(!!errors.fullName)} />
            {errors.fullName && <p className="text-xs font-medium text-red-500 pl-1">{errors.fullName.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Correo electrónico</label>
            <input {...register('email')} type="email" placeholder="usuario@maxplus.com" className={inputCls(!!errors.email)} />
            {errors.email && <p className="text-xs font-medium text-red-500 pl-1">{errors.email.message}</p>}
          </div>

          {/* Password (create only) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contraseña</label>
              <PasswordInput registration={register('password')} error={errors.password?.message} />
            </div>
          )}

          {/* Rol */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rol</label>
            <select
              {...register('roleId')}
              disabled={rolesLoading}
              className={cn(inputCls(!!errors.roleId), 'cursor-pointer disabled:opacity-60')}
            >
              <option value="">{rolesLoading ? 'Cargando roles...' : '— Selecciona un rol —'}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name || r.nombre || r.roleName}</option>
              ))}
            </select>
            {errors.roleId && <p className="text-xs font-medium text-red-500 pl-1">{errors.roleId.message}</p>}
          </div>

          {/* Activo (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between py-3 px-4 bg-slate-50 dark:bg-[#151520] rounded-2xl border border-slate-100 dark:border-white/5">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Usuario activo</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Los inactivos no pueden iniciar sesión</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-violet-500
                                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                peer-checked:after:translate-x-full" />
              </label>
            </div>
          )}

          <ApiError message={apiError} />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-14 bg-slate-50 dark:bg-[#151520] text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-[#1E1E2C] transition-colors border border-slate-200 dark:border-white/5">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || rolesLoading}
              className="flex-[2] h-14 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-[0_4px_15px_rgba(124,59,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,59,237,0.4)]">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── PasswordModal ────────────────────────────────────────────────────────────
function PasswordModal({ user, token, onClose }) {
  const { toast } = useToast();
  const [apiError, setApiError] = useState('');
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setApiError('');
    try {
      await userService.changePassword(user.id, { currentPassword, newPassword }, token);
      setDone(true);
      toast.success('Contraseña actualizada');
      setTimeout(onClose, 1400);
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={!done ? onClose : undefined}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-[#0A0A0F] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden"
      >
        {done ? (
          <div className="p-10 flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14 }}
              className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center"
            >
              <Check size={26} className="text-violet-600 dark:text-violet-400" />
            </motion.div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Contraseña actualizada</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
                  <KeyRound size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Cambiar contraseña</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{user.fullName}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-[#151520] transition-colors border border-transparent dark:hover:border-white/5">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contraseña actual</label>
                <PasswordInput registration={register('currentPassword')} error={errors.currentPassword?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nueva contraseña</label>
                <PasswordInput registration={register('newPassword')} error={errors.newPassword?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmar contraseña</label>
                <PasswordInput registration={register('confirmPassword')} error={errors.confirmPassword?.message} />
              </div>

              <ApiError message={apiError} />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 h-14 bg-slate-50 dark:bg-[#151520] text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-[#1E1E2C] transition-colors border border-slate-200 dark:border-white/5">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-[2] h-14 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-[0_4px_15px_rgba(245,158,11,0.3)]">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} strokeWidth={2.5} />}
                  {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── DeactivateDialog ─────────────────────────────────────────────────────────
function DeactivateDialog({ user, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={!loading ? onClose : undefined}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-[#0A0A0F] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center shrink-0">
              <UserX size={24} className="text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">¿Desactivar usuario?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                El usuario <span className="font-bold text-slate-900 dark:text-slate-200">{user.fullName}</span> perderá
                acceso al sistema.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 h-14 bg-slate-50 dark:bg-[#151520] text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-[#1E1E2C] transition-colors border border-slate-200 dark:border-white/5 disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} disabled={loading}
              className="flex-[2] h-14 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)]">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserX size={18} strokeWidth={2.5} />}
              {loading ? 'Desactivando...' : 'Desactivar'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── UsersPage ────────────────────────────────────────────────────────────────
export function UsersPage() {
  const { token, user: me } = useAuthContext();
  const { toast } = useToast();

  const [users,          setUsers]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [fetchErr,       setFetchErr]       = useState('');
  const [search,         setSearch]         = useState('');
  const [userModal,      setUserModal]      = useState(null); // { mode: 'create'|'edit', user? }
  const [passModal,      setPassModal]      = useState(null); // user object
  const [deactivateTarget, setDeactivateTarget] = useState(null); // user object
  const [deactivating,   setDeactivating]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const data = await userService.getAll(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchErr(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) =>
    (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email    || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSaved = () => {
    setUserModal(null);
    load();
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await userService.deactivate(deactivateTarget.id, token);
      toast.success(`${deactivateTarget.fullName} desactivado`);
      setDeactivateTarget(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Error al desactivar');
    } finally {
      setDeactivating(false);
    }
  };

  // Guard
  if (me?.roleName !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 p-8">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Shield size={30} strokeWidth={1.5} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-center text-slate-500">
          Solo los administradores pueden gestionar usuarios
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full gap-5 bg-slate-50 dark:bg-[#0A0A0F] min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20 text-white shrink-0">
              <Users size={20} strokeWidth={2.5} />
            </div>
            Usuarios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona los accesos al sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-3 rounded-[1rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151520] text-slate-500 hover:text-violet-600 transition-all shadow-sm">
            <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
          </button>
          <button onClick={() => setUserModal({ mode: 'create' })}
            className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-[1rem] transition-all shadow-[0_4px_15px_rgba(124,59,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,59,237,0.4)]">
            <Plus size={18} strokeWidth={2.5} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full h-12 pl-12 pr-4 text-sm bg-white dark:bg-[#151520] border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15 transition-all font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
        />
      </div>

      {/* Error */}
      {fetchErr && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{fetchErr}</span>
          <button onClick={load} className="text-xs font-bold underline shrink-0">Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-violet-500" size={24} />
        </div>
      )}

      {/* Table */}
      {!loading && !fetchErr && (
        <div className="bg-white dark:bg-[#151520] rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1E1E2C]/50">
            {['Nombre', 'Email', 'Rol', 'Estado', 'Creado', ''].map((h) => (
              <p key={h} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</p>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-400">
                {search ? 'Sin resultados para la búsqueda' : 'No hay usuarios registrados'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {filtered.map((u) => {
                const isSelf = u.id === me?.id;
                return (
                  <div key={u.id} className={cn(
                    'group flex flex-col md:grid md:grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] md:items-center gap-3 md:gap-4 px-6 py-4 transition-colors',
                    !u.isActive && 'opacity-60',
                    'hover:bg-slate-50/80 dark:hover:bg-[#1E1E2C]/40',
                  )}>
                    {/* Nombre */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={u.fullName || ''} />
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{u.fullName || '—'}</p>
                    </div>

                    {/* Email */}
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate pl-13 md:pl-0">{u.email}</p>

                    {/* Rol */}
                    <div className="pl-13 md:pl-0">
                      <RoleBadge role={u.roleName || u.role} />
                    </div>

                    {/* Estado */}
                    <div className="pl-13 md:pl-0">
                      <span className={cn(
                        'px-2 py-0.5 rounded-lg text-[11px] font-bold border',
                        u.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',
                      )}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Creado */}
                    <p className="text-xs text-slate-400 pl-13 md:pl-0 hidden md:block">{fmtDate(u.createdAt)}</p>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 pl-13 md:pl-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#1E1E2C] border border-slate-100 dark:border-white/5 rounded-xl p-1">
                        <button
                          onClick={() => setPassModal(u)}
                          title="Cambiar contraseña"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                        >
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => setUserModal({ mode: 'edit', user: u })}
                          title="Editar"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        {u.isActive && !isSelf && (
                          <button
                            onClick={() => setDeactivateTarget(u)}
                            title="Desactivar"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <UserX size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!loading && !fetchErr && filtered.length > 0 && (
        <p className="text-xs text-slate-400 font-medium text-center pb-4">
          {filtered.length} {filtered.length === 1 ? 'usuario' : 'usuarios'}
        </p>
      )}

      {/* Modals */}
      <AnimatePresence>
        {userModal && (
          <UserModal
            key="user-modal"
            mode={userModal.mode}
            user={userModal.user}
            token={token}
            onClose={() => setUserModal(null)}
            onSaved={handleSaved}
          />
        )}
        {passModal && (
          <PasswordModal
            key="pass-modal"
            user={passModal}
            token={token}
            onClose={() => setPassModal(null)}
          />
        )}
        {deactivateTarget && (
          <DeactivateDialog
            key="deactivate-dialog"
            user={deactivateTarget}
            onClose={() => setDeactivateTarget(null)}
            onConfirm={handleDeactivate}
            loading={deactivating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
