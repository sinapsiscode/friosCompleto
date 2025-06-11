import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { CREDENCIALES } from '../utils/credentials';
import Modal from '../components/Common/Modal';
import RegistroForm from '../components/Forms/RegistroForm';
import { showAlert } from '../utils/sweetAlert';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('admin');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerUserType, setRegisterUserType] = useState('cliente');
  const { login } = useContext(AuthContext);
  const { data } = useContext(DataContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log(`🔍 Intentando login - Usuario: ${username}, Tipo: ${userType}, Password: ${password}`);
    
    if (!username || !password) {
      showAlert('Por favor complete usuario y contraseña', 'warning');
      return;
    }

    // Verificar credenciales
    let credencialesValidas = false;
    let usuarioEncontrado = null;

    // Verificar credenciales predeterminadas
    if (userType in CREDENCIALES.default && 
        username === userType && 
        password === CREDENCIALES.default[userType].password) {
        console.log('✅ Credenciales predeterminadas válidas');
        credencialesValidas = true;
    }
    
    // Verificar técnicos
    else if (userType === 'tecnico') {
        console.log('🔍 Verificando técnicos...');
        console.log('Credenciales técnicos:', CREDENCIALES.tecnicos);
        console.log('Data técnicos:', data.tecnicos);
        
        usuarioEncontrado = CREDENCIALES.tecnicos.find(t => 
            t.usuario === username && t.password === password) ||
            data.tecnicos.find(t => 
            t.usuario === username && t.password === password);
            
        if (usuarioEncontrado) {
            console.log('✅ Técnico encontrado:', usuarioEncontrado);
            credencialesValidas = true;
        }
    }
    
    // Verificar clientes
    else if (userType === 'cliente') {
        console.log('🔍 Verificando clientes...');
        console.log('Credenciales clientes:', CREDENCIALES.clientes);
        console.log('Data clientes:', data.clientes);
        
        usuarioEncontrado = CREDENCIALES.clientes.find(c => 
            c.usuario === username && c.password === password) ||
            data.clientes.find(c => 
            c.usuario === username && c.password === password);
            
        if (usuarioEncontrado) {
            console.log('✅ Cliente encontrado:', usuarioEncontrado);
            credencialesValidas = true;
        }
    }

    if (credencialesValidas) {
      console.log('✅ Login exitoso, iniciando sesión...');
      login(username, password, userType);
    } else {
      console.log('❌ Credenciales inválidas');
      showAlert('Usuario o contraseña incorrectos', 'error');
    }
  };

  const handleRegisterSuccess = (newUsername, newPassword) => {
    setShowRegisterModal(false);
    // Iniciar sesión automáticamente después del registro
    login(newUsername, newPassword, registerUserType);
  };

  const handleShowRegisterModal = (type) => {
    setRegisterUserType(type);
    setShowRegisterModal(true);
  };

  const handleQuickAccess = (user, pass, type) => {
    console.log(`🚀 Acceso rápido - Usuario: ${user}, Tipo: ${type}`);
    setUsername(user);
    setPassword(pass);
    setUserType(type);
    // Auto-submit
    setTimeout(() => {
      login(user, pass, type);
    }, 100);
  };


  return (
    <section className="flex items-center justify-center min-h-screen p-4" style={{background: 'linear-gradient(135deg, rgba(0, 119, 204, 0.8), rgba(0, 102, 176, 0.9))'}}>
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-xl text-center">
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white mx-auto mb-4 shadow-lg overflow-hidden">
            <img src="/logo.png" alt="PROSERVIS Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PROSERVIS</h1>
          <p className="text-gray-600 text-base">Sistema de Gestión de Servicios Técnicos</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <i className="fas fa-user absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            <input 
              type="text" 
              placeholder="Usuario" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 bg-gray-50 transition-all duration-300 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="relative">
            <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 bg-gray-50 transition-all duration-300 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div>
            <select 
              value={userType} 
              onChange={(e) => setUserType(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl text-gray-900 bg-gray-50 transition-all duration-300 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            >
              <option value="admin">Administrador</option>
              <option value="tecnico">Técnico</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
          
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50">
            Iniciar Sesión
          </button>

          <div className="mt-8">
            <p className="text-gray-600 text-sm mb-4">¿No tienes cuenta?</p>
            <div className="space-y-3">
              <button 
                type="button" 
                className="w-full py-3 bg-transparent border-2 border-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => handleShowRegisterModal('cliente')}
              >
                Registrarse como Cliente
              </button>
              <button 
                type="button" 
                className="w-full py-3 bg-transparent border-2 border-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => handleShowRegisterModal('tecnico')}
              >
                Registrarse como Técnico
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Acceso Rápido (Demo)</h4>
          <div className="grid grid-cols-3 gap-3">
            <button 
              className="flex flex-col items-center p-3 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:-translate-y-1" 
              onClick={() => handleQuickAccess('admin', 'admin123', 'admin')}
            >
              <i className="fas fa-user-shield text-lg mb-1"></i>
              <span className="text-xs font-medium">Administrador</span>
            </button>
            <button 
              className="flex flex-col items-center p-3 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:-translate-y-1" 
              onClick={() => handleQuickAccess('jperez', '123', 'tecnico')}
            >
              <i className="fas fa-user-cog text-lg mb-1"></i>
              <span className="text-xs font-medium">Técnico</span>
            </button>
            <button 
              className="flex flex-col items-center p-3 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:-translate-y-1" 
              onClick={() => handleQuickAccess('norte', '123', 'cliente')}
            >
              <i className="fas fa-user text-lg mb-1"></i>
              <span className="text-xs font-medium">Cliente</span>
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title={`Registro de ${registerUserType === 'cliente' ? 'Cliente' : 'Técnico'}`}
        size="large"
      >
        <RegistroForm
          userType={registerUserType}
          onRegisterSuccess={handleRegisterSuccess}
          onCancel={() => setShowRegisterModal(false)}
        />
      </Modal>
    </section>
  );
};

export default Login;