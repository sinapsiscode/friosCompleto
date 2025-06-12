const prisma = require('../config/database');

const evaluacionController = {
  // Crear o actualizar evaluación de un servicio
  evaluarServicio: async (req, res) => {
    try {
      const { id } = req.params; // ID del servicio
      const { calificacion, comentario } = req.body;

      console.log('⭐ === EVALUAR SERVICIO ===');
      console.log('🆔 Servicio ID:', id);
      console.log('📝 Datos evaluación:', { calificacion, comentario });
      console.log('👤 Usuario:', req.user);

      // Validar datos básicos
      if (!calificacion || calificacion < 1 || calificacion > 5) {
        return res.status(400).json({
          success: false,
          message: 'La calificación debe ser un número entre 1 y 5'
        });
      }

      // Verificar que el servicio existe
      const servicio = await prisma.servicio.findUnique({
        where: { id },
        include: {
          cliente: { select: { id: true, userId: true } },
          tecnico: { select: { id: true, nombre: true, apellido: true } }
        }
      });

      if (!servicio) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      // Verificar que el servicio está completado
      if (servicio.estado !== 'COMPLETADO') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden evaluar servicios completados'
        });
      }

      // Verificar que el usuario es el cliente del servicio (si es cliente)
      if (req.user.role === 'CLIENTE') {
        const clientePerfil = await prisma.cliente.findUnique({
          where: { userId: req.user.id }
        });

        if (!clientePerfil || servicio.clienteId !== clientePerfil.id) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para evaluar este servicio'
          });
        }
      }

      // Crear o actualizar evaluación
      const evaluacionData = {
        calificacion: parseInt(calificacion),
        comentario: comentario || '',
        fechaEvaluacion: new Date().toISOString(),
        evaluadoPor: {
          userId: req.user.id,
          role: req.user.role,
          timestamp: new Date().toISOString()
        }
      };

      const servicioActualizado = await prisma.servicio.update({
        where: { id },
        data: {
          evaluacion: evaluacionData
        },
        include: {
          cliente: {
            select: { id: true, nombre: true, apellido: true }
          },
          tecnico: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      console.log('✅ Evaluación guardada exitosamente');

      res.json({
        success: true,
        message: 'Evaluación guardada exitosamente',
        data: {
          servicio: servicioActualizado,
          evaluacion: evaluacionData
        }
      });
    } catch (error) {
      console.error('❌ Error al evaluar servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener evaluación de un servicio específico
  obtenerEvaluacion: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('📋 === OBTENER EVALUACIÓN ===');
      console.log('🆔 Servicio ID:', id);

      const servicio = await prisma.servicio.findUnique({
        where: { id },
        select: {
          id: true,
          evaluacion: true,
          estado: true,
          tecnico: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      if (!servicio) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          servicioId: servicio.id,
          evaluacion: servicio.evaluacion,
          estado: servicio.estado,
          tecnico: servicio.tecnico
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener evaluación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener servicios del cliente para evaluar
  obtenerServiciosParaEvaluar: async (req, res) => {
    try {
      console.log('📋 === SERVICIOS PARA EVALUAR ===');
      console.log('👤 Usuario:', req.user);

      // Obtener perfil del cliente
      const clientePerfil = await prisma.cliente.findUnique({
        where: { userId: req.user.id }
      });

      if (!clientePerfil) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de cliente no encontrado'
        });
      }

      // Obtener servicios completados del cliente
      const servicios = await prisma.servicio.findMany({
        where: {
          clienteId: clientePerfil.id,
          estado: 'COMPLETADO'
        },
        include: {
          tecnico: {
            select: { id: true, nombre: true, apellido: true }
          },
          equipo: {
            select: { id: true, nombre: true, tipo: true }
          }
        },
        orderBy: {
          fechaCompletado: 'desc'
        }
      });

      // Separar evaluados y pendientes
      const serviciosEvaluados = servicios.filter(s => s.evaluacion);
      const serviciosPendientes = servicios.filter(s => !s.evaluacion);

      console.log(`✅ Encontrados: ${serviciosPendientes.length} pendientes, ${serviciosEvaluados.length} evaluados`);

      res.json({
        success: true,
        data: {
          pendientes: serviciosPendientes,
          evaluados: serviciosEvaluados,
          total: servicios.length
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener servicios para evaluar:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener evaluaciones de un técnico
  obtenerEvaluacionesTecnico: async (req, res) => {
    try {
      const { tecnicoId } = req.params;

      console.log('📊 === EVALUACIONES DE TÉCNICO ===');
      console.log('🆔 Técnico ID:', tecnicoId);

      // Si no se proporciona ID y el usuario es técnico, usar su propio ID
      let finalTecnicoId = tecnicoId;
      if (!tecnicoId && req.user.role === 'TECNICO') {
        const tecnicoPerfil = await prisma.tecnico.findUnique({
          where: { userId: req.user.id }
        });
        if (tecnicoPerfil) {
          finalTecnicoId = tecnicoPerfil.id.toString();
        }
      }

      if (!finalTecnicoId) {
        return res.status(400).json({
          success: false,
          message: 'ID de técnico requerido'
        });
      }

      // Obtener servicios evaluados del técnico
      const servicios = await prisma.servicio.findMany({
        where: {
          tecnicoId: parseInt(finalTecnicoId),
          estado: 'COMPLETADO',
          evaluacion: { not: null }
        },
        include: {
          cliente: {
            select: { 
              id: true, 
              nombre: true, 
              apellido: true, 
              razonSocial: true,
              telefono: true,
              email: true 
            }
          },
          equipo: {
            select: { 
              id: true, 
              nombre: true, 
              tipo: true, 
              marca: true, 
              modelo: true 
            }
          },
          equiposServicio: {
            include: {
              equipo: {
                select: { 
                  id: true, 
                  nombre: true, 
                  tipo: true, 
                  marca: true, 
                  modelo: true 
                }
              }
            }
          }
        },
        orderBy: {
          fechaCompletado: 'desc'
        }
      });

      // Calcular estadísticas
      const evaluaciones = servicios.map(s => s.evaluacion);
      const totalEvaluaciones = evaluaciones.length;
      const promedioCalificacion = totalEvaluaciones > 0 
        ? (evaluaciones.reduce((sum, eval) => sum + eval.calificacion, 0) / totalEvaluaciones).toFixed(1)
        : 0;

      const distribucionCalificaciones = {
        1: evaluaciones.filter(e => e.calificacion === 1).length,
        2: evaluaciones.filter(e => e.calificacion === 2).length,
        3: evaluaciones.filter(e => e.calificacion === 3).length,
        4: evaluaciones.filter(e => e.calificacion === 4).length,
        5: evaluaciones.filter(e => e.calificacion === 5).length
      };

      console.log(`✅ Encontradas ${totalEvaluaciones} evaluaciones, promedio: ${promedioCalificacion}`);

      res.json({
        success: true,
        data: {
          servicios,
          estadisticas: {
            total: totalEvaluaciones,
            promedio: parseFloat(promedioCalificacion),
            distribucion: distribucionCalificaciones
          }
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener evaluaciones de técnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = evaluacionController;