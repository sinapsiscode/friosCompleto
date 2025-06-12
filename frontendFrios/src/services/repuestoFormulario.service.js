import api from './api';

const repuestoFormularioService = {
  // Obtener todos los repuestos del formulario
  async getAll(params = {}) {
    try {
      const response = await api.get('/api/repuestos-formulario', { params });
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error al obtener repuestos formulario:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener repuestos',
        data: []
      };
    }
  },

  // Obtener repuesto por ID
  async getById(id) {
    try {
      const response = await api.get(`/api/repuestos-formulario/${id}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener repuesto'
      };
    }
  },

  // Crear nuevo repuesto
  async create(repuestoData) {
    try {
      console.log('📝 Creando repuesto formulario:', repuestoData);
      const response = await api.post('/api/repuestos-formulario', repuestoData);
      console.log('✅ Repuesto creado:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Repuesto creado exitosamente'
      };
    } catch (error) {
      console.error('❌ Error al crear repuesto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear repuesto',
        errors: error.response?.data?.errors
      };
    }
  },

  // Actualizar repuesto
  async update(id, repuestoData) {
    try {
      const response = await api.put(`/api/repuestos-formulario/${id}`, repuestoData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Repuesto actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar repuesto'
      };
    }
  },

  // Eliminar repuesto
  async delete(id) {
    try {
      console.log('🗑️ Eliminando repuesto formulario:', id);
      const response = await api.delete(`/api/repuestos-formulario/${id}`);
      console.log('✅ Repuesto eliminado');
      
      return {
        success: true,
        message: response.data.message || 'Repuesto eliminado exitosamente'
      };
    } catch (error) {
      console.error('❌ Error al eliminar repuesto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar repuesto'
      };
    }
  }
};

export default repuestoFormularioService;