import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Tv, LogIn, AtSign, Lock, Loader2 } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useAuthContext } from '../../context/AuthContext';
import { apiPost } from '../../lib/api';
import { cn } from '../../lib/utils';

// ─── LoginPage ─────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { settings } = useSettings();
  const { login }    = useAuthContext();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [shaking,  setShaking]  = useState(false);

  const businessName = settings.businessName || 'MaxPlus IPTV';
  const canSubmit    = email.trim() && password;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      const data = await apiPost('/api/auth/login', { email: email.trim(), password });
      login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas. Intenta de nuevo.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0A0A0F]">

      {/* ── Decorative glows ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-violet-900/5 blur-[150px]" />

      {/* ── Dot grid ─────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize:  '32px 32px',
        }}
      />

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ type: 'spring', damping: 28, stiffness: 200, delay: 0.05 }}
        className="relative z-10 mx-4 w-full max-w-sm"
      >
        {/* Solid Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#151520] shadow-2xl shadow-black/50">

          {/* Top shimmer */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

          <div className="px-8 pt-8 pb-8 space-y-6">

            {/* ── Brand ─────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 shadow-xl shadow-violet-500/[0.12]">
                <Tv size={32} className="text-violet-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-[26px] font-black tracking-tight text-white leading-none">
                {businessName}
              </h1>
              <p className="mt-2 text-[11px] font-semibold text-white/25 uppercase tracking-[0.18em]">
                Panel de Control IPTV
              </p>
            </motion.div>

            {/* ── Divider ───────────────────────────────────────────── */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

            {/* ── Form ──────────────────────────────────────────────── */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              {/* Email */}
              <div className="relative group">
                <AtSign
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors"
                />
                <input
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  className={cn(
                    'h-14 w-full rounded-2xl border py-3 pl-11 pr-4',
                    'bg-[#0A0A0F]/50 text-white placeholder:text-slate-500',
                    'text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-4',
                    error
                      ? 'border-red-500/40 focus:border-red-500/50 focus:ring-red-500/[0.15] bg-red-500/5'
                      : 'border-white/5 focus:border-violet-500/40 focus:ring-violet-500/[0.12] focus:bg-[#0A0A0F]'
                  )}
                />
              </div>

              {/* Password */}
              <motion.div
                animate={shaking ? { x: [0, -10, 10, -10, 10, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.45 }}
                className="relative group"
              >
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors"
                />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className={cn(
                    'h-14 w-full rounded-2xl border py-3 pl-11 pr-12',
                    'bg-[#0A0A0F]/50 text-white placeholder:text-slate-500',
                    'text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-4',
                    error
                      ? 'border-red-500/40 focus:border-red-500/50 focus:ring-red-500/[0.15] bg-red-500/5'
                      : 'border-white/5 focus:border-violet-500/40 focus:ring-violet-500/[0.12] focus:bg-[#0A0A0F]'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0  }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-xs text-red-400"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={!canSubmit || loading}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl py-4 mt-2',
                  'text-sm font-bold text-white transition-all duration-300',
                  canSubmit && !loading
                    ? 'bg-violet-600 hover:bg-violet-500 shadow-[0_4px_15px_rgba(124,59,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,59,237,0.4)] cursor-pointer'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                )}
              >
                {loading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <LogIn size={16} strokeWidth={2.5} />
                }
                {loading ? 'Verificando...' : 'Ingresar al Sistema'}
              </motion.button>
            </motion.form>

          </div>

          {/* Bottom shimmer */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        </div>

        {/* Version tag */}
        <p className="mt-4 text-center text-[11px] font-medium text-white/[0.15]">
          v0.1.0 · MaxPlus IPTV
        </p>
      </motion.div>
    </div>
  );
}
