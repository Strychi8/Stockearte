import React, { useState, useEffect } from 'react';
import { productosService } from '../services/productos.service';
import { Store, X, AlertCircle, CheckCircle2, Edit3, Trash2 } from 'lucide-react';

// Modal de detalle del producto con visualización de atributos, código inmutable y foto.
// Permite modificar el stock local a operadores de tienda o auditar el desglose de sucursales a Casa Central.
// Casa Central cuenta además con opciones directas para modificar atributos y dar de baja el artículo.

export default function ProductoDetalleModal({
  detalle,
  onClose,
  isTienda,
  isCasaCentral,
  userTiendaId,
  onStockUpdated,
  onEdit,
  onDelete
}) {
  const [stockInput, setStockInput] = useState('');
  const [error, setError] = useState(null);
  const [mensajeLocal, setMensajeLocal] = useState(null);
  const [loading, setLoading] = useState(false);

  const producto = detalle?.producto;
  const stocks = detalle?.stocks || [];

  useEffect(() => {
    if (isTienda && stocks.length > 0) {
      setStockInput(String(stocks[0].stock ?? 0));
    }
    setError(null);
    setMensajeLocal(null);
  }, [detalle, isTienda]);

  if (!producto) return null;

  const handleActualizarStock = async (e) => {
    e.preventDefault();
    setError(null);
    setMensajeLocal(null);

    const stockNum = parseInt(stockInput, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setError('El stock debe ser un número entero mayor o igual a 0');
      return;
    }

    setLoading(true);
    try {
      const res = await productosService.updateStock(producto.id, userTiendaId, stockNum);
      if (res.exito) {
        setMensajeLocal(res.mensaje);
        if (onStockUpdated) {
          onStockUpdated(producto.id);
        }
      } else {
        setError(res.mensaje);
      }
    } catch (err) {
      let msg = 'No se pudo actualizar el stock en este momento. Intente más tarde.';
      if (err.message && !err.message.includes('Ruta no encontrada') && !err.message.includes('Error HTTP')) {
        msg = err.message;
      }
      setError(msg);
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
              Código: {producto.codigo}
            </span>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {producto.nombre}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {mensajeLocal && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{mensajeLocal}</span>
            </div>
          )}

          <div className="flex gap-4 items-center">
            {producto.foto && (
              <img
                src={producto.foto}
                alt={producto.nombre}
                className="w-20 h-20 rounded-xl object-cover border border-slate-800"
              />
            )}
            <div className="text-xs space-y-1">
              <p className="text-slate-300">
                <strong className="text-slate-400">Talle:</strong> {producto.talle}
              </p>
              <p className="text-slate-300">
                <strong className="text-slate-400">Color:</strong> {producto.color}
              </p>
              <p className="text-slate-300">
                <strong className="text-slate-400">Código Único:</strong>{' '}
                <span className="font-mono text-brand-400 font-bold">{producto.codigo}</span>
              </p>
            </div>
          </div>

          {/* Si es Usuario de Tienda: Modificar Stock de su tienda */}
          {isTienda && (
            <form
              onSubmit={handleActualizarStock}
              className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3"
            >
              <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-4 h-4" />
                <span>Modificar Stock de Mi Tienda</span>
              </h4>
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">
                  Cantidad de unidades disponibles
                </label>
                <input
                  id="input-nuevo-stock"
                  type="number"
                  min="0"
                  required
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Actualizar Stock'}
              </button>
            </form>
          )}

          {/* Si es Casa Central: Ver desglose de stock de cada tienda */}
          {isCasaCentral && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Stock Distribuido por Sucursal
              </h4>
              {stocks.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Este producto no está asignado a ninguna tienda todavía.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {stocks.map((s) => (
                    <div
                      key={s.tienda_id}
                      className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-brand-400" />
                        <span className="font-semibold text-slate-200">{s.codigo_tienda}</span>
                      </div>
                      <span className={`font-bold ${s.stock > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {s.stock} u.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {isCasaCentral ? (
            <>
              <button
                type="button"
                onClick={() => onDelete && onDelete(producto.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-semibold rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Producto</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => onEdit && onEdit(producto)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
