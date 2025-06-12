import api from './api';

const clienteService = {
  // Obtener información del cliente autenticado
  async getMe() {
    try {
      console.log('🔄 Cliente Service - Obteniendo mi información...');
      const response = await api.get('/api/clientes/me');
      console.log('📡 Respuesta del servidor (getMe):', response);
      console.log('📦 Datos recibidos (getMe):', response.data);
      
      if (response.data.success) {
        console.log('✅ Mi información procesada:', response.data.data);
        return response.data;
      } else {
        console.log('❌ Error en respuesta getMe:', response.data.message);
        return { success: false, data: null, message: response.data.message };
      }
    } catch (error) {
      console.error('❌ Error en cliente.service.getMe:', error);
      return { success: false, data: null, message: 'Error de conexión' };
    }
  },

  // Obtener todos los clientes
  async getAll(params = {}) {
    try {
      console.log('🔄 Cliente Service - Obteniendo clientes con params:', params);
      const response = await api.get('/api/clientes', { params });
      console.log('📡 Respuesta del servidor:', response);
      console.log('📦 Datos recibidos:', response.data);
      
      // El backend devuelve { success: true, data: [...], pagination: {...} }
      const clientes = response.data.data || [];
      console.log('✅ Clientes procesados:', clientes.length);
      
      return {
        success: true,
        data: clientes,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('❌ Error en cliente.service.getAll:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener clientes',
        data: [] // Siempre devolver un array vacío en caso de error
      };
    }
  },

  // Obtener cliente por ID
  async getById(id) {
    try {
      const response = await api.get(`/api/clientes/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener cliente'
      };
    }
  },

  // Crear nuevo cliente con foto
  async create(clienteData, avatarFile = null) {
    console.log('📡 === CLIENTE SERVICE CREATE ===');
    console.log('📝 Datos recibidos:', clienteData);
    console.log('📷 Archivo recibido:', avatarFile);
    
    try {
      const formData = new FormData();
      
      // Agregar datos del cliente
      Object.keys(clienteData).forEach(key => {
        if (clienteData[key] !== null && clienteData[key] !== undefined) {
          // Manejar arrays especialmente para FormData
          if (Array.isArray(clienteData[key])) {
            formData.append(key, JSON.stringify(clienteData[key]));
          } else {
            formData.append(key, clienteData[key]);
          }
          console.log(`➕ FormData: ${key} = ${clienteData[key]}`);
        }
      });
      
      // Agregar archivo de avatar si existe
      if (avatarFile) {
        formData.append('avatar', avatarFile);
        console.log('📷 Avatar agregado al FormData:', avatarFile.name);
      }
      
      console.log('🚀 Enviando POST a /api/clientes...');
      const response = await api.post('/api/clientes', formData, {
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
      console.error('❌ Error en cliente service:', error);
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
        message: error.response?.data?.message || 'Error al crear cliente',
        errors: error.response?.data?.errors
      };
    }
  },

  // Actualizar cliente
  async update(id, clienteData, avatarFile = null) {
    console.log('📡 === CLIENTE SERVICE UPDATE ===');
    console.log('🆔 ID cliente:', id);
    console.log('📝 Datos recibidos:', clienteData);
    console.log('📷 Archivo recibido:', avatarFile);
    
    try {
      const formData = new FormData();
      
      // Agregar datos del cliente
      Object.keys(clienteData).forEach(key => {
        if (clienteData[key] !== null && clienteData[key] !== undefined) {
          // Manejar arrays especialmente para FormData
          if (Array.isArray(clienteData[key])) {
            formData.append(key, JSON.stringify(clienteData[key]));
          } else {
            formData.append(key, clienteData[key]);
          }
          console.log(`➕ FormData: ${key} = ${clienteData[key]}`);
        }
      });
      
      // Agregar archivo de avatar si existe
      if (avatarFile) {
        formData.append('avatar', avatarFile);
        console.log('📷 Avatar agregado al FormData:', avatarFile.name);
      }
      
      console.log('🔄 Enviando PUT a /api/clientes/' + id + '...');
      const response = await api.put(`/api/clientes/${id}`, formData, {
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
      console.error('❌ Error en cliente service update:', error);
      console.error('📋 Status:', error.response?.status);
      console.error('📋 Response data:', error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar cliente'
      };
    }
  },

  // Eliminar cliente
  async delete(id) {
    try {
      const response = await api.delete(`/api/clientes/${id}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar cliente'
      };
    }
  },

  // Obtener equipos del cliente
  async getEquipos(id, params = {}) {
    try {
      const response = await api.get(`/api/clientes/${id}/equipos`, { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener equipos del cliente'
      };
    }
  }
};

export default clienteService;