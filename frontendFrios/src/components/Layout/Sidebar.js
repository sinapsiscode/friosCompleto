import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const { data } = useContext(DataContext);

  const adminMenu = [
    { path: '/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { path: '/servicios', icon: 'fa-tools', label: 'Órdenes de Servicio' },
    { path: '/programaciones', icon: 'fa-calendar-alt', label: 'Programaciones' },
    { path: '/solicitar-servicio', icon: 'fa-concierge-bell', label: 'Solicitar Orden de Servicio' },
    { path: '/tecnicos', icon: 'fa-user-cog', label: 'Técnicos' },
    { path: '/clientes', icon: 'fa-users', label: 'Clientes' },
    { path: '/repuestos', icon: 'fa-wrench', label: 'Repuestos' },
    { path: '/estadisticas', icon: 'fa-chart-line', label: 'Estadísticas' },
    { path: '/diagrama', icon: 'fa-chart-gantt', label: 'Diagrama de Gantt' },
    { path: '/configurar-perfil', icon: 'fa-user-circle', label: 'Mi Perfil' },
  ];

  const tecnicoMenu = [
    { path: '/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { path: '/mis-servicios', icon: 'fa-clipboard-list', label: 'Mis Órdenes de Servicio' },
    { path: '/solicitar-servicio', icon: 'fa-concierge-bell', label: 'Solicitar Orden de Servicio' },
    { path: '/mis-evaluaciones', icon: 'fa-search', label: 'Mis Evaluaciones' },
    { path: '/historial-trabajos', icon: 'fa-history', label: 'Historial' },
  ];

  const clienteMenu = [
    { path: '/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { path: '/solicitar-servicio', icon: 'fa-concierge-bell', label: 'Solicitar Orden de Servicio' },
    { path: '/mis-equipos', icon: 'fa-snowflake', label: 'Mis Equipos' },
    { path: '/evaluaciones', icon: 'fa-star', label: 'Evaluaciones' }
  ];

  const getMenu = () => {
    const userType = user?.userType || user?.role?.toLowerCase();
    switch (userType) {
      case 'admin':
        return adminMenu;
      case 'tecnico':
        return tecnicoMenu;
      case 'cliente':
        return clienteMenu;
      default:
        return [];
    }
  };

  const getUserRole = () => {
    const userType = user?.userType || user?.role?.toLowerCase();
    switch (userType) {
      case 'admin':
        return 'Administrador';
      case 'tecnico':
        return 'Técnico';
      case 'cliente':
        return 'Cliente';
      default:
        return 'Usuario';
    }
  };

  const getUserData = () => {
    const userType = user?.userType || user?.role?.toLowerCase();
    if (userType === 'cliente') {
      return data.clientes.find(c => c.usuario === user.username);
    } else if (userType === 'tecnico') {
      return data.tecnicos.find(t => t.usuario === user.username);
    }
    return null;
  };

  return (
    <>
      {/* Overlay para mobile */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[49] lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}
      
      <nav className={`${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64 lg:w-[260px]'} h-screen bg-white border-r border-gray-200 z-[50] overflow-y-auto fixed top-0 left-0 flex flex-col transition-all duration-300 shadow-lg lg:shadow-none`}>
      <div className="flex items-center justify-center lg:justify-start px-5 py-6 bg-gradient-to-br from-primary to-primary-dark text-white h-[70px] relative shadow-md">
        <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-white">
          <img src="/logo.png" alt="PROSERVIS Logo" className="w-8 h-8 object-contain" />
        </div>
        <h2 className={`m-0 ml-3 text-xl font-semibold whitespace-nowrap -tracking-wide ${collapsed ? 'lg:hidden' : 'block'}`}>PROSERVIS</h2>
      </div>
      
      <div className="flex items-center justify-center lg:justify-start px-5 py-6 bg-gray-50 border-b border-gray-200 mb-2">
        {getUserData()?.profileImage ? (
          <img 
            src={getUserData().profileImage} 
            alt={user?.username} 
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
            {(user?.userType || user?.role?.toLowerCase()) === 'admin' ? 'AD' : 
             (user?.userType || user?.role?.toLowerCase()) === 'cliente' ? (getUserData()?.tipo === 'empresa' ? getUserData()?.razonSocial?.charAt(0)?.toUpperCase() || 'C' : `${getUserData()?.nombre?.charAt(0) || ''}${getUserData()?.apellido?.charAt(0) || ''}`.toUpperCase() || 'C') :
             (user?.userType || user?.role?.toLowerCase()) === 'tecnico' ? `${getUserData()?.nombre?.charAt(0) || ''}${getUserData()?.apellido?.charAt(0) || ''}`.toUpperCase() || 'T' :
             'U'}
          </div>
        )}
        <div className={`ml-3 ${collapsed ? 'lg:hidden' : 'block'}`}>
          <h3 className="m-0 text-[15px] font-semibold text-gray-900">{user?.username}</h3>
          <p className="m-0 text-xs text-gray-600 mt-0.5">{getUserRole()}</p>
        </div>
      </div>
      
      <ul className="list-none py-2 m-0 flex-1">
        {getMenu().map((item) => (
          <li key={item.path} className="relative">
            <NavLink 
              to={item.path} 
              className={({ isActive }) => 
                `flex items-center ${collapsed ? 'justify-center lg:justify-center' : 'justify-start'} py-3 px-5 no-underline transition-all duration-200 mx-3 rounded-lg text-[15px] ${
                  isActive
                    ? 'bg-gradient-to-br from-primary to-primary-dark text-white font-medium shadow-lg shadow-primary/25 hover:shadow-xl' 
                    : 'text-gray-700 font-normal hover:bg-primary/10 hover:text-primary hover:translate-x-0.5'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <i className={`fas ${item.icon} ${collapsed ? '' : 'mr-3'} min-w-[22px] text-center text-lg`}></i>
              <span className={collapsed ? 'lg:hidden' : 'block'}>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      
      <div className="mt-auto py-4 border-t border-gray-200 px-3">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); logout(); }}
          className={`flex items-center ${collapsed ? 'justify-center lg:justify-center' : 'justify-start'} py-3.5 px-4 text-danger no-underline transition-all duration-200 rounded-lg text-[15px] font-medium hover:bg-danger hover:text-white hover:-translate-y-px hover:shadow-md hover:shadow-danger/25`}
          title={collapsed ? 'Cerrar Sesión' : undefined}
        >
          <i className={`fas fa-sign-out-alt ${collapsed ? '' : 'mr-3'} min-w-[22px] text-center text-lg`}></i>
          <span className={collapsed ? 'lg:hidden' : 'block'}>Cerrar Sesión</span>
        </a>
      </div>
    </nav>
    </>
  );
};

export default Sidebar;