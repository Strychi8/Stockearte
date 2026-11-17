import React, { useState, useEffect } from 'react';
import { usuariosService } from '../services/usuarios.service';
import { X, Trash2, AlertCircle } from 'lucide-react';

// Modal detallado para visualizar, editar y eliminar usuarios del sistema.
// Permite modificar datos personales, tienda asignada, estado de habilitación y contraseña opcional.

export default function UsuarioDetalleModal({ usuario, onClose, onSuccess, onDelete, tiendas = [] }) {
  const [form, setForm] = useState({
    id: usuario?.id,
    nombre_usuario: usuario?.nombre_usuario || '',
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    habilitado: usuario?.habilitado ?? true,
    tienda_id: usuario?.tienda_id ? String(usuario.tienda_id) : '',
    nueva_contrasenia: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setForm({
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario || '',
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        habilitado: usuario.habilitado ?? true,
        tienda_id: usuario.tienda_id ? String(usuario.tienda_id) : '',
        nueva_contrasenia: ''
      });
      setError(null);
    }
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        nombre_usuario: form.nombre_usuario,
        nombre: form.nombre,
        apellido: form.apellido,
        habilitado: form.habilitado,
        tienda_id: form.tienda_id ? parseInt(form.tienda_id, 10) : 0
      };
      if (form.nueva_contrasenia) {
        payload.contrasenia = form.nueva_contrasenia;
      }

      const res = await usuariosService.updateUsuario(form.id, payload);
      if (res.exito) {
        onSuccess(res.mensaje);
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
          <div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Editar Usuario: {form.nombre_usuario}
            </h3>
          </div>
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
              value={form.nombre_usuario}
              onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nueva Contraseña (dejar en blanco para mantener la actual)
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.nueva_contrasenia}
              onChange={(e) => setForm({ ...form, nueva_contrasenia: e.target.value })}
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
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tienda Asignada (o Casa Central)
            </label>
            <select
              value={form.tienda_id}
              onChange={(e) => setForm({ ...form, tienda_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Casa Central (Sin tienda física)</option>
              {tiendas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} ({t.ciudad})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="editar-usuario-habilitado"
              type="checkbox"
              checked={form.habilitado}
              onChange={(e) => setForm({ ...form, habilitado: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-700 bg-slate-950"
            />
            <label htmlFor="editar-usuario-habilitado" className="text-xs text-slate-300 font-medium">
              Usuario habilitado
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onDelete(form.id)}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Usuario</span>
            </button>

            <div className="flex items-center gap-2">
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
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
