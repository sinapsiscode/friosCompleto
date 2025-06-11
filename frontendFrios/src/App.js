import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Componente interno para usar el contexto
const AppContent = () => {
  console.log('PROSERVIS App iniciando...');
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/*" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DataProvider>
  );
}

export default App;