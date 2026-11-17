import { request } from '../../../config/api';

// Servicio para consumir los endpoints REST del microservicio de Usuarios.
// Implementa operaciones CRUD, listados con filtros por sucursal y consulta de operadores sin asignar.

export const usuariosService = {
  async getUsuarios(params = {}) {
    const query = new URLSearchParams();
    if (params.nombre_usuario) query.append('nombre_usuario', params.nombre_usuario);
    if (params.tienda_id) query.append('tienda_id', params.tienda_id);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request(`/usuarios${qStr}`);
  },

  async getUsuario(id) {
    return request(`/usuarios/${id}`);
  },

  async getUsuariosNoAsignados() {
    return request('/usuarios/no-asignados');
  },

  async getUsuariosPorTienda(tiendaId) {
    return request(`/usuarios/tienda/${tiendaId}`);
  },

  async createUsuario(payload) {
    return request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateUsuario(id, payload) {
    return request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteUsuario(id) {
    return request(`/usuarios/${id}`, {
      method: 'DELETE'
    });
  }
};

export default usuariosService;
