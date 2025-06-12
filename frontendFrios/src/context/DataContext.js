import React, { createContext, useState, useEffect, useContext } from 'react';
import clienteService from '../services/cliente.service';
import tecnicoService from '../services/tecnico.service';
import equipoService from '../services/equipo.service';
import servicioService from '../services/servicio.service';
import AuthContext from './AuthContext';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { useBackend } = useContext(AuthContext);
  const [data, setData] = useState(() => {
    console.log('🔍 === FORZANDO USO EXCLUSIVO DEL BACKEND ===');
    console.log('❌ NO usar localStorage ni dummyData');
    console.log('✅ Solo datos del backend');
    
    // Limpiar localStorage existente
    localStorage.removeItem('frioServiceData');
    
    // Estado inicial vacío - será poblado solo desde el backend
    const emptyData = {
      tecnicos: [],
      clientes: [],
      equipos: [],
      servicios: [],
      repuestos: [],
      herramientas: [],
      administradores: []
    };
    
    console.log('🚀 Estado inicial vacío - esperando datos del backend');
    return emptyData;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos del backend
  const loadBackendData = async () => {
    console.log('🔄 === INICIANDO CARGA DE DATOS DEL BACKEND ===');
    console.log('🔌 useBackend:', useBackend);
    
    if (!useBackend) {
      console.log('⚠️ Backend deshabilitado, no se cargarán datos');
      return;
    }
    
    setIsLoading(true);
    try {
      // Cargar clientes del backend
      console.log('📥 Cargando clientes...');
      const clientesResponse = await clienteService.getAll({ limit: 100 });
      console.log('📊 Respuesta clientes:', clientesResponse);
      
      if (clientesResponse.success && clientesResponse.data) {
        console.log('✅ Clientes cargados:', clientesResponse.data.length);
        console.log('📋 Muestra de clientes:', clientesResponse.data.slice(0, 3));
        setData(prev => {
          const newData = {
            ...prev,
            clientes: clientesResponse.data
          };
          console.log('💾 Estado actualizado con clientes:', newData.clientes.length);
          return newData;
        });
      } else {
        console.error('❌ Error al cargar clientes:', clientesResponse.message);
      }
      
      // Cargar técnicos del backend
      console.log('📥 Cargando técnicos...');
      const tecnicosResponse = await tecnicoService.getAll({ limit: 100 });
      console.log('📊 Respuesta técnicos:', tecnicosResponse);
      
      if (tecnicosResponse.success) {
        console.log('✅ Técnicos cargados:', tecnicosResponse.data?.length || 0);
        console.log('📋 Muestra de técnicos:', tecnicosResponse.data?.slice(0, 2));
        setData(prev => ({
          ...prev,
          tecnicos: tecnicosResponse.data || []
        }));
      } else {
        console.error('❌ Error al cargar técnicos:', tecnicosResponse.message);
      }
      
      // Cargar equipos del backend
      console.log('📥 Cargando equipos...');
      const equiposResponse = await equipoService.getAll({ limit: 100 });
      console.log('📊 Respuesta equipos:', equiposResponse);
      
      if (equiposResponse.success) {
        console.log('✅ Equipos cargados:', equiposResponse.data?.length || 0);
        console.log('📋 Muestra de equipos:', equiposResponse.data?.slice(0, 2));
        setData(prev => ({
          ...prev,
          equipos: equiposResponse.data || []
        }));
      } else {
        console.error('❌ Error al cargar equipos:', equiposResponse.message);
      }
      
      // Cargar servicios del backend
      console.log('📥 Cargando servicios...');
      const serviciosResponse = await servicioService.getAll({ limit: 100 });
      console.log('📊 Respuesta servicios:', serviciosResponse);
      
      if (serviciosResponse.success && serviciosResponse.data) {
        console.log('✅ Servicios cargados:', serviciosResponse.data.length);
        console.log('📋 Muestra de servicios:', serviciosResponse.data.slice(0, 3));
        setData(prev => ({
          ...prev,
          servicios: serviciosResponse.data
        }));
      } else {
        console.error('❌ Error al cargar servicios:', serviciosResponse.message);
      }
      
    } catch (error) {
      console.error('❌ Error general cargando datos del backend:', error);
    } finally {
      setIsLoading(false);
      console.log('🏁 === CARGA DE DATOS FINALIZADA ===');
    }
  };

  // Cargar datos del backend al montar o cuando cambie useBackend
  useEffect(() => {
    console.log('🔄 DataContext useEffect - useBackend:', useBackend);
    if (useBackend) {
      console.log('🚀 Iniciando carga de datos del backend...');
      loadBackendData();
    } else {
      console.log('⚠️ Backend deshabilitado, no se cargarán datos del servidor');
      console.log('📊 Datos actuales en modo dummy:');
      console.log('  - Clientes:', data.clientes?.length || 0);
      console.log('  - Equipos:', data.equipos?.length || 0);
      console.log('  - Cliente "cliente":', data.clientes?.find(c => c.usuario === 'cliente'));
    }
  }, [useBackend]);

  // Escuchar eventos de login para recargar datos inmediatamente
  useEffect(() => {
    const handleUserLogin = (event) => {
      console.log('🎯 Evento de login detectado, recargando datos...', event.detail);
      if (useBackend) {
        loadBackendData();
      }
    };

    window.addEventListener('userLoggedIn', handleUserLogin);
    return () => window.removeEventListener('userLoggedIn', handleUserLogin);
  }, [useBackend, loadBackendData]);

  // NO guardar en localStorage - solo usar backend
  useEffect(() => {
    console.log('❌ localStorage deshabilitado - solo backend');
    // Limpiar cualquier dato previo
    localStorage.removeItem('frioServiceData');
  }, [data]);

  const updateData = (key, newData) => {
    setData(prev => ({
      ...prev,
      [key]: newData
    }));
  };

  const addItem = (key, item) => {
    setData(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), item]
    }));
  };

  const updateItem = (key, id, updates) => {
    setData(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const addEquipoToCliente = (clienteId, equipoId) => {
    setData(prev => ({
      ...prev,
      clientes: prev.clientes.map(cliente => 
        cliente.id === clienteId 
          ? { ...cliente, equipos: [...(cliente.equipos || []), equipoId] }
          : cliente
      )
    }));
  };

  const removeEquipoFromCliente = (clienteId, equipoId) => {
    setData(prev => ({
      ...prev,
      clientes: prev.clientes.map(cliente => 
        cliente.id === clienteId 
          ? { ...cliente, equipos: cliente.equipos.filter(id => id !== equipoId) }
          : cliente
      )
    }));
  };

  const deleteItem = (key, id) => {
    setData(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(item => item.id !== id)
    }));
  };

  const getNextId = (key) => {
    const items = data[key] || [];
    
    // For services (orders), generate ODT format
    if (key === 'servicios') {
      if (items.length === 0) return 'ODT-001';
      
      // Extract numeric part from ODT IDs
      const numericIds = items
        .map(item => {
          if (typeof item.id === 'string' && item.id.startsWith('ODT-')) {
            return parseInt(item.id.substring(4));
          }
          return typeof item.id === 'number' ? item.id : 0;
        })
        .filter(id => !isNaN(id));
      
      const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
      return `ODT-${String(maxId + 1).padStart(3, '0')}`;
    }
    
    // For other entities, use regular numeric IDs
    if (items.length === 0) return 1;
    const maxId = Math.max(...items.map(item => typeof item.id === 'number' ? item.id : 0));
    return maxId + 1;
  };

  return (
    <DataContext.Provider value={{
      data,
      updateData,
      addItem,
      updateItem,
      deleteItem,
      getNextId,
      addEquipoToCliente,
      removeEquipoFromCliente,
      isLoading,
      loadBackendData
    }}>
      {children}
    </DataContext.Provider>
  );
};