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

        {/* Panel de credenciales de prueba */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Usuarios Disponibles:</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">👨‍💼 Admin:</span>
              <button 
                type="button"
                onClick={() => handleQuickAccess('admin/servicefrios', '123456')}
                className="text-blue-600 hover:text-blue-800 font-mono bg-white px-2 py-1 rounded border"
              >
                admin/servicefrios : 123456
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">🔧 Técnico:</span>
              <button 
                type="button"
                onClick={() => handleQuickAccess('williams', '123456')}
                className="text-indigo-600 hover:text-indigo-800 font-mono bg-white px-2 py-1 rounded border"
              >
                williams : 123456
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">👥 Cliente:</span>
              <button 
                type="button"
                onClick={() => handleQuickAccess('jaeden1', '123456')}
                className="text-green-600 hover:text-green-800 font-mono bg-white px-2 py-1 rounded border"
              >
                jaeden1 : 123456
              </button>
            </div>
            {!useBackend && (
              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="text-gray-600">📱 Fallback:</span>
                <button 
                  type="button"
                  onClick={() => handleQuickAccess('cliente', 'cliente123')}
                  className="text-purple-600 hover:text-purple-800 font-mono bg-white px-2 py-1 rounded border"
                >
                  cliente : cliente123
                </button>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t text-xs">
            <p className={`${useBackend ? 'text-green-600' : 'text-amber-600'}`}>
              {useBackend ? '✅ Backend conectado - usando usuarios reales' : '⚠️ Backend desconectado - usando datos estáticos'}
            </p>
            {useBackend && (
              <p className="text-gray-500 mt-1">
                💡 Si las contraseñas no funcionan, ejecuta: <code className="bg-gray-200 px-1 rounded">node scripts/reset-passwords.js</code>
              </p>
            )}
          </div>
        </div>


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