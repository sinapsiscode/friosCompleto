import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import Modal from '../../components/Common/Modal';
import { showAlert } from '../../utils/sweetAlert';
import programacionService from '../../services/programacion.service';
import clienteService from '../../services/cliente.service';
import tecnicoService from '../../services/tecnico.service';

const Programaciones = () => {
  const { data, updateItem } = useContext(DataContext);
  const { useBackend } = useContext(AuthContext);
  
  const [programaciones, setProgramaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProgramacion, setSelectedProgramacion] = useState(null);
  const [filtros, setFiltros] = useState({
    cliente: '',
    tecnico: '',
    frecuencia: '',
    isActive: 'all'
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [useBackend]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      if (useBackend) {
        // Cargar todos los datos en paralelo
        const [programacionesResponse, clientesResponse, tecnicosResponse] = await Promise.all([
          programacionService.getAll({ limit: 100 }),
          clienteService.getAll({ limit: 100 }),
          tecnicoService.getAll({ limit: 100 })
        ]);

        console.log('✅ Programaciones cargadas:', programacionesResponse.data?.length || 0);
        console.log('✅ Clientes cargados:', clientesResponse.data?.length || 0);
        console.log('✅ Técnicos cargados:', tecnicosResponse.data?.length || 0);

        setProgramaciones(programacionesResponse.data || []);
        setClientes(clientesResponse.data || []);
        setTecnicos(tecnicosResponse.data || []);

      } else {
        // Usar datos del contexto
        setProgramaciones(data.programaciones || []);
        setClientes(data.clientes || []);
        setTecnicos(data.tecnicos || []);
      }

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError('Error al cargar los datos');
      
      // Fallback al contexto si hay error con la API
      setProgramaciones(data.programaciones || []);
      setClientes(data.clientes || []);
      setTecnicos(data.tecnicos || []);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar programaciones
  const programacionesFiltradas = programaciones.filter(programacion => {
    const cliente = clientes.find(c => c.id === programacion.clienteId);
    const tecnico = tecnicos.find(t => t.id === programacion.tecnicoId);
    
    return (
      (!filtros.cliente || programacion.clienteId === parseInt(filtros.cliente)) &&
      (!filtros.tecnico || programacion.tecnicoId === parseInt(filtros.tecnico)) &&
      (!filtros.frecuencia || programacion.frecuencia === filtros.frecuencia) &&
      (filtros.isActive === 'all' || 
       (filtros.isActive === 'active' && programacion.isActive) ||
       (filtros.isActive === 'inactive' && !programacion.isActive))
    );
  });

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleActive = async (programacion) => {
    try {
      if (useBackend) {
        const response = await programacionService.toggleActive(programacion.id);
        if (response.success) {
          showAlert(
            `Programación ${response.data.isActive ? 'activada' : 'desactivada'} exitosamente`,
            'success'
          );
          cargarDatos(); // Recargar datos
        }
      } else {
        // Actualizar en contexto local
        updateItem('programaciones', programacion.id, {
          ...programacion,
          isActive: !programacion.isActive
        });
        showAlert(
          `Programación ${!programacion.isActive ? 'activada' : 'desactivada'} exitosamente`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      showAlert('Error al cambiar el estado de la programación', 'error');
    }
  };

  const handleGenerarServicios = async () => {
    try {
      const response = await programacionService.generarServicios();
      if (response.success) {
        showAlert(
          `Se generaron ${response.data.serviciosCreados} servicios automáticamente`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error al generar servicios:', error);
      showAlert('Error al generar servicios automáticos', 'error');
    }
  };

  const handleViewDetails = (programacion) => {
    setSelectedProgramacion(programacion);
    setShowModal(true);
  };

  const getClienteNombre = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? (cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`) : 'N/A';
  };

  const getTecnicoNombre = (tecnicoId) => {
    if (!tecnicoId) return 'Sin asignar';
    const tecnico = tecnicos.find(t => t.id === tecnicoId);
    return tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'N/A';
  };

  const getFrecuenciaLabel = (frecuencia) => {
    const labels = {
      'DIARIO': 'Diario',
      'SEMANAL': 'Semanal',
      'QUINCENAL': 'Quincenal',
      'MENSUAL': 'Mensual',
      'BIMESTRAL': 'Bimestral',
      'TRIMESTRAL': 'Trimestral',
      'SEMESTRAL': 'Semestral',
      'ANUAL': 'Anual',
      'PERSONALIZADO': 'Personalizado'
    };
    return labels[frecuencia] || frecuencia;
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando programaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📅 Gestión de Programaciones
          </h1>
          <p className="text-gray-600">
            Administre las programaciones de mantenimiento automático
          </p>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          <button
            onClick={handleGenerarServicios}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <i className="fas fa-sync-alt"></i>
            Generar Servicios
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-filter text-gray-400"></i>
          Filtros
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              name="cliente"
              value={filtros.cliente}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Todos los clientes</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Técnico
            </label>
            <select
              name="tecnico"
              value={filtros.tecnico}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Todos los técnicos</option>
              <option value="null">Sin asignar</option>
              {tecnicos.map(tecnico => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nombre} {tecnico.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia
            </label>
            <select
              name="frecuencia"
              value={filtros.frecuencia}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Todas las frecuencias</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSUAL">Mensual</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="SEMESTRAL">Semestral</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="isActive"
              value={filtros.isActive}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Programaciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Técnico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frecuencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próxima Ejecución
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
                      <p className="text-lg font-medium">No hay programaciones</p>
                      <p className="text-sm">Las programaciones creadas aparecerán aquí</p>
                    </div>
                  </td>
                </tr>
              ) : (
                programacionesFiltradas.map((programacion) => (
                  <tr key={programacion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getClienteNombre(programacion.clienteId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getTecnicoNombre(programacion.tecnicoId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getFrecuenciaLabel(programacion.frecuencia)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFecha(programacion.fechaInicio)}
                      {programacion.fechaFin && (
                        <span> - {formatFecha(programacion.fechaFin)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {programacion.proximaEjecucion ? 
                        formatFecha(programacion.proximaEjecucion) : 
                        'No programada'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        programacion.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {programacion.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(programacion)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleToggleActive(programacion)}
                          className={`transition-colors ${
                            programacion.isActive 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={programacion.isActive ? 'Desactivar' : 'Activar'}
                        >
                          <i className={`fas ${programacion.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {showModal && selectedProgramacion && (
        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          title="Detalles de la Programación"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Cliente:</label>
                <p className="text-sm text-gray-900">{getClienteNombre(selectedProgramacion.clienteId)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Técnico:</label>
                <p className="text-sm text-gray-900">{getTecnicoNombre(selectedProgramacion.tecnicoId)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Frecuencia:</label>
                <p className="text-sm text-gray-900">{getFrecuenciaLabel(selectedProgramacion.frecuencia)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Prioridad:</label>
                <p className="text-sm text-gray-900">{selectedProgramacion.prioridad}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Descripción:</label>
              <p className="text-sm text-gray-900">{selectedProgramacion.descripcion || 'Sin descripción'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Horario:</label>
              <p className="text-sm text-gray-900">
                {selectedProgramacion.horaInicio}
                {selectedProgramacion.horaFin && ` - ${selectedProgramacion.horaFin}`}
              </p>
            </div>

            {selectedProgramacion.equipos && (
              <div>
                <label className="text-sm font-medium text-gray-700">Equipos:</label>
                <p className="text-sm text-gray-900">
                  {Array.isArray(selectedProgramacion.equipos) 
                    ? `${selectedProgramacion.equipos.length} equipos`
                    : 'Equipos no especificados'
                  }
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Programaciones;