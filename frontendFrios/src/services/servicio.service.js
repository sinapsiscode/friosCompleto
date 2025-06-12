import api from './api';

const servicioService = {
  // Obtener todos los servicios con filtros
  getAll: async (params = {}) => {
    console.log('📋 === SERVICIO SERVICE GET ALL ===');
    console.log('🔍 Parámetros:', params);
    console.log('🔑 Token en sessionStorage:', sessionStorage.getItem('token'));
    console.log('👤 Usuario en sessionStorage:', sessionStorage.getItem('user'));
    
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar parámetros de filtrado
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.estado) queryParams.append('estado', params.estado);
      if (params.tecnicoId) queryParams.append('tecnicoId', params.tecnicoId);
      if (params.clienteId) queryParams.append('clienteId', params.clienteId);
      if (params.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
      if (params.fechaFin) queryParams.append('fechaFin', params.fechaFin);
      
      const url = `/api/servicios${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔄 Llamando GET:', url);
      
      const response = await api.get(url);
      console.log('✅ Servicios obtenidos:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener servicios:', error);
      throw error;
    }
  },

  // Obtener servicio por ID
  getById: async (id) => {
    console.log('📋 === SERVICIO SERVICE GET BY ID ===');
    console.log('🆔 ID:', id);
    
    try {
      const response = await api.get(`/api/servicios/${id}`);
      console.log('✅ Servicio obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener servicio:', error);
      throw error;
    }
  },

  // Crear nuevo servicio
  create: async (servicioData) => {
    console.log('📋 === SERVICIO SERVICE CREATE ===');
    console.log('📝 Datos recibidos:', servicioData);
    
    try {
      // Función para extraer hora de inicio del rango
      const extractStartTime = (timeRange) => {
        if (!timeRange) return null;
        if (timeRange.includes('-')) {
          return timeRange.split('-')[0].trim(); // "10:00-14:00" → "10:00"
        }
        return timeRange; // Si ya es hora específica
      };

      // Función para extraer hora de fin del rango
      const extractEndTime = (timeRange) => {
        if (!timeRange) return null;
        if (timeRange.includes('-')) {
          return timeRange.split('-')[1].trim(); // "10:00-14:00" → "14:00"
        }
        return timeRange; // Si es hora específica, usar la misma como fin
      };

      // Extraer horas del rango
      const horaInicio = extractStartTime(servicioData.hora);
      const horaFin = extractEndTime(servicioData.hora);
      
      console.log('🕐 Procesando horarios:');
      console.log('  - Rango original:', servicioData.hora);
      console.log('  - Hora inicio:', horaInicio);
      console.log('  - Hora fin:', horaFin);

      // Transformar datos del frontend al formato del backend
      const backendData = {
        clienteId: parseInt(servicioData.clienteId),
        tecnicoId: servicioData.tecnicoId ? parseInt(servicioData.tecnicoId) : null,
        tipoServicio: servicioData.tipo, // Mapear 'tipo' a 'tipoServicio'
        descripcion: servicioData.descripcion,
        observaciones: servicioData.observaciones || null,
        prioridad: servicioData.prioridad.toUpperCase(),
        
        // Datos de dirección
        direccionServicio: servicioData.direccionServicio || null,
        ciudadServicio: servicioData.ciudadServicio || null,
        distritoServicio: servicioData.distritoServicio || null,
        
        // Usar hora de inicio para fechaProgramada
        fechaProgramada: servicioData.fecha && horaInicio ? 
          new Date(`${servicioData.fecha}T${horaInicio}:00`).toISOString() : null,
        
        // Campos de rango horario
        horaInicio: horaInicio,
        horaFin: horaFin,
        rangoHorario: servicioData.hora,
        
        // Manejar múltiples equipos - por ahora tomar el primero
        equipoId: servicioData.equipos && servicioData.equipos.length > 0 ? 
          parseInt(servicioData.equipos[0]) : null,
        
        // Relación con programación si existe
        programacionId: servicioData.programacionId ? parseInt(servicioData.programacionId) : null,
        
        // Metadatos adicionales en detalles
        detalles: {
          equiposSeleccionados: servicioData.equipos || [],
          fechaOriginal: servicioData.fecha,
          horaOriginal: servicioData.hora,
          solicitadoPor: servicioData.solicitadoPor || 'admin'
        }
      };
      
      console.log('🔄 Datos transformados para backend:', backendData);
      
      const response = await api.post('/api/servicios', backendData);
      console.log('✅ Servicio creado exitosamente:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear servicio:', error);
      throw error;
    }
  },

  // Actualizar servicio
  update: async (id, servicioData) => {
    console.log('📋 === SERVICIO SERVICE UPDATE ===');
    console.log('🆔 ID:', id);
    console.log('📝 Datos:', servicioData);
    
    try {
      // Transformar datos del frontend al formato del backend
      const backendData = {
        ...(servicioData.clienteId && { clienteId: parseInt(servicioData.clienteId) }),
        ...(servicioData.tecnicoId && { tecnicoId: parseInt(servicioData.tecnicoId) }),
        ...(servicioData.tipo && { tipoServicio: servicioData.tipo }),
        ...(servicioData.descripcion && { descripcion: servicioData.descripcion }),
        ...(servicioData.observaciones !== undefined && { observaciones: servicioData.observaciones }),
        ...(servicioData.prioridad && { prioridad: servicioData.prioridad.toUpperCase() }),
        ...(servicioData.estado && { estado: servicioData.estado.toUpperCase() }),
        
        // Combinar fecha y hora si están presentes
        ...(servicioData.fecha && servicioData.hora && {
          fechaProgramada: new Date(`${servicioData.fecha}T${servicioData.hora}:00`).toISOString()
        }),
        
        // Actualizar equipos si están presentes
        ...(servicioData.equipos && servicioData.equipos.length > 0 && {
          equipoId: parseInt(servicioData.equipos[0])
        })
      };
      
      console.log('🔄 Datos transformados para backend:', backendData);
      
      const response = await api.put(`/api/servicios/${id}`, backendData);
      console.log('✅ Servicio actualizado exitosamente:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar servicio:', error);
      throw error;
    }
  },

  // Asignar técnico a servicio
  asignarTecnico: async (servicioId, tecnicoId) => {
    console.log('📋 === SERVICIO SERVICE ASIGNAR TECNICO ===');
    console.log('🆔 Servicio ID:', servicioId);
    console.log('👨‍🔧 Técnico ID:', tecnicoId);
    
    try {
      const response = await api.post(`/api/servicios/${servicioId}/asignar-tecnico`, {
        tecnicoId: parseInt(tecnicoId)
      });
      console.log('✅ Técnico asignado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al asignar técnico:', error);
      throw error;
    }
  },

  // Iniciar servicio (cambiar estado a PROCESO)
  iniciar: async (servicioId) => {
    console.log('📋 === SERVICIO SERVICE INICIAR ===');
    console.log('🆔 Servicio ID:', servicioId);
    
    try {
      const response = await api.post(`/api/servicios/${servicioId}/iniciar`);
      console.log('✅ Servicio iniciado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al iniciar servicio:', error);
      throw error;
    }
  },

  // Completar servicio con formato original completo
  completar: async (servicioId, datosCompletado = {}) => {
    console.log('📋 === SERVICIO SERVICE COMPLETAR ===');
    console.log('🆔 Servicio ID:', servicioId);
    console.log('📝 Datos completado:', datosCompletado);
    
    try {
      // Función helper para convertir base64 a File
      const base64ToFile = (base64Data, fileName) => {
        const base64String = base64Data.split(',')[1];
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new File([byteArray], fileName, { type: 'image/jpeg' });
      };

      // Verificar si hay fotos para determinar el tipo de envío
      const hayFotos = (datosCompletado.fotosAntes && datosCompletado.fotosAntes.length > 0) ||
                      (datosCompletado.fotosDespues && datosCompletado.fotosDespues.length > 0) ||
                      (datosCompletado.fotos && datosCompletado.fotos.length > 0);

      if (hayFotos) {
        // Usar FormData para subir archivos
        const formData = new FormData();
        
        // Agregar TODOS los campos que espera el backend actualizado
        formData.append('trabajosRealizados', datosCompletado.trabajosRealizados || '');
        formData.append('recomendaciones', datosCompletado.recomendaciones || '');
        formData.append('proximoMantenimiento', datosCompletado.proximoMantenimiento || '');
        formData.append('frecuenciaMantenimiento', datosCompletado.frecuenciaMantenimiento || '');
        
        // Agregar repuestos utilizados como JSON
        if (datosCompletado.repuestosUtilizados && datosCompletado.repuestosUtilizados.length > 0) {
          formData.append('repuestosUtilizados', JSON.stringify(datosCompletado.repuestosUtilizados));
        }
        
        // Agregar fotos como JSON (el backend actualizado las procesa como strings base64)
        if (datosCompletado.fotosAntes && datosCompletado.fotosAntes.length > 0) {
          formData.append('fotosAntes', JSON.stringify(datosCompletado.fotosAntes));
        }
        
        if (datosCompletado.fotosDespues && datosCompletado.fotosDespues.length > 0) {
          formData.append('fotosDespues', JSON.stringify(datosCompletado.fotosDespues));
        }
        
        if (datosCompletado.fotos && datosCompletado.fotos.length > 0) {
          formData.append('fotos', JSON.stringify(datosCompletado.fotos));
        }
        
        // Campos de compatibilidad existentes
        formData.append('observacionesFinales', datosCompletado.observacionesFinales || '');
        formData.append('evaluacion', datosCompletado.evaluacion || '');
        formData.append('tiempoEmpleado', datosCompletado.tiempoEmpleado || '');
        
        console.log('📁 Enviando con FormData (incluye archivos)');
        const response = await api.post(`/api/servicios/${servicioId}/completar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('✅ Servicio completado exitosamente:', response.data);
        return response.data;
      } else {
        // Sin archivos, enviar JSON con TODOS los campos nuevos
        const payload = {
          // Nuevos campos principales que espera el backend
          trabajosRealizados: datosCompletado.trabajosRealizados || '',
          recomendaciones: datosCompletado.recomendaciones || '',
          proximoMantenimiento: datosCompletado.proximoMantenimiento || '',
          frecuenciaMantenimiento: datosCompletado.frecuenciaMantenimiento || '',
          repuestosUtilizados: datosCompletado.repuestosUtilizados || [],
          
          // Fotos como arrays (incluso si están vacías)
          fotosAntes: datosCompletado.fotosAntes || [],
          fotosDespues: datosCompletado.fotosDespues || [],
          fotos: datosCompletado.fotos || [],
          
          // Campos de compatibilidad existentes
          observacionesFinales: datosCompletado.observacionesFinales || '',
          evaluacion: datosCompletado.evaluacion || '',
          tiempoEmpleado: datosCompletado.tiempoEmpleado || ''
        };
        
        console.log('📄 Enviando JSON (sin archivos)');
        const response = await api.post(`/api/servicios/${servicioId}/completar`, payload);
        console.log('✅ Servicio completado exitosamente:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error al completar servicio:', error);
      throw error;
    }
  },

  // Cancelar servicio
  cancelar: async (servicioId, motivo = '') => {
    console.log('📋 === SERVICIO SERVICE CANCELAR ===');
    console.log('🆔 Servicio ID:', servicioId);
    console.log('📝 Motivo:', motivo);
    
    try {
      const response = await api.post(`/api/servicios/${servicioId}/cancelar`, {
        motivo
      });
      console.log('✅ Servicio cancelado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al cancelar servicio:', error);
      throw error;
    }
  },

  // Obtener estadísticas de servicios
  getEstadisticas: async (params = {}) => {
    console.log('📋 === SERVICIO SERVICE ESTADISTICAS ===');
    console.log('🔍 Parámetros:', params);
    
    try {
      const queryParams = new URLSearchParams();
      if (params.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
      if (params.fechaFin) queryParams.append('fechaFin', params.fechaFin);
      if (params.tecnicoId) queryParams.append('tecnicoId', params.tecnicoId);
      
      const url = `/api/servicios/estadisticas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      
      console.log('✅ Estadísticas obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }
};

export default servicioService;