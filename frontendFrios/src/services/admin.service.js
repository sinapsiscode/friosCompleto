import api from './api';

const adminService = {
  // Obtener perfil del administrador actual
  getProfile: async () => {
    try {
      const response = await api.get('/api/admin/profile');
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil del administrador:', error);
      throw error;
    }
  },

  // Actualizar perfil del administrador
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/admin/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar perfil del administrador:', error);
      throw error;
    }
  }
};

export default adminService;