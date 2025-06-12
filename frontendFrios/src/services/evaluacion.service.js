import api from './api';

const evaluacionService = {
  // Evaluar un servicio
  evaluarServicio: async (servicioId, evaluacionData) => {
    console.log('⭐ === EVALUACION SERVICE EVALUAR ===');
    console.log('🆔 Servicio ID:', servicioId);
    console.log('📝 Datos evaluación:', evaluacionData);
    
    try {
      const response = await api.post(`/api/evaluaciones/servicio/${servicioId}`, evaluacionData);
      console.log('✅ Evaluación enviada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al evaluar servicio:', error);
      throw error;
    }
  },

  // Obtener evaluación de un servicio específico
  obtenerEvaluacion: async (servicioId) => {
    console.log('📋 === EVALUACION SERVICE OBTENER ===');
    console.log('🆔 Servicio ID:', servicioId);
    
    try {
      const response = await api.get(`/api/evaluaciones/servicio/${servicioId}`);
      console.log('✅ Evaluación obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener evaluación:', error);
      throw error;
    }
  },

  // Obtener servicios del cliente para evaluar
  obtenerMisServicios: async () => {
    console.log('📋 === EVALUACION SERVICE MIS SERVICIOS ===');
    
    try {
      const response = await api.get('/api/evaluaciones/mis-servicios');
      console.log('✅ Servicios para evaluar obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener servicios para evaluar:', error);
      throw error;
    }
  },

  // Obtener evaluaciones de un técnico (para técnicos)
  obtenerEvaluacionesTecnico: async (tecnicoId = null) => {
    console.log('📊 === EVALUACION SERVICE TECNICO ===');
    console.log('🆔 Técnico ID:', tecnicoId);
    
    try {
      const url = tecnicoId 
        ? `/api/evaluaciones/tecnico/${tecnicoId}`
        : '/api/evaluaciones/tecnico';
        
      const response = await api.get(url);
      console.log('✅ Evaluaciones de técnico obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener evaluaciones de técnico:', error);
      throw error;
    }
  }
};

export default evaluacionService;