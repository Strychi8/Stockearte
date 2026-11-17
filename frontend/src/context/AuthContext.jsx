import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../features/auth';

// Contexto global para administrar la sesión de usuario, credenciales y roles (Casa Central / Tienda).
// Provee persistencia del estado en LocalStorage y métodos de inicio y cierre de sesión para toda la app.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockearte_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('stockearte_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('stockearte_user');
    }
  }, [user]);

  const login = async (nombre_usuario, contrasenia) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(nombre_usuario, contrasenia);
      if (data.exito && data.usuario) {
        setUser(data.usuario);
        return { success: true };
      } else {
        const errorMsg = data.mensaje || 'Nombre de usuario o contraseña incorrectos';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      let msg = 'No se pudo conectar con el servicio de autenticación. Intente nuevamente en unos instantes.';
      
      if (err.status === 401) {
        msg = err.message || 'Nombre de usuario o contraseña incorrectos';
      } else if (err.status === 403) {
        msg = 'Acceso denegado: el usuario no se encuentra habilitado para operar';
      } else if (err.status === 404 || err.status === 500) {
        msg = 'El servicio de autenticación no se encuentra disponible temporalmente. Intente más tarde.';
      } else if (err.message && !err.message.includes('Ruta no encontrada') && !err.message.includes('Error HTTP') && !err.message.includes('fetch')) {
        msg = err.message;
      }
      
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
  };

  const isCasaCentral = user?.rol === 'CASA_CENTRAL';
  const isTienda = user?.rol === 'TIENDA';

  return (
    <AuthContext.Provider
      value={{
        user,
        isCasaCentral,
        isTienda,
        loading,
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
