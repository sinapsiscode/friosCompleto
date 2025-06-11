// Utilidades para manejo de fechas sin problemas de zona horaria

/**
 * Formatea una fecha string (YYYY-MM-DD) o Date object a formato local español
 * Evita problemas de zona horaria que pueden cambiar el día
 * @param {string|Date} fechaInput - Fecha en formato string o Date object
 * @returns {string} - Fecha formateada en español (dd/mm/yyyy)
 */
export const formatearFecha = (fechaInput) => {
  if (!fechaInput) return 'Sin fecha';
  
  // Si es un string de fecha (YYYY-MM-DD)
  if (typeof fechaInput === 'string') {
    // Si la fecha ya tiene hora, usar directamente
    if (fechaInput.includes('T')) {
      return new Date(fechaInput).toLocaleDateString('es-ES');
    }
    
    // Si es solo fecha (YYYY-MM-DD), agregar hora local para evitar problemas de UTC
    return new Date(fechaInput + 'T00:00:00').toLocaleDateString('es-ES');
  }
  
  // Si es un Date object
  if (fechaInput instanceof Date) {
    return fechaInput.toLocaleDateString('es-ES');
  }
  
  // Fallback
  return 'Fecha inválida';
};

/**
 * Formatea una fecha string o Date object a formato local español con hora
 * @param {string|Date} fechaInput - Fecha en formato string o Date object
 * @returns {string} - Fecha y hora formateada en español
 */
export const formatearFechaHora = (fechaInput) => {
  if (!fechaInput) return 'Sin fecha';
  
  try {
    const fecha = typeof fechaInput === 'string' ? new Date(fechaInput) : fechaInput;
    return fecha.toLocaleString('es-ES');
  } catch (error) {
    return 'Fecha inválida';
  }
};

/**
 * Convierte una fecha a formato ISO (YYYY-MM-DD) sin problemas de zona horaria
 * @param {Date} fecha - Date object
 * @returns {string} - Fecha en formato ISO (YYYY-MM-DD)
 */
export const fechaAISO = (fecha) => {
  if (!fecha || !(fecha instanceof Date)) return '';
  
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
 * @returns {string} - Fecha actual en formato ISO
 */
export const fechaHoyISO = () => {
  return fechaAISO(new Date());
};