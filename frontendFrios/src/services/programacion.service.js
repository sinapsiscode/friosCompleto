import api from './api';

const programacionService = {
  // Obtener todas las programaciones
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/programaciones', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener programaciones:', error);
      throw error;
    }
  },

  // Obtener programación por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/programaciones/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener programación:', error);
      throw error;
    }
  },

  // Crear nueva programación
  create: async (programacionData) => {
    try {
      const response = await api.post('/api/programaciones', programacionData);
      return response.data;
    } catch (error) {
      console.error('Error al crear programación:', error);
      throw error;
    }
  },

  // Actualizar programación
  update: async (id, programacionData) => {
    try {
      const response = await api.put(`/api/programaciones/${id}`, programacionData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar programación:', error);
      throw error;
    }
  }
};

export default programacionService;