import { request } from '../../../config/api';

// Servicio para interactuar con los endpoints REST del microservicio de Tiendas.
// Provee operaciones CRUD, cambio de estado de sucursales y asignación de personal e inventario.

export const tiendasService = {
  async getTiendas(params = {}) {
    const query = new URLSearchParams();
    if (params.codigo) query.append('codigo', params.codigo);
    if (params.habilitada !== undefined && params.habilitada !== '') {
      query.append('habilitada', params.habilitada);
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request(`/tiendas${qStr}`);
  },

  async getTienda(id) {
    return request(`/tiendas/${id}`);
  },

  async createTienda(payload) {
    return request('/tiendas', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateTienda(id, payload) {
    return request(`/tiendas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteTienda(id) {
    return request(`/tiendas/${id}`, {
      method: 'DELETE'
    });
  },

  async cambiarEstadoTienda(id, habilitada) {
    return request(`/tiendas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ habilitada })
    });
  },

  async getUsuariosPorTienda(tiendaId) {
    return request(`/tiendas/${tiendaId}/usuarios`);
  },

  async getProductosPorTienda(tiendaId) {
    return request(`/tiendas/${tiendaId}/productos`);
  },

  async getProductosNoAsignadosTienda(tiendaId) {
    return request(`/tiendas/${tiendaId}/productos-disponibles`);
  },

  async asignarUsuariosTienda(tiendaId, usuarioIds) {
    return request(`/tiendas/${tiendaId}/usuarios`, {
      method: 'POST',
      body: JSON.stringify({ usuario_ids: usuarioIds })
    });
  },

  async desasignarUsuarioTienda(tiendaId, usuarioId) {
    return request(`/tiendas/${tiendaId}/usuarios/${usuarioId}`, {
      method: 'DELETE'
    });
  },

  async asignarProductosTienda(tiendaId, productoIds) {
    return request(`/tiendas/${tiendaId}/productos`, {
      method: 'POST',
      body: JSON.stringify({ producto_ids: productoIds })
    });
  },

  async desasignarProductoTienda(tiendaId, productoId) {
    return request(`/tiendas/${tiendaId}/productos/${productoId}`, {
      method: 'DELETE'
    });
  }
};

export default tiendasService;
