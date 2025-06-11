const fs = require('fs');
const path = require('path');

/**
 * Repara automáticamente las rutas de imagen que solo tienen el nombre del archivo
 * @param {string} filename - Nombre del archivo o ruta
 * @param {string} userType - Tipo de usuario: 'tecnicos', 'clientes', 'administradores'
 * @returns {string|null} - Ruta completa o null si no se encuentra
 */
const fixImagePath = (filename, userType = 'tecnicos') => {
  if (!filename) return null;
  
  // Si ya tiene la ruta completa, devolverla tal como está
  if (filename.includes('/')) {
    return filename;
  }
  
  // Si solo es el nombre del archivo, buscar en las carpetas por fecha
  const uploadsDir = path.join(__dirname, '../../uploads');
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Lista de rutas posibles ordenadas por probabilidad
  const possiblePaths = [
    // Año y mes actual
    `${userType}/avatars/${currentYear}/${currentMonth}/${filename}`,
    // Año actual, meses anteriores
    `${userType}/avatars/${currentYear}/${String(new Date().getMonth()).padStart(2, '0') || '12'}/${filename}`,
    `${userType}/avatars/${currentYear}/05/${filename}`,
    `${userType}/avatars/${currentYear}/04/${filename}`,
    `${userType}/avatars/${currentYear}/03/${filename}`,
    `${userType}/avatars/${currentYear}/02/${filename}`,
    `${userType}/avatars/${currentYear}/01/${filename}`,
    // Año anterior
    `${userType}/avatars/${currentYear - 1}/12/${filename}`,
    `${userType}/avatars/${currentYear - 1}/11/${filename}`,
    // Sin estructura de fechas (legacy)
    `${userType}/avatars/${filename}`,
    // Directorio raíz de usuario
    `${userType}/${filename}`
  ];
  
  // Buscar el archivo en las rutas posibles
  for (const relativePath of possiblePaths) {
    const fullPath = path.join(uploadsDir, relativePath);
    if (fs.existsSync(fullPath)) {
      console.log(`🔧 Ruta reparada automáticamente: ${filename} → ${relativePath}`);
      return relativePath;
    }
  }
  
  console.log(`⚠️ No se pudo reparar la ruta para: ${filename}`);
  return null;
};

/**
 * Middleware para reparar rutas de imagen automáticamente en las respuestas
 */
const autoFixImagePaths = (data, userType) => {
  if (!data) return data;
  
  // Si es un array, procesar cada elemento
  if (Array.isArray(data)) {
    return data.map(item => autoFixImagePaths(item, userType));
  }
  
  // Si es un objeto, procesar las propiedades
  if (typeof data === 'object' && data !== null) {
    const fixed = { ...data };
    
    // Reparar profileImage si existe y no es una ruta completa
    if (fixed.profileImage && !fixed.profileImage.includes('/')) {
      const fixedPath = fixImagePath(fixed.profileImage, userType);
      if (fixedPath) {
        fixed.profileImage = fixedPath;
      }
    }
    
    return fixed;
  }
  
  return data;
};

module.exports = {
  fixImagePath,
  autoFixImagePaths
};