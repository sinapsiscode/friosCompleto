import React, { createContext, useState, useEffect, useContext } from 'react';
import { dummyData as initialData } from '../utils/dummyData';
import clienteService from '../services/cliente.service';
import tecnicoService from '../services/tecnico.service';
import AuthContext from './AuthContext';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { useBackend } = useContext(AuthContext);
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('frioServiceData');
    const baseData = savedData ? JSON.parse(savedData) : initialData;
    
    // Asegurar que existan todas las colecciones necesarias
    return {
      ...baseData,
      repuestos: baseData.repuestos || [],
      herramientas: baseData.herramientas || [],
      administradores: baseData.administradores || initialData.administradores || []
    };
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
        console.log('⚠️ Usando datos dummy para técnicos');
      }
      
      // TODO: Cargar otros datos (servicios, equipos, etc.) cuando tengamos los servicios
      
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

  // Guardar en localStorage solo si no usamos backend
  useEffect(() => {
    if (!useBackend) {
      localStorage.setItem('frioServiceData', JSON.stringify(data));
    }
  }, [data, useBackend]);

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