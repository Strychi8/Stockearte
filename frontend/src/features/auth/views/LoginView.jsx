import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { LogIn, ShieldAlert, Store, Building2 } from 'lucide-react';

// Pantalla de inicio de sesión con formulario de credenciales y accesos rápidos de prueba.
// Procesa la autenticación del operador y redirige al panel correspondiente según sus privilegios.

export default function LoginView() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    const res = await login(username, password);
    if (res.success) {
      navigate('/');
    }
  };

  const handleQuickLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    const res = await login(u, p);
    if (res.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 mb-4 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
            Stockearte
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión Distribuida de Stock e Indumentaria
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre de Usuario
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: admin o AnaG20"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>

        {/* Quick test accounts */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Acceso Rápido de Prueba (Demo)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition flex flex-col gap-1 group"
            >
              <div className="flex items-center gap-1.5 text-brand-400 font-semibold group-hover:text-brand-300">
                <Building2 className="w-3.5 h-3.5" />
                <span>Casa Central</span>
              </div>
              <span className="text-slate-400 text-[11px]">admin / admin123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('AnaG20', '123456')}
              className="p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition flex flex-col gap-1 group"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold group-hover:text-emerald-300">
                <Store className="w-3.5 h-3.5" />
                <span>Tienda Palermo</span>
              </div>
              <span className="text-slate-400 text-[11px]">AnaG20 / 123456</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
