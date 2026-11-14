const express = require('express');
const router = express.Router();
const { productosClient } = require('../grpcClients');

/**
 * GET /api/productos/tienda/:tienda_id
 * Obtiene los productos asignados a una tienda específica.
 */
router.get('/tienda/:tienda_id', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.tienda_id, 10);
    if (isNaN(tienda_id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }

    const respuesta = await productosClient.ObtenerProductosPorTienda({ tienda_id });
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Productos] Error al obtener productos por tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

/**
 * GET /api/productos/no-asignados/:tienda_id
 * Obtiene los productos del catálogo general que no están asignados a la tienda dada.
 */
router.get('/no-asignados/:tienda_id', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.tienda_id, 10);
    if (isNaN(tienda_id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }

    const respuesta = await productosClient.ObtenerProductosNoAsignados({ tienda_id });
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Productos] Error al obtener productos no asignados:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

/**
 * GET /api/productos
 * Búsqueda y listado de productos con filtros combinables (nombre, código, talle, color).
 * Si se envía tienda_id_usuario, restringe los productos a los de esa tienda.
 */
router.get('/', async (req, res) => {
  try {
    const { nombre, codigo, talle, color, tienda_id_usuario } = req.query;

    const requestPayload = {
      filtro_nombre: nombre ? String(nombre).trim() : '',
      filtro_codigo: codigo ? String(codigo).trim() : '',
      filtro_talle: talle ? String(talle).trim() : '',
      filtro_color: color ? String(color).trim() : ''
    };

    if (tienda_id_usuario !== undefined && tienda_id_usuario !== '') {
      const parsedTiendaId = parseInt(tienda_id_usuario, 10);
      if (!isNaN(parsedTiendaId) && parsedTiendaId > 0) {
        requestPayload.tienda_id_usuario = parsedTiendaId;
      }
    }

    const respuesta = await productosClient.BuscarProductos(requestPayload);
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Productos] Error al buscar productos:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

/**
 * GET /api/productos/:id
 * Detalle completo de un producto con desglose de stock.
 * Si se incluye ?tienda_id_solicitante=X, solo devuelve el stock de esa sucursal.
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de producto inválido' });
    }

    const requestPayload = { id };
    const { tienda_id_solicitante } = req.query;
    if (tienda_id_solicitante !== undefined && tienda_id_solicitante !== '') {
      const parsedTid = parseInt(tienda_id_solicitante, 10);
      if (!isNaN(parsedTid) && parsedTid > 0) {
        requestPayload.tienda_id_solicitante = parsedTid;
      }
    }

    const respuesta = await productosClient.ObtenerProducto(requestPayload);
    if (!respuesta.exito) {
      return res.status(404).json(respuesta);
    }
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Productos] Error al obtener producto:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

/**
 * POST /api/productos
 * Alta de producto con generación aleatoria de código único de 10 caracteres
 * y asignación opcional inicial a tiendas con stock 0.
 */
router.post('/', async (req, res) => {
  try {
    const { nombre, talle, color, foto, tienda_ids } = req.body;

    if (!nombre || !talle || !color) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Campos requeridos: nombre, talle, color'
      });
    }

    const requestPayload = {
      nombre: String(nombre).trim(),
      talle: String(talle).trim(),
      color: String(color).trim(),
      foto: String(foto || '').trim(),
      tienda_ids: Array.isArray(tienda_ids) ? tienda_ids.map(Number).filter(n => !isNaN(n)) : []
    };

    const respuesta = await productosClient.CrearProducto(requestPayload);
    return res.status(respuesta.exito ? 201 : 400).json(respuesta);
  } catch (error) {
    console.error('[Controller Productos] Error al crear producto:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

/**
 * PUT /api/productos/:id
 * Modifica datos descriptivos de un producto (nombre, talle, color, foto).
 * El código de 10 caracteres permanece inmutable.
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de producto inválido' });
    }

    const { nombre, talle, color, foto } = req.body;
    if (!nombre || !talle || !color) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Campos requeridos: nombre, talle, color'
      });
    }

    const requestPayload = {
      id,
      nombre: String(nombre).trim(),
      talle: String(talle).trim(),
      color: String(color).trim(),
      foto: String(foto || '').trim()
    };

    const respuesta = await productosClient.ModificarProducto(requestPayload);
    return res.status(respuesta.exito ? 200 : 400).json(respuesta);
  } catch (error) {
    console.error('[Controller Productos] Error al modificar producto:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

/**
 * PUT /api/productos/:id/stock
 * Modifica el stock de un producto para una tienda específica.
 */
router.put('/:id/stock', async (req, res) => {
  try {
    const producto_id = parseInt(req.params.id, 10);
    if (isNaN(producto_id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de producto inválido' });
    }

    const { tienda_id, nuevo_stock } = req.body;
    const parsedTiendaId = parseInt(tienda_id, 10);
    const parsedStock = parseInt(nuevo_stock, 10);

    if (isNaN(parsedTiendaId) || isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({
        exito: false,
        mensaje: "Debe ingresar 'tienda_id' válido y 'nuevo_stock' mayor o igual a 0"
      });
    }

    const respuesta = await productosClient.ModificarStock({
      producto_id,
      tienda_id: parsedTiendaId,
      nuevo_stock: parsedStock
    });

    return res.status(respuesta.exito ? 200 : 400).json(respuesta);
  } catch (error) {
    console.error('[Controller Productos] Error al modificar stock:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

/**
 * DELETE /api/productos/:id
 * Elimina un producto del catálogo.
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de producto inválido' });
    }

    const respuesta = await productosClient.EliminarProducto({ id });
    return res.status(respuesta.exito ? 200 : 404).json(respuesta);
  } catch (error) {
    console.error('[Controller Productos] Error al eliminar producto:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

module.exports = router;
