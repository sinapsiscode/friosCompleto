import React, { createContext, useState, useEffect } from 'react';
import { dummyData as initialData } from '../utils/dummyData';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
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

  useEffect(() => {
    localStorage.setItem('frioServiceData', JSON.stringify(data));
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
      removeEquipoFromCliente
    }}>
      {children}
    </DataContext.Provider>
  );
};