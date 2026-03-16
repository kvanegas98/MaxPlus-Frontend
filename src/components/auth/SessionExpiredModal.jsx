import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogIn, Loader2, AlertCircle, Utensils } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { apiPost } from '../../lib/api';
import { cn } from '../../lib/utils';

export function SessionExpiredModal() {
  const { isSessionExpired, user, login, logout } = useAuthContext();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  if (!isSessionExpired) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password || loading) return;

    setLoading(true);
    setError('');
    try {
      // Intentamos re-loguear con el mismo email del usuario actual
      const data = await apiPost('/api/auth/login', { 
        email: user?.email, 
        password 
      });
      login(data.token, data.user);
      setPassword('');
    } catch (err) {
      const msg = err.status === 401
        ? 'Contraseña incorrecta. Verifica e intenta de nuevo.'
        : (err.message || 'Error al reanudar sesión');
      setError(msg);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl">
          {/* Decorative Shimmer */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                <Lock size={28} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight font-display">Sesión Expirada</h2>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest leading-none">
                {user?.nombre || user?.email || 'Usuario'}
              </p>
              <p className="text-[10px] text-slate-500 mt-4 leading-relaxed max-w-[240px]">
                Tu sesión ha terminado por seguridad. Ingresa tu contraseña para continuar donde estabas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                animate={shaking ? { x: [0, -10, 10, -10, 10, -6, 6, 0] } : { x: 0 }}
                className="relative group"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  autoFocus
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Tu contraseña"
                  className={cn(
                    "w-full h-14 pl-12 pr-4 bg-white/5 border-2 border-white/5 rounded-2xl text-white text-sm font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600",
                    error && "border-red-500/50 focus:border-red-500"
                  )}
                />
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5"
                >
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-red-400 leading-snug">{error}</p>
                </motion.div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!password || loading}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} strokeWidth={2.5} />}
                  {loading ? 'Reanudando...' : 'Reanudar Sesión'}
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full h-11 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  Continuar con otra cuenta
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center mt-6 text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
          MaxPlus IPTV · Security
        </p>
      </motion.div>
    </div>
  );
}
