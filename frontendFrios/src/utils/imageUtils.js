// Utilidades para manejar imágenes de perfil

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:2001';

/**
 * Construye la URL completa para una imagen de perfil
 * @param {string} filename - Nombre del archivo de imagen
 * @param {string} userType - Tipo de usuario: 'tecnicos', 'clientes', 'administradores'
 * @returns {string} URL completa de la imagen
 */
export const buildImageUrl = (filename, userType = 'tecnicos') => {
  if (!filename) return null;
  
  // Si ya es una URL completa, devolverla tal como está
  if (filename.startsWith('http')) {
    return filename;
  }
  
  // Si tiene la estructura completa de carpetas, usar directamente
  if (filename.includes('/')) {
    return `${API_BASE_URL}/uploads/${filename}`;
  }
  
  // Si solo es el nombre del archivo, intentar construir la ruta
  // Para archivos existentes, intentaremos varias rutas posibles
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Intentar con año y mes actual primero
  return `${API_BASE_URL}/uploads/${userType}/avatars/${currentYear}/${currentMonth}/${filename}`;
};

/**
 * Componente de imagen con fallback automático
 */
export const ProfileImage = ({ 
  filename, 
  userType = 'tecnicos', 
  alt = 'Foto de perfil', 
  className = '',
  style = {},
  fallbackIcon = 'fa-user' 
}) => {
  const handleError = (e) => {
    console.log('❌ Error cargando imagen:', e.target.src);
    
    // Intentar rutas alternativas
    const currentUrl = e.target.src;
    const baseFilename = filename.split('/').pop(); // Obtener solo el nombre del archivo
    
    // Lista de rutas alternativas a intentar
    const alternativeUrls = [
      // Ruta directa sin estructura de fechas
      `${API_BASE_URL}/uploads/${userType}/avatars/${baseFilename}`,
      // Año anterior
      `${API_BASE_URL}/uploads/${userType}/avatars/${new Date().getFullYear() - 1}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${baseFilename}`,
      // Mes anterior
      `${API_BASE_URL}/uploads/${userType}/avatars/${new Date().getFullYear()}/${String(new Date().getMonth()).padStart(2, '0') || '12'}/${baseFilename}`,
    ];
    
    // Buscar una URL que no haya sido intentada
    const nextUrl = alternativeUrls.find(url => url !== currentUrl);
    
    if (nextUrl) {
      console.log('🔄 Intentando ruta alternativa:', nextUrl);
      e.target.src = nextUrl;
    } else {
      // No más rutas que intentar, mostrar ícono de fallback
      console.log('🚫 Todas las rutas fallaron, mostrando ícono por defecto');
      e.target.style.display = 'none';
      e.target.parentNode.innerHTML = `<i class="fas ${fallbackIcon} text-4xl text-gray-400"></i>`;
    }
  };

  if (!filename) {
    return <i className={`fas ${fallbackIcon} text-4xl text-gray-400`}></i>;
  }

  const imageUrl = buildImageUrl(filename, userType);

  return (
    <img 
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
    />
  );
};

export default {
  buildImageUrl,
  ProfileImage
};