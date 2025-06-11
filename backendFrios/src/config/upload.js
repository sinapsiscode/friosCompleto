const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio base de uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Crear estructura de directorios para técnicos
const createTecnicoUploadDirs = () => {
  const baseDir = path.join(uploadsDir, 'tecnicos');
  const avatarsDir = path.join(baseDir, 'avatars');
  
  [baseDir, avatarsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Crear estructura de directorios para clientes
const createClienteUploadDirs = () => {
  const baseDir = path.join(uploadsDir, 'clientes');
  const avatarsDir = path.join(baseDir, 'avatars');
  
  [baseDir, avatarsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Crear estructura de directorios para administradores
const createAdminUploadDirs = () => {
  const baseDir = path.join(uploadsDir, 'administradores');
  const avatarsDir = path.join(baseDir, 'avatars');
  
  [baseDir, avatarsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Crear estructura de directorios para servicios
const createServicioUploadDirs = () => {
  const baseDir = path.join(uploadsDir, 'servicios');
  const fotosDir = path.join(baseDir, 'fotos');
  const documentosDir = path.join(baseDir, 'documentos');
  
  [baseDir, fotosDir, documentosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createTecnicoUploadDirs();
createClienteUploadDirs();
createAdminUploadDirs();
createServicioUploadDirs();

// Función para obtener el directorio basado en fecha
const getDateBasedPath = (baseDir) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const yearDir = path.join(baseDir, year.toString());
  const monthDir = path.join(yearDir, month);
  
  // Crear directorios si no existen
  [yearDir, monthDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  return monthDir;
};

// Configuración de almacenamiento local para técnicos
const tecnicoLocalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Estructura: uploads/tecnicos/avatars/2024/01/
    const avatarsBase = path.join(uploadsDir, 'tecnicos', 'avatars');
    const folder = getDateBasedPath(avatarsBase);
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const tecnicoId = req.params.id || 'temp';
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Formato: avatar-tecnicoId-timestamp-random.jpg
    const filename = `avatar-${tecnicoId}-${timestamp}-${randomString}${extension}`;
    
    cb(null, filename);
  }
});

// Configuración de almacenamiento local para clientes
const clienteLocalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Estructura: uploads/clientes/avatars/2024/01/
    const avatarsBase = path.join(uploadsDir, 'clientes', 'avatars');
    const folder = getDateBasedPath(avatarsBase);
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const clienteId = req.params.id || 'temp';
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Formato: avatar-clienteId-timestamp-random.jpg
    const filename = `avatar-${clienteId}-${timestamp}-${randomString}${extension}`;
    
    cb(null, filename);
  }
});

// Configuración de almacenamiento local para administradores
const adminLocalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Estructura: uploads/administradores/avatars/2024/01/
    const avatarsBase = path.join(uploadsDir, 'administradores', 'avatars');
    const folder = getDateBasedPath(avatarsBase);
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const adminId = req.params.id || 'temp';
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Formato: avatar-adminId-timestamp-random.jpg
    const filename = `avatar-${adminId}-${timestamp}-${randomString}${extension}`;
    
    cb(null, filename);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = {
    avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  };
  
  const mimeTypes = file.fieldname.includes('avatar') 
    ? allowedMimeTypes.avatar 
    : allowedMimeTypes.document;
  
  if (mimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const fileType = file.fieldname.includes('avatar') ? 'imágenes' : 'documentos';
    cb(new Error(`Solo se permiten ${fileType} en formatos permitidos`), false);
  }
};

// Configuración de multer para almacenamiento local de técnicos
const uploadLocalTecnico = multer({
  storage: tecnicoLocalStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Configuración de multer para almacenamiento local de clientes
const uploadLocalCliente = multer({
  storage: clienteLocalStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Configuración de multer para almacenamiento local de administradores
const uploadLocalAdmin = multer({
  storage: adminLocalStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Middleware para upload de avatar de técnicos
const uploadTecnicoAvatar = uploadLocalTecnico.single('avatar');

// Middleware para upload de avatar de clientes
const uploadClienteAvatar = uploadLocalCliente.single('avatar');

// Middleware para upload de avatar de administradores
const uploadAdminAvatar = uploadLocalAdmin.single('avatar');

// Función helper para construir URL relativa
const buildFileUrl = (filename, type, userRole) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  let folder = 'tecnicos'; // Por defecto
  
  if (userRole === 'CLIENTE') {
    folder = 'clientes';
  }
  
  const basePath = `/uploads/${folder}/avatars/${year}/${month}`;
  return `${basePath}/${filename}`;
};

// ===== IMPLEMENTACIÓN PARA OVH (COMENTADA) =====
/*
// Para usar con OVH o cualquier S3-compatible storage
const AWS = require('aws-sdk');

// Configurar cliente S3 para OVH
const s3Client = new AWS.S3({
  endpoint: process.env.OVH_ENDPOINT || 'https://s3.gra.cloud.ovh.net',
  accessKeyId: process.env.OVH_ACCESS_KEY,
  secretAccessKey: process.env.OVH_SECRET_KEY,
  region: process.env.OVH_REGION || 'gra',
  signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.OVH_BUCKET_NAME || 'servicefrios-bucket';

// Almacenamiento en memoria para OVH
const memoryStorage = multer.memoryStorage();

// Función para subir a OVH
const uploadToOVH = async (file, folder, entityId) => {
  const timestamp = Date.now();
  const extension = file.mimetype.split('/')[1];
  const filename = `${file.fieldname}-${entityId}-${timestamp}.${extension}`;
  
  // Estructura en OVH: tecnicos/avatars/2025/01/filename.jpg
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const key = `${folder}/${year}/${month}/${filename}`;
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read', // O 'private' para URLs firmadas
    Metadata: {
      entityId: entityId,
      uploadDate: new Date().toISOString(),
    }
  };
  
  try {
    const result = await s3Client.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error uploading to OVH:', error);
    throw new Error('Error al subir archivo a OVH');
  }
};

// Función para eliminar de OVH
const deleteFromOVH = async (fileUrl) => {
  try {
    // Extraer key de la URL
    const urlParts = fileUrl.split('.ovh.net/');
    if (urlParts.length < 2) return;
    
    const key = urlParts[1];
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };
    
    await s3Client.deleteObject(params).promise();
    console.log('Archivo eliminado de OVH:', key);
  } catch (error) {
    console.error('Error al eliminar de OVH:', error);
    // No lanzar error para no interrumpir el flujo
  }
};

// Middleware para procesar upload a OVH
const processOVHUpload = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  try {
    const entityId = req.params.id || 'temp';
    const folder = req.file.fieldname === 'avatar' 
      ? (req.originalUrl.includes('tecnicos') ? 'tecnicos/avatars' : 'clientes/avatars')
      : 'servicios/documentos';
    
    const fileUrl = await uploadToOVH(req.file, folder, entityId);
    req.uploadedFileUrl = fileUrl;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al subir archivo',
      error: error.message
    });
  }
};

// Configuración de multer para OVH (comentada)
const uploadOVH = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Middlewares para OVH (comentados)
const uploadTecnicoAvatarOVH = uploadOVH.single('avatar');
const uploadClienteAvatarOVH = uploadOVH.single('avatar');
*/
// ===== FIN IMPLEMENTACIÓN OVH =====

// Función para eliminar archivo antiguo (almacenamiento local)
const deleteOldFile = async (filename, userType = 'tecnicos') => {
  if (!filename) return;
  
  try {
    console.log('🗑️ Intentando eliminar archivo antiguo:', filename);
    
    // Construir rutas posibles donde puede estar el archivo
    const possiblePaths = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Rutas para diferentes años y meses (buscar en los últimos 2 años)
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = String(month).padStart(2, '0');
        const filePath = path.join(
          uploadsDir, 
          userType, 
          'avatars', 
          year.toString(), 
          monthStr, 
          filename
        );
        possiblePaths.push(filePath);
      }
    }
    
    // También agregar ruta directa sin estructura de fechas (por si acaso)
    possiblePaths.push(path.join(uploadsDir, userType, 'avatars', filename));
    
    // Buscar y eliminar el archivo
    let fileDeleted = false;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ Archivo eliminado exitosamente:', filePath);
        fileDeleted = true;
        break;
      }
    }
    
    if (!fileDeleted) {
      console.log('⚠️ Archivo no encontrado para eliminar:', filename);
    }
    
    // Para OVH descomentar:
    /*
    if (filename.includes('ovh.net')) {
      await deleteFromOVH(filename);
    }
    */
  } catch (error) {
    console.error('❌ Error al eliminar archivo:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
};

// Middleware para manejar errores de multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error en la carga del archivo: ${error.message}`
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
};

module.exports = {
  uploadTecnicoAvatar,
  uploadClienteAvatar,
  uploadAdminAvatar,
  buildFileUrl,
  deleteOldFile,
  handleUploadError
  
  // Para OVH descomentar las siguientes líneas:
  /*
  , uploadTecnicoAvatarOVH,
  uploadClienteAvatarOVH,
  processOVHUpload,
  uploadToOVH,
  deleteFromOVH
  */
};