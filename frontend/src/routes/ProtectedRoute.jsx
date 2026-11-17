import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Control de seguridad que revisa si el usuario inició sesión y a qué pantallas puede entrar.
// Si no inició sesión, lo envía a ingresar al sistema; si no tiene permisos, lo lleva al catálogo de productos.

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Si el usuario no tiene permisos para esta ruta (ej. TIENDA queriendo entrar a /tiendas)
    return <Navigate to="/productos" replace />;
  }

  return children ? children : <Outlet />;
}
