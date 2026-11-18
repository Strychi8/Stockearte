import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Store, Users, Package, LogOut } from 'lucide-react';

// Barra de navegación superior con enlaces a las secciones disponibles según el rol.
// Muestra la identidad de la tienda o Casa Central y permite cerrar la sesión activa.
export default function Navbar() {
  const { user, isCasaCentral, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    `px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logotipo y nombre del sistema */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-inner group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
                Stockearte
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1.5">
                {isCasaCentral ? (
                  'Casa Central — Admin'
                ) : (
                  <>
                    <span>Tienda: {user?.codigo_tienda || 'Sucursal'}</span>
                    {user?.tienda_habilitada === false && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[9px] font-bold normal-case">
                        Inhabilitada
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          </NavLink>

          {/* Enlaces de navegación */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {isCasaCentral && (
              <>
                <NavLink to="/tiendas" id="tab-tiendas" className={navItemClass}>
                  <Store className="w-4 h-4" />
                  <span>Tiendas</span>
                </NavLink>

                <NavLink to="/usuarios" id="tab-usuarios" className={navItemClass}>
                  <Users className="w-4 h-4" />
                  <span>Usuarios</span>
                </NavLink>
              </>
            )}

            <NavLink to="/productos" id="tab-productos" className={navItemClass}>
              <Package className="w-4 h-4" />
              <span>Productos</span>
            </NavLink>
          </nav>

          {/* Perfil del operador y cierre de sesión */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-white">
                {user?.nombre ? `${user.nombre} ${user.apellido || ''}` : user?.nombre_usuario}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                @{user?.nombre_usuario}
              </span>
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
