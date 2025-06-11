import React, { useState, useContext } from 'react';
import { showAlert } from '../utils/sweetAlert';
import AuthContext from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerUserType, setRegisterUserType] = useState('cliente');
  const { login, useBackend } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log(`🔍 Intentando login - Usuario: ${username}, Password: ${password}`);
    
    if (!username || !password) {
      showAlert('Por favor complete usuario y contraseña', 'warning');
      return;
    }

    try {
      const result = await login(username, password);
      
      if (result.success) {
        console.log('✅ Login exitoso');
        showAlert('¡Bienvenido!', 'success');
      } else {
        console.log('❌ Login fallido:', result.message);
        showAlert(result.message || 'Credenciales inválidas', 'error');
      }
    } catch (error) {
      console.error('Error en login:', error);
      showAlert('Error de conexión', 'error');
    }
  };

  const handleQuickAccess = (user, pass) => {
    console.log(`🚀 Acceso rápido - Usuario: ${user}`);
    setUsername(user);
    setPassword(pass);
    // Auto-submit
    setTimeout(async () => {
      const result = await login(user, pass);
      if (result.success) {
        showAlert('¡Bienvenido!', 'success');
      } else {
        showAlert(result.message || 'Credenciales inválidas', 'error');
      }
    }, 100);
  };

  return (
    <section className="flex items-center justify-center min-h-screen p-4" style={{background: 'linear-gradient(135deg, rgba(0, 119, 204, 0.8), rgba(0, 102, 176, 0.9))'}}>
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-xl text-center">
        <div className="mb-8">
          <img src="/logo.png" alt="PROSERVIS Logo" className="w-20 h-20 mx-auto mb-4 rounded-full shadow-lg" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">PROSERVIS</h1>
          <p className="text-gray-600">Sistema de Gestión de Servicios de Refrigeración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
          >
            Iniciar Sesión
          </button>
        </form>


        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            © 2024 PROSERVIS - Sistema de Gestión de Servicios
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;