import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import Modal from '../../components/Common/Modal';
import EquipoForm from '../../components/Forms/EquipoForm';
import clienteService from '../../services/cliente.service';

const MisEquipos = () => {
  const { data, deleteItem, removeEquipoFromCliente } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [clienteActual, setClienteActual] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [equipoToDelete, setEquipoToDelete] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Utility function to reset localStorage if needed (for debugging)
  const resetLocalStorage = () => {
    console.log('🔄 Resetting localStorage...');
    localStorage.removeItem('frioServiceData');
    window.location.reload();
  };

  // Cargar información del cliente desde el backend
  useEffect(() => {
    const loadClienteData = async () => {
      console.log('🔍 === MIS EQUIPOS - CARGA DE DATOS ===');
      console.log('👤 Usuario logueado:', user);
      
      if (!user || (user.userType !== 'cliente' && user.role !== 'CLIENTE')) {
        console.log('❌ Usuario no es cliente');
        setIsLoadingData(false);
        return;
      }

      try {
        setIsLoadingData(true);
        console.log('🔄 Cargando información del cliente desde backend...');
        
        const miInfoResponse = await clienteService.getMe();
        
        if (miInfoResponse.success && miInfoResponse.data) {
          console.log('✅ Mi información cargada en MisEquipos:', miInfoResponse.data);
          console.log('🔧 Equipos encontrados:', miInfoResponse.data.equipos?.length || 0);
          setClienteActual(miInfoResponse.data);
        } else {
          console.log('⚠️ No se pudo cargar mi información, usando fallback');
          // Fallback con datos estáticos
          const clienteEstatico = {
            id: 'cliente-demo',
            usuario: user?.username || 'cliente',
            nombre: 'Cliente',
            apellido: 'Demo',
            razonSocial: 'Empresa Demo S.A.C.',
            equipos: []
          };
          setClienteActual(clienteEstatico);
        }
      } catch (error) {
        console.error('❌ Error cargando datos del cliente:', error);
        setClienteActual(null);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadClienteData();
  }, [user]);

  // Usar directamente los equipos del cliente que vienen del backend
  const misEquipos = clienteActual?.equipos || [];
  
  console.log('🔍 === DEBUGGING EQUIPOS FILTERING ===');
  console.log('👤 clienteActual:', clienteActual);
  console.log('📋 clienteActual.equipos:', clienteActual?.equipos);
  console.log('🎯 misEquipos (desde backend):', misEquipos);
  console.log('📊 misEquipos.length:', misEquipos.length);

  const filteredEquipos = misEquipos.filter(equipo => {
    const matchesSearch = (equipo.marca?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (equipo.modelo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (equipo.ubicacion?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || equipo.tipo === filterTipo;
    const matchesEstado = filterEstado === 'todos' || equipo.estadoOperativo === filterEstado;
    
    return matchesSearch && matchesTipo && matchesEstado;
  });

  console.log('🎯 filteredEquipos (después de filtros de búsqueda):', filteredEquipos);
  console.log('📊 filteredEquipos.length:', filteredEquipos.length);

  const handleNuevoEquipo = () => {
    setSelectedEquipo(null);
    setShowModal(true);
  };

  const handleEditEquipo = (equipo) => {
    setSelectedEquipo(equipo);
    setShowModal(true);
  };

  const handleDeleteClick = (equipo) => {
    setEquipoToDelete(equipo);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (equipoToDelete && clienteActual) {
      // Eliminar equipo de la lista general
      deleteItem('equipos', equipoToDelete.id);
      // Eliminar referencia del equipo en el cliente
      removeEquipoFromCliente(clienteActual.id, equipoToDelete.id);
      setShowDeleteConfirm(false);
      setEquipoToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setEquipoToDelete(null);
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'operativo': return 'success';
      case 'mantenimiento': return 'warning';
      case 'reparacion': return 'danger';
      default: return 'secondary';
    }
  };

  // Mostrar indicador de carga
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mis equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header minimalista */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">Mis Equipos</h1>
              <p className="text-gray-500">Gestiona y monitorea el estado de tus equipos de refrigeración</p>
            </div>
          </div>
        </div>

        {/* Estadísticas minimalistas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-100 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Operativos</p>
                <p className="text-2xl font-light text-gray-900">{filteredEquipos.filter(e => e.estadoOperativo === 'operativo').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-100 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">En mantenimiento</p>
                <p className="text-2xl font-light text-gray-900">{filteredEquipos.filter(e => e.estadoOperativo === 'mantenimiento').length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-100 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total equipos</p>
                <p className="text-2xl font-light text-gray-900">{filteredEquipos.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de filtros minimalista */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Buscar por marca, modelo o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={filterTipo} 
                onChange={(e) => setFilterTipo(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="todos">Todos los tipos</option>
                <option value="refrigeradora">Refrigeradora</option>
                <option value="congeladora">Congeladora</option>
                <option value="frigobar">Frigobar</option>
                <option value="camara">Cámara frigorífica</option>
              </select>
              
              <select 
                value={filterEstado} 
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="operativo">Operativo</option>
                <option value="mantenimiento">En Mantenimiento</option>
                <option value="reparacion">En Reparación</option>
              </select>
              
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  className={`px-3 py-2 transition-all duration-200 ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setViewMode('grid')}
                  title="Vista de cuadrícula"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                  </svg>
                </button>
                <button 
                  className={`px-3 py-2 transition-all duration-200 ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setViewMode('list')}
                  title="Vista de lista"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
              </div>
              
              <button 
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center gap-2"
                onClick={handleNuevoEquipo}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Nuevo Equipo</span>
              </button>
            </div>
          </div>
        </div>

        {filteredEquipos.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron equipos</h3>
              <p className="text-gray-500 mb-6">No tiene equipos que coincidan con los filtros seleccionados</p>
              <button 
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 inline-flex items-center gap-2"
                onClick={handleNuevoEquipo}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Registrar nuevo equipo</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipos.map(equipo => (
              <div key={equipo.id} className="bg-white rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                {/* Header con estado e imagen */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {/* Imagen del equipo si existe */}
                  {equipo.imagenEquipo ? (
                    <img 
                      src={`http://localhost:2001/uploads/${equipo.imagenEquipo}`} 
                      alt={`${equipo.marca} ${equipo.modelo}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        console.log('Error cargando imagen:', equipo.imagenEquipo);
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fas fa-snowflake text-6xl text-gray-300"></i>
                    </div>
                  )}
                  
                  {/* Overlay oscuro para mejorar legibilidad */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                      equipo.estadoOperativo === 'operativo' ? 'bg-green-100/90 text-green-800' : 
                      equipo.estadoOperativo === 'mantenimiento' ? 'bg-amber-100/90 text-amber-800' : 
                      'bg-red-100/90 text-red-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        equipo.estadoOperativo === 'operativo' ? 'bg-green-500' : 
                        equipo.estadoOperativo === 'mantenimiento' ? 'bg-amber-500' : 
                        'bg-red-500'
                      }`}></span>
                      {equipo.estadoOperativo === 'operativo' ? 'Operativo' : 
                       equipo.estadoOperativo === 'mantenimiento' ? 'Mantenimiento' : 'Reparación'}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <div className="text-sm text-white/80 mb-1">{equipo.tipo.charAt(0).toUpperCase() + equipo.tipo.slice(1)}</div>
                    <h3 className="text-xl font-medium text-white">{equipo.marca}</h3>
                    <p className="text-white/90">{equipo.modelo}</p>
                  </div>
                  
                  {/* Ícono decorativo */}
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
                </div>
                
                {/* Contenido */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Serial</span>
                      <span className="font-mono text-gray-900">{equipo.numeroSerie}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Capacidad</span>
                      <span className="text-gray-900">{equipo.capacidad}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Ubicación</span>
                      <span className="text-gray-900">{equipo.ubicacion}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Fecha instalación</span>
                      <span className="text-gray-900">
                        {equipo.fechaInstalacion ? new Date(equipo.fechaInstalacion).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        }) : 'No registrada'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                      onClick={() => handleEditEquipo(equipo)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      <span>Editar</span>
                    </button>
                    <button 
                      className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                      title="Programar servicio"
                      onClick={() => console.log('Programar servicio', equipo.id)}
                    >
                      <svg className="w-4 h-4 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                    <button 
                      className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
                      title="Eliminar equipo"
                      onClick={() => handleDeleteClick(equipo)}
                    >
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Instalación</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipos.map(equipo => (
                    <tr key={equipo.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {equipo.marca} {equipo.modelo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {equipo.tipo.charAt(0).toUpperCase() + equipo.tipo.slice(1)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">{equipo.numeroSerie}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {equipo.ubicacion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          equipo.estadoOperativo === 'operativo' ? 'bg-green-100 text-green-800' : 
                          equipo.estadoOperativo === 'mantenimiento' ? 'bg-amber-100 text-amber-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            equipo.estadoOperativo === 'operativo' ? 'bg-green-500' : 
                            equipo.estadoOperativo === 'mantenimiento' ? 'bg-amber-500' : 
                            'bg-red-500'
                          }`}></span>
                          {equipo.estadoOperativo === 'operativo' ? 'Operativo' : 
                           equipo.estadoOperativo === 'mantenimiento' ? 'Mantenimiento' : 'Reparación'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {equipo.fechaInstalacion ? new Date(equipo.fechaInstalacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'No registrada'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-gray-900 hover:text-gray-700 mr-3"
                          onClick={() => handleEditEquipo(equipo)}
                        >
                          Editar
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => console.log('Programar servicio', equipo.id)}
                        >
                          Programar
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteClick(equipo)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}
        >
          <EquipoForm 
            equipo={selectedEquipo}
            clienteId={clienteActual?.id}
            onClose={() => setShowModal(false)}
            onSave={async (nuevoEquipo) => {
              console.log('✅ Equipo guardado exitosamente:', nuevoEquipo);
              // Recargar datos del cliente para mostrar el nuevo equipo
              try {
                const miInfoResponse = await clienteService.getMe();
                if (miInfoResponse.success && miInfoResponse.data) {
                  console.log('🔄 Datos del cliente actualizados:', miInfoResponse.data);
                  setClienteActual(miInfoResponse.data);
                }
              } catch (error) {
                console.error('❌ Error recargando datos:', error);
              }
            }}
          />
        </Modal>

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar Equipo</h3>
                  <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              {equipoToDelete && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    ¿Está seguro que desea eliminar el equipo <strong>{equipoToDelete.marca} {equipoToDelete.modelo}</strong>?
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Serial: {equipoToDelete.numeroSerie}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisEquipos;