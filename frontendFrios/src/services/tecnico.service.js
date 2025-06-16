import api from './api';

const tecnicoService = {
  // Obtener todos los técnicos
  async getAll(params = {}) {
    try {
      const response = await api.get('/api/tecnicos', { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener técnicos'
      };
    }
  },

  // Obtener técnico por ID
  async getById(id) {
    try {
      const response = await api.get(`/api/tecnicos/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener técnico'
      };
    }
  },

  // Crear nuevo técnico con foto
  async create(tecnicoData, avatarFile = null) {
    console.log('📡 === TECNICO SERVICE CREATE ===');
    console.log('📝 Datos recibidos:', tecnicoData);
    console.log('📷 Archivo recibido:', avatarFile);
    
    try {
      const formData = new FormData();
      
      // Agregar datos del técnico
      Object.keys(tecnicoData).forEach(key => {
        if (tecnicoData[key] !== null && tecnicoData[key] !== undefined) {
          formData.append(key, tecnicoData[key]);
          console.log(`➕ FormData: ${key} = ${tecnicoData[key]}`);
        }
      });
      
      // Agregar archivo de avatar si existe
      if (avatarFile) {
        formData.append('avatar', avatarFile);
        console.log('📷 Avatar agregado al FormData:', avatarFile.name);
      }
      
      console.log('🚀 Enviando POST a /api/tecnicos...');
      const response = await api.post('/api/tecnicos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Respuesta exitosa del backend:', response.data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Error en tecnico service:', error);
      console.error('📋 Status:', error.response?.status);
      console.error('📋 Response data:', error.response?.data);
      
      // Mostrar errores específicos de validación
      if (error.response?.data?.errors) {
        console.error('🚨 ERRORES DE VALIDACIÓN:');
        error.response.data.errors.forEach((err, index) => {
          console.error(`  ${index + 1}. ${err.field || 'Campo'}: ${err.message}`);
        });
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear técnico',
        errors: error.response?.data?.errors
      };
    }
  },

  // Actualizar técnico con foto
  async update(id, tecnicoData, avatarFile = null) {
    try {
      const formData = new FormData();
      
      // Agregar datos del técnico
      Object.keys(tecnicoData).forEach(key => {
        // Omitir solo campos que no son relevantes para el backend
        if (key === 'id' || key === 'userId' || key === 'createdAt' || key === 'updatedAt' || key === 'usuario') {
          return; // No enviar campos de metadata
        }
        
        // Enviar todos los demás campos, incluso si son null (el backend decidirá)
        const value = tecnicoData[key];
        formData.append(key, value === null ? '' : value);
        console.log(`📤 FormData: ${key} = ${value}`);
      });
      
      // Agregar archivo de avatar si existe
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      const response = await api.put(`/api/tecnicos/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar técnico'
      };
    }
  },

  // Eliminar técnico
  async delete(id) {
    try {
      const response = await api.delete(`/api/tecnicos/${id}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar técnico'
      };
    }
  },

  // Obtener servicios del técnico
  async getServicios(id, params = {}) {
    try {
      const response = await api.get(`/api/tecnicos/${id}/servicios`, { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener servicios del técnico'
      };
    }
  },

  // Obtener disponibilidad del técnico
  async getDisponibilidad(id, params = {}) {
    try {
      const response = await api.get(`/api/tecnicos/${id}/disponibilidad`, { params });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener disponibilidad del técnico'
      };
    }
  }
};

export default tecnicoService;