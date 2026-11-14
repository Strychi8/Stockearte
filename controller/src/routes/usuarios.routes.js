const express = require('express');
const router = express.Router();
const { usuariosClient } = require('../grpcClients');

/**
 * GET /api/usuarios/no-asignados
 * Obtiene usuarios que no pertenecen a ninguna tienda física.
 */
router.get('/no-asignados', async (req, res) => {
  try {
    const respuesta = await usuariosClient.ObtenerUsuariosNoAsignados({});
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Usuarios] Error al obtener no asignados:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de usuarios: ${error.message}`
    });
  }
});

/**
 * GET /api/usuarios/tienda/:tienda_id
 * Obtiene usuarios pertenecientes a una tienda específica.
 */
router.get('/tienda/:tienda_id', async (req, res) => {
  try {
    const tienda_id = parseInt(req.params.tienda_id, 10);
    if (isNaN(tienda_id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de tienda inválido' });
    }

    const respuesta = await usuariosClient.ObtenerUsuariosPorTienda({ tienda_id });
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Usuarios] Error al obtener usuarios por tienda:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de usuarios: ${error.message}`
    });
  }
});

/**
 * GET /api/usuarios
 * Búsqueda y listado de usuarios con filtros (nombre_usuario, tienda_id).
 */
router.get('/', async (req, res) => {
  try {
    const { nombre_usuario, tienda_id } = req.query;

    const requestPayload = {
      filtro_nombre_usuario: nombre_usuario ? String(nombre_usuario).trim() : ''
    };

    if (tienda_id !== undefined && tienda_id !== '') {
      const parsedTiendaId = parseInt(tienda_id, 10);
      if (!isNaN(parsedTiendaId)) {
        requestPayload.filtro_tienda_id = parsedTiendaId;
      }
    }

    const respuesta = await usuariosClient.BuscarUsuarios(requestPayload);
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Usuarios] Error al buscar usuarios:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de usuarios: ${error.message}`
    });
  }
});

/**
 * GET /api/usuarios/:id
 * Detalle completo de un usuario por su ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de usuario inválido' });
    }

    const respuesta = await usuariosClient.ObtenerUsuario({ id });
    if (!respuesta.exito) {
      return res.status(404).json(respuesta);
    }
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Usuarios] Error al obtener usuario:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de usuarios: ${error.message}`
    });
  }
});

/**
 * POST /api/usuarios
 * Da de alta un nuevo usuario.
 */
router.post('/', async (req, res) => {
  try {
    const { nombre_usuario, contrasenia, nombre, apellido, habilitado, tienda_id } = req.body;

    if (!nombre_usuario || !contrasenia || !nombre || !apellido) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Campos requeridos: nombre_usuario, contrasenia, nombre, apellido'
      });
    }

    const requestPayload = {
      nombre_usuario: String(nombre_usuario).trim(),
      contrasenia: String(contrasenia).trim(),
      nombre: String(nombre).trim(),
      apellido: String(apellido).trim(),
      habilitado: habilitado !== undefined ? Boolean(habilitado) : true
    };

    if (tienda_id !== undefined && tienda_id !== null && tienda_id !== '') {
      const parsedTiendaId = parseInt(tienda_id, 10);
      if (!isNaN(parsedTiendaId) && parsedTiendaId > 0) {
        requestPayload.tienda_id = parsedTiendaId;
      }
    }

    const respuesta = await usuariosClient.CrearUsuario(requestPayload);
    return res.status(respuesta.exito ? 201 : 400).json(respuesta);
  } catch (error) {
    console.error('[Controller Usuarios] Error al crear usuario:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de usuarios: ${error.message}`
    });
  }
});

/**
 * PUT /api/usuarios/:id
 * Modifica los datos de un usuario existente.
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de usuario inválido' });
    }

    const { nombre_usuario, contrasenia, nombre, apellido, habilitado, tienda_id } = req.body;

    const requestPayload = {
      id,
      nombre_usuario: String(nombre_usuario || '').trim(),
      nombre: String(nombre || '').trim(),
      apellido: String(apellido || '').trim(),
      habilitado: habilitado !== undefined ? Boolean(habilitado) : true
    };

    if (contrasenia) {
      requestPayload.contrasenia = String(contrasenia).trim();
    }

    if (tienda_id !== undefined) {
      const parsedTiendaId = parseInt(tienda_id, 10);
      requestPayload.tienda_id = !isNaN(parsedTiendaId) && parsedTiendaId > 0 ? parsedTiendaId : 0;
    }

    const respuesta = await usuariosClient.ModificarUsuario(requestPayload);
    return res.status(respuesta.exito ? 200 : 400).json(respuesta);
  } catch (error) {
    console.error('[Controller Usuarios] Error al modificar usuario:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de usuarios: ${error.message}`
    });
  }
});

/**
 * DELETE /api/usuarios/:id
 * Elimina un usuario por su ID.
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ exito: false, mensaje: 'ID de usuario inválido' });
    }

    const respuesta = await usuariosClient.EliminarUsuario({ id });
    return res.status(respuesta.exito ? 200 : 404).json(respuesta);
  } catch (error) {
    console.error('[Controller Usuarios] Error al eliminar usuario:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de usuarios: ${error.message}`
    });
  }
});

module.exports = router;
