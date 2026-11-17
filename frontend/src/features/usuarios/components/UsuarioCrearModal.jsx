import React, { useState } from 'react';
import { usuariosService } from '../services/usuarios.service';
import { Users, X, AlertCircle } from 'lucide-react';

// Modal flotante para el alta de nuevos usuarios con validación de nombre de usuario único.
// Asigna pertenencia exclusiva a Casa Central o a una tienda física, mostrando errores en el pop-up.

export default function UsuarioCrearModal({ isOpen, onClose, onSuccess, tiendas = [] }) {
  const [form, setForm] = useState({
    nombre_usuario: '',
    contrasenia: '',
    nombre: '',
    apellido: '',
    habilitado: true,
    tienda_id: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...form,
        tienda_id: form.tienda_id ? parseInt(form.tienda_id, 10) : undefined
      };
      const res = await usuariosService.createUsuario(payload);
      if (res.exito) {
        onSuccess(res.mensaje);
        setForm({
          nombre_usuario: '',
          contrasenia: '',
          nombre: '',
          apellido: '',
          habilitado: true,
          tienda_id: ''
        });
        onClose();
      } else {
        setError(res.mensaje);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <span>Alta de Usuario</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de Usuario
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Enzo30"
              value={form.nombre_usuario}
              onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.contrasenia}
              onChange={(e) => setForm({ ...form, contrasenia: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Enzo"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Apellido
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Benítez"
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asignación de Pertenencia (solo puede pertenecer a una tienda o Casa Central)
            </label>
            <select
              value={form.tienda_id}
              onChange={(e) => setForm({ ...form, tienda_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Casa Central (Sin tienda física asignada)</option>
              {tiendas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} - {t.ciudad}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="crear-usuario-habilitado"
              type="checkbox"
              checked={form.habilitado}
              onChange={(e) => setForm({ ...form, habilitado: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-700 bg-slate-950"
            />
            <label htmlFor="crear-usuario-habilitado" className="text-xs text-slate-300 font-medium">
              Usuario habilitado para operar
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Dar de Alta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
