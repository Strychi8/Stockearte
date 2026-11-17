import React, { useState, useEffect } from 'react';
import { productosService } from '../services/productos.service';
import { Package, X, AlertCircle } from 'lucide-react';

// Modal exclusivo de Casa Central para modificar nombre, talle, color y foto de un producto.
// Mantiene el código de 10 caracteres protegido de manera inmutable según las consignas del sistema.

export default function ProductoModificarModal({ producto, onClose, onSuccess }) {
  const [form, setForm] = useState({
    id: producto?.id,
    codigo: producto?.codigo || '',
    nombre: producto?.nombre || '',
    talle: producto?.talle || '',
    color: producto?.color || '',
    foto: producto?.foto || ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (producto) {
      setForm({
        id: producto.id,
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        talle: producto.talle || '',
        color: producto.color || '',
        foto: producto.foto || ''
      });
      setError(null);
    }
  }, [producto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await productosService.updateProducto(form.id, {
        nombre: form.nombre,
        talle: form.talle,
        color: form.color,
        foto: form.foto
      });
      if (res.exito) {
        onSuccess(res.mensaje, res.producto);
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
            <span className="text-xs font-mono text-brand-400">
              Código: {form.codigo}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Modificar Producto
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
              Nombre Comercial
            </label>
            <input
              type="text"
              required
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
              value={form.foto || ''}
              onChange={(e) => setForm({ ...form, foto: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-brand-500"
            />
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
