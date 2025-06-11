// Configuración base para axios
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:2001';

// Configurar axios con la URL base
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    console.log('🔑 Token desde sessionStorage:', token);
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token agregado al header:', `Bearer ${token}`);
    } else {
      console.log('❌ No hay token válido, omitiendo Authorization header');
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;