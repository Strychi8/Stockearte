import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

// Estructura visual principal que envuelve las páginas de la aplicación autenticada.
// Integra la barra de navegación superior fija, el contenido dinámico (<Outlet />) y el pie de página.
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
