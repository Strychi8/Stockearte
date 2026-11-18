import React, { useState, useEffect } from 'react';
import { productosService } from '../services/productos.service';
import { tiendasService } from '../../tiendas/services/tiendas.service';
import { useAuth } from '../../../context/AuthContext';
import ProductoCrearModal from '../components/ProductoCrearModal';
import ProductoDetalleModal from '../components/ProductoDetalleModal';
import ProductoModificarModal from '../components/ProductoModificarModal';
import Toast from '../../../components/ui/Toast';
import {
  Package, Plus, Search, Filter, Trash2, Edit3,
  RefreshCw, Store, Image as ImageIcon, ShieldAlert
} from 'lucide-react';

// Pantalla para ver y buscar productos por nombre, código, talle o color.
// Permite a Casa Central consultar todo el inventario y a cada tienda ver y gestionar su propio stock.

export default function ProductosView() {
  const { user, isCasaCentral, isTienda } = useAuth();

  const [productos, setProductos] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [tiendaActual, setTiendaActual] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroTalle, setFiltroTalle] = useState('');
  const [filtroColor, setFiltroColor] = useState('');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [modalModificar, setModalModificar] = useState(null);

  const [notificacion, setNotificacion] = useState(null);

  const mostrarMensaje = (texto, tipo = 'success') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const filters = {
        nombre: filtroNombre,
        codigo: filtroCodigo,
        talle: filtroTalle,
        color: filtroColor
      };
      if (isTienda && user?.tienda_id) {
        filters.tienda_id_usuario = user.tienda_id;
        try {
          const tData = await tiendasService.getTienda(user.tienda_id);
          if (tData?.exito && tData?.tienda) {
            setTiendaActual(tData.tienda);
            if (user && user.tienda_habilitada !== tData.tienda.habilitada) {
              const updatedUser = { ...user, tienda_habilitada: tData.tienda.habilitada };
              localStorage.setItem('stockearte_user', JSON.stringify(updatedUser));
            }
          }
        } catch (tErr) {
          console.error('[ProductosView] Error al consultar tienda:', tErr);
        }
      }

      const res = await productosService.getProductos(filters);
      setProductos(res.productos || []);

      if (isCasaCentral && tiendas.length === 0) {
        const tData = await tiendasService.getTiendas();
        setTiendas(tData.tiendas || []);
      }
    } catch (err) {
      mostrarMensaje(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [isCasaCentral, isTienda, user?.tienda_id]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarProductos();
  };

  const abrirDetalle = async (pItem) => {
    try {
      const tiendaSolicitante = isTienda ? user?.tienda_id : null;
      const res = await productosService.getProducto(pItem.id, tiendaSolicitante);
      if (res.exito) {
        setModalDetalle({
          producto: res.producto,
          stocks: res.stocks || []
        });
      }
    } catch (err) {
      mostrarMensaje(err.message, 'error');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Confirmas que deseas eliminar este producto del catálogo?')) return;
    try {
      const res = await productosService.deleteProducto(id);
      if (res.exito) {
        mostrarMensaje(res.mensaje);
        if (modalDetalle && modalDetalle.producto.id === id) setModalDetalle(null);
        if (modalModificar && modalModificar.id === id) setModalModificar(null);
        cargarProductos();
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
            <Package className="w-7 h-7 text-brand-400" />
            <span>
              {isCasaCentral
                ? 'Catálogo General de Productos'
                : `Control de Stock`}
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isCasaCentral
              ? 'Alta de artículos con código único aleatorio, modificación de atributos y auditoría de stock en sucursales.'
              : 'Gestión y modificación directa de unidades disponibles para tu sucursal.'}
          </p>
        </div>

        {isCasaCentral && (
          <button
            id="btn-nuevo-producto"
            onClick={() => setModalCrear(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm shadow-lg shadow-brand-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>

      {/* Estado Bloqueado si la tienda del usuario se encuentra inhabilitada */}
      {isTienda && tiendaActual && !tiendaActual.habilitada ? (
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden my-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-inner shadow-rose-500/20">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Sucursal Inhabilitada
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">
              {tiendaActual.codigo} se encuentra inhabilitada
            </h3>

            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              La sucursal <strong className="text-white font-mono">{tiendaActual.codigo}</strong> ({tiendaActual.ciudad}, {tiendaActual.provincia}) ha sido dada de baja temporalmente por la <strong className="text-brand-300">Casa Central</strong>.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 text-left w-full space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Dirección registrada:</span>
                <span className="font-medium text-slate-200">{tiendaActual.direccion}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Estado de operaciones:</span>
                <span className="font-bold text-rose-400">Suspendida / No operable</span>
              </div>
              <p className="text-slate-400 text-[11px] pt-1">
                ⚠️ Las tarjetas de productos e inventario permanecen ocultas y las modificaciones de stock están bloqueadas por seguridad. Comunícate con un administrador de Casa Central para reactivar la sucursal.
              </p>
            </div>

            <button
              id="btn-reverificar-tienda"
              onClick={() => cargarProductos()}
              disabled={loading}
              className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Verificar estado nuevamente</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <form
            onSubmit={handleBuscar}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md"
          >
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="filtro-prod-nombre"
                type="text"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                placeholder="Filtrar por nombre..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-3">
              <input
                id="filtro-prod-codigo"
                type="text"
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
                placeholder="Código del producto..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                id="filtro-prod-talle"
                type="text"
                value={filtroTalle}
                onChange={(e) => setFiltroTalle(e.target.value)}
                placeholder="Talle (ej: M, 42)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                id="filtro-prod-color"
                type="text"
                value={filtroColor}
                onChange={(e) => setFiltroColor(e.target.value)}
                placeholder="Color (ej: Negro)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-1 flex gap-1">
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center"
                title="Filtrar"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroNombre('');
                  setFiltroCodigo('');
                  setFiltroTalle('');
                  setFiltroColor('');
                  cargarProductos();
                }}
                title="Limpiar filtros"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Grid de Productos */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-slate-800/80 rounded-2xl">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No se encontraron productos con los criterios de búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {productos.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-full h-44 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                      {p.foto ? (
                        <img
                          src={p.foto}
                          alt={p.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-slate-600 flex flex-col items-center gap-1">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[10px]">Sin fotografía</span>
                        </div>
                      )}

                      <span className="absolute top-2.5 right-2.5 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-brand-300 border border-slate-700">
                        {p.codigo}
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                        {p.nombre}
                      </h3>

                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          Talle: {p.talle}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          Color: {p.color}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Store className="w-3.5 h-3.5 text-brand-400" />
                          <span>{p.codigo_tienda || (isCasaCentral ? 'Consolidado' : user?.codigo_tienda)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-medium">Stock:</span>
                          <strong className={`font-bold ${p.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.stock} u.
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      id={`btn-detalle-prod-${p.id}`}
                      onClick={() => abrirDetalle(p)}
                      className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isTienda ? 'Modificar Stock' : 'Ver Detalle / Stock'}</span>
                    </button>

                    {isCasaCentral && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModalModificar(p)}
                          title="Editar producto"
                          className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEliminar(p.id)}
                          title="Eliminar producto"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modales */}
      <ProductoCrearModal
        isOpen={modalCrear}
        onClose={() => setModalCrear(false)}
        tiendas={tiendas}
        onSuccess={(msg) => {
          mostrarMensaje(msg);
          cargarProductos();
        }}
      />

      {modalDetalle && (
        <ProductoDetalleModal
          detalle={modalDetalle}
          onClose={() => setModalDetalle(null)}
          isTienda={isTienda}
          isCasaCentral={isCasaCentral}
          userTiendaId={user?.tienda_id}
          onStockUpdated={(prodId) => {
            mostrarMensaje('Stock actualizado correctamente');
            abrirDetalle({ id: prodId });
            cargarProductos();
          }}
          onEdit={(producto) => {
            setModalDetalle(null);
            setModalModificar(producto);
          }}
          onDelete={(prodId) => {
            handleEliminar(prodId);
          }}
        />
      )}

      {modalModificar && (
        <ProductoModificarModal
          producto={modalModificar}
          onClose={() => setModalModificar(null)}
          onSuccess={(msg, prodActualizado) => {
            mostrarMensaje(msg);
            if (modalDetalle && modalDetalle.producto.id === modalModificar.id) {
              abrirDetalle(prodActualizado || modalModificar);
            }
            cargarProductos();
          }}
        />
      )}
    </div>
  );
}
