const express = require('express');
const router = express.Router();
const { tiendasClient, usuariosClient, productosClient } = require('../grpcClients');

/**
 * GET /api/tiendas
 * Búsqueda y listado de tiendas (filtros: codigo, habilitada).
 */
router.get('/', async (req, res) => {
  try {
    const { codigo, habilitada } = req.query;

    const requestPayload = {
      filtro_codigo: codigo ? String(codigo).trim() : ''
    };

    if (habilitada !== undefined && habilitada !== '') {
      requestPayload.filtro_habilitada = habilitada === 'true' || habilitada === true;
    }

    const respuesta = await tiendasClient.BuscarTiendas(requestPayload);
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al buscar tiendas:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

/**
 * GET /api/tiendas/:id
 * Detalle completo de una tienda por ID numérico o por código.
 */
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    const isNum = /^\d+$/.test(param);

    const requestPayload = {};
    if (isNum) {
      requestPayload.id = parseInt(param, 10);
    } else {
      requestPayload.codigo = String(param).trim();
    }

    const respuesta = await tiendasClient.ObtenerTienda(requestPayload);
    if (!respuesta.exito) {
      return res.status(404).json(respuesta);
    }
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al obtener tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

/**
 * POST /api/tiendas
 * Alta de una nueva tienda física.
 */
router.post('/', async (req, res) => {
  try {
    const { codigo, direccion, ciudad, provincia, habilitada } = req.body;

    if (!codigo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El código de la tienda es obligatorio'
      });
    }

    const requestPayload = {
      codigo: String(codigo).trim(),
      direccion: String(direccion || '').trim(),
      ciudad: String(ciudad || '').trim(),
      provincia: String(provincia || '').trim(),
      habilitada: habilitada !== undefined ? Boolean(habilitada) : true
    };

    const respuesta = await tiendasClient.CrearTienda(requestPayload);
    return res.status(respuesta.exito ? 201 : 400).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al crear tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

/**
 * PUT /api/tiendas/:id
 * Modificación completa de una tienda existente.
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }

    const { codigo, direccion, ciudad, provincia, habilitada } = req.body;
    if (!codigo) {
      return res.status(400).json({ exito: false, mensaje: 'El código de la tienda es obligatorio' });
    }

    const requestPayload = {
      id,
      codigo: String(codigo).trim(),
      direccion: String(direccion || '').trim(),
      ciudad: String(ciudad || '').trim(),
      provincia: String(provincia || '').trim(),
      habilitada: habilitada !== undefined ? Boolean(habilitada) : true
    };

    const respuesta = await tiendasClient.ModificarTienda(requestPayload);
    return res.status(respuesta.exito ? 200 : 400).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al modificar tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

/**
 * DELETE /api/tiendas/:id
 * Eliminación de una tienda.
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }

    const respuesta = await tiendasClient.EliminarTienda({ id });
    return res.status(respuesta.exito ? 200 : 404).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al eliminar tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

/**
 * PATCH /api/tiendas/:id/estado
 * Cambia el estado entre habilitada e inhabilitada.
 */
router.patch('/:id/estado', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }

    const { habilitada } = req.body;
    if (habilitada === undefined) {
      return res.status(400).json({ exito: false, mensaje: "Debe especificar el campo booleano 'habilitada'" });
    }

    const respuesta = await tiendasClient.CambiarEstadoTienda({
      id,
      habilitada: Boolean(habilitada)
    });

    return res.status(respuesta.exito ? 200 : 404).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al cambiar estado de tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

/**
 * GET /api/tiendas/:id/usuarios
 * Obtiene la lista de usuarios asignados a una tienda específica.
 */
router.get('/:id/usuarios', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.id, 10);
    if (isNaN(tienda_id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }
    const respuesta = await usuariosClient.ObtenerUsuariosPorTienda({ tienda_id });
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al obtener usuarios por tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de usuarios: ${error.message}`
    });
  }
});

/**
 * GET /api/tiendas/:id/productos
 * Obtiene la lista de productos asociados a una tienda específica.
 */
router.get('/:id/productos', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.id, 10);
    if (isNaN(tienda_id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }
    const respuesta = await productosClient.ObtenerProductosPorTienda({ tienda_id });
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al obtener productos por tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

/**
 * GET /api/tiendas/:id/productos-disponibles
 * Obtiene los productos del catálogo que no están asignados a la tienda.
 */
router.get('/:id/productos-disponibles', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.id, 10);
    if (isNaN(tienda_id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }
    const respuesta = await productosClient.ObtenerProductosNoAsignados({ tienda_id });
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al obtener productos no asignados:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de productos: ${error.message}`
    });
  }
});

