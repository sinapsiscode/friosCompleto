import React, { useState, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import AuthContext from '../context/AuthContext';

// Admin Pages
import AdminDashboard from './Admin/AdminDashboard';
import Servicios from './Admin/Servicios';
import Programaciones from './Admin/Programaciones';
import Tecnicos from './Admin/Tecnicos';
import Clientes from './Admin/Clientes';
import RepuestosFormulario from './Admin/RepuestosFormulario';
import Estadisticas from './Admin/Estadisticas';
import DiagramaGantt from './Admin/DiagramaGantt';
import ConfigurarPerfil from './Admin/ConfigurarPerfil';

// Tecnico Pages
import TecnicoDashboard from './Tecnico/TecnicoDashboard';
import MisServicios from './Tecnico/MisServicios';
import MisEvaluaciones from './Tecnico/MisEvaluaciones';
import HistorialTrabajos from './Tecnico/HistorialTrabajos';

// Cliente Pages
import ClienteDashboard from './Cliente/ClienteDashboard';
import SolicitarServicio from './Cliente/SolicitarServicio';
import MisEquipos from './Cliente/MisEquipos';
import Evaluaciones from './Cliente/Evaluaciones';
import Diagrama from './Cliente/Diagrama';

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useContext(AuthContext);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getRoutes = () => {
    switch (user?.userType || user?.role?.toLowerCase()) {
      case 'admin':
        return (
          <>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/programaciones" element={<Programaciones />} />
            <Route path="/solicitar-servicio" element={<SolicitarServicio />} />
            <Route path="/tecnicos" element={<Tecnicos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/repuestos" element={<RepuestosFormulario />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="/diagrama" element={<DiagramaGantt />} />
            <Route path="/configurar-perfil" element={<ConfigurarPerfil />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </>
        );
      case 'tecnico':
        return (
          <>
            <Route path="/dashboard" element={<TecnicoDashboard />} />
            <Route path="/mis-servicios" element={<MisServicios />} />
            <Route path="/solicitar-servicio" element={<SolicitarServicio />} />
            <Route path="/mis-evaluaciones" element={<MisEvaluaciones />} />
            <Route path="/historial-trabajos" element={<HistorialTrabajos />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </>
        );
      case 'cliente':
        return (
          <>
            <Route path="/dashboard" element={<ClienteDashboard />} />
            <Route path="/solicitar-servicio" element={<SolicitarServicio />} />
            <Route path="/mis-equipos" element={<MisEquipos />} />
            <Route path="/evaluaciones" element={<Evaluaciones />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </>
        );
      default:
        return <Route path="*" element={<Navigate to="/login" replace />} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50 relative">
      <Sidebar collapsed={false} toggleSidebar={toggleSidebar} />
      <div className={`flex flex-col bg-gray-50 min-h-screen flex-1 transition-all duration-300 ml-0 lg:ml-[260px]`}>
        <Header toggleSidebar={toggleSidebar} sidebarCollapsed={false} />
        <div className="flex-1 p-6 pt-20 overflow-y-auto bg-gray-50">
          <Routes>
            {getRoutes()}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;