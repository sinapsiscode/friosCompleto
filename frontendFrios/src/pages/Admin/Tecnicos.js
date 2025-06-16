import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import Modal from '../../components/Common/Modal';
import TecnicoForm from '../../components/Forms/TecnicoForm';
import tecnicoService from '../../services/tecnico.service';
import { ProfileImage } from '../../utils/imageUtils';

const Tecnicos = () => {
  const { data } = useContext(DataContext);
  const { useBackend } = useContext(AuthContext);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('todas');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [selectedTecnico, setSelectedTecnico] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTecnico, setHistoryTecnico] = useState(null);
  const [showServiceDetailsModal, setShowServiceDetailsModal] = useState(false);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Para forzar actualización

  // Cargar técnicos del backend o datos estáticos
  useEffect(() => {
    const loadTecnicos = async () => {
      if (useBackend) {
        console.log('🌐 Cargando técnicos desde el backend...');
        setLoading(true);
        const result = await tecnicoService.getAll();
        if (result.success) {
          console.log('✅ Técnicos cargados:', result.data.length);
          setTecnicos(result.data || []);
        } else {
          console.error('❌ Error cargando técnicos:', result.message);
          setTecnicos([]);
        }
        setLoading(false);
      } else {
        console.log('💾 Usando técnicos de datos estáticos');
        setTecnicos(data.tecnicos || []);
        setLoading(false);
      }
    };
    
    loadTecnicos();
  }, [useBackend, refreshKey]);

  const filteredTecnicos = tecnicos.filter(tecnico => {
    const matchesSearch = 
      tecnico.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tecnico.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tecnico.dni && tecnico.dni.includes(searchTerm));
    const matchesEspecialidad = filterEspecialidad === 'todas' || tecnico.especialidad === filterEspecialidad;
    
    return matchesSearch && matchesEspecialidad;
  });

  const handleNuevoTecnico = () => {
    setSelectedTecnico(null);
    setShowModal(true);
  };

  const handleEditTecnico = (tecnico) => {
    setSelectedTecnico(tecnico);
    setShowModal(true);
  };

  const handleShowHistory = (tecnico) => {
    setHistoryTecnico(tecnico);
    setShowHistoryModal(true);
  };

  const getEspecialidadBadge = (especialidad) => {
    const badges = {
      refrigeracion: 'primary',
      congelacion: 'info',
      camaras: 'warning',
      general: 'secondary'
    };
    return badges[especialidad] || 'secondary';
  };

  const getServiciosActivos = (tecnicoId) => {
    return data.servicios.filter(s => 
      s.tecnicoId === tecnicoId && (s.estado === 'pendiente' || s.estado === 'proceso')
    ).length;
  };

  const getEstadoTecnico = (tecnicoId) => {
    const servicios = data.servicios.filter(s => s.tecnicoId === tecnicoId);
    const enProceso = servicios.filter(s => s.estado === 'proceso').length;
    const pendientes = servicios.filter(s => s.estado === 'pendiente').length;
    
    // Debug para el técnico con ID 1 (Juan Pérez)
    if (tecnicoId === 1) {
      console.log(`🔍 Estado técnico ${tecnicoId}:`, {
        serviciosTotal: servicios.length,
        enProceso,
        pendientes,
        servicios: servicios.map(s => ({ id: s.id, estado: s.estado, descripcion: s.descripcion }))
      });
    }
    
    if (enProceso > 0) {
      return {
        estado: 'En servicio',
        disponible: false,
        color: 'danger',
        bgColor: 'bg-danger',
        descripcion: `Trabajando en ${enProceso} servicio${enProceso > 1 ? 's' : ''}`
      };
    } else if (pendientes > 0) {
      return {
        estado: 'Ocupado',
        disponible: false,
        color: 'warning',
        bgColor: 'bg-warning',
        descripcion: `${pendientes} servicio${pendientes > 1 ? 's' : ''} asignado${pendientes > 1 ? 's' : ''}`
      };
    } else {
      return {
        estado: 'Disponible',
        disponible: true,
        color: 'success',
        bgColor: 'bg-success',
        descripcion: 'Listo para asignar'
      };
    }
  };

  const getInitials = (nombre, apellido) => {
    const firstInitial = nombre ? nombre.charAt(0).toUpperCase() : '';
    const lastInitial = apellido ? apellido.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  const getAvatarColor = (id) => {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #30cfd0, #330867)',
      'linear-gradient(135deg, #a8edea, #fed6e3)',
      'linear-gradient(135deg, #ff9a9e, #fecfef)'
    ];
    return colors[id % colors.length];
  };

  const getTecnicoHistory = (tecnicoId) => {
    return data.servicios.filter(s => 
      s.tecnicoId === tecnicoId && (s.estado === 'completado' || s.estado === 'cancelado')
    ).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  const handleViewServiceDetails = (servicio) => {
    console.log('🔍 FUNCIÓN handleViewServiceDetails EJECUTADA!');
    console.log('=== TECNICO HISTORIAL - VER DETALLE ===');
    console.log('servicio completo:', servicio);
    console.log('servicio.id:', servicio.id);
    console.log('servicio.fotos:', servicio.fotos);
    console.log('tipo de servicio.fotos:', typeof servicio.fotos);
    console.log('es array servicio.fotos:', Array.isArray(servicio.fotos));
    
    if (servicio.fotos) {
      console.log('servicio.fotos.antes:', servicio.fotos.antes);
      console.log('servicio.fotos.despues:', servicio.fotos.despues);
      console.log('tiene antes?:', servicio.fotos.antes ? 'SÍ' : 'NO');
      console.log('tiene despues?:', servicio.fotos.despues ? 'SÍ' : 'NO');
      
      if (servicio.fotos.antes) {
        console.log('cantidad fotos antes:', servicio.fotos.antes.length);
        console.log('array fotos antes:', servicio.fotos.antes);
      }
      
      if (servicio.fotos.despues) {
        console.log('cantidad fotos despues:', servicio.fotos.despues.length);
        console.log('array fotos despues:', servicio.fotos.despues);
      }
    } else {
      console.log('NO HAY FOTOS EN EL SERVICIO');
    }
    
    console.log('=== FIN DEBUG TECNICO HISTORIAL ===');
    
    setSelectedServiceForDetails(servicio);
    setShowServiceDetailsModal(true);
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-gray-900 m-0"><i className="fas fa-user-hard-hat"></i> Técnicos</h2>
        <div className="flex gap-3">
          <button className="btn-primary-enhanced group" onClick={handleNuevoTecnico}>
            <span>
              <i className="fas fa-user-plus text-lg"></i>
              <span>Nuevo Técnico</span>
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex items-center gap-4 flex-wrap border border-gray-200">
        <div className="flex-1 min-w-[280px] relative">
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-base pointer-events-none"></i>
          <input 
            type="text" 
            placeholder="Buscar técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 px-4 pl-12 border border-gray-300 rounded-lg text-base text-gray-900 bg-gray-50 transition-all duration-200 focus:outline-none focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_var(--primary-alpha-10)]"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Especialidad:</label>
          <select 
            value={filterEspecialidad} 
            onChange={(e) => setFilterEspecialidad(e.target.value)}
            className="py-3 px-4 border border-gray-300 rounded-lg text-base text-gray-900 bg-white appearance-none cursor-pointer transition-all duration-200 hover:border-gray-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-alpha-10)]"
          >
            <option value="todas">Todas</option>
            <option value="refrigeracion">Refrigeración</option>
            <option value="congelacion">Congelación</option>
            <option value="camaras">Cámaras</option>
            <option value="general">General</option>
          </select>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button 
            className={`p-3 min-w-[40px] bg-transparent rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="fas fa-th-large"></i>
          </button>
          <button 
            className={`p-3 min-w-[40px] bg-transparent rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Cargando técnicos...</p>
        </div>
      ) : filteredTecnicos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <i className="fas fa-user-hard-hat text-6xl text-gray-300 mb-6"></i>
          <h3 className="text-xl text-gray-700 m-0 mb-3">No se encontraron técnicos</h3>
          <p className="text-base text-gray-500 m-0 mb-8">No hay técnicos que coincidan con los filtros aplicados.</p>
          <button className="btn-primary-enhanced group" onClick={handleNuevoTecnico}>
            <span>
              <i className="fas fa-user-plus text-lg"></i>
              <span>Agregar Primer Técnico</span>
            </span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 animate-fadeIn">
          {filteredTecnicos.map(tecnico => {
            const serviciosActivos = getServiciosActivos(tecnico.id);
            const estadoInfo = getEstadoTecnico(tecnico.id);
            
            return (
              <div key={tecnico.id} className="bg-white rounded-3xl shadow-md p-6 border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden flex flex-col min-h-[400px] group hover:transform hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl hover:border-warning/20 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-warning before:to-warning-light before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-100">
                <div className="flex items-start relative pb-6 border-b border-gray-100">
                  <ProfileImage 
                    filename={tecnico.profileImage}
                    userType="tecnicos"
                    alt={`${tecnico.nombre} ${tecnico.apellido}`}
                    className="rounded-2xl object-cover object-center border-2 border-gray-200 mr-4"
                    style={{ width: '82px', height: '76px' }}
                    fallbackIcon="fa-user"
                  />
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 m-0 leading-tight">{tecnico.nombre} {tecnico.apellido}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm text-gray-600 font-medium m-0 bg-gray-100 py-1 px-3 rounded-lg inline-block w-fit">DNI: {tecnico.dni}</p>
                      <span className={`py-1 px-3 rounded-full text-xs font-medium uppercase tracking-wide inline-block w-fit ${getEspecialidadBadge(tecnico.especialidad) === 'primary' ? 'bg-primary/20 text-primary-dark' : getEspecialidadBadge(tecnico.especialidad) === 'info' ? 'bg-info/20 text-info-dark' : getEspecialidadBadge(tecnico.especialidad) === 'warning' ? 'bg-warning/20 text-warning-dark' : 'bg-secondary/10 text-secondary-dark'}`}>
                        {tecnico.especialidad === 'refrigeracion' ? 'Refrigeración' :
                         tecnico.especialidad === 'congelacion' ? 'Congelación' :
                         tecnico.especialidad === 'camaras' ? 'Cámaras' : 'General'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col mb-2">
                  <div className="flex flex-col ">
                    <div className="flex items-center gap-4 text-gray-700 text-sm transition-all duration-200 py-3  hover:text-gray-900 hover:transform hover:translate-x-0.5">
                      <i className="fas fa-phone w-5 flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 text-success"></i>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal font-medium">{tecnico.telefono}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700 text-sm transition-all duration-200 py-3  hover:text-gray-900 hover:transform hover:translate-x-0.5">
                      <i className="fas fa-envelope w-5 flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 text-primary"></i>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal font-medium">{tecnico.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700 text-sm transition-all duration-200 py-3  hover:text-gray-900 hover:transform hover:translate-x-0.5">
                      <i className="fas fa-briefcase w-5 flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 text-warning"></i>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal font-medium">{tecnico.experiencia} años de experiencia</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700 text-sm transition-all duration-200 py-3 hover:text-gray-900 hover:transform hover:translate-x-0.5">
                      <i className="fas fa-chart-line w-5 flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 text-info"></i>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal font-medium">{estadoInfo.descripcion}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 text-center border border-gray-200 transition-all duration-300 flex flex-col items-center justify-center min-h-[70px] relative overflow-hidden group before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-warning before:to-warning-light before:scale-x-0 before:transition-all before:duration-300 hover:bg-gradient-to-br hover:from-warning/10 hover:to-warning/20 hover:border-warning/20 hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:before:scale-x-100">
                      <span className="block text-2xl font-bold text-gray-900 leading-tight mb-1">{serviciosActivos}</span>
                      <span className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Servicios Activos</span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200 transition-all duration-300 flex flex-row items-center gap-3 min-h-[70px] relative overflow-hidden text-left group before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-warning before:to-warning-light before:scale-x-0 before:transition-all before:duration-300 hover:bg-gradient-to-br hover:from-warning/10 hover:to-warning/20 hover:border-warning/20 hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:before:scale-x-100">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 animate-pulse ${estadoInfo.bgColor}`}></div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900">{estadoInfo.estado}</span>
                        <span className="text-xs text-gray-600">{estadoInfo.descripcion}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 mt-auto">
                  <button 
                    className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-info flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-info-dark" 
                    title="Ver perfil del técnico"
                    onClick={() => handleEditTecnico(tecnico)}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button 
                    className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-orange-500 flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-orange-600" 
                    title="Ver historial de trabajos"
                    onClick={() => handleShowHistory(tecnico)}
                  >
                    <i className="fas fa-history"></i>
                  </button>
                  <button 
                    className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-primary flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-primary-dark" 
                    title="Editar información del técnico"
                    onClick={() => handleEditTecnico(tecnico)}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
          
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-fadeIn">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Nombre</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">DNI</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Especialidad</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Teléfono</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Email</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Experiencia</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Servicios Activos</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Estado</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTecnicos.map(tecnico => {
                const serviciosActivos = getServiciosActivos(tecnico.id);
                const estadoInfo = getEstadoTecnico(tecnico.id);
                
                return (
                  <tr key={tecnico.id} className="transition-all duration-200 border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                      <div className="flex items-center gap-3">
                        <ProfileImage 
                          filename={tecnico.profileImage}
                          userType="tecnicos"
                          alt={`${tecnico.nombre} ${tecnico.apellido}`}
                          className="rounded-2xl object-cover object-center border-2 border-gray-200"
                          style={{ width: '82px', height: '76px' }}
                          fallbackIcon="fa-user"
                        />
                        <span>{tecnico.nombre} {tecnico.apellido}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{tecnico.dni}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                      <span className={`inline-flex items-center py-1 px-3 rounded-full text-xs font-medium uppercase tracking-wide ${getEspecialidadBadge(tecnico.especialidad) === 'primary' ? 'bg-primary/20 text-primary-dark' : getEspecialidadBadge(tecnico.especialidad) === 'info' ? 'bg-info/20 text-info-dark' : getEspecialidadBadge(tecnico.especialidad) === 'warning' ? 'bg-warning/20 text-warning-dark' : 'bg-secondary/10 text-secondary-dark'}`}>
                        {tecnico.especialidad}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{tecnico.telefono}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{tecnico.email}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{tecnico.experiencia} años</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{serviciosActivos}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                      <span className={`inline-flex items-center py-1 px-3 rounded-full text-xs font-medium ${
                        estadoInfo.color === 'success' ? 'bg-success/20 text-success-dark' : 
                        estadoInfo.color === 'warning' ? 'bg-warning/20 text-warning-dark' : 
                        'bg-danger/20 text-danger-dark'
                      }`}>
                        {estadoInfo.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                      <button 
                        className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-info flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-info-dark" 
                        title="Ver perfil"
                        onClick={() => handleEditTecnico(tecnico)}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-orange-500 flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-orange-600 ml-2" 
                        title="Ver historial"
                        onClick={() => handleShowHistory(tecnico)}
                      >
                        <i className="fas fa-history"></i>
                      </button>
                      <button 
                        className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-primary flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-primary-dark ml-2" 
                        title="Editar"
                        onClick={() => handleEditTecnico(tecnico)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-success flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-success-dark ml-2" 
                        title="Asignar servicio"
                      >
                        <i className="fas fa-plus-circle"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedTecnico ? `Técnico: ${selectedTecnico.nombre} ${selectedTecnico.apellido}` : 'Nuevo Técnico'}
      >
        <TecnicoForm 
          tecnico={selectedTecnico}
          onClose={() => setShowModal(false)}
          onSuccess={(newTecnico) => {
            console.log('✅ Técnico creado exitosamente:', newTecnico);
            // Si es edición, actualizar los datos del técnico seleccionado
            if (selectedTecnico) {
              setSelectedTecnico(prev => ({
                ...prev,
                ...newTecnico
              }));
            }
            setShowModal(false);
            // Actualizar lista sin recargar página completa
            setRefreshKey(prev => prev + 1);
          }}
        />
      </Modal>

      {/* Modal de historial */}
      {showHistoryModal && historyTecnico && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ProfileImage 
                    filename={historyTecnico.profileImage}
                    userType="tecnicos"
                    alt={`${historyTecnico.nombre} ${historyTecnico.apellido}`}
                    className="rounded-xl object-cover object-center"
                    style={{ width: '82px', height: '76px' }}
                    fallbackIcon="fa-user"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Historial de {historyTecnico.nombre} {historyTecnico.apellido}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {historyTecnico.especialidad === 'refrigeracion' ? 'Especialista en Refrigeración' :
                       historyTecnico.especialidad === 'congelacion' ? 'Especialista en Congelación' :
                       historyTecnico.especialidad === 'camaras' ? 'Especialista en Cámaras' : 'Técnico General'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="fas fa-times text-gray-500 text-xl"></i>
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const historyServices = getTecnicoHistory(historyTecnico.id);
                
                if (historyServices.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <i className="fas fa-history text-5xl text-gray-300 mb-4"></i>
                      <h3 className="text-xl text-gray-700 font-semibold mb-2">Sin historial de servicios</h3>
                      <p className="text-gray-500">Este técnico aún no ha completado ningún servicio.</p>
                    </div>
                  );
                }

                // Estadísticas del técnico
                const totalServicios = historyServices.length;
                const serviciosCompletados = historyServices.filter(s => s.estado === 'completado').length;
                const serviciosCancelados = historyServices.filter(s => s.estado === 'cancelado').length;
                const serviciosConEvaluacion = historyServices.filter(s => s.evaluacion).length;
                const promedioCalificacion = serviciosConEvaluacion > 0
                  ? (historyServices
                      .filter(s => s.evaluacion)
                      .reduce((acc, s) => acc + s.evaluacion.calificacion, 0) / serviciosConEvaluacion
                    ).toFixed(1)
                  : 0;

                return (
                  <div className="space-y-6">
                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <i className="fas fa-clipboard-check text-white"></i>
                          </div>
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Total</p>
                            <p className="text-2xl font-bold text-blue-900">{totalServicios}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <i className="fas fa-check-circle text-white"></i>
                          </div>
                          <div>
                            <p className="text-sm text-green-600 font-medium">Completados</p>
                            <p className="text-2xl font-bold text-green-900">{serviciosCompletados}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <i className="fas fa-times-circle text-white"></i>
                          </div>
                          <div>
                            <p className="text-sm text-red-600 font-medium">Cancelados</p>
                            <p className="text-2xl font-bold text-red-900">{serviciosCancelados}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <i className="fas fa-star text-white"></i>
                          </div>
                          <div>
                            <p className="text-sm text-yellow-600 font-medium">Calificación</p>
                            <p className="text-2xl font-bold text-yellow-900">{promedioCalificacion}/5</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de servicios */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicios Realizados</h3>
                      <div className="space-y-3">
                        {historyServices.map(servicio => {
                          const cliente = data.clientes.find(c => c.id === servicio.clienteId);
                          const equipos = data.equipos.filter(e => servicio.equipos.includes(e.id));
                          
                          return (
                            <div key={servicio.id} className="flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-primary transition-all duration-300">
                              <div className="bg-primary text-white p-3 rounded-lg text-center min-w-16 flex flex-col justify-center shrink-0">
                                <span className="text-lg font-bold leading-none">{new Date(servicio.fecha).getDate()}</span>
                                <span className="text-xs uppercase mt-1 opacity-90">
                                  {new Date(servicio.fecha).toLocaleDateString('es', { month: 'short' })}
                                </span>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2">
                                  <h4 className="text-base font-semibold text-gray-900 mb-1 lg:mb-0">
                                    {cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}
                                  </h4>
                                  <div className="flex gap-2 flex-wrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${servicio.tipo === 'preventivo' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'}`}>
                                      <i className={`fas fa-${servicio.tipo === 'preventivo' ? 'shield-alt' : 'tools'}`}></i> {servicio.tipo}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                                      servicio.estado === 'completado' ? 'bg-success/10 text-success' : 'bg-red-100 text-red-700'
                                    }`}>
                                      <i className={`fas fa-${servicio.estado === 'completado' ? 'check-circle' : 'times-circle'}`}></i>
                                      {servicio.estado === 'completado' ? 'Completado' : 'Cancelado'}
                                    </span>
                                    {servicio.evaluacion && (
                                      <span className="px-2 py-1 text-xs font-medium bg-warning/10 text-warning rounded-full flex items-center gap-1">
                                        <i className="fas fa-star"></i>
                                        {servicio.evaluacion.calificacion}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <p className="text-gray-700 text-sm mb-2">{servicio.descripcion}</p>
                                
                                <div className="flex justify-between items-end">
                                  <div className="flex flex-wrap gap-2">
                                    {equipos.slice(0, 2).map(equipo => (
                                      <span key={equipo.id} className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary-dark rounded text-xs font-medium">
                                        {equipo.tipo} {equipo.marca}
                                      </span>
                                    ))}
                                    {equipos.length > 2 && (
                                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                        +{equipos.length - 2} más
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      console.log('🔥🔥🔥 BOTÓN PRESIONADO! - Ver detalles 🔥🔥🔥');
                                      console.log('Servicio ID:', servicio.id);
                                      console.log('Servicio completo:', servicio);
                                      handleViewServiceDetails(servicio);
                                    }}
                                    className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5"
                                    title="Ver detalles del servicio"
                                  >
                                    <i className="fas fa-eye text-xs"></i>
                                    Ver detalles
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Footer del modal */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles del servicio desde historial */}
      {showServiceDetailsModal && selectedServiceForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Detalles del Servicio
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedServiceForDetails.estado === 'completado' ? 'Servicio completado' : 'Servicio cancelado'}
                  </p>
                </div>
                <button
                  onClick={() => setShowServiceDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="fas fa-times text-gray-500 text-xl"></i>
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const cliente = data.clientes.find(c => c.id === selectedServiceForDetails.clienteId);
                const tecnico = data.tecnicos.find(t => t.id === selectedServiceForDetails.tecnicoId);
                const equipos = data.equipos.filter(e => selectedServiceForDetails.equipos.includes(e.id));
                
                return (
                  <div className="space-y-6">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Cliente:</span> 
                              <span className="ml-2">{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</span>
                            </p>
                            {cliente?.ruc && (
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">RUC:</span> 
                                <span className="ml-2">{cliente.ruc}</span>
                              </p>
                            )}
                            {cliente?.dni && (
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">DNI:</span> 
                                <span className="ml-2">{cliente.dni}</span>
                              </p>
                            )}
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Dirección:</span> 
                              <span className="ml-2">{cliente?.direccion}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Teléfono:</span> 
                              <span className="ml-2">{cliente?.telefono}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Técnico Asignado</h3>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Nombre:</span> 
                              <span className="ml-2">{tecnico?.nombre} {tecnico?.apellido}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Especialidad:</span> 
                              <span className="ml-2 capitalize">{tecnico?.especialidad}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Teléfono:</span> 
                              <span className="ml-2">{tecnico?.telefono}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Email:</span> 
                              <span className="ml-2">{tecnico?.email}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalles del Servicio</h3>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Fecha:</span> 
                              <span className="ml-2">{new Date(selectedServiceForDetails.fecha).toLocaleDateString()}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Hora:</span> 
                              <span className="ml-2">{selectedServiceForDetails.hora}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Tipo:</span> 
                              <span className="ml-2 capitalize">{selectedServiceForDetails.tipo}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Prioridad:</span> 
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                selectedServiceForDetails.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                                selectedServiceForDetails.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {selectedServiceForDetails.prioridad}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Estado:</span> 
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                selectedServiceForDetails.estado === 'completado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {selectedServiceForDetails.estado}
                              </span>
                            </p>
                            {selectedServiceForDetails.fechaCompletado && (
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Fecha de finalización:</span> 
                                <span className="ml-2">{new Date(selectedServiceForDetails.fechaCompletado).toLocaleDateString()}</span>
                              </p>
                            )}
                            {selectedServiceForDetails.fechaCancelado && (
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Fecha de cancelación:</span> 
                                <span className="ml-2">{new Date(selectedServiceForDetails.fechaCancelado).toLocaleDateString()}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {selectedServiceForDetails.motivoCancelacion && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Motivo de Cancelación</h3>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-sm text-red-700">{selectedServiceForDetails.motivoCancelacion}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción del Trabajo</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{selectedServiceForDetails.descripcion}</p>
                      </div>
                    </div>

                    {/* Equipos trabajados */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Equipos Trabajados</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {equipos.map(equipo => (
                          <div key={equipo.id} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-snowflake text-primary"></i>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{equipo.tipo} {equipo.marca}</h4>
                                <p className="text-sm text-gray-600">Modelo: {equipo.modelo}</p>
                                <p className="text-sm text-gray-600">Serial: {equipo.serial}</p>
                                <p className="text-sm text-gray-600">Ubicación: {equipo.ubicacion}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Observaciones */}
                    {selectedServiceForDetails.observaciones && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Observaciones</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800">{selectedServiceForDetails.observaciones}</p>
                        </div>
                      </div>
                    )}

                    {/* Evaluación del cliente */}
                    {selectedServiceForDetails.evaluacion && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Evaluación del Cliente</h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-green-800">Calificación:</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <i 
                                  key={i} 
                                  className={`fas fa-star ${i < selectedServiceForDetails.evaluacion.calificacion ? 'text-yellow-400' : 'text-gray-300'}`}
                                ></i>
                              ))}
                              <span className="ml-2 text-green-800 font-bold">
                                {selectedServiceForDetails.evaluacion.calificacion}/5
                              </span>
                            </div>
                          </div>
                          {selectedServiceForDetails.evaluacion.comentario && (
                            <p className="text-green-800 mt-2">
                              <span className="font-medium">Comentario:</span> {selectedServiceForDetails.evaluacion.comentario}
                            </p>
                          )}
                          <p className="text-xs text-green-600 mt-2">
                            Evaluado el {new Date(selectedServiceForDetails.evaluacion.fecha).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Registro Fotográfico del Trabajo */}
                    {(selectedServiceForDetails.fotosAntes?.length > 0 || selectedServiceForDetails.fotosDespues?.length > 0) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Registro Fotográfico del Trabajo</h3>
                        
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Fotos de ANTES */}
                          {selectedServiceForDetails.fotosAntes && selectedServiceForDetails.fotosAntes.length > 0 && (
                            <div className="flex-1">
                              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                  <i className="fas fa-exclamation-triangle text-red-600 text-xs"></i>
                                </div>
                                Fotos ANTES del Trabajo
                              </h4>
                              <div className="flex flex-wrap gap-3">
                                {selectedServiceForDetails.fotosAntes.map((foto, index) => (
                                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg overflow-hidden hover:bg-red-100 transition-colors w-32 h-32 flex-shrink-0">
                                    {foto.data ? (
                                      <div className="relative w-full h-full">
                                        <img 
                                          src={foto.data} 
                                          alt={`Antes ${index + 1}`} 
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => window.open(foto.data, '_blank')}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                                          <p className="text-xs font-medium truncate">{foto.nombre}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                        <i className="fas fa-image text-2xl text-red-400 mb-1"></i>
                                        <p className="text-xs text-red-700 font-medium text-center">{typeof foto === 'string' ? foto : foto.nombre || `Foto ${index + 1}`}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Fotos de DESPUÉS */}
                          {selectedServiceForDetails.fotosDespues && selectedServiceForDetails.fotosDespues.length > 0 && (
                            <div className="flex-1">
                              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <i className="fas fa-check-circle text-green-600 text-xs"></i>
                                </div>
                                Fotos DESPUÉS del Trabajo
                              </h4>
                              <div className="flex flex-wrap gap-3">
                                {selectedServiceForDetails.fotosDespues.map((foto, index) => (
                                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg overflow-hidden hover:bg-green-100 transition-colors w-32 h-32 flex-shrink-0">
                                    {foto.data ? (
                                      <div className="relative w-full h-full">
                                        <img 
                                          src={foto.data} 
                                          alt={`Después ${index + 1}`} 
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => window.open(foto.data, '_blank')}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                                          <p className="text-xs font-medium truncate">{foto.nombre}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                        <i className="fas fa-image text-2xl text-green-400 mb-1"></i>
                                        <p className="text-xs text-green-700 font-medium text-center">{typeof foto === 'string' ? foto : foto.nombre || `Foto ${index + 1}`}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            
            {/* Footer del modal */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowServiceDetailsModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tecnicos;