import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthContext from './context/AuthContext';
import { DataProvider } from './context/DataContext';

function App() {
  console.log('PROSERVIS App iniciando...');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedSession = sessionStorage.getItem('currentUser');
    if (savedSession) {
      try {
        const userData = JSON.parse(savedSession);
        if (userData && userData.loggedIn) {
          setUser(userData);
        }
      } catch (e) {
        console.error('Error al recuperar sesión:', e);
        sessionStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (username, password, userType) => {
    console.log(`🔐 Iniciando sesión - Usuario: ${username}, Tipo: ${userType}`);
    
    // Aquí irá la lógica de autenticación
    const userData = {
      username,
      role: userType, // Cambiar userType por role para consistencia
      userType, // Mantener userType para compatibilidad
      loggedIn: true
    };
    
    console.log('✅ Datos de usuario creados:', userData);
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('currentUser');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <DataProvider>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <Login />} 
            />
            <Route 
              path="/*" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </DataProvider>
  );
}

export default App;