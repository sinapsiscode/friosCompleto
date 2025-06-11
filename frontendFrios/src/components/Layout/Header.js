import React, { useState, useContext, useRef, useEffect } from 'react';
import AuthContext from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import Modal from '../Common/Modal';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const { data, updateItem } = useContext(DataContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get user display name
  const getUserName = () => {
    if (!user) return 'Usuario';
    
    if (user.role === 'admin') {
      return 'Administrador';
    } else if (user.role === 'cliente') {
      const cliente = data.clientes.find(c => c.usuario === user.username);
      return cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}` || user.username;
    } else if (user.role === 'tecnico') {
      const tecnico = data.tecnicos.find(t => t.usuario === user.username);
      return `${tecnico?.nombre} ${tecnico?.apellido}` || user.username;
    }
    
    return user.username;
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = getUserName();
    if (name === 'Administrador') return 'AD';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get user data for settings
  const getUserData = () => {
    console.log('getUserData - user:', user);
    console.log('getUserData - data:', data);
    
    if (user.role === 'cliente') {
      console.log('Looking for cliente with usuario:', user.username);
      console.log('Available clientes:', data.clientes);
      const cliente = data.clientes.find(c => c.usuario === user.username);
      console.log('Found cliente:', cliente);
      return cliente;
    } else if (user.role === 'tecnico') {
      console.log('Looking for tecnico with usuario:', user.username);
      console.log('Available tecnicos:', data.tecnicos);
      const tecnico = data.tecnicos.find(t => t.usuario === user.username);
      console.log('Found tecnico:', tecnico);
      return tecnico;
    }
    return null;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug formData changes
  useEffect(() => {
    if (showSettingsModal) {
      console.log('FormData updated:', formData);
    }
  }, [formData, showSettingsModal]);

  const handleOpenSettings = () => {
    const userData = getUserData();
    console.log('Opening settings, userData:', userData); // Debug log
    console.log('User role:', user?.role);
    console.log('User username:', user?.username);
    
    // Always show modal
    if (userData) {
      console.log('Setting formData to userData:', userData);
      setFormData({
        ...userData,
        // Ensure all required fields are present
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        email: userData.email || '',
        telefono: userData.telefono || '',
        dni: userData.dni || '',
        ...(user?.role === 'tecnico' && { 
          especialidad: userData.especialidad || 'general', 
          experiencia: userData.experiencia || 0 
        }),
        ...(user?.role === 'cliente' && { 
          direccion: userData.direccion || '', 
          tipo: userData.tipo || 'persona', 
          ciudad: userData.ciudad || 'Lima', 
          distrito: userData.distrito || '' 
        })
      });
      setImagePreview(userData.profileImage || null);
    } else {
      console.log('No userData found, creating default formData');
      // Create default form data based on user role
      setFormData({
        id: null,
        username: user?.username || '',
        role: user?.role || '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        dni: '',
        ...(user?.role === 'cliente' && { direccion: '', tipo: 'persona', ciudad: 'Lima', distrito: '', ruc: '', sector: '' }),
        ...(user?.role === 'tecnico' && { especialidad: 'general', experiencia: 0 })
      });
      setImagePreview(null);
    }
    
    console.log('Final formData will be set shortly...');
    setShowSettingsModal(true);
    setShowDropdown(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    
    const updatedData = {
      ...formData,
      profileImage: imagePreview
    };
    
    if (user?.role === 'cliente') {
      updateItem('clientes', formData.id, updatedData);
    } else if (user?.role === 'tecnico') {
      updateItem('tecnicos', formData.id, updatedData);
    }
    
    setShowSettingsModal(false);
    setProfileImage(null);
    setImagePreview(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  return (
    <>
      <header className="fixed top-0 right-0 left-16 lg:left-[260px] h-16 lg:h-[70px] bg-white shadow-sm flex items-center px-4 lg:px-6 z-[40] border-b border-gray-200">
      <button 
        id="sidebar-toggle" 
        className="lg:hidden bg-none border-none text-xl text-gray-600 cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary"
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars"></i>
      </button>
      
      <div className="flex-1 pl-2 lg:pl-4">
        <h1 className="text-sm lg:text-xl font-semibold text-gray-800 m-0 hidden sm:block">Sistema de Gestión FríoService</h1>
        <h1 className="text-sm font-semibold text-gray-800 m-0 sm:hidden">FríoService</h1>
      </div>
      
      <div className="ml-auto flex items-center gap-2 lg:gap-5">
        <div className="relative cursor-pointer p-1.5 lg:p-2 rounded-lg transition-all duration-200 hover:bg-primary/10">
          <i className="fas fa-bell text-lg lg:text-xl text-gray-700 transition-all duration-200 hover:text-primary hover:scale-110"></i>
          <span className="absolute top-1 right-1 lg:top-2 lg:right-2 bg-danger text-white min-w-[16px] lg:min-w-[18px] h-[16px] lg:h-[18px] text-xs font-semibold flex items-center justify-center rounded-full px-1 border-2 border-white shadow-sm">3</span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-1 lg:gap-2 cursor-pointer p-1.5 lg:p-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {getUserData()?.profileImage ? (
              <img 
                src={getUserData().profileImage} 
                alt={getUserName()} 
                className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs lg:text-sm font-semibold">
                {getUserInitials()}
              </div>
            )}
            <span className="text-xs lg:text-sm font-medium text-gray-800 hidden sm:block">{getUserName()}</span>
            <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'} text-xs text-gray-600 hidden lg:block transition-transform duration-200`}></i>
          </div>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{getUserName()}</p>
                <p className="text-xs text-gray-500">{user.username}</p>
              </div>
              
              <button
                onClick={handleOpenSettings}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <i className="fas fa-user-cog text-gray-400"></i>
                Configuración de perfil
              </button>
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 border-t border-gray-100"
              >
                <i className="fas fa-sign-out-alt text-gray-400"></i>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Configuración de Perfil</h2>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setProfileImage(null);
                  setImagePreview(null);
                }}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                    <i className="fas fa-user text-4xl text-gray-400"></i>
                  </div>
                )}
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <i className="fas fa-times text-sm"></i>
                  </button>
                )}
              </div>
              
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-image-input"
                />
                <label
                  htmlFor="profile-image-input"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <i className="fas fa-camera"></i>
                  <span className="text-sm">Cambiar foto</span>
                </label>
              </div>
            </div>

            
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setProfileImage(null);
                  setImagePreview(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;