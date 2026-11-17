import React, { useState } from 'react';
import { Users, Package, Plus, Trash2 } from 'lucide-react';

// Pestaña interna para gestionar las asignaciones de operadores y productos a una sucursal.
// Permite asociar o remover usuarios disponibles y habilitar artículos del catálogo con stock inicial en 0.

export default function TiendaAsignacionesTab({
  subtab,
  setSubtab,
  usuariosAsignados,
  usuariosDisponibles,
  productosAsignados,
  productosDisponibles,
  onAsignarUsuario,
  onDesasignarUsuario,
  onAsignarProducto,
  onDesasignarProducto
}) {
  const [selectedUid, setSelectedUid] = useState('');
  const [selectedPid, setSelectedPid] = useState('');

  return (
    <div className="space-y-4 pt-2">
      <div className="flex border-b border-slate-800">
        <button
          type="button"
          onClick={() => setSubtab('usuarios')}
          className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            subtab === 'usuarios'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Personal Asignado ({usuariosAsignados.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubtab('productos')}
          className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            subtab === 'productos'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Inventario Asignado ({productosAsignados.length})</span>
        </button>
      </div>

      {subtab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={selectedUid}
              onChange={(e) => setSelectedUid(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Seleccionar operador disponible...</option>
              {usuariosDisponibles.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre_usuario} ({u.nombre} {u.apellido})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                onAsignarUsuario(selectedUid);
                setSelectedUid('');
              }}
              disabled={!selectedUid}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Asignar</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {usuariosAsignados.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No hay personal asignado a esta sucursal.</p>
            ) : (
              usuariosAsignados.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{u.nombre_usuario}</span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      ({u.nombre} {u.apellido})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDesasignarUsuario(u.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition"
                    title="Desasignar usuario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {subtab === 'productos' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={selectedPid}
              onChange={(e) => setSelectedPid(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Seleccionar producto del catálogo para habilitar...</option>
              {productosDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.codigo}] {p.nombre} ({p.talle} / {p.color})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                onAsignarProducto(selectedPid);
                setSelectedPid('');
              }}
              disabled={!selectedPid}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Habilitar</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {productosAsignados.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No hay productos asignados a esta sucursal.</p>
            ) : (
              productosAsignados.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-slate-800 text-brand-300 px-1.5 py-0.5 rounded">
                      {p.codigo}
                    </span>
                    <span className="font-semibold text-white">{p.nombre}</span>
                    <span className="text-slate-400 text-[11px]">
                      ({p.talle} / {p.color}) - Stock: <strong className="text-emerald-400">{p.stock ?? 0} u.</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDesasignarProducto(p.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition"
                    title="Desasignar producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
