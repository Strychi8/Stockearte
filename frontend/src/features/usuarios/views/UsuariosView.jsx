import React, { useState, useEffect } from 'react';
import { usuariosService } from '../services/usuarios.service';
import { tiendasService } from '../../tiendas/services/tiendas.service';
import UsuarioCrearModal from '../components/UsuarioCrearModal';
import UsuarioDetalleModal from '../components/UsuarioDetalleModal';
import Toast from '../../../components/ui/Toast';
import {
  Users, Plus, Search, Filter, Trash2, CheckCircle2, XCircle,
  Building2, Store, RefreshCw
} from 'lucide-react';

// Pantalla de gestión y administración de usuarios, credenciales y asignación exclusiva a sucursales.
// Incluye barra de filtros por nombre y tienda, tabla responsiva y control de modales de alta y edición.

export default function UsuariosView() {
  const [usuarios, setUsuarios] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [filtroNombreUsuario, setFiltroNombreUsuario] = useState('');
  const [filtroTiendaId, setFiltroTiendaId] = useState('');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null);

  // Toast
  const [notificacion, setNotificacion] = useState(null);

  const mostrarMensaje = (texto, tipo = 'success') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [uData, tData] = await Promise.all([
        usuariosService.getUsuarios({
          nombre_usuario: filtroNombreUsuario,
          tienda_id: filtroTiendaId
        }),
        tiendasService.getTiendas()
      ]);
      setUsuarios(uData.usuarios || []);
      setTiendas(tData.tiendas || []);
    } catch (err) {
      mostrarMensaje(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroTiendaId]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const abrirDetalle = async (uItem) => {
    try {
      const res = await usuariosService.getUsuario(uItem.id);
      if (res.exito) {
        setModalDetalle(res.usuario);
      }
    } catch (err) {
      mostrarMensaje(err.message, 'error');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Confirmas que deseas eliminar este usuario?')) return;
    try {
      const res = await usuariosService.deleteUsuario(id);
      if (res.exito) {
        mostrarMensaje(res.mensaje);
        if (modalDetalle && modalDetalle.id === id) setModalDetalle(null);
        cargarDatos();
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
            <Users className="w-7 h-7 text-brand-400" />
            <span>Gestión de Usuarios</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Alta y administración de operadores, credenciales y asignación exclusiva a sucursales o Casa Central.
          </p>
        </div>

        <button
          id="btn-nuevo-usuario"
          onClick={() => setModalCrear(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm shadow-lg shadow-brand-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Filtros */}
      <form
        onSubmit={handleBuscar}
        className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md"
      >
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="filtro-usuario-nombre"
            type="text"
            value={filtroNombreUsuario}
            onChange={(e) => setFiltroNombreUsuario(e.target.value)}
            placeholder="Filtrar por nombre de usuario..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            id="filtro-usuario-tienda"
            value={filtroTiendaId}
            onChange={(e) => setFiltroTiendaId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas las Tiendas / Casa Central</option>
            {tiendas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo} ({t.ciudad})
              </option>
            ))}
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
              setFiltroNombreUsuario('');
              setFiltroTiendaId('');
              cargarDatos();
            }}
            title="Recargar"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Tabla de Usuarios */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800/80 rounded-2xl">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Nombre de Usuario</th>
                  <th className="px-5 py-3.5">Tienda Asignada</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-semibold text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-xs">
                        {u.nombre_usuario ? u.nombre_usuario[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <span>{u.nombre_usuario}</span>
                        {(u.nombre || u.apellido) && (
                          <p className="text-[11px] text-slate-400 font-normal">
                            {u.nombre} {u.apellido}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {u.codigo_tienda === 'Casa Central' || !u.codigo_tienda ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          <Building2 className="w-3 h-3" />
                          <span>Casa Central</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700">
                          <Store className="w-3 h-3 text-slate-400" />
                          <span>{u.codigo_tienda}</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.habilitado
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {u.habilitado ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Habilitado</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Inhabilitado</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-detalle-usuario-${u.id}`}
                          onClick={() => abrirDetalle(u)}
                          className="px-2.5 py-1 rounded-lg text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 font-medium transition"
                        >
                          Ver Detalle / Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(u.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <UsuarioCrearModal
        isOpen={modalCrear}
        onClose={() => setModalCrear(false)}
        tiendas={tiendas}
        onSuccess={(msg) => {
          mostrarMensaje(msg);
          cargarDatos();
        }}
      />

      {modalDetalle && (
        <UsuarioDetalleModal
          usuario={modalDetalle}
          tiendas={tiendas}
          onClose={() => setModalDetalle(null)}
          onSuccess={(msg) => {
            mostrarMensaje(msg);
            cargarDatos();
          }}
          onDelete={handleEliminar}
        />
      )}
    </div>
  );
}
