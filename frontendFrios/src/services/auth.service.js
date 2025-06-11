// Servicio de autenticación para comunicarse con el backend
import api from './api';

const authService = {
  // Login con backend
  async login(username, password) {
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password
      });
      
      if (response.data.success) {
        // Guardar token y datos del usuario en sessionStorage para sesiones independientes
        sessionStorage.setItem('token', response.data.token);
        
        // Agregar userType basado en role
        const user = {
          ...response.data.user,
          userType: response.data.user.role?.toLowerCase() || 'cliente'
        };
        
        sessionStorage.setItem('user', JSON.stringify(user));
        
        return {
          success: true,
          user: user,
          token: response.data.token
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Error en el login'
      };
      
    } catch (error) {
      console.error('Error en login:', error);
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