import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';
import api from '../services/api';
import { CREDENCIALES } from '../utils/credentials';

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  useBackend: false
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  useEffect(() => {
    // Verificar si hay una sesión activa al cargar
    if (useBackend && authService.isAuthenticated()) {
      const savedUser = authService.getCurrentUser();
      setUser(savedUser);
    }
  }, [useBackend]);

  const checkBackendConnection = async () => {
    // Verificar conexión con backend real
    try {
      await api.get('/health');
      console.log('✅ Backend conectado - Usando API con sesiones independientes');
      console.log('🔧 Forzando useBackend = true para usar datos del backend');
      setUseBackend(true);
    } catch (error) {
      console.log('⚠️ Backend no disponible - Usando datos estáticos');
      setUseBackend(false);
    }
  };

  const login = async (username, password) => {
    try {
      if (useBackend) {
        // Login con backend
        console.log('🔐 Intentando login con backend...');
        const result = await authService.login(username, password);
        
        if (result.success) {
          setUser(result.user);
          console.log('✅ Login exitoso con backend:', result.user);
          
          // Disparar evento para que DataContext recargue los datos
          console.log('🎯 Disparando evento userLoggedIn para recargar datos...');
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: result.user }));
          
          return { success: true, user: result.user };
        } else {
          console.log('❌ Login fallido:', result.message);
          return { success: false, message: result.message };
        }
      } else {
        // Login con datos estáticos (fallback)
        console.log('🔐 Usando login estático...');
        
        // Verificar credenciales predeterminadas
        if (username in CREDENCIALES.default && 
            password === CREDENCIALES.default[username].password) {
          let role = 'ADMIN';
          let userType = 'admin';
          
          // Mapear roles correctamente
          if (username === 'admin/servicefrios' || username === 'admin') {
            role = 'ADMIN';
            userType = 'admin';
          } else if (username === 'tecnico') {
            role = 'TECNICO';
            userType = 'tecnico';
          } else if (username === 'cliente') {
            role = 'CLIENTE';
            userType = 'cliente';
          }
          
          const usuario = { 
            username, 
            role, 
            userType 
          };
          setUser(usuario);
          console.log('✅ Login exitoso estático:', usuario);
          return { success: true, user: usuario };
        }
        
        // Verificar técnicos
        const tecnico = CREDENCIALES.tecnicos.find(
          t => t.usuario === username && t.password === password
        );
        if (tecnico) {
          const usuario = { 
            username, 
            role: 'TECNICO', 
            userType: 'tecnico' 
          };
          setUser(usuario);
          console.log('✅ Login técnico estático:', usuario);
          return { success: true, user: usuario };
        }
        
        // Verificar clientes
        const cliente = CREDENCIALES.clientes.find(
          c => c.usuario === username && c.password === password
        );
        if (cliente) {
          const usuario = { 
            username, 
            role: 'CLIENTE', 
            userType: 'cliente' 
          };
          setUser(usuario);
          console.log('✅ Login cliente estático:', usuario);
          return { success: true, user: usuario };
        }
        
        return { success: false, message: 'Credenciales incorrectas' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const logout = () => {
    if (useBackend) {
      authService.logout();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      useBackend
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;