/**
 * POST /api/tiendas/:id/usuarios
 * Asigna una lista de IDs de usuarios a la tienda y sincroniza en el servicio de usuarios.
 */
router.post('/:id/usuarios', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.id, 10);
    if (isNaN(tienda_id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }

    const { usuario_ids } = req.body;
    if (!Array.isArray(usuario_ids) || usuario_ids.length === 0) {
      return res.status(400).json({ exito: false, mensaje: "Debe enviar un array 'usuario_ids'" });
    }

    const parsedIds = usuario_ids.map(Number).filter(n => !isNaN(n));
    const respuesta = await tiendasClient.AsignarUsuarios({
      tienda_id,
      usuario_ids: parsedIds
    });

    // Sincronizar en el microservicio de usuarios para actualizar tienda_id
    for (const uid of parsedIds) {
      try {
        const uData = await usuariosClient.ObtenerUsuario({ id: uid });
        if (uData.exito && uData.usuario) {
          await usuariosClient.ModificarUsuario({
            id: uid,
            nombre_usuario: uData.usuario.nombre_usuario,
            nombre: uData.usuario.nombre,
            apellido: uData.usuario.apellido,
            habilitado: uData.usuario.habilitado,
            tienda_id: tienda_id
          });
        }
      } catch (errSync) {
        console.warn(`[Controller Tiendas] No se pudo sincronizar usuario ${uid}:`, errSync.message);
      }
    }

    return res.status(respuesta.exito ? 200 : 400).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al asignar usuarios a tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

/**
 * DELETE /api/tiendas/:id/usuarios/:usuario_id
 * Desasigna un usuario de la tienda y lo reasigna a Casa Central (tienda_id = 0).
 */
router.delete('/:id/usuarios/:usuario_id', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.id, 10);
    const usuario_id = parseInt(req.params.usuario_id, 10);

    if (isNaN(tienda_id) || isNaN(usuario_id)) {
      return res.status(400).json({ exito: false, mensaje: 'IDs inválidos' });
    }

    const respuesta = await tiendasClient.DesasignarUsuario({ tienda_id, usuario_id });

    // Sincronizar en el microservicio de usuarios (tienda_id = 0)
    try {
      const uData = await usuariosClient.ObtenerUsuario({ id: usuario_id });
      if (uData.exito && uData.usuario) {
        await usuariosClient.ModificarUsuario({
          id: usuario_id,
          nombre_usuario: uData.usuario.nombre_usuario,
          nombre: uData.usuario.nombre,
          apellido: uData.usuario.apellido,
          habilitado: uData.usuario.habilitado,
          tienda_id: 0
        });
      }
    } catch (errSync) {
      console.warn(`[Controller Tiendas] No se pudo sincronizar desasignación del usuario ${usuario_id}:`, errSync.message);
    }

    return res.status(respuesta.exito ? 200 : 404).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al desasignar usuario de tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

/**
 * POST /api/tiendas/:id/productos
 * Asigna una lista de IDs de productos a la tienda e inicializa su stock en 0.
 */
router.post('/:id/productos', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.id, 10);
    if (isNaN(tienda_id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }

    const { producto_ids } = req.body;
    if (!Array.isArray(producto_ids) || producto_ids.length === 0) {
      return res.status(400).json({ exito: false, mensaje: "Debe enviar un array 'producto_ids'" });
    }

    const parsedIds = producto_ids.map(Number).filter(n => !isNaN(n));
    const respuesta = await tiendasClient.AsignarProductos({
      tienda_id,
      producto_ids: parsedIds
    });

    // Sincronizar en el microservicio de productos para inicializar stock en 0
    for (const pid of parsedIds) {
      try {
        await productosClient.ModificarStock({
          producto_id: pid,
          tienda_id,
          nuevo_stock: 0
        });
      } catch (errSync) {
        console.warn(`[Controller Tiendas] No se pudo inicializar stock para producto ${pid}:`, errSync.message);
      }
    }

    return res.status(respuesta.exito ? 200 : 400).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al asignar productos a tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

/**
 * DELETE /api/tiendas/:id/productos/:producto_id
 * Desasigna un producto de la tienda.
 */
router.delete('/:id/productos/:producto_id', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.id, 10);
    const producto_id = parseInt(req.params.producto_id, 10);

    if (isNaN(tienda_id) || isNaN(producto_id)) {
      return res.status(400).json({ exito: false, mensaje: 'IDs inválidos' });
    }

    const respuesta = await tiendasClient.DesasignarProducto({ tienda_id, producto_id });
    return res.status(respuesta.exito ? 200 : 404).json(respuesta);
  } catch (error) {
    console.error('[Controller Tiendas] Error al desasignar producto de tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de tiendas: ${error.message}`
    });
  }
});

module.exports = router;
