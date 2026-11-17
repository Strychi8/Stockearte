import React, { useState } from 'react';
import { productosService } from '../services/productos.service';
import { Package, X, AlertCircle } from 'lucide-react';

// Modal flotante para dar de alta nuevos productos en el catálogo comercial de Casa Central.
// Genera código único inmutable de 10 caracteres y asigna inventario inicial en 0 a las tiendas seleccionadas.

export default function ProductoCrearModal({ isOpen, onClose, onSuccess, tiendas = [] }) {
  const [form, setForm] = useState({
    nombre: '',
    talle: '',
    color: '',
    foto: '',
    tienda_ids: []
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleTiendaSeleccionada = (tiendaId) => {
    setForm((prev) => {
      const exists = prev.tienda_ids.includes(tiendaId);
      return {
        ...prev,
        tienda_ids: exists
          ? prev.tienda_ids.filter((id) => id !== tiendaId)
          : [...prev.tienda_ids, tiendaId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await productosService.createProducto(form);
      if (res.exito) {
        onSuccess(res.mensaje);
        setForm({ nombre: '', talle: '', color: '', foto: '', tienda_ids: [] });
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-400" />
            <span>Alta de Producto al Catálogo</span>
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
              Nombre Comercial del Producto
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Remera Estampada Urban"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Talle
              </label>
              <input
                type="text"
                required
                placeholder="Ej: M, L, 42"
                value={form.talle}
                onChange={(e) => setForm({ ...form, talle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Color
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Negro, Blanco"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              URL de la Fotografía
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={form.foto}
              onChange={(e) => setForm({ ...form, foto: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asignar a Tiendas en el Alta (Stock inicial en 0 por defecto)
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              {tiendas.map((t) => {
                const checked = form.tienda_ids.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      checked ? 'bg-brand-500/10 border border-brand-500/30' : 'hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTiendaSeleccionada(t.id)}
                        className="rounded text-brand-600 focus:ring-brand-500 border-slate-700 bg-slate-900"
                      />
                      <span className="text-slate-200 font-medium">{t.codigo}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{t.ciudad}</span>
                  </label>
                );
              })}
            </div>
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
