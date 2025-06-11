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
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        
        return {
          success: true,
          user: response.data.user,
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
    return user ? JSON.parse(user) : null;
  }
};

export default authService;