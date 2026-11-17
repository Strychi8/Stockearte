import { request } from '../../../config/api';

// Servicio para gestionar las peticiones HTTP del módulo de autenticación de usuarios.
// Envía las credenciales al endpoint /login del backend y retorna los datos del operador autenticado.

export const authService = {
  /**
   * Inicia sesión con nombre de usuario y contraseña.
   */
  async login(nombre_usuario, contrasenia) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nombre_usuario, contrasenia })
    });
  }
};

export default authService;
