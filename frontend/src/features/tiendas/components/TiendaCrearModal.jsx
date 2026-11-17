import React, { useState } from 'react';
import { tiendasService } from '../services/tiendas.service';
import { Store, X, AlertCircle } from 'lucide-react';

// Modal flotante para registrar una nueva tienda física con código alfanumérico único.
// Valida los campos ingresados y muestra alertas de error directamente dentro del formulario.

export default function TiendaCrearModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    codigo: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    habilitada: true
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await tiendasService.createTienda(form);
      if (res.exito) {
        onSuccess(res.mensaje);
        setForm({ codigo: '', direccion: '', ciudad: '', provincia: '', habilitada: true });
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
            <Store className="w-5 h-5 text-brand-400" />
            <span>Alta de Tienda Física</span>
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
              Código Alfanumérico Único
            </label>
            <input
              type="text"
              required
              placeholder="Ej: SUC-CORDOBA-01"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dirección
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Av. Colón 1234"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Córdoba"
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Provincia
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Córdoba"
                value={form.provincia}
                onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="crear-habilitada"
              type="checkbox"
              checked={form.habilitada}
              onChange={(e) => setForm({ ...form, habilitada: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-700 bg-slate-950"
            />
            <label htmlFor="crear-habilitada" className="text-xs text-slate-300 font-medium">
              Tienda habilitada comercialmente
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
              {loading ? 'Guardando...' : 'Crear Tienda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
