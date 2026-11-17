import React, { useState, useEffect } from 'react';
import { tiendasService } from '../services/tiendas.service';
import { usuariosService } from '../../usuarios/services/usuarios.service';
import { productosService } from '../../productos/services/productos.service';
import TiendaAsignacionesTab from './TiendaAsignacionesTab';
import { X, Trash2, AlertCircle } from 'lucide-react';

// Modal detallado para editar los datos generales de una tienda o gestionar sus asignaciones.
// Permite modificar atributos, eliminar la tienda y vincular operadores e ítems de inventario.

export default function TiendaDetalleModal({ tienda, onClose, onSuccess, onDelete }) {
  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'asignaciones'
  const [subtabAsig, setSubtabAsig] = useState('usuarios'); // 'usuarios' | 'productos'
  const [form, setForm] = useState({ ...tienda });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Datos para asignaciones
  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [productosAsignados, setProductosAsignados] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);

  const cargarAsignaciones = async (tiendaId) => {
    try {
      const [uAsig, uDisp, pAsig, pDisp] = await Promise.all([
        usuariosService.getUsuariosPorTienda(tiendaId),
        usuariosService.getUsuariosNoAsignados(),
        productosService.getProductosPorTienda(tiendaId),
        productosService.getProductosNoAsignadosTienda(tiendaId)
      ]);
      setUsuariosAsignados(uAsig.usuarios || []);
      setUsuariosDisponibles(uDisp.usuarios || []);
      setProductosAsignados(pAsig.productos || []);
      setProductosDisponibles(pDisp.productos || []);
    } catch (err) {
      console.error('Error al cargar asignaciones:', err);
    }
  };

  useEffect(() => {
    setForm({ ...tienda });
    setError(null);
    cargarAsignaciones(tienda.id);
  }, [tienda]);

  const handleModificar = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await tiendasService.updateTienda(form.id, form);
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

  const handleAsignarUsuario = async (uid) => {
    if (!uid) return;
    try {
      const res = await tiendasService.asignarUsuariosTienda(form.id, [parseInt(uid, 10)]);
      if (res.exito) {
        onSuccess('Usuario asignado a la tienda');
        cargarAsignaciones(form.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDesasignarUsuario = async (uid) => {
    try {
      const res = await tiendasService.desasignarUsuarioTienda(form.id, uid);
      if (res.exito) {
        onSuccess('Usuario desasignado');
        cargarAsignaciones(form.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAsignarProducto = async (pid) => {
    if (!pid) return;
    try {
      const res = await tiendasService.asignarProductosTienda(form.id, [parseInt(pid, 10)]);
      if (res.exito) {
        onSuccess('Producto asignado a la tienda (stock en 0)');
        cargarAsignaciones(form.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDesasignarProducto = async (pid) => {
    try {
      const res = await tiendasService.desasignarProductoTienda(form.id, pid);
      if (res.exito) {
        onSuccess('Producto desasignado de la tienda');
        cargarAsignaciones(form.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {form.codigo} — {form.ciudad}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas internas del Modal */}
        <div className="flex gap-2 border-b border-slate-800 mt-4 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('datos')}
            className={`pb-2 px-1 text-xs font-semibold border-b-2 transition ${
              activeTab === 'datos'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Datos de la Tienda
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('asignaciones')}
            className={`pb-2 px-1 text-xs font-semibold border-b-2 transition ${
              activeTab === 'asignaciones'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Personal e Inventario
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: Datos */}
        {activeTab === 'datos' && (
          <form onSubmit={handleModificar} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Código de Tienda
              </label>
              <input
                type="text"
                required
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
                  value={form.provincia}
                  onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="modal-editar-habilitada"
                type="checkbox"
                checked={form.habilitada}
                onChange={(e) => setForm({ ...form, habilitada: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-700 bg-slate-950"
              />
              <label htmlFor="modal-editar-habilitada" className="text-xs text-slate-300 font-medium">
                Tienda habilitada comercialmente
              </label>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onDelete(form.id)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Tienda</span>
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
        )}

        {/* TAB 2: Asignaciones */}
        {activeTab === 'asignaciones' && (
          <TiendaAsignacionesTab
            subtab={subtabAsig}
            setSubtab={setSubtabAsig}
            usuariosAsignados={usuariosAsignados}
            usuariosDisponibles={usuariosDisponibles}
            productosAsignados={productosAsignados}
            productosDisponibles={productosDisponibles}
            onAsignarUsuario={handleAsignarUsuario}
            onDesasignarUsuario={handleDesasignarUsuario}
            onAsignarProducto={handleAsignarProducto}
            onDesasignarProducto={handleDesasignarProducto}
          />
        )}
      </div>
    </div>
  );
}
