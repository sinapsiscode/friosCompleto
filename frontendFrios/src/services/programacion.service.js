import api from './api';

const programacionService = {
  // Obtener todas las programaciones
  getAll: async (params = {}) => {
    console.log('📅 === PROGRAMACION SERVICE GET ALL ===');
    console.log('🔍 Parámetros:', params);
    
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar parámetros de filtrado
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.clienteId) queryParams.append('clienteId', params.clienteId);
      if (params.tecnicoId) queryParams.append('tecnicoId', params.tecnicoId);
      if (params.frecuencia) queryParams.append('frecuencia', params.frecuencia);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
      
      const url = `/api/programaciones${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔄 Llamando GET:', url);
      
      const response = await api.get(url);
      console.log('✅ Programaciones obtenidas:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener programaciones:', error);
      throw error;
    }
  },

  // Obtener programación por ID
  getById: async (id) => {
    console.log('📅 === PROGRAMACION SERVICE GET BY ID ===');
    console.log('🆔 ID:', id);
    
    try {
      const response = await api.get(`/api/programaciones/${id}`);
      console.log('✅ Programación obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener programación:', error);
      throw error;
    }
  },

  // Crear nueva programación
  create: async (programacionData) => {
    console.log('📅 === PROGRAMACION SERVICE CREATE ===');
    console.log('📝 Datos recibidos:', programacionData);
    
    try {
      // Transformar datos del frontend al formato del backend
      const backendData = {
        clienteId: parseInt(programacionData.clienteId),
        tecnicoId: programacionData.tecnicoId ? parseInt(programacionData.tecnicoId) : null,
        nombre: programacionData.nombre,
        descripcion: programacionData.descripcion || null,
        tipoServicio: programacionData.tipoServicio || 'programado',
        frecuencia: programacionData.frecuencia,
        intervaloDias: programacionData.intervaloDias ? parseInt(programacionData.intervaloDias) : null,
        horaInicio: programacionData.horaInicio,
        horaFin: programacionData.horaFin || null,
        diasSemana: programacionData.diasSemana ? JSON.stringify(programacionData.diasSemana) : null,
        diaMes: programacionData.diaMes ? parseInt(programacionData.diaMes) : null,
        fechaInicio: programacionData.fechaInicio,
        fechaFin: programacionData.fechaFin || null,
        prioridad: programacionData.prioridad || 'MEDIA',
        observaciones: programacionData.observaciones || null,
        equipos: programacionData.equipos ? JSON.stringify(programacionData.equipos) : JSON.stringify([])
      };
      
      console.log('🔄 Datos transformados para backend:', backendData);
      
      const response = await api.post('/api/programaciones', backendData);
      console.log('✅ Programación creada exitosamente:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear programación:', error);
      throw error;
    }
  },

  // Actualizar programación
  update: async (id, programacionData) => {
    console.log('📅 === PROGRAMACION SERVICE UPDATE ===');
    console.log('🆔 ID:', id);
    console.log('📝 Datos:', programacionData);
    
    try {
      // Transformar datos del frontend al formato del backend
      const backendData = {};
      
      // Solo incluir campos que han cambiado
      if (programacionData.clienteId) backendData.clienteId = parseInt(programacionData.clienteId);
      if (programacionData.tecnicoId !== undefined) {
        backendData.tecnicoId = programacionData.tecnicoId ? parseInt(programacionData.tecnicoId) : null;
      }
      if (programacionData.nombre) backendData.nombre = programacionData.nombre;
      if (programacionData.descripcion !== undefined) backendData.descripcion = programacionData.descripcion;
      if (programacionData.tipoServicio) backendData.tipoServicio = programacionData.tipoServicio;
      if (programacionData.frecuencia) backendData.frecuencia = programacionData.frecuencia;
      if (programacionData.intervaloDias !== undefined) {
        backendData.intervaloDias = programacionData.intervaloDias ? parseInt(programacionData.intervaloDias) : null;
      }
      if (programacionData.horaInicio) backendData.horaInicio = programacionData.horaInicio;
      if (programacionData.horaFin !== undefined) backendData.horaFin = programacionData.horaFin;
      if (programacionData.diasSemana !== undefined) {
        backendData.diasSemana = programacionData.diasSemana ? JSON.stringify(programacionData.diasSemana) : null;
      }
      if (programacionData.diaMes !== undefined) {
        backendData.diaMes = programacionData.diaMes ? parseInt(programacionData.diaMes) : null;
      }
      if (programacionData.fechaInicio) backendData.fechaInicio = programacionData.fechaInicio;
      if (programacionData.fechaFin !== undefined) backendData.fechaFin = programacionData.fechaFin;
      if (programacionData.prioridad) backendData.prioridad = programacionData.prioridad;
      if (programacionData.observaciones !== undefined) backendData.observaciones = programacionData.observaciones;
      if (programacionData.isActive !== undefined) backendData.isActive = programacionData.isActive;
      if (programacionData.equipos !== undefined) {
        backendData.equipos = JSON.stringify(programacionData.equipos || []);
      }
      
      console.log('🔄 Datos transformados para backend:', backendData);
      
      const response = await api.put(`/api/programaciones/${id}`, backendData);
      console.log('✅ Programación actualizada exitosamente:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar programación:', error);
      throw error;
    }
  },

  // Eliminar programación
  delete: async (id) => {
    console.log('📅 === PROGRAMACION SERVICE DELETE ===');
    console.log('🆔 ID a eliminar:', id);
    
    try {
      const response = await api.delete(`/api/programaciones/${id}`);
      console.log('✅ Programación eliminada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar programación:', error);
      throw error;
    }
  },

  // Activar/Desactivar programación
  toggleActive: async (id) => {
    console.log('📅 === PROGRAMACION SERVICE TOGGLE ACTIVE ===');
    console.log('🆔 ID:', id);
    
    try {
      const response = await api.post(`/api/programaciones/${id}/toggle-active`);
      console.log('✅ Estado de programación cambiado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al cambiar estado de programación:', error);
      throw error;
    }
  },

  // Generar servicios de programaciones
  generarServicios: async (fechaHasta = null) => {
    console.log('📅 === PROGRAMACION SERVICE GENERAR SERVICIOS ===');
    console.log('📅 Fecha hasta:', fechaHasta);
    
    try {
      const params = fechaHasta ? `?fechaHasta=${fechaHasta}` : '';
      const response = await api.post(`/api/programaciones/generar-servicios${params}`);
      console.log('✅ Servicios generados exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al generar servicios:', error);
      throw error;
    }
  },

  // Obtener frecuencias disponibles
  getFrecuencias: () => {
    return [
      { value: 'DIARIO', label: 'Diario' },
      { value: 'SEMANAL', label: 'Semanal' },
      { value: 'QUINCENAL', label: 'Quincenal' },
      { value: 'MENSUAL', label: 'Mensual' },
      { value: 'BIMESTRAL', label: 'Bimestral' },
      { value: 'TRIMESTRAL', label: 'Trimestral' },
      { value: 'SEMESTRAL', label: 'Semestral' },
      { value: 'ANUAL', label: 'Anual' },
      { value: 'PERSONALIZADO', label: 'Personalizado' }
    ];
  },

  // Obtener días de la semana
  getDiasSemana: () => {
    return [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Lunes' },
      { value: 2, label: 'Martes' },
      { value: 3, label: 'Miércoles' },
      { value: 4, label: 'Jueves' },
      { value: 5, label: 'Viernes' },
      { value: 6, label: 'Sábado' }
    ];
  },

  // Calcular próxima ejecución en el frontend (para preview)
  calcularProximaEjecucion: (frecuencia, fechaInicio, intervaloDias = null, diasSemana = null, diaMes = null) => {
    const ahora = new Date();
    const inicio = new Date(fechaInicio);
    let proxima = new Date(Math.max(ahora.getTime(), inicio.getTime()));
    
    switch (frecuencia) {
      case 'DIARIO':
        proxima.setDate(proxima.getDate() + 1);
        break;
        
      case 'SEMANAL':
        proxima.setDate(proxima.getDate() + 7);
        break;
        
      case 'QUINCENAL':
        proxima.setDate(proxima.getDate() + 15);
        break;
        
      case 'MENSUAL':
        if (diaMes) {
          proxima.setMonth(proxima.getMonth() + 1);
          proxima.setDate(diaMes);
        } else {
          proxima.setMonth(proxima.getMonth() + 1);
        }
        break;
        
      case 'BIMESTRAL':
        proxima.setMonth(proxima.getMonth() + 2);
        break;
        
      case 'TRIMESTRAL':
        proxima.setMonth(proxima.getMonth() + 3);
        break;
        
      case 'SEMESTRAL':
        proxima.setMonth(proxima.getMonth() + 6);
        break;
        
      case 'ANUAL':
        proxima.setFullYear(proxima.getFullYear() + 1);
        break;
        
      case 'PERSONALIZADO':
        if (intervaloDias) {
          proxima.setDate(proxima.getDate() + intervaloDias);
        }
        break;
        
      default:
        proxima.setDate(proxima.getDate() + 30); // Default mensual
    }
    
    return proxima;
  }
};

export default programacionService;