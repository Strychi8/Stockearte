import React, { useState, useEffect } from 'react';
import { tiendasService } from '../services/tiendas.service';
import TiendaCrearModal from '../components/TiendaCrearModal';
import TiendaDetalleModal from '../components/TiendaDetalleModal';
import Toast from '../../../components/ui/Toast';
import {
  Store, Plus, Search, Filter, Trash2, Edit3, CheckCircle2, XCircle, RefreshCw,
  ToggleLeft, ToggleRight
} from 'lucide-react';

// Vista principal para la administración de sucursales físicas de la cadena.
// Renderiza el catálogo de tiendas, filtros por código y estado, y orquesta los modales de alta y edición.

export default function TiendasView() {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroHabilitada, setFiltroHabilitada] = useState('');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null);

  // Toast
  const [notificacion, setNotificacion] = useState(null);

  const mostrarMensaje = (texto, tipo = 'success') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const cargarTiendas = async () => {
    setLoading(true);
    try {
      const data = await tiendasService.getTiendas({
        codigo: filtroCodigo,
        habilitada: filtroHabilitada
      });
      setTiendas(data.tiendas || []);
    } catch (err) {
      mostrarMensaje(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTiendas();
  }, [filtroHabilitada]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarTiendas();
  };

  const abrirDetalle = async (tItem) => {
    try {
      const res = await tiendasService.getTienda(tItem.id);
      if (res.exito) {
        setModalDetalle(res.tienda);
      }
    } catch (err) {
      mostrarMensaje(err.message, 'error');
    }
  };

  const handleToggleEstado = async (id, estadoActual) => {
    try {
      const res = await tiendasService.cambiarEstadoTienda(id, !estadoActual);
      if (res.exito) {
        mostrarMensaje(res.mensaje);
        if (modalDetalle && modalDetalle.id === id) {
          setModalDetalle({ ...modalDetalle, habilitada: !estadoActual });
        }
        cargarTiendas();
      }
    } catch (err) {
      mostrarMensaje(err.message, 'error');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Confirmas que deseas eliminar esta tienda?')) return;
    try {
      const res = await tiendasService.deleteTienda(id);
      if (res.exito) {
        mostrarMensaje(res.mensaje);
        if (modalDetalle && modalDetalle.id === id) setModalDetalle(null);
        cargarTiendas();
      } else {
        mostrarMensaje(res.mensaje, 'error');
      }
    } catch (err) {
      mostrarMensaje(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Toast notificacion={notificacion} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Store className="w-7 h-7 text-brand-400" />
            <span>Gestión de Tiendas</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Administra sucursales, apertura/cierre de tiendas y asignación de personal e inventario.
          </p>
        </div>

        <button
          id="btn-nueva-tienda"
          onClick={() => setModalCrear(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm shadow-lg shadow-brand-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Tienda</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <form
        onSubmit={handleBuscar}
        className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md"
      >
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="filtro-tienda-codigo"
            type="text"
            value={filtroCodigo}
            onChange={(e) => setFiltroCodigo(e.target.value)}
            placeholder="Filtrar por código (ej: SUC-PALERMO)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            id="filtro-tienda-estado"
            value={filtroHabilitada}
            onChange={(e) => setFiltroHabilitada(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los Estados</option>
            <option value="true">Habilitadas</option>
            <option value="false">Inhabilitadas</option>
          </select>
        </div>

        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltroCodigo('');
              setFiltroHabilitada('');
              cargarTiendas();
            }}
            title="Recargar"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Grid de Tiendas */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : tiendas.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800/80 rounded-2xl">
          <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No se encontraron tiendas con los filtros aplicados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiendas.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-brand-400 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                      {t.codigo}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">
                      {t.ciudad}, {t.provincia}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{t.direccion}</p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      t.habilitada
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {t.habilitada ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Habilitada</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Inhabilitada</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  id={`btn-detalle-tienda-${t.id}`}
                  onClick={() => abrirDetalle(t)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ver Detalle / Asignar</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleEstado(t.id, t.habilitada)}
                    title={t.habilitada ? 'Inhabilitar tienda' : 'Habilitar tienda'}
                    className={`p-1.5 rounded-lg transition ${
                      t.habilitada
                        ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.habilitada ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEliminar(t.id)}
                    title="Eliminar tienda"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      <TiendaCrearModal
        isOpen={modalCrear}
        onClose={() => setModalCrear(false)}
        onSuccess={(msg) => {
          mostrarMensaje(msg);
          cargarTiendas();
        }}
      />

      {modalDetalle && (
        <TiendaDetalleModal
          tienda={modalDetalle}
          onClose={() => setModalDetalle(null)}
          onSuccess={(msg) => {
            mostrarMensaje(msg);
            cargarTiendas();
          }}
          onDelete={handleEliminar}
        />
      )}
    </div>
  );
}
