# 🚀 Migración a OVH Cloud Storage

Este documento explica cómo migrar de almacenamiento local a OVH Object Storage para el manejo de archivos (avatares, documentos) en ServiceFrios.

## 📋 Requisitos Previos

1. **Cuenta OVH Cloud**: Crear cuenta en [ovhcloud.com](https://www.ovhcloud.com/)
2. **Object Storage creado**: Crear un contenedor de Object Storage
3. **Credenciales S3**: Obtener Access Key y Secret Key
4. **Dependencia AWS SDK**: Instalar `aws-sdk`

## 🔧 Configuración Paso a Paso

### 1. Instalar dependencias

```bash
cd backendFrios
npm install aws-sdk
```

### 2. Configurar variables de entorno

Agregar al archivo `.env`:

```env
# OVH Object Storage Configuration
OVH_ENDPOINT=https://s3.gra.cloud.ovh.net
OVH_ACCESS_KEY=tu_access_key_aqui
OVH_SECRET_KEY=tu_secret_key_aqui
OVH_REGION=gra
OVH_BUCKET_NAME=servicefrios-bucket

# Opcional: Configurar modo de almacenamiento
STORAGE_MODE=ovh  # 'local' o 'ovh'
```

### 3. Obtener credenciales OVH

1. **Panel OVH**: Ir a [ovhcloud.com](https://www.ovhcloud.com/) → Panel de control
2. **Object Storage**: Crear nuevo contenedor
3. **Usuario S3**: Crear usuario con permisos de lectura/escritura
4. **Credenciales**: Copiar Access Key y Secret Key

### 4. Activar OVH en el código

En `/src/config/upload.js`:

```javascript
// 1. Descomentar toda la sección OVH (líneas 183-293)
// 2. Descomentar las exportaciones (líneas 351-357)
// 3. Modificar las rutas para usar OVH
```

### 5. Modificar rutas para usar OVH

En `/src/routes/tecnico.routes.js`:

```javascript
// Cambiar de:
const { uploadTecnicoAvatar, handleUploadError } = require('../config/upload');

// A:
const { 
  uploadTecnicoAvatarOVH, 
  processOVHUpload, 
  handleUploadError 
} = require('../config/upload');

// Y en las rutas cambiar:
uploadTecnicoAvatar  →  uploadTecnicoAvatarOVH
// Agregar después del upload:
processOVHUpload,
```

### 6. Modificar controller para URLs OVH

En `/src/controllers/tecnico.controller.js`:

```javascript
// Cambiar de:
profileImage: req.file ? req.file.filename : null,

// A:
profileImage: req.uploadedFileUrl || (req.file ? req.file.filename : null),
```

## 🔄 Migración Gradual (Recomendado)

### Opción 1: Feature Flag

```javascript
// En upload.js
const useOVH = process.env.STORAGE_MODE === 'ovh';

const uploadTecnicoAvatar = useOVH 
  ? uploadTecnicoAvatarOVH 
  : uploadLocalTecnico.single('avatar');
```

### Opción 2: Dual Storage (Respaldo)

```javascript
// Subir a ambos: local + OVH
const dualUpload = async (req, res, next) => {
  // Subir a local
  await uploadLocalTecnico.single('avatar')(req, res, () => {});
  
  // Subir a OVH
  if (req.file) {
    req.uploadedFileUrl = await uploadToOVH(req.file, folder, entityId);
  }
  
  next();
};
```

## 📁 Estructura de Archivos en OVH

```
servicefrios-bucket/
├── tecnicos/
│   └── avatars/
│       └── 2025/
│           └── 01/
│               └── avatar-123-1736123456789.jpg
├── clientes/
│   └── avatars/
│       └── 2025/01/
└── servicios/
    ├── fotos/
    └── documentos/
```

## 🔒 Configuración de Seguridad

### Permisos del Bucket

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::servicefrios-bucket/*/avatars/*"
    }
  ]
}
```

### URLs Firmadas (Opcional)

Para archivos privados, usar URLs firmadas:

```javascript
const signedUrl = s3Client.getSignedUrl('getObject', {
  Bucket: BUCKET_NAME,
  Key: fileKey,
  Expires: 3600 // 1 hora
});
```

## 🧪 Testing

### 1. Test de conectividad

```javascript
// Crear archivo test-ovh.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.OVH_ENDPOINT,
  accessKeyId: process.env.OVH_ACCESS_KEY,
  secretAccessKey: process.env.OVH_SECRET_KEY,
  region: process.env.OVH_REGION
});

s3.listBuckets((err, data) => {
  if (err) console.error('Error:', err);
  else console.log('Buckets:', data.Buckets);
});
```

### 2. Test de upload

```bash
# Ejecutar desde backendFrios/
node test-ovh.js
```

## 📊 Monitoreo y Logs

### Logs de uploads

```javascript
// En processOVHUpload
console.log(`✅ Archivo subido a OVH: ${result.Location}`);
console.log(`📁 Bucket: ${BUCKET_NAME}, Key: ${key}`);
console.log(`📏 Tamaño: ${(file.size / 1024).toFixed(2)} KB`);
```

### Métricas recomendadas

- Tiempo de upload promedio
- Tasa de errores
- Uso de almacenamiento
- Costos por mes

## 💰 Costos Estimados

### OVH Object Storage Pricing (aprox.)

- **Almacenamiento**: €0.01 GB/mes
- **Transferencia salida**: €0.01 GB (primeros 1TB gratis)
- **Requests**: €0.004 por 1000 requests

### Estimación ServiceFrios

```
Usuarios: 100 técnicos + 500 clientes
Avatares: 600 × 500KB = 300MB
Fotos servicios: 1000 servicios × 2MB = 2GB
Total: ~2.3GB = €0.023/mes (~$0.025)
```

## 🔄 Rollback Plan

### Si hay problemas con OVH

1. **Cambiar variable**: `STORAGE_MODE=local`
2. **Revertir imports** en rutas
3. **Restaurar desde backup** local si es necesario

### Script de rollback

```bash
#!/bin/bash
# rollback-to-local.sh
echo "Revirtiendo a almacenamiento local..."
sed -i 's/STORAGE_MODE=ovh/STORAGE_MODE=local/g' .env
echo "✅ Rollback completado"
```

## 📚 Referencias

- [OVH Object Storage Docs](https://docs.ovh.com/gb/en/storage/object-storage/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [S3 API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/)

---

**⚠️ Importante**: Probar en entorno de desarrollo antes de migrar a producción.

**🔒 Seguridad**: Nunca commitear las credenciales OVH al repositorio.