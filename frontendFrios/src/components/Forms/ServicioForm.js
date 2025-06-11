import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import { showAlert } from '../../utils/sweetAlert';
import servicioService from '../../services/servicio.service';
import clienteService from '../../services/cliente.service';
import tecnicoService from '../../services/tecnico.service';

const ServicioForm = ({ servicio, onClose, activeTab = 0 }) => {
  const { data, addItem, updateItem, getNextId } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    clienteId: '',
    tecnicoId: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    tipo: 'Preventivo', // Valor corregido
    descripcion: '',
    equipos: [],
    prioridad: 'MEDIA', // Valor corregido
    observaciones: ''
  });
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [equiposCliente, setEquiposCliente] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales desde APIs
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        console.log('📋 Cargando clientes y técnicos...');
        setLoading(true);
        
        // Cargar clientes y técnicos en paralelo
        const [clientesResponse, tecnicosResponse] = await Promise.all([
          clienteService.getAll({ limit: 100 }),
          tecnicoService.getAll({ limit: 100 })
        ]);
        
        console.log('✅ Clientes cargados:', clientesResponse.data?.length || 0);
        console.log('✅ Técnicos cargados:', tecnicosResponse.data?.length || 0);
        
        setClientes(clientesResponse.data || []);
        setTecnicos(tecnicosResponse.data || []);
        
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        showAlert('Error al cargar datos iniciales', 'error');
        
        // Fallback a localStorage si la API falla
        setClientes(data.clientes || []);
        setTecnicos(data.tecnicos || []);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [data.clientes, data.tecnicos]);

  // Cargar equipos cuando se selecciona un cliente
  useEffect(() => {
    const cargarEquipos = async () => {
      if (formData.clienteId) {
        try {
          console.log('🔧 Cargando equipos del cliente:', formData.clienteId);
          
          // Buscar cliente en la lista cargada
          const cliente = clientes.find(c => c.id === parseInt(formData.clienteId));
          setClienteSeleccionado(cliente);
          
          if (cliente && cliente.equipos) {
            console.log('✅ Equipos encontrados:', cliente.equipos.length);
            setEquiposCliente(cliente.equipos);
          } else {
            // Si no están en la respuesta, cargar por separado
            // TODO: Implementar API específica para equipos del cliente
            setEquiposCliente([]);
          }
        } catch (error) {
          console.error('❌ Error cargando equipos:', error);
          setEquiposCliente([]);
        }
      } else {
        setEquiposCliente([]);
        setClienteSeleccionado(null);
      }
    };
    
    cargarEquipos();
  }, [formData.clienteId, clientes]);

  // Cargar datos del servicio existente
  useEffect(() => {
    if (servicio) {
      console.log('🔄 Cargando datos del servicio existente:', servicio);
      setFormData({
        clienteId: servicio.clienteId || '',
        tecnicoId: servicio.tecnicoId || '',
        fecha: servicio.fechaProgramada ? new Date(servicio.fechaProgramada).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        hora: servicio.fechaProgramada ? new Date(servicio.fechaProgramada).toTimeString().slice(0, 5) : '09:00',
        tipo: servicio.tipoServicio || 'Preventivo',
        descripcion: servicio.descripcion || '',
        equipos: servicio.equiposServicio?.map(es => es.equipoId) || [],
        prioridad: servicio.prioridad || 'MEDIA',
        observaciones: servicio.observaciones || ''
      });
    }
  }, [servicio]);

  useEffect(() => {
    if (formData.clienteId) {
      const cliente = data.clientes.find(c => c.id === parseInt(formData.clienteId));
      setClienteSeleccionado(cliente);
    }
  }, [formData.clienteId, data.clientes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEquipoToggle = (equipoId) => {
    setFormData(prev => ({
      ...prev,
      equipos: prev.equipos.includes(equipoId)
        ? prev.equipos.filter(id => id !== equipoId)
        : [...prev.equipos, equipoId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 === INICIO SUBMIT SERVICIO ===');
    console.log('📝 Datos del formulario:', formData);
    
    // Validaciones básicas
    if (!formData.clienteId) {
      showAlert('Por favor seleccione un cliente', 'warning');
      return;
    }
    
    if (!formData.descripcion || formData.descripcion.length < 10) {
      showAlert('Por favor ingrese una descripción de al menos 10 caracteres', 'warning');
      return;
    }

    try {
      const servicioData = {
        clienteId: parseInt(formData.clienteId),
        tecnicoId: formData.tecnicoId ? parseInt(formData.tecnicoId) : null,
        tipo: formData.tipo, // Se mapea a tipoServicio en el service
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        hora: formData.hora,
        prioridad: formData.prioridad,
        observaciones: formData.observaciones,
        equipos: formData.equipos, // Array de IDs de equipos
        solicitadoPor: user.role || 'ADMIN'
      };

      console.log('📤 Enviando datos al servicio:', servicioData);

      let resultado;
      if (servicio) {
        // Actualizar servicio existente
        console.log('🔄 Actualizando servicio existente...');
        resultado = await servicioService.update(servicio.id, servicioData);
      } else {
        // Crear nuevo servicio
        console.log('✨ Creando nuevo servicio...');
        resultado = await servicioService.create(servicioData);
      }

      console.log('✅ Respuesta del servicio:', resultado);
      
      if (resultado.success) {
        showAlert(
          servicio ? 'Servicio actualizado exitosamente' : 'Servicio creado exitosamente',
          'success'
        );
        
        // Recargar datos en el contexto
        if (window.location.pathname.includes('/servicios')) {
          window.location.reload(); // Temporal hasta actualizar DataContext
        }
        
        onClose();
      } else {
        throw new Error(resultado.message || 'Error en la operación');
      }
    } catch (error) {
      console.error('❌ Error al guardar servicio:', error);
      showAlert(
        error.response?.data?.message || error.message || 'Error al guardar el servicio',
        'error'
      );
    }
    
    console.log('🏁 === FIN SUBMIT SERVICIO ===');
  };

  // Función temporal para mantener compatibilidad con localStorage (será removida)
  const handleSubmitOld = (e) => {
    e.preventDefault();
    
    if (!formData.clienteId || !formData.tecnicoId || formData.equipos.length === 0) {
      showAlert('Por favor complete todos los campos obligatorios', 'warning');
      return;
    }

    const servicioData = {
      ...formData,
      clienteId: parseInt(formData.clienteId),
      tecnicoId: parseInt(formData.tecnicoId),
      estado: servicio ? formData.estado : 'pendiente',
      fotos: servicio ? formData.fotos : []
    };

    if (servicio) {
      updateItem('servicios', servicio.id, servicioData);
    } else {
      // Get the current user info for the requester
      const getSolicitante = () => {
        if (user.userType === 'admin') {
          return {
            tipo: 'admin',
            id: null,
            nombre: 'Administrador',
            usuario: user.username
          };
        } else if (user.userType === 'tecnico') {
          const tecnico = data.tecnicos.find(t => t.usuario === user.username);
          return {
            tipo: 'tecnico',
            id: tecnico?.id,
            nombre: `${tecnico?.nombre} ${tecnico?.apellido}`,
            usuario: user.username
          };
        }
        return null;
      };

      addItem('servicios', {
        ...servicioData,
        id: getNextId('servicios'),
        solicitadoPor: getSolicitante()
      });
    }

    showAlert('Servicio guardado exitosamente', 'success');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="servicio-form">
      <div className="form-section" style={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="clienteId">Cliente: *</label>
            <select 
              id="clienteId"
              name="clienteId" 
              value={formData.clienteId} 
              onChange={handleChange}
              required
              disabled={!!servicio || loading}
            >
              <option value="">{loading ? 'Cargando clientes...' : 'Seleccione cliente'}</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tecnicoId">Técnico Asignado:</label>
            <select 
              id="tecnicoId"
              name="tecnicoId" 
              value={formData.tecnicoId} 
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">{loading ? 'Cargando técnicos...' : 'Seleccione técnico (opcional)'}</option>
              {tecnicos.map(tecnico => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nombre} {tecnico.apellido} {tecnico.especialidad ? `- ${tecnico.especialidad}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fecha">Fecha: *</label>
            <input 
              type="date"
              id="fecha"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="hora">Hora: *</label>
            <input 
              type="time"
              id="hora"
              name="hora"
              value={formData.hora}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="tipo">Tipo de Servicio: *</label>
            <select 
              id="tipo"
              name="tipo" 
              value={formData.tipo} 
              onChange={handleChange}
              required
            >
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="prioridad">Prioridad: *</label>
            <select 
              id="prioridad"
              name="prioridad" 
              value={formData.prioridad} 
              onChange={handleChange}
              required
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción del Servicio: *</label>
          <textarea 
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>

        {equiposCliente.length > 0 && (
          <div className="form-group">
            <label>Equipos a Intervenir: *</label>
            <div className="equipos-checkbox-group">
              {equiposCliente.map(equipo => (
                <label key={equipo.id} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={formData.equipos.includes(equipo.id)}
                    onChange={() => handleEquipoToggle(equipo.id)}
                  />
                  {equipo.tipo} {equipo.marca} {equipo.modelo} - {equipo.ubicacion}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="observaciones">Observaciones:</label>
          <textarea 
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows="2"
          />
        </div>

      </div>

      {servicio && (
        <div className="form-section" style={{ display: activeTab === 1 ? 'block' : 'none' }}>
          {/* Información del solicitante */}
          {servicio.solicitadoPor && (
            <div className="form-group mb-6">
              <label className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <i className="fas fa-user-circle text-gray-400"></i>
                Solicitado por:
              </label>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  servicio.solicitadoPor.tipo === 'admin' ? 'bg-purple-100 text-purple-600' :
                  servicio.solicitadoPor.tipo === 'tecnico' ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  <i className={`fas ${
                    servicio.solicitadoPor.tipo === 'admin' ? 'fa-user-shield' :
                    servicio.solicitadoPor.tipo === 'tecnico' ? 'fa-user-cog' :
                    'fa-user'
                  } text-xl`}></i>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">{servicio.solicitadoPor.nombre}</p>
                  <p className="text-sm text-gray-600">
                    {servicio.solicitadoPor.tipo === 'admin' ? 'Administrador del Sistema' :
                     servicio.solicitadoPor.tipo === 'tecnico' ? 'Técnico' :
                     'Cliente'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="estado">Estado del Servicio:</label>
            <select 
              id="estado"
              name="estado" 
              value={formData.estado} 
              onChange={handleChange}
            >
              <option value="pendiente">Pendiente</option>
              <option value="proceso">En Proceso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Detalles del servicio cuando está completado */}
          {servicio.detalleServicio && (
            <div className="space-y-6 mt-6">
              {/* Trabajos realizados */}
              {servicio.detalleServicio.trabajosRealizados && (
                <div className="form-group">
                  <label className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-clipboard-check text-gray-400"></i>
                    Trabajos Realizados:
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{servicio.detalleServicio.trabajosRealizados}</p>
                  </div>
                </div>
              )}

              {/* Repuestos utilizados */}
              {servicio.detalleServicio.repuestosUtilizados && servicio.detalleServicio.repuestosUtilizados.length > 0 && (
                <div className="form-group">
                  <label className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-tools text-gray-400"></i>
                    Repuestos Utilizados:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {servicio.detalleServicio.repuestosUtilizados.map(repuestoId => {
                      const repuesto = data.repuestos?.find(r => r.id === repuestoId);
                      return repuesto ? (
                        <span key={repuestoId} className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
                          {repuesto.nombre}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              {servicio.detalleServicio.recomendaciones && (
                <div className="form-group">
                  <label className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-lightbulb text-gray-400"></i>
                    Recomendaciones:
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{servicio.detalleServicio.recomendaciones}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Registro Fotográfico del Trabajo */}
          {(servicio.fotosAntes?.length > 0 || servicio.fotosDespues?.length > 0 || servicio.fotos?.length > 0) && (
            <div className="form-group mt-6">
              <label className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <i className="fas fa-camera text-gray-400"></i>
                Registro Fotográfico del Trabajo:
              </label>
              
              <div className="space-y-6">
                {/* Fotos de ANTES */}
                {servicio.fotosAntes && servicio.fotosAntes.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-red-600 text-xs"></i>
                      </div>
                      Fotos ANTES del Trabajo
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {servicio.fotosAntes.map((foto, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg overflow-hidden hover:bg-red-100 transition-colors">
                          {foto.data ? (
                            <div className="relative">
                              <img 
                                src={foto.data} 
                                alt={`Antes ${index + 1}`} 
                                className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(foto.data, '_blank')}
                              />
                              <div className="p-2">
                                <p className="text-xs text-red-700 font-medium truncate">{foto.nombre}</p>
                                <p className="text-xs text-red-500">Estado inicial</p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <i className="fas fa-image text-3xl text-red-400 mb-2"></i>
                              <p className="text-xs text-red-700 font-medium">{typeof foto === 'string' ? foto : foto.nombre || `Foto ${index + 1}`}</p>
                              <p className="text-xs text-red-500 mt-1">Estado inicial</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fotos de DESPUÉS */}
                {servicio.fotosDespues && servicio.fotosDespues.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-check-circle text-green-600 text-xs"></i>
                      </div>
                      Fotos DESPUÉS del Trabajo
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {servicio.fotosDespues.map((foto, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg overflow-hidden hover:bg-green-100 transition-colors">
                          {foto.data ? (
                            <div className="relative">
                              <img 
                                src={foto.data} 
                                alt={`Después ${index + 1}`} 
                                className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(foto.data, '_blank')}
                              />
                              <div className="p-2">
                                <p className="text-xs text-green-700 font-medium truncate">{foto.nombre}</p>
                                <p className="text-xs text-green-500">Trabajo completado</p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <i className="fas fa-image text-3xl text-green-400 mb-2"></i>
                              <p className="text-xs text-green-700 font-medium">{typeof foto === 'string' ? foto : foto.nombre || `Foto ${index + 1}`}</p>
                              <p className="text-xs text-green-500 mt-1">Trabajo completado</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fotos del formato anterior (solo nombres) */}
                {servicio.fotos && servicio.fotos.length > 0 && !servicio.fotosAntes && !servicio.fotosDespues && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Fotos del servicio</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {servicio.fotos.map((foto, index) => (
                        <div key={index} className="bg-gray-100 rounded-lg p-4 text-center">
                          <i className="fas fa-image text-3xl text-gray-400 mb-2"></i>
                          <p className="text-sm text-gray-600">{foto}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evaluación del cliente */}
          {servicio.evaluacion && (
            <div className="form-group mt-6">
              <label className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <i className="fas fa-star text-gray-400"></i>
                Evaluación del Cliente:
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-yellow-800">Calificación:</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <i 
                        key={i} 
                        className={`fas fa-star ${i < servicio.evaluacion.calificacion ? 'text-yellow-400' : 'text-gray-300'}`}
                      ></i>
                    ))}
                    <span className="ml-2 text-yellow-800 font-bold">
                      {servicio.evaluacion.calificacion}/5
                    </span>
                  </div>
                </div>
                {servicio.evaluacion.comentario && (
                  <p className="text-yellow-800 mt-2">
                    <span className="font-medium">Comentario:</span> {servicio.evaluacion.comentario}
                  </p>
                )}
                <p className="text-xs text-yellow-600 mt-2">
                  Evaluado el {new Date(servicio.evaluacion.fecha).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Motivo de cancelación */}
          {servicio.motivoCancelacion && (
            <div className="form-group mt-6">
              <label className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-red-500"></i>
                Motivo de Cancelación:
              </label>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{servicio.motivoCancelacion}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="modal-footer">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          {servicio ? 'Actualizar' : 'Crear'} Servicio
        </button>
      </div>
    </form>
  );
};

export default ServicioForm;