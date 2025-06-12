require('dotenv').config();
require('express-async-errors');

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { PrismaClient } = require('@prisma/client');

// Importar middlewares
const errorHandler = require('./src/middlewares/error.middleware');

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const clienteRoutes = require('./src/routes/cliente.routes');
const tecnicoRoutes = require('./src/routes/tecnico.routes');
const servicioRoutes = require('./src/routes/servicio.routes');
const equipoRoutes = require('./src/routes/equipo.routes');
const repuestoRoutes = require('./src/routes/repuesto.routes');
const repuestoFormularioRoutes = require('./src/routes/repuestoFormulario.routes');
const herramientaRoutes = require('./src/routes/herramienta.routes');
const programacionRoutes = require('./src/routes/programacion.routes');

const app = express();
const prisma = new PrismaClient();

// Configuración básica
const PORT = process.env.PORT || 2001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requests por ventana de tiempo (aumentado para desarrollo)
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos'
  }
});

// Middlewares globales
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:2000',
  credentials: true
}));

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta API para servir imágenes con headers CORS correctos
app.get('/uploads/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  const fs = require('fs');
  
  // Verificar si el archivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Imagen no encontrada' });
  }
  
  // Configurar headers CORS específicos para imágenes
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:2000');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Determinar el tipo de contenido
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 día
  
  // Enviar el archivo
  res.sendFile(filePath);
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ServiceFrios API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/tecnicos', tecnicoRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/repuestos', repuestoRoutes);
app.use('/api/repuestos-formulario', repuestoFormularioRoutes);
app.use('/api/herramientas', herramientaRoutes);
app.use('/api/programaciones', programacionRoutes);

// Ruta para 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos PostgreSQL');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      
      if (NODE_ENV === 'development') {
        console.log(`🔧 Prisma Studio: npx prisma studio`);
      }
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;