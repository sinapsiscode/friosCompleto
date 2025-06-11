import api from './api';

const equipoService = {
  // Obtener todos los equipos
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/equipos', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      throw error;
    }
  },

  // Obtener equipo por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/equipos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener equipo:', error);
      throw error;
    }
  },

  // Obtener equipos por cliente
  getByCliente: async (clienteId) => {
    try {
      const response = await api.get(`/api/equipos/cliente/${clienteId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener equipos del cliente:', error);
      throw error;
    }
  },

  // Crear nuevo equipo
  create: async (equipoData) => {
    try {
      // Si hay imagen, crear FormData
      if (equipoData.imagenEquipo instanceof File) {
        const formData = new FormData();
        
        // Agregar todos los campos del equipo
        Object.keys(equipoData).forEach(key => {
          if (key === 'imagenEquipo') {
            formData.append('imagenEquipo', equipoData[key]);
          } else if (equipoData[key] !== null && equipoData[key] !== undefined) {
            formData.append(key, equipoData[key]);
          }
        });
        
        const response = await api.post('/api/equipos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Sin imagen, enviar JSON normal
        const response = await api.post('/api/equipos', equipoData);
        return response.data;
      }
    } catch (error) {
      console.error('Error al crear equipo:', error);
      throw error;
    }
  },

  // Actualizar equipo
  update: async (id, equipoData) => {
    try {
      // Si hay imagen, crear FormData
      if (equipoData.imagenEquipo instanceof File) {
        const formData = new FormData();
        
        // Agregar todos los campos del equipo
        Object.keys(equipoData).forEach(key => {
          if (key === 'imagenEquipo') {
            formData.append('imagenEquipo', equipoData[key]);
          } else if (equipoData[key] !== null && equipoData[key] !== undefined) {
            formData.append(key, equipoData[key]);
          }
        });
        
        const response = await api.put(`/api/equipos/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Sin imagen, enviar JSON normal
        const response = await api.put(`/api/equipos/${id}`, equipoData);
        return response.data;
      }
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      throw error;
    }
  },

  // Eliminar equipo
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/equipos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      throw error;
    }
  },

  // Obtener servicios del equipo
  getServicios: async (id, params = {}) => {
    try {
      const response = await api.get(`/api/equipos/${id}/servicios`, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener servicios del equipo:', error);
      throw error;
    }
  }
};

export default equipoService;