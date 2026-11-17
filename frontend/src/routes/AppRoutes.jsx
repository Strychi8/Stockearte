import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import { LoginView } from '../features/auth';
import { TiendasView } from '../features/tiendas';
import { UsuariosView } from '../features/usuarios';
import { ProductosView } from '../features/productos';

// Organiza la navegación y las diferentes pantallas del sistema (ingreso, tiendas, usuarios y productos).
// Coordina los accesos para que cada persona ingrese únicamente a los sectores que tiene autorizados.

export default function AppRoutes() {
  const { user, isCasaCentral } = useAuth();

  return (
    <Routes>
      {/* Ruta pública de Login. Si ya está logueado, redirige a inicio */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginView />}
      />

      {/* Rutas protegidas dentro del MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Ruta raíz: redirige a la vista principal según el rol */}
          <Route
            path="/"
            element={<Navigate to={isCasaCentral ? '/tiendas' : '/productos'} replace />}
          />

          {/* Rutas exclusivas para Casa Central */}
          <Route element={<ProtectedRoute allowedRoles={['CASA_CENTRAL']} />}>
            <Route path="/tiendas" element={<TiendasView />} />
            <Route path="/usuarios" element={<UsuariosView />} />
          </Route>

          {/* Ruta accesible para ambos roles (Casa Central y Tiendas) */}
          <Route path="/productos" element={<ProductosView />} />
        </Route>
      </Route>

      {/* Redirección por defecto ante rutas desconocidas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
