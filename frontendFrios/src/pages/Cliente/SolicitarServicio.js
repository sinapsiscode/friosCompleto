import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import Modal from '../../components/Common/Modal';
import EquipoForm from '../../components/Forms/EquipoForm';
import { showAlert } from '../../utils/sweetAlert';
import { formatearFecha } from '../../utils/dateUtils';
import servicioService from '../../services/servicio.service';
import programacionService from '../../services/programacion.service';

// Componente del formulario original (ahora extraído)
const FormularioOrdenServicio = ({ onClose, clienteActual: clienteActualProp, data, addItem, getNextId, user }) => {
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [clienteActual, setClienteActual] = useState(clienteActualProp);
  const [formData, setFormData] = useState({
    tipo: '',
    restaurante: '',
    descripcion: '',
    equiposSeleccionados: [],
    fechaPreferida: '',
    horaPreferida: '',
    urgencia: 'baja',
    ubicacionSeleccionada: '',
    clienteSeleccionado: '', // Para administradores
    programacion: {
      fechaInicio: '',
      fechaFin: '',
      frecuencia: 'mensual',
      diasSemana: [],
      diaMes: '',
      fechasEspecificas: []
    }
  });

  // Efecto para sincronizar el cliente actual con el prop
  useEffect(() => {
    setClienteActual(clienteActualProp);
  }, [clienteActualProp]);

  const misEquipos = clienteActual 
    ? data.equipos.filter(e => clienteActual.equipos.includes(e.id))
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 HandleChange - Campo: ${name}, Valor: ${value}, Tipo: ${typeof value}`);
    
    // Si se selecciona un cliente diferente, actualizar clienteActual y resetear ubicación
    if (name === 'clienteSeleccionado') {
      const nuevoCliente = data.clientes.find(c => c.id === parseInt(value));
      console.log('👤 Cliente seleccionado:', nuevoCliente);
      setClienteActual(nuevoCliente);
      
      // Resetear campos relacionados con la ubicación y equipos
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ubicacionSeleccionada: '',
        equiposSeleccionados: []
      }));
      return;
    }
    
    // Log adicional para ubicación
    if (name === 'ubicacionSeleccionada') {
      console.log('🏢 Ubicación seleccionada index:', value);
      if (clienteActual?.ubicaciones && value !== '') {
        const ubicacion = clienteActual.ubicaciones[parseInt(value)];
        console.log('🏢 Datos de ubicación:', ubicacion);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProgramacionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      programacion: {
        ...prev.programacion,
        [field]: value
      }
    }));
  };

  const handleEquipoToggle = (equipoId) => {
    setFormData(prev => ({
      ...prev,
      equiposSeleccionados: prev.equiposSeleccionados.includes(equipoId)
        ? prev.equiposSeleccionados.filter(id => id !== equipoId)
        : [...prev.equiposSeleccionados, equipoId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('🔵 === INICIANDO GUARDADO DE SOLICITUD DE SERVICIO ===');
    console.log('📋 FormData completo:', formData);
    console.log('👤 Cliente actual:', clienteActual);
    
    // Validación simple
    if (!formData.tipo || !formData.descripcion || formData.equiposSeleccionados.length === 0) {
      console.log('❌ Validación falló - Campos faltantes');
      showAlert('Por favor complete todos los campos obligatorios para la orden y seleccione al menos un equipo', 'warning');
      return;
    }

    // Validación adicional para administradores y técnicos
    if ((user.userType === 'admin' || user.userType === 'tecnico') && !formData.clienteSeleccionado) {
      console.log('❌ Validación falló - Cliente no seleccionado');
      showAlert('Por favor seleccione un cliente para la orden', 'warning');
      return;
    }

    // Validar ubicación si existen ubicaciones
    if (clienteActual?.ubicaciones && clienteActual.ubicaciones.length > 0 && formData.ubicacionSeleccionada === '') {
      console.log('❌ Validación falló - Ubicación no seleccionada');
      showAlert('Por favor seleccione una ubicación para la orden', 'warning');
      return;
    }

    // Usar la dirección seleccionada o la básica del cliente
    let ubicacionInfo;
    
    console.log('🔍 Analizando ubicación:');
    console.log('- Cliente tiene ubicaciones:', clienteActual?.ubicaciones?.length || 0);
    console.log('- Ubicación seleccionada (formData):', formData.ubicacionSeleccionada);
    console.log('- Ubicaciones disponibles:', clienteActual?.ubicaciones);
    
    if (clienteActual?.ubicaciones && clienteActual.ubicaciones.length > 0) {
      // Si tiene ubicaciones, usar la seleccionada
      if (formData.ubicacionSeleccionada !== '') {
        const ubicacionIndex = parseInt(formData.ubicacionSeleccionada);
        const ubicacionSeleccionada = clienteActual.ubicaciones[ubicacionIndex];
        console.log('📍 Ubicación seleccionada:', ubicacionSeleccionada);
        console.log('📍 Index:', ubicacionIndex);
        console.log('📍 Dirección:', ubicacionSeleccionada?.direccion);
        console.log('📍 Ciudad:', ubicacionSeleccionada?.ciudad);
        console.log('📍 Distrito:', ubicacionSeleccionada?.distrito);
        
        ubicacionInfo = {
          direccionServicio: ubicacionSeleccionada.direccion || '',
          ciudadServicio: ubicacionSeleccionada.ciudad || 'Lima',
          distritoServicio: ubicacionSeleccionada.distrito || ''
        };
      } else {
        // Si tiene ubicaciones pero no seleccionó ninguna, usar valores vacíos
        // (aunque esto no debería pasar por la validación anterior)
        console.log('⚠️ Tiene ubicaciones pero no seleccionó ninguna');
        ubicacionInfo = {
          direccionServicio: '',
          ciudadServicio: 'Lima',
          distritoServicio: ''
        };
      }
    } else {
      // Si no tiene ubicaciones, usar la dirección del cliente
      console.log('📍 Usando dirección del cliente (no tiene ubicaciones)');
      ubicacionInfo = {
        direccionServicio: clienteActual.direccion || '',
        ciudadServicio: clienteActual.ciudad || 'Lima',
        distritoServicio: clienteActual.distrito || ''
      };
    }
    console.log('📍 Info de dirección final:', ubicacionInfo);

    const nuevaSolicitud = {
      id: getNextId('servicios'),
      clienteId: clienteActual.id,
      tecnicoId: null, // Se asignará después
      fecha: formData.fechaPreferida || formData.programacion.fechaInicio || new Date().toISOString().split('T')[0],
      hora: formData.horaPreferida || '09:00',
      tipo: formData.tipo,
      estado: 'pendiente',
      descripcion: formData.descripcion,
      equipos: formData.equiposSeleccionados,
      prioridad: formData.urgencia,
      observaciones: '',
      fotos: [],
      ...ubicacionInfo,
      // Agregar información del solicitante para administradores y técnicos
      ...((user.userType === 'admin' || user.userType === 'tecnico') && {
        solicitadoPor: user.userType === 'admin' ? {
          tipo: 'admin',
          id: null,
          nombre: 'Administrador',
          usuario: user.username
        } : {
          tipo: 'tecnico',
          id: data.tecnicos.find(t => t.usuario === user.username)?.id,
          nombre: (() => {
            const tecnico = data.tecnicos.find(t => t.usuario === user.username);
            return tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'Técnico';
          })(),
          usuario: user.username
        }
      })
    };

    console.log('📄 === SOLICITUD DE SERVICIO A GUARDAR ===');
    console.log('🆔 ID:', nuevaSolicitud.id);
    console.log('👤 Cliente ID:', nuevaSolicitud.clienteId);
    console.log('📅 Fecha:', nuevaSolicitud.fecha, '| Fuente:', {
      fechaPreferida: formData.fechaPreferida,
      fechaInicio: formData.programacion.fechaInicio,
      tipo: formData.tipo
    });
    console.log('🕐 Hora:', nuevaSolicitud.hora);
    console.log('📍 Dirección:', {
      direccionServicio: nuevaSolicitud.direccionServicio,
      ciudadServicio: nuevaSolicitud.ciudadServicio,
      distritoServicio: nuevaSolicitud.distritoServicio
    });
    console.log('🔧 Equipos seleccionados:', nuevaSolicitud.equipos);
    console.log('📋 Objeto completo de solicitud:', nuevaSolicitud);

    addItem('servicios', nuevaSolicitud);
    console.log('✅ Solicitud guardada exitosamente');

    // Si es servicio programado, crear la programación
    if (formData.tipo === 'programado' && formData.programacion.fechaInicio && formData.programacion.fechaFin) {
      const nuevaProgramacion = {
        id: getNextId('programaciones'),
        clienteId: clienteActual.id,
        tipo: formData.programacion.frecuencia,
        fechaInicio: formData.programacion.fechaInicio,
        fechaFin: formData.programacion.fechaFin,
        diasProgramados: [new Date(formData.programacion.fechaInicio).getDate()],
        equipos: formData.equiposSeleccionados,
        estado: 'activa'
      };
      addItem('programaciones', nuevaProgramacion);
    }

    console.log('🎉 === FIN DEL PROCESO DE GUARDADO ===');
    
    showAlert('Solicitud de orden de servicio enviada exitosamente', 'success');
    onClose();
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 m-0">
              <i className="fas fa-info-circle text-primary"></i>
              Información de la Orden
            </h3>
          </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Debug: Mostrar tipo de usuario */}
              {console.log('🔍 Tipo de usuario:', user.userType, '| user completo:', user)}
              
              {/* Selector de cliente para administradores y técnicos */}
              {(user.userType === 'admin' || user.userType === 'tecnico' || user.role === 'ADMIN' || user.role === 'TECNICO') && (
                <div className="flex flex-col col-span-full">
                  <label htmlFor="clienteSeleccionado" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <i className="fas fa-user text-gray-400 text-sm"></i>
                    Cliente *
                  </label>
                  <div className="relative">
                    <select 
                      id="clienteSeleccionado"
                      name="clienteSeleccionado" 
                      value={formData.clienteSeleccionado} 
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white transition-all duration-200 hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none pr-10"
                      required
                    >
                      <option value="">Seleccione un cliente</option>
                      {data.clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`}
                        </option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <label htmlFor="tipo" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <i className="fas fa-cog text-gray-400 text-sm"></i>
                  Tipo de Orden *
                </label>
                <div className="relative">
                  <select 
                    id="tipo"
                    name="tipo" 
                    value={formData.tipo} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white transition-all duration-200 hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none pr-10"
                    required
                  >
                    <option value="">Seleccione el tipo de orden</option>
                    <option value="programado">Mantenimiento Programado</option>
                    <option value="correctivo">Servicio Correctivo</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                </div>
              </div>
              <div className="flex flex-col">
                <label htmlFor="ubicacion" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <i className="fas fa-map-marker-alt text-gray-400 text-sm"></i>
                  Dirección para la Orden
                </label>
                <div className="relative">
                  {clienteActual?.ubicaciones && clienteActual.ubicaciones.length > 0 ? (
                    <>
                      <select
                        name="ubicacionSeleccionada"
                        value={formData.ubicacionSeleccionada || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        required
                      >
                        <option value="">Seleccione una ubicación para la orden</option>
                        {clienteActual.ubicaciones.map((ubicacion, index) => (
                          <option key={index} value={index}>
                            {ubicacion.nombre} - {ubicacion.direccion}, {ubicacion.distrito}
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    </>
                  ) : (
                    <input
                      type="text"
                      value={clienteActual ? `${clienteActual.direccion}, ${clienteActual.distrito || ''}, ${clienteActual.ciudad || 'Lima'}` : ''}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-gray-50 transition-all duration-200"
                      disabled
                      placeholder="Dirección registrada"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col col-span-full">
              <label htmlFor="descripcion" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <i className="fas fa-align-left text-gray-400 text-sm"></i>
                Descripción del Problema o Requerimiento *
              </label>
              <textarea 
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 resize-y transition-all duration-200 hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans"
                rows="4"
                placeholder="Describa detalladamente el requerimiento o el problema que presenta el equipo"
                required
              />
            </div>

        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 m-0">
              <i className="fas fa-snowflake text-primary"></i>
              Equipos a Intervenir *
            </h3>
            <button 
              type="button" 
              className="bg-transparent border border-primary text-primary px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-primary hover:text-white flex items-center gap-2"
              onClick={() => setShowEquipoModal(true)}
            >
              <i className="fas fa-plus"></i>
              <span>Nuevo Equipo</span>
            </button>
          </div>
          <div className="mt-4">
            {misEquipos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {misEquipos.map(equipo => (
                  <div 
                    key={equipo.id} 
                    className={`bg-gray-50 border-2 ${formData.equiposSeleccionados.includes(equipo.id) ? 'border-primary bg-primary/10' : 'border-gray-200'} rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary hover:transform hover:-translate-y-1 hover:shadow-sm relative`}
                    onClick={() => handleEquipoToggle(equipo.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${equipo.estado === 'operativo' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        <i className="fas fa-snowflake"></i>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox"
                          checked={formData.equiposSeleccionados.includes(equipo.id)}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-800 mb-1">{equipo.tipo.charAt(0).toUpperCase() + equipo.tipo.slice(1)}</h4>
                      <p className="text-sm text-gray-600 mb-2">{equipo.marca} {equipo.modelo}</p>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <i className="fas fa-map-marker-alt"></i>
                        {equipo.ubicacion}
                      </span>
                    </div>
                    <span className={`absolute bottom-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${equipo.estado === 'operativo' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {equipo.estado === 'operativo' ? 'Operativo' : 'En Mantenimiento'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <i className="fas fa-snowflake text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500 mb-4">No tiene equipos registrados</p>
                <button 
                  type="button" 
                  className="bg-primary text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-primary-dark flex items-center gap-2 mx-auto"
                  onClick={() => setShowEquipoModal(true)}
                >
                  <i className="fas fa-plus"></i>
                  <span>Registrar primer equipo</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {formData.tipo === 'programado' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 m-0">
                <i className="fas fa-calendar-alt text-primary"></i>
                Configuración de Programación
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <label htmlFor="fechaInicio" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <i className="fas fa-calendar-day text-gray-400 text-sm"></i>
                  Fecha de Inicio *
                </label>
                <input 
                  type="date"
                  id="fechaInicio"
                  name="fechaInicio"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white transition-all duration-200 hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={formData.programacion.fechaInicio}
                  onChange={(e) => handleProgramacionChange('fechaInicio', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required={formData.tipo === 'programado'}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="fechaFin" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <i className="fas fa-calendar-times text-gray-400 text-sm"></i>
                  Fecha de Fin *
                </label>
                <input 
                  type="date"
                  id="fechaFin"
                  name="fechaFin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white transition-all duration-200 hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={formData.programacion.fechaFin}
                  onChange={(e) => handleProgramacionChange('fechaFin', e.target.value)}
                  min={formData.programacion.fechaInicio || new Date().toISOString().split('T')[0]}
                  required={formData.tipo === 'programado'}
                />
              </div>
              <div className="flex flex-col col-span-full">
                <label htmlFor="frecuencia" className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                  <i className="fas fa-repeat text-gray-400 text-sm"></i>
                  Frecuencia de Mantenimiento *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className={`border-2 ${formData.programacion.frecuencia === 'semanal' ? 'border-primary bg-primary/5' : 'border-gray-200'} rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300`}>
                    <input
                      type="radio"
                      name="frecuencia"
                      value="semanal"
                      checked={formData.programacion.frecuencia === 'semanal'}
                      onChange={(e) => handleProgramacionChange('frecuencia', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <i className="fas fa-calendar-week text-xl text-primary mb-2"></i>
                      <h4 className="font-semibold text-gray-800 text-sm">Semanal</h4>
                      <p className="text-xs text-gray-600">Cada 7 días</p>
                    </div>
                  </label>
                  <label className={`border-2 ${formData.programacion.frecuencia === 'mensual' ? 'border-primary bg-primary/5' : 'border-gray-200'} rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300`}>
                    <input
                      type="radio"
                      name="frecuencia"
                      value="mensual"
                      checked={formData.programacion.frecuencia === 'mensual'}
                      onChange={(e) => handleProgramacionChange('frecuencia', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <i className="fas fa-calendar text-xl text-primary mb-2"></i>
                      <h4 className="font-semibold text-gray-800 text-sm">Mensual</h4>
                      <p className="text-xs text-gray-600">Cada 30 días</p>
                    </div>
                  </label>
                  <label className={`border-2 ${formData.programacion.frecuencia === 'trimestral' ? 'border-primary bg-primary/5' : 'border-gray-200'} rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300`}>
                    <input
                      type="radio"
                      name="frecuencia"
                      value="trimestral"
                      checked={formData.programacion.frecuencia === 'trimestral'}
                      onChange={(e) => handleProgramacionChange('frecuencia', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <i className="fas fa-calendar-plus text-xl text-primary mb-2"></i>
                      <h4 className="font-semibold text-gray-800 text-sm">Trimestral</h4>
                      <p className="text-xs text-gray-600">Cada 90 días</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.tipo === 'correctivo' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 m-0">
                <i className="fas fa-clock text-primary"></i>
                Programación Correctiva
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <label htmlFor="fechaPreferida" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <i className="fas fa-calendar-day text-gray-400 text-sm"></i>
                  Fecha para la Visita *
                </label>
                <input 
                  type="date"
                  id="fechaPreferida"
                  name="fechaPreferida"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white transition-all duration-200 hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={formData.fechaPreferida}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required={formData.tipo === 'correctivo'}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="horaPreferida" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <i className="fas fa-clock text-gray-400 text-sm"></i>
                  Rango de Horas Disponibles *
                </label>
                <select
                  id="horaPreferida"
                  name="horaPreferida"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white transition-all duration-200 hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={formData.horaPreferida}
                  onChange={handleChange}
                  required={formData.tipo === 'correctivo'}
                >
                  <option value="">Seleccione un rango de 4 horas</option>
                  <option value="08:00-12:00">08:00 - 12:00 (Mañana)</option>
                  <option value="09:00-13:00">09:00 - 13:00 (Mañana)</option>
                  <option value="10:00-14:00">10:00 - 14:00 (Mañana-Tarde)</option>
                  <option value="12:00-16:00">12:00 - 16:00 (Mediodía-Tarde)</option>
                  <option value="13:00-17:00">13:00 - 17:00 (Tarde)</option>
                  <option value="14:00-18:00">14:00 - 18:00 (Tarde)</option>
                  <option value="15:00-19:00">15:00 - 19:00 (Tarde-Noche)</option>
                  <option value="16:00-20:00">16:00 - 20:00 (Tarde-Noche)</option>
                </select>
              </div>
              <div className="flex flex-col col-span-full">
                <label htmlFor="urgencia" className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                  <i className="fas fa-exclamation-triangle text-gray-400 text-sm"></i>
                  Nivel de Urgencia
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className={`border-2 ${formData.urgencia === 'baja' ? 'border-success bg-success/5' : 'border-gray-200'} rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300`}>
                    <input
                      type="radio"
                      name="urgencia"
                      value="baja"
                      checked={formData.urgencia === 'baja'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <i className="fas fa-check-circle text-xl text-success mb-2"></i>
                      <h4 className="font-semibold text-gray-800 text-sm">Baja</h4>
                      <p className="text-xs text-gray-600">7 días</p>
                    </div>
                  </label>
                  <label className={`border-2 ${formData.urgencia === 'media' ? 'border-warning bg-warning/5' : 'border-gray-200'} rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300`}>
                    <input
                      type="radio"
                      name="urgencia"
                      value="media"
                      checked={formData.urgencia === 'media'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <i className="fas fa-exclamation-circle text-xl text-warning mb-2"></i>
                      <h4 className="font-semibold text-gray-800 text-sm">Media</h4>
                      <p className="text-xs text-gray-600">2-3 días</p>
                    </div>
                  </label>
                  <label className={`border-2 ${formData.urgencia === 'alta' ? 'border-danger bg-danger/5' : 'border-gray-200'} rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300`}>
                    <input
                      type="radio"
                      name="urgencia"
                      value="alta"
                      checked={formData.urgencia === 'alta'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <i className="fas fa-exclamation-triangle text-xl text-danger mb-2"></i>
                      <h4 className="font-semibold text-gray-800 text-sm">Alta</h4>
                      <p className="text-xs text-gray-600">24h</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 p-6 bg-gray-50 rounded-lg mt-6">
          <button 
            type="button" 
            className="bg-transparent border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-gray-100 flex items-center gap-2" 
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
            <span>Cancelar</span>
          </button>
          <button type="submit" className="bg-primary text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-primary-dark flex items-center gap-2">
            <i className="fas fa-paper-plane"></i>
            <span>Enviar Solicitud de Orden</span>
          </button>
        </div>
      </form>

      <Modal
        isOpen={showEquipoModal}
        onClose={() => setShowEquipoModal(false)}
        title="Nuevo Equipo"
      >
        <EquipoForm 
          clienteId={clienteActual?.id}
          onClose={() => {
            setShowEquipoModal(false);
            // Recargar la página para mostrar el nuevo equipo
            window.location.reload();
          }}
        />
      </Modal>
    </div>
  );
};

const SolicitarServicio = () => {
  const { data, addItem, getNextId } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [clienteActual, setClienteActual] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 20;

  useEffect(() => {
    if (user.userType === 'admin' || user.userType === 'tecnico') {
      // Para administradores y técnicos, no hay cliente automático
      setClienteActual(null);
    } else {
      // Para clientes, buscar por usuario
      const cliente = data.clientes.find(c => c.usuario === user.username);
      setClienteActual(cliente);
    }
  }, [data.clientes, user]);

  // Cálculos para clientes
  const misServicios = clienteActual 
    ? data.servicios.filter(s => s.clienteId === clienteActual.id)
    : [];

  const serviciosFiltrados = misServicios.filter(servicio => {
    const cumpleFiltroEstado = filtroEstado === 'todos' || servicio.estado === filtroEstado;
    const cumpleFiltroTipo = filtroTipo === 'todos' || servicio.tipo === filtroTipo;
    return cumpleFiltroEstado && cumpleFiltroTipo;
  });

  // Cálculos de paginación
  const totalPaginas = Math.ceil(serviciosFiltrados.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const indiceFin = indiceInicio + elementosPorPagina;
  const serviciosPaginados = serviciosFiltrados.slice(indiceInicio, indiceFin);

  // Resetear página actual si no hay datos en la página actual
  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(1);
    }
  }, [totalPaginas, paginaActual]);

  // Para clientes, mostrar vista de tabla
  if (user.userType === 'cliente') {

    const getEstadoClass = (estado) => {
      switch (estado) {
        case 'completado':
          return 'bg-success/10 text-success';
        case 'proceso':
          return 'bg-info/10 text-info';
        case 'pendiente':
          return 'bg-warning/10 text-warning';
        case 'cancelado':
          return 'bg-danger/10 text-danger';
        default:
          return 'bg-gray-100 text-gray-600';
      }
    };

    const getEstadoTexto = (estado) => {
      switch (estado) {
        case 'proceso': return 'En Proceso';
        case 'completado': return 'Completado';
        case 'pendiente': return 'Pendiente';
        case 'cancelado': return 'Cancelado';
        default: return estado;
      }
    };

    const getTecnicoNombre = (tecnicoId) => {
      if (!tecnicoId) return 'Sin asignar';
      const tecnico = data.tecnicos.find(t => t.id === tecnicoId);
      return tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'Sin asignar';
    };

    return (
      <div className="w-full max-w-7xl mx-auto p-6 animate-fadeIn">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-4">
              <i className="fas fa-clipboard-list text-info"></i> Orden de Servicio
            </h1>
            <p className="text-lg text-gray-600">Gestiona tus órdenes de servicio</p>
          </div>
          <button 
            onClick={() => setShowFormModal(true)}
            className="mt-4 lg:mt-0 bg-primary text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-primary-dark flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <i className="fas fa-plus"></i>
            <span>Agregar Orden de Servicio</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <i className="fas fa-filter text-gray-400"></i>
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer transition-all hover:border-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="proceso">En Proceso</option>
            <option value="completado">Completados</option>
            <option value="cancelado">Cancelados</option>
          </select>
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer transition-all hover:border-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="todos">Todos los tipos</option>
            <option value="programado">Mantenimiento Programado</option>
            <option value="correctivo">Servicio Correctivo</option>
          </select>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {serviciosFiltrados.length} de {misServicios.length} órdenes
            </div>
            {totalPaginas > 1 && (
              <div className="text-sm text-gray-500">
                Página {paginaActual} de {totalPaginas}
              </div>
            )}
          </div>
        </div>

        {/* Tabla de órdenes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {serviciosPaginados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Técnico</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serviciosPaginados.map((servicio) => (
                    <tr key={servicio.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <i className="fas fa-clipboard-list text-primary"></i>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{servicio.tipo === 'programado' ? 'Mantenimiento Programado' : 'Servicio Correctivo'}</div>
                            <div className="text-sm text-gray-500">{formatearFecha(servicio.fecha)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          servicio.tipo === 'programado' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                        }`}>
                          <i className={`fas ${servicio.tipo === 'programado' ? 'fa-calendar-check' : 'fa-tools'} mr-1`}></i>
                          {servicio.tipo === 'programado' ? 'Programado' : 'Correctivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={servicio.descripcion}>
                          {servicio.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTecnicoNombre(servicio.tecnicoId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(servicio.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoClass(servicio.estado)}`}>
                          {getEstadoTexto(servicio.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          servicio.prioridad === 'alta' ? 'bg-danger/10 text-danger' :
                          servicio.prioridad === 'media' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        }`}>
                          {servicio.prioridad}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-clipboard-list text-4xl text-gray-400"></i>
              </div>
              <h3 className="text-xl text-gray-700 font-semibold mb-2">No hay órdenes para mostrar</h3>
              <p className="text-gray-500 mb-6">
                {misServicios.length === 0 
                  ? 'Aún no has creado ninguna orden de servicio' 
                  : 'No hay órdenes que coincidan con los filtros seleccionados'
                }
              </p>
              <button 
                onClick={() => setShowFormModal(true)}
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-primary-dark flex items-center gap-2 mx-auto"
              >
                <i className="fas fa-plus"></i>
                <span>Crear primera orden</span>
              </button>
            </div>
          )}
        </div>

        {/* Controles de paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white rounded-lg shadow-sm border border-gray-100 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              Mostrando {indiceInicio + 1} - {Math.min(indiceFin, serviciosFiltrados.length)} de {serviciosFiltrados.length} órdenes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <i className="fas fa-chevron-left mr-1"></i>
                Anterior
              </button>
              
              {/* Números de página */}
              <div className="flex items-center gap-1">
                {[...Array(totalPaginas)].map((_, index) => {
                  const numPagina = index + 1;
                  // Mostrar solo páginas cercanas a la actual para evitar demasiados números
                  if (
                    numPagina === 1 ||
                    numPagina === totalPaginas ||
                    (numPagina >= paginaActual - 2 && numPagina <= paginaActual + 2)
                  ) {
                    return (
                      <button
                        key={numPagina}
                        onClick={() => setPaginaActual(numPagina)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          paginaActual === numPagina
                            ? 'bg-primary text-white'
                            : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {numPagina}
                      </button>
                    );
                  }
                  // Mostrar puntos suspensivos si hay salto
                  if (
                    (numPagina === paginaActual - 3 && paginaActual > 4) ||
                    (numPagina === paginaActual + 3 && paginaActual < totalPaginas - 3)
                  ) {
                    return (
                      <span key={numPagina} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Siguiente
                <i className="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>
        )}

        {/* Modal del formulario */}
        <Modal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          title="Nueva Orden de Servicio"
          size="large"
        >
          <FormularioOrdenServicio 
            onClose={() => setShowFormModal(false)}
            clienteActual={clienteActual}
            data={data}
            addItem={addItem}
            getNextId={getNextId}
            user={user}
          />
        </Modal>
      </div>
    );
  }

  // Para administradores y técnicos, mantener el formulario original
  return (
    <FormularioOrdenServicio 
      onClose={() => {}}
      clienteActual={clienteActual}
      data={data}
      addItem={addItem}
      getNextId={getNextId}
      user={user}
    />
  );
};

export default SolicitarServicio;