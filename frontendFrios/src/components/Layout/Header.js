import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import AuthContext from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import Modal from '../Common/Modal';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const { data, updateItem } = useContext(DataContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [formData, setFormData] = useState({});
  const dropdownRef = useRef(null);

  // Get user display name
  const getUserName = () => {
    if (!user) return 'Usuario';
    
    // Si el usuario viene del backend con profile
    if (user.profile) {
      return `${user.profile.nombre} ${user.profile.apellido}`;
    }
    
    // Si tiene username, usar eso
    if (user.username) {
      return user.username.replace('admin/servicefrios', 'Administrador');
    }
    
    return 'Usuario';
  };

  // Get user role display
  const getUserRole = () => {
    if (!user) return '';
    const role = user.role || user.userType;
    switch (role) {
      case 'ADMIN':
      case 'admin':
        return 'Administrador';
      case 'TECNICO':
      case 'tecnico':
        return 'Técnico';
      case 'CLIENTE':
      case 'cliente':
        return 'Cliente';
      default:
        return role;
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get user data for settings (memoized to prevent infinite loops)
  const userData = useMemo(() => {
    if (!user) return null;
    
    // Si el usuario viene del backend, usar sus datos directamente
    if (user.profile) {
      return {
        nombre: user.profile.nombre,
        apellido: user.profile.apellido,
        email: user.email,
        telefono: user.profile.telefono || '+51 999 999 999'
      };
    }
    
    // Fallback para datos estáticos
    if (user.role === 'cliente') {
      const cliente = data.clientes.find(c => c.usuario === user.username);
      return cliente;
    } else if (user.role === 'tecnico') {
      const tecnico = data.tecnicos.find(t => t.usuario === user.username);
      return tecnico;
    } else if (user.role === 'admin' || user.role === 'ADMIN') {
      return {
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: user.email || 'admin@sistema.com',
        telefono: '+51 999 999 999'
      };
    }
    return null;
  }, [user, data.clientes, data.tecnicos]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOpenSettings = () => {
    if (userData) {
      setFormData({
        ...userData,
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        email: userData.email || '',
        telefono: userData.telefono || '',
        dni: userData.dni || '',
      });
    }
    setShowSettingsModal(true);
  };

  const handleSaveSettings = () => {
    // Aquí iría la lógica para guardar los cambios
    console.log('Guardando configuración:', formData);
    setShowSettingsModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!user) {
    return null;
  }

  const displayName = getUserName();
  const displayRole = getUserRole();

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center fixed top-0 right-0 left-0 lg:left-[260px] z-10 h-16">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 mr-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-800">PROSERVIS</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {getUserInitials(displayName)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{displayRole}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <button
                  onClick={handleOpenSettings}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configuración
                </button>
                <button
                  onClick={logout}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Configuración de Perfil</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Header;