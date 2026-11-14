const express = require('express');
const router = express.Router();
const { usuariosClient } = require('../grpcClients');

/**
 * POST /api/auth/login
 * Autentica credenciales contra el microservicio gRPC de Usuarios.
 */
router.post('/login', async (req, res) => {
  try {
    const { nombre_usuario, contrasenia } = req.body;

    if (!nombre_usuario || !contrasenia) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe ingresar nombre de usuario y contraseña'
      });
    }

    const respuesta = await usuariosClient.Autenticar({
      nombre_usuario: String(nombre_usuario).trim(),
      contrasenia: String(contrasenia).trim()
    });

    if (!respuesta.exito) {
      return res.status(401).json(respuesta);
    }

    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('[Controller Auth] Error al autenticar:', error);
    return res.status(500).json({
      exito: false,
      mensaje: `Error al conectar con el servicio de usuarios: ${error.message}`
    });
  }
});

module.exports = router;
