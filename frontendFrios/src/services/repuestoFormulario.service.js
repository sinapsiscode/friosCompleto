import api from './api';

const repuestoFormularioService = {
  // Obtener todos los repuestos del formulario
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/repuestos-formulario', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener repuestos formulario:', error);
      throw error;
    }
  },

  // Obtener repuesto por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/repuestos-formulario/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener repuesto:', error);
      throw error;
    }
  },

  // Crear nuevo repuesto
  create: async (repuestoData) => {
    try {
      const response = await api.post('/api/repuestos-formulario', repuestoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear repuesto:', error);
      throw error;
    }
  },

  // Actualizar repuesto
  update: async (id, repuestoData) => {
    try {
      const response = await api.put(`/api/repuestos-formulario/${id}`, repuestoData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar repuesto:', error);
      throw error;
    }
  },

  // Eliminar repuesto
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/repuestos-formulario/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar repuesto:', error);
      throw error;
    }
  }
};

export default repuestoFormularioService;