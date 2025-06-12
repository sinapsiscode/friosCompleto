// Servicio de autenticación para comunicarse con el backend
import api from './api';

const authService = {
  // Login con backend
  async login(username, password) {
    try {
      console.log('🔐 === AUTH SERVICE LOGIN ===');
      console.log('👤 Usuario:', username);
      console.log('🔒 Password length:', password.length);
      
      const response = await api.post('/api/auth/login', {
        username,
        password
      });
      
      console.log('📡 Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        // Guardar token y datos del usuario en sessionStorage para sesiones independientes
        sessionStorage.setItem('token', response.data.token);
        
        // Agregar userType basado en role
        const user = {
          ...response.data.user,
          userType: response.data.user.role?.toLowerCase() || 'cliente'
        };
        
        sessionStorage.setItem('user', JSON.stringify(user));
        
        console.log('✅ Login exitoso, usuario guardado:', user);
        return {
          success: true,
          user: user,
          token: response.data.token
        };
      }
      
      console.log('❌ Login fallido desde servidor:', response.data.message);
      return {
        success: false,
        message: response.data.message || 'Error en el login'
      };
      
    } catch (error) {
      console.error('❌ Error en auth.service.login:', error);
      console.error('📋 Status:', error.response?.status);
      console.error('📋 Response data:', error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error de conexión con el servidor'
      };
    }
  },

  // Obtener perfil del usuario
  async getProfile() {
    try {
      const response = await api.get('/api/auth/profile');
      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener perfil'
      };
    }
  },

  // Logout
  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  // Verificar si hay una sesión activa
  isAuthenticated() {
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('user');
    return !!(token && user);
  },

  // Obtener usuario actual
  getCurrentUser() {
    const user = sessionStorage.getItem('user');
    if (!user) return null;
    
    const parsedUser = JSON.parse(user);
    // Asegurar que siempre tenga userType
    if (!parsedUser.userType && parsedUser.role) {
      parsedUser.userType = parsedUser.role.toLowerCase();
    }
    
    return parsedUser;
  }
};

export default authService;