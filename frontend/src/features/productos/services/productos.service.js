import { request } from '../../../config/api';

// Servicio para gestionar las peticiones REST asociadas al catálogo de productos y stock distribuido.
// Permite consultar artículos, dar de alta con código autogenerado y actualizar unidades por sucursal.

export const productosService = {
  async getProductos(params = {}) {
    const query = new URLSearchParams();
    if (params.nombre) query.append('nombre', params.nombre);
    if (params.codigo) query.append('codigo', params.codigo);
    if (params.talle) query.append('talle', params.talle);
    if (params.color) query.append('color', params.color);
    if (params.tienda_id_usuario) query.append('tienda_id_usuario', params.tienda_id_usuario);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request(`/productos${qStr}`);
  },

  async getProducto(id, tiendaId = null) {
    const qStr = tiendaId ? `?tienda_id=${tiendaId}` : '';
    return request(`/productos/${id}${qStr}`);
  },

  async getProductosPorTienda(tiendaId) {
    return request(`/productos/tienda/${tiendaId}`);
  },

  async getProductosNoAsignadosTienda(tiendaId) {
    return request(`/productos/no-asignados/${tiendaId}`);
  },

  async createProducto(payload) {
    return request('/productos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateProducto(id, payload) {
    return request(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async updateStock(productoId, tiendaId, stock) {
    return request(`/productos/${productoId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ tienda_id: tiendaId, stock, nuevo_stock: stock })
    });
  },

  async deleteProducto(id) {
    return request(`/productos/${id}`, {
      method: 'DELETE'
    });
  }
};

export default productosService;
