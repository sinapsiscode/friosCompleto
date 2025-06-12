import React, { useContext, useState, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import { showAlert } from '../../utils/sweetAlert';
import servicioService from '../../services/servicio.service';
import clienteService from '../../services/cliente.service';
import tecnicoService from '../../services/tecnico.service';
import equipoService from '../../services/equipo.service';

const Estadisticas = () => {
  const { data } = useContext(DataContext);
  
  const [periodo, setPeriodo] = useState('mes');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [datosBackend, setDatosBackend] = useState({
    servicios: [],
    clientes: [],
    tecnicos: [],
    equipos: []
  });
  const [chartData, setChartData] = useState({
    serviciosPorMes: [],
    serviciosPorTipo: [],
    serviciosPorTecnico: [],
    evaluaciones: []
  });

  // Cargar datos del backend
  useEffect(() => {
    const cargarDatosEstadisticas = async () => {
      try {
        setLoading(true);
        console.log('📊 Cargando datos para estadísticas...');
        
        // Cargar todos los datos en paralelo
        const [serviciosRes, clientesRes, tecnicosRes, equiposRes] = await Promise.all([
          servicioService.getAll({ limit: 200 }),
          clienteService.getAll({ limit: 100 }),
          tecnicoService.getAll({ limit: 50 }),
          equipoService.getAll({ limit: 500 })
        ]);
        
        console.log('✅ Datos cargados:', {
          servicios: serviciosRes.data?.length || 0,
          clientes: clientesRes.data?.length || 0,
          tecnicos: tecnicosRes.data?.length || 0,
          equipos: equiposRes.data?.length || 0
        });
        
        setDatosBackend({
          servicios: serviciosRes.data || [],
          clientes: clientesRes.data || [],
          tecnicos: tecnicosRes.data || [],
          equipos: equiposRes.data || []
        });
        
      } catch (error) {
        console.error('❌ Error cargando datos de estadísticas:', error);
        // Fallback a datos del contexto
        setDatosBackend({
          servicios: data.servicios || [],
          clientes: data.clientes || [],
          tecnicos: data.tecnicos || [],
          equipos: data.equipos || []
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatosEstadisticas();
  }, []);

  useEffect(() => {
    // Procesar datos para los gráficos cuando se cargan los datos del backend
    const procesarDatos = () => {
      if (datosBackend.servicios.length === 0) return;
      
      // Servicios por mes
      const serviciosPorMes = calcularServiciosPorMes();
      
      // Servicios por tipo
      const serviciosPorTipo = {
        preventivo: datosBackend.servicios.filter(s => s.tipoServicio === 'preventivo' || s.tipoServicio === 'programado').length,
        correctivo: datosBackend.servicios.filter(s => s.tipoServicio === 'correctivo' || s.tipoServicio === 'Correctivo').length
      };
      
      // Servicios por técnico
      const serviciosPorTecnico = datosBackend.tecnicos.map(tecnico => ({
        nombre: `${tecnico.nombre} ${tecnico.apellido}`,
        servicios: datosBackend.servicios.filter(s => s.tecnicoId === tecnico.id).length
      }));
      
      // Evaluaciones promedio
      const evaluaciones = calcularEvaluacionesPromedio();
      
      setChartData({
        serviciosPorMes,
        serviciosPorTipo,
        serviciosPorTecnico,
        evaluaciones
      });
    };
    
    procesarDatos();
  }, [datosBackend, periodo]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.relative')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const calcularServiciosPorMes = () => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return meses.map((mes, index) => {
      const count = datosBackend.servicios.filter(s => {
        const fecha = new Date(s.fechaProgramada || s.fechaSolicitud);
        return fecha.getMonth() === index && fecha.getFullYear() === 2025;
      }).length;
      return { mes, count };
    });
  };

  const calcularEvaluacionesPromedio = () => {
    const serviciosConEvaluacion = datosBackend.servicios.filter(s => s.evaluacion);
    if (serviciosConEvaluacion.length === 0) return 0;
    
    const suma = serviciosConEvaluacion.reduce((acc, s) => acc + s.evaluacion.calificacion, 0);
    return (suma / serviciosConEvaluacion.length).toFixed(1);
  };

  const calcularPromedioSatisfaccionTecnicos = () => {
    // Obtener todas las evaluaciones de servicios completados
    const serviciosConEvaluacion = data.servicios.filter(s => 
      s.estado === 'COMPLETADO' && 
      s.evaluacion && 
      s.evaluacion.calificacion
    );
    
    if (serviciosConEvaluacion.length === 0) {
      return "Sin datos";
    }
    
    // Calcular promedio por técnico
    const calificacionesPorTecnico = {};
    
    serviciosConEvaluacion.forEach(servicio => {
      const tecnicoId = servicio.tecnicoId;
      if (!calificacionesPorTecnico[tecnicoId]) {
        calificacionesPorTecnico[tecnicoId] = [];
      }
      calificacionesPorTecnico[tecnicoId].push(servicio.evaluacion.calificacion);
    });
    
    // Calcular promedio de cada técnico
    const promediosTecnicos = Object.values(calificacionesPorTecnico).map(calificaciones => {
      return calificaciones.reduce((acc, cal) => acc + cal, 0) / calificaciones.length;
    });
    
    // Calcular promedio general de todos los técnicos
    const promedioGeneral = promediosTecnicos.reduce((acc, prom) => acc + prom, 0) / promediosTecnicos.length;
    
    return `${promedioGeneral.toFixed(1)}/5.0`;
  };

  const calcularTiempoPromedioResolucion = () => {
    const serviciosCompletados = data.servicios.filter(s => s.estado === 'COMPLETADO');
    
    if (serviciosCompletados.length === 0) {
      return "Sin datos";
    }
    
    const tiemposTotales = serviciosCompletados.map(servicio => {
      let inicio, fin;
      
      // Priorizar fechaInicio y fechaFinalizacion (nuevo sistema)
      if (servicio.fechaInicio && servicio.fechaFinalizacion) {
        inicio = new Date(servicio.fechaInicio);
        fin = new Date(servicio.fechaFinalizacion);
      }
      // Usar fechas de respaldo para órdenes antiguas
      else if (servicio.horaInicio && servicio.fechaCompletado) {
        inicio = new Date(servicio.horaInicio);
        fin = new Date(servicio.fechaCompletado);
      }
      // Si solo tiene fecha de servicio y fecha completado, usar esas
      else if (servicio.fecha && servicio.fechaCompletado) {
        inicio = new Date(servicio.fecha);
        fin = new Date(servicio.fechaCompletado);
      }
      // Caso de respaldo: simular tiempo promedio
      else {
        return 2.0; // 2 días como promedio estimado
      }
      
      const diferenciaDias = (fin - inicio) / (1000 * 60 * 60 * 24);
      return Math.max(diferenciaDias, 0.1); // Mínimo 0.1 días para trabajos muy rápidos
    });
    
    const promedioDias = tiemposTotales.reduce((acc, tiempo) => acc + tiempo, 0) / tiemposTotales.length;
    
    if (promedioDias < 1) {
      return `${Math.round(promedioDias * 24)} horas`;
    } else {
      const dias = Math.floor(promedioDias);
      const horasRestantes = Math.round((promedioDias - dias) * 24);
      
      if (dias === 0) {
        return `${horasRestantes} horas`;
      } else if (horasRestantes === 0) {
        return `${dias} día${dias !== 1 ? 's' : ''}`;
      } else {
        return `${dias} día${dias !== 1 ? 's' : ''} ${horasRestantes}h`;
      }
    }
  };


  const exportarPDF = async () => {
    setIsExporting(true);
    
    try {
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Crear HTML con estilos para el PDF
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Estadísticas - ${periodo}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #fafafa;
        }
        .section h2 {
            color: #4a5568;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-top: 0;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .kpi-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .kpi-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .kpi-value {
            font-size: 24px;
            font-weight: bold;
            color: #2d3748;
            margin: 5px 0;
        }
        .chart-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .chart-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .bar-chart {
            display: flex;
            align-items: end;
            height: 150px;
            gap: 10px;
            margin-top: 15px;
        }
        .bar {
            background: linear-gradient(to top, #667eea, #764ba2);
            border-radius: 4px 4px 0 0;
            min-height: 20px;
            flex: 1;
            display: flex;
            align-items: start;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            padding-top: 5px;
        }
        .bar-label {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        th {
            background: #f7fafc;
            font-weight: bold;
            color: #4a5568;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        @media print {
            body { margin: 0; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 REPORTE DE ESTADÍSTICAS</h1>
        <p>Período: ${periodo.charAt(0).toUpperCase() + periodo.slice(1)} | Generado el: ${new Date().toLocaleDateString('es-CO', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
    </div>

    <div class="section">
        <h2>📈 Indicadores Principales (KPIs)</h2>
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Satisfacción Promedio Técnicos</div>
                <div class="kpi-value">${calcularPromedioSatisfaccionTecnicos()}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Satisfacción del Cliente</div>
                <div class="kpi-value">${calcularEvaluacionesPromedio()}/5.0</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Tiempo Promedio</div>
                <div class="kpi-value">${calcularTiempoPromedioResolucion()}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Servicios Completados</div>
                <div class="kpi-value">${data.servicios.filter(s => s.estado === 'COMPLETADO').length}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Clientes Registrados</div>
                <div class="kpi-value">${data.clientes.length}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📊 Análisis de Órdenes de Servicio</h2>
        <div class="chart-section">
            <div class="chart-card">
                <h3>Órdenes por Mes</h3>
                <div class="bar-chart">
                    ${chartData.serviciosPorMes.map(item => `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div class="bar" style="height: ${Math.max(item.count * 20, 20)}px;">
                                ${item.count}
                            </div>
                            <div class="bar-label">${item.mes}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="chart-card">
                <h3>Distribución por Tipo</h3>
                <div style="margin-top: 15px;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="width: 15px; height: 15px; background: #667eea; border-radius: 50%; margin-right: 10px;"></div>
                        <span>Preventivo: <strong>${chartData.serviciosPorTipo.preventivo}</strong> órdenes</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 15px; height: 15px; background: #f6ad55; border-radius: 50%; margin-right: 10px;"></div>
                        <span>Correctivo: <strong>${chartData.serviciosPorTipo.correctivo}</strong> órdenes</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>👥 Rendimiento por Técnico</h2>
        <table>
            <thead>
                <tr>
                    <th>Técnico</th>
                    <th>Especialidad</th>
                    <th>Órdenes Completadas</th>
                    <th>Evaluación Promedio</th>
                    <th>Eficiencia</th>
                </tr>
            </thead>
            <tbody>
                ${data.tecnicos.map(tecnico => {
                  const servicios = data.servicios.filter(s => s.tecnicoId === tecnico.id);
                  const completados = servicios.filter(s => s.estado === 'COMPLETADO').length;
                  const evaluaciones = servicios.filter(s => s.evaluacion);
                  const promEval = evaluaciones.length > 0 
                    ? (evaluaciones.reduce((acc, s) => acc + s.evaluacion.calificacion, 0) / evaluaciones.length).toFixed(1)
                    : 'N/A';
                  const eficiencia = Math.min(completados * 10, 100);
                  
                  return `
                    <tr>
                        <td><strong>${tecnico.nombre} ${tecnico.apellido}</strong></td>
                        <td>${tecnico.especialidad}</td>
                        <td>${completados}</td>
                        <td>${promEval !== 'N/A' ? promEval + '/5.0' : 'Sin evaluaciones'}</td>
                        <td>${eficiencia}%</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>🏢 Estado de Equipos por Cliente</h2>
        <table>
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Total Equipos</th>
                    <th>Operativos</th>
                    <th>En Mantenimiento</th>
                    <th>% Operatividad</th>
                </tr>
            </thead>
            <tbody>
                ${data.clientes.map(cliente => {
                  const equiposCliente = data.equipos.filter(e => e.clienteId === cliente.id);
                  const operativos = equiposCliente.filter(e => e.estadoOperativo === 'operativo').length;
                  const mantenimiento = equiposCliente.filter(e => e.estadoOperativo === 'mantenimiento').length;
                  const porcentajeOp = equiposCliente.length > 0 ? Math.round((operativos / equiposCliente.length) * 100) : 0;
                  
                  return `
                    <tr>
                        <td><strong>${cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`}</strong></td>
                        <td>${equiposCliente.length}</td>
                        <td style="color: #48bb78;">${operativos}</td>
                        <td style="color: #ed8936;">${mantenimiento}</td>
                        <td><strong>${porcentajeOp}%</strong></td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p><strong>Sistema de Gestión de Órdenes de Servicio Técnico</strong></p>
        <p>Reporte generado automáticamente el ${new Date().toLocaleString('es-CO')}</p>
    </div>
</body>
</html>`;
      
      // Crear un blob con el HTML y abrirlo en una nueva ventana para imprimir/guardar como PDF
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Abrir en nueva ventana para imprimir como PDF
      const printWindow = window.open(url, '_blank');
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      // También ofrecer descarga del HTML
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-estadisticas-${periodo}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      showAlert('Error al generar el reporte PDF', 'error');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportarExcel = async () => {
    setIsExporting(true);
    
    try {
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Crear HTML con formato de Excel
      const excelContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
  <style>
    @page { margin: 0.5in; }
    body { font-family: Calibri, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    .title { 
      background-color: #4472C4; 
      color: white; 
      font-size: 20px; 
      font-weight: bold; 
      padding: 15px; 
      text-align: center; 
    }
    .subtitle { 
      background-color: #5B9BD5; 
      color: white; 
      font-size: 16px; 
      font-weight: bold; 
      padding: 10px; 
    }
    .header { 
      background-color: #2E75B6; 
      color: white; 
      font-weight: bold; 
      padding: 8px; 
      border: 1px solid #1F4E79; 
    }
    .subheader { 
      background-color: #70AD47; 
      color: white; 
      font-weight: bold; 
      padding: 8px; 
      text-align: center;
    }
    .data { 
      border: 1px solid #D3D3D3; 
      padding: 8px; 
      background-color: white; 
    }
    .data-alt { 
      border: 1px solid #D3D3D3; 
      padding: 8px; 
      background-color: #F2F2F2; 
    }
    .success { 
      background-color: #70AD47; 
      color: white; 
      font-weight: bold; 
      text-align: center; 
      padding: 8px;
    }
    .danger { 
      background-color: #C65911; 
      color: white; 
      font-weight: bold; 
      text-align: center; 
      padding: 8px;
    }
    .warning { 
      background-color: #FFC000; 
      color: #333; 
      font-weight: bold; 
      text-align: center; 
      padding: 8px;
    }
    .number { text-align: right; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .section { margin-bottom: 30px; }
    .kpi-box {
      background-color: #E7E6E6;
      border: 2px solid #70AD47;
      padding: 10px;
      margin: 5px;
      text-align: center;
      display: inline-block;
      width: 200px;
    }
    .kpi-value {
      font-size: 24px;
      font-weight: bold;
      color: #2E75B6;
    }
    .kpi-label {
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="section">
    <table>
      <tr>
        <td colspan="6" class="title">SISTEMA DE GESTIÓN DE ÓRDENES DE SERVICIO TÉCNICO</td>
      </tr>
      <tr>
        <td colspan="6" class="subtitle">DASHBOARD EJECUTIVO - ${periodo.toUpperCase()} ${new Date().getFullYear()}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <table>
      <tr>
        <td colspan="6" class="subheader">INDICADORES CLAVE DE RENDIMIENTO (KPIs)</td>
      </tr>
      <tr>
        <td class="header">Indicador</td>
        <td class="header">Valor Actual</td>
        <td class="header">Meta</td>
        <td class="header">Estado</td>
        <td class="header">Variación</td>
        <td class="header">Interpretación</td>
      </tr>
      <tr>
        <td class="data bold">Satisfacción Promedio Técnicos</td>
        <td class="data center bold">${calcularPromedioSatisfaccionTecnicos()}</td>
        <td class="data center">4.5/5.0</td>
        <td class="${parseFloat(calcularPromedioSatisfaccionTecnicos()) >= 4.5 ? 'success' : 'danger'}">${parseFloat(calcularPromedioSatisfaccionTecnicos()) >= 4.5 ? '✓ CUMPLE' : '✗ NO CUMPLE'}</td>
        <td class="data center">+0.2</td>
        <td class="data">Promedio de calificación de todos los técnicos</td>
      </tr>
      <tr>
        <td class="data-alt bold">Satisfacción del Cliente</td>
        <td class="data-alt center bold">${calcularEvaluacionesPromedio()}/5.0</td>
        <td class="data-alt center">4.5/5.0</td>
        <td class="${parseFloat(calcularEvaluacionesPromedio()) >= 4.5 ? 'success' : 'danger'}">${parseFloat(calcularEvaluacionesPromedio()) >= 4.5 ? '✓ CUMPLE' : '✗ NO CUMPLE'}</td>
        <td class="data-alt center">${(parseFloat(calcularEvaluacionesPromedio()) - 4.5).toFixed(1)}</td>
        <td class="data-alt">Calificación promedio en escala 1-5</td>
      </tr>
      <tr>
        <td class="data bold">Tiempo de Resolución</td>
        <td class="data center bold">2.5 días</td>
        <td class="data center">3.0 días</td>
        <td class="success">✓ CUMPLE</td>
        <td class="data center">-0.5 días</td>
        <td class="data">Días promedio para completar servicio</td>
      </tr>
      <tr>
        <td class="data-alt bold">Servicios Completados</td>
        <td class="data-alt center bold">${data.servicios.filter(s => s.estado === 'COMPLETADO').length}</td>
        <td class="data-alt center">50</td>
        <td class="${data.servicios.filter(s => s.estado === 'COMPLETADO').length >= 50 ? 'success' : 'danger'}">${data.servicios.filter(s => s.estado === 'COMPLETADO').length >= 50 ? '✓ CUMPLE' : '✗ NO CUMPLE'}</td>
        <td class="data-alt center">${data.servicios.filter(s => s.estado === 'COMPLETADO').length - 50}</td>
        <td class="data-alt">Total acumulado del período</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <table>
      <tr>
        <td colspan="8" class="subheader">ANÁLISIS MENSUAL DE ÓRDENES DE SERVICIO</td>
      </tr>
      <tr>
        <td class="header">MES</td>
        <td class="header center">TOTAL</td>
        <td class="header center">% DEL TOTAL</td>
        <td class="header center">PREVENTIVOS</td>
        <td class="header center">CORRECTIVOS</td>
        <td class="header center">COMPLETADOS</td>
        <td class="header center">EVALUADOS</td>
        <td class="header center">CALIF. PROM</td>
      </tr>
      ${(() => {
        const total = chartData.serviciosPorMes.reduce((acc, item) => acc + item.count, 0);
        return chartData.serviciosPorMes.map((item, index) => {
          const mesServicios = data.servicios.filter(s => {
            const fecha = new Date(s.fechaProgramada || s.fechaSolicitud);
            return fecha.toLocaleDateString('es', { month: 'short' }) === item.mes;
          });
          const preventivos = mesServicios.filter(s => s.tipoServicio === 'preventivo' || s.tipoServicio === 'programado').length;
          const correctivos = mesServicios.filter(s => s.tipoServicio === 'correctivo' || s.tipoServicio === 'Correctivo').length;
          const completados = mesServicios.filter(s => s.estado === 'COMPLETADO').length;
          const evaluados = mesServicios.filter(s => s.evaluacion).length;
          const califProm = evaluados > 0 
            ? (mesServicios.filter(s => s.evaluacion).reduce((acc, s) => acc + s.evaluacion.calificacion, 0) / evaluados).toFixed(1)
            : 'N/A';
          const porcentaje = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
          const rowClass = index % 2 === 0 ? 'data' : 'data-alt';
          
          return `
      <tr>
        <td class="${rowClass} bold">${item.mes.toUpperCase()}</td>
        <td class="${rowClass} center">${item.count}</td>
        <td class="${rowClass} center">${porcentaje}%</td>
        <td class="${rowClass} center">${preventivos}</td>
        <td class="${rowClass} center">${correctivos}</td>
        <td class="${rowClass} center">${completados}</td>
        <td class="${rowClass} center">${evaluados}</td>
        <td class="${rowClass} center bold">${califProm}</td>
      </tr>`;
        }).join('');
      })()}
    </table>
  </div>

  <div class="section">
    <table>
      <tr>
        <td colspan="9" class="subheader">RENDIMIENTO DE TÉCNICOS</td>
      </tr>
      <tr>
        <td class="header">TÉCNICO</td>
        <td class="header">ESPECIALIDAD</td>
        <td class="header center">EXPERIENCIA</td>
        <td class="header center">ÓRDENES</td>
        <td class="header center">COMPLETADOS</td>
        <td class="header center">TASA ÉXITO</td>
        <td class="header center">EVALUACIÓN</td>
        <td class="header center">PRODUCTIVIDAD</td>
        <td class="header center">DISPONIBILIDAD</td>
      </tr>
      ${data.tecnicos.map((tecnico, index) => {
        const servicios = data.servicios.filter(s => s.tecnicoId === tecnico.id);
        const completados = servicios.filter(s => s.estado === 'COMPLETADO').length;
        const enProceso = servicios.filter(s => s.estado === 'en-progreso').length;
        const evaluaciones = servicios.filter(s => s.evaluacion);
        const promEval = evaluaciones.length > 0 
          ? (evaluaciones.reduce((acc, s) => acc + s.evaluacion.calificacion, 0) / evaluaciones.length).toFixed(1)
          : 'N/A';
        const tasaExito = servicios.length > 0 ? ((completados / servicios.length) * 100).toFixed(1) : '0.0';
        const productividad = completados >= 10 ? 'ALTA' : completados >= 5 ? 'MEDIA' : 'BAJA';
        const disponibilidad = enProceso === 0 ? 'DISPONIBLE' : enProceso <= 2 ? 'PARCIAL' : 'OCUPADO';
        const rowClass = index % 2 === 0 ? 'data' : 'data-alt';
        const prodClass = productividad === 'ALTA' ? 'success' : productividad === 'MEDIA' ? 'warning' : 'danger';
        const dispClass = disponibilidad === 'DISPONIBLE' ? 'success' : disponibilidad === 'PARCIAL' ? 'warning' : 'danger';
        
        return `
      <tr>
        <td class="${rowClass} bold">${tecnico.nombre} ${tecnico.apellido}</td>
        <td class="${rowClass}">${tecnico.especialidad.charAt(0).toUpperCase() + tecnico.especialidad.slice(1)}</td>
        <td class="${rowClass} center">${tecnico.experiencia} años</td>
        <td class="${rowClass} center">${servicios.length}</td>
        <td class="${rowClass} center bold">${completados}</td>
        <td class="${rowClass} center">${tasaExito}%</td>
        <td class="${rowClass} center bold">${promEval}</td>
        <td class="${prodClass}">${productividad}</td>
        <td class="${dispClass}">${disponibilidad}</td>
      </tr>`;
      }).join('')}
    </table>
  </div>

  <div class="section">
    <table>
      <tr>
        <td colspan="8" class="subheader">ANÁLISIS DE CLIENTES Y EQUIPOS</td>
      </tr>
      <tr>
        <td class="header">CLIENTE</td>
        <td class="header">TIPO</td>
        <td class="header">DOCUMENTO</td>
        <td class="header center">EQUIPOS</td>
        <td class="header center">OPERATIVOS</td>
        <td class="header center">% OPERATIVIDAD</td>
        <td class="header center">SERVICIOS</td>
        <td class="header">ÚLTIMA ATENCIÓN</td>
      </tr>
      ${data.clientes.map((cliente, index) => {
        const equiposCliente = data.equipos.filter(e => e.clienteId === cliente.id);
        const operativos = equiposCliente.filter(e => e.estadoOperativo === 'operativo').length;
        const porcentajeOp = equiposCliente.length > 0 ? Math.round((operativos / equiposCliente.length) * 100) : 0;
        const serviciosCliente = data.servicios.filter(s => s.clienteId === cliente.id);
        const ultimoServicio = serviciosCliente.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
        const tipoCliente = cliente.razonSocial ? 'EMPRESA' : 'PARTICULAR';
        const nombreCliente = cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`;
        const documento = cliente.ruc || cliente.dni || 'No registrado';
        const rowClass = index % 2 === 0 ? 'data' : 'data-alt';
        const opClass = porcentajeOp >= 80 ? 'success' : porcentajeOp >= 50 ? 'warning' : 'danger';
        
        return `
      <tr>
        <td class="${rowClass} bold">${nombreCliente}</td>
        <td class="${rowClass}">${tipoCliente}</td>
        <td class="${rowClass}">${documento}</td>
        <td class="${rowClass} center">${equiposCliente.length}</td>
        <td class="${rowClass} center">${operativos}</td>
        <td class="${opClass}">${porcentajeOp}%</td>
        <td class="${rowClass} center">${serviciosCliente.length}</td>
        <td class="${rowClass}">${ultimoServicio ? new Date(ultimoServicio.fecha).toLocaleDateString('es-CO') : 'Sin servicios'}</td>
      </tr>`;
      }).join('')}
    </table>
  </div>

  <div class="section">
    <table>
      <tr>
        <td colspan="4" class="subtitle center">Reporte generado el ${new Date().toLocaleString('es-CO')}</td>
      </tr>
    </table>
  </div>
</body>
</html>`;
      
      // Crear blob y descargar
      const blob = new Blob([excelContent], { 
        type: 'application/vnd.ms-excel;charset=utf-8' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Estadisticas_${periodo}_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      showAlert('Error al generar el reporte Excel', 'error');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportarJSON = async () => {
    setIsExporting(true);
    
    try {
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reporteData = {
        titulo: 'Reporte de Estadísticas',
        periodo: periodo,
        fechaGeneracion: new Date().toISOString(),
        kpis: {
          satisfaccionPromedioTecnicos: calcularPromedioSatisfaccionTecnicos(),
          satisfaccionCliente: parseFloat(calcularEvaluacionesPromedio()),
          tiempoPromedioResolucion: calcularTiempoPromedioResolucion(),
          serviciosCompletados: data.servicios.filter(s => s.estado === 'COMPLETADO').length,
          clientesRegistrados: data.clientes.length
        },
        graficos: {
          serviciosPorMes: chartData.serviciosPorMes,
          serviciosPorTipo: chartData.serviciosPorTipo,
          serviciosPorTecnico: chartData.serviciosPorTecnico
        },
        tecnicos: data.tecnicos.map(tecnico => {
          const servicios = data.servicios.filter(s => s.tecnicoId === tecnico.id);
          const completados = servicios.filter(s => s.estado === 'COMPLETADO').length;
          const evaluaciones = servicios.filter(s => s.evaluacion);
          const promEval = evaluaciones.length > 0 
            ? parseFloat((evaluaciones.reduce((acc, s) => acc + s.evaluacion.calificacion, 0) / evaluaciones.length).toFixed(1))
            : null;
          
          return {
            id: tecnico.id,
            nombre: `${tecnico.nombre} ${tecnico.apellido}`,
            especialidad: tecnico.especialidad,
            serviciosCompletados: completados,
            evaluacionPromedio: promEval,
            eficiencia: Math.min(completados * 10, 100)
          };
        }),
        equiposPorCliente: data.clientes.map(cliente => {
          const equiposCliente = data.equipos.filter(e => e.clienteId === cliente.id);
          return {
            clienteId: cliente.id,
            cliente: cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`,
            totalEquipos: equiposCliente.length,
            operativos: equiposCliente.filter(e => e.estadoOperativo === 'operativo').length,
            enMantenimiento: equiposCliente.filter(e => e.estadoOperativo === 'mantenimiento').length
          };
        })
      };
      
      // Crear blob y descargar
      const blob = new Blob([JSON.stringify(reporteData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-estadisticas-${periodo}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al exportar JSON:', error);
      showAlert('Error al generar el reporte JSON', 'error');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h2 className="text-2xl text-gray-900 font-semibold m-0 flex items-center gap-3 before:content-['📊'] before:text-3xl">Estadísticas y Reportes</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <select 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value)}
            className="py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 text-base font-medium cursor-pointer transition-all duration-200 min-w-[150px] hover:border-primary focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-alpha-10)]"
          >
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="año">Este Año</option>
          </select>
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className={`${
                isExporting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-95'
              } text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl group`}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-download text-lg group-hover:scale-110 transition-transform duration-200"></i>
                  <span>Exportar Reporte</span>
                  <i className={`fas fa-chevron-down text-sm transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}></i>
                </>
              )}
            </button>
            
            {showExportMenu && !isExporting && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    Formatos disponibles
                  </div>
                  <button
                    onClick={exportarPDF}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 transition-colors duration-150 group"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <i className="fas fa-file-pdf text-red-600"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">PDF</div>
                      <div className="text-xs text-gray-500">Reporte completo para imprimir</div>
                    </div>
                  </button>
                  <button
                    onClick={exportarExcel}
                    className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-3 transition-colors duration-150 group"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <i className="fas fa-file-excel text-green-600"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Excel (CSV)</div>
                      <div className="text-xs text-gray-500">Datos para análisis</div>
                    </div>
                  </button>
                  <button
                    onClick={exportarJSON}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors duration-150 group"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <i className="fas fa-code text-blue-600"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">JSON</div>
                      <div className="text-xs text-gray-500">Datos estructurados para APIs</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
        <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden flex items-center gap-6 group hover:transform hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-success before:transition-all before:duration-300 before:w-0 hover:before:w-2 after:content-[''] after:absolute after:-top-1/2 after:-right-1/5 after:w-30 after:h-30 after:bg-gradient-radial after:from-primary/10 after:to-transparent after:rounded-full after:transition-all after:duration-300 hover:after:scale-150 hover:after:opacity-80">
          <div className="w-18 h-18 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0 transition-all duration-300 relative z-[1] bg-success/10 text-success group-hover:transform group-hover:scale-110 group-hover:rotate-2">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Satisfacción Promedio Técnicos</h3>
            <p className="text-3xl font-bold text-gray-900 leading-tight my-1">{calcularPromedioSatisfaccionTecnicos()}</p>
            <span className="text-sm inline-flex items-center gap-1 py-1 px-3 rounded-full font-medium bg-success/10 text-success-dark">
              <i className="fas fa-arrow-up text-xs"></i> +0.2 vs mes anterior
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden flex items-center gap-6 group hover:transform hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-warning before:transition-all before:duration-300 before:w-0 hover:before:w-2 after:content-[''] after:absolute after:-top-1/2 after:-right-1/5 after:w-30 after:h-30 after:bg-gradient-radial after:from-warning/10 after:to-transparent after:rounded-full after:transition-all after:duration-300 hover:after:scale-150 hover:after:opacity-80">
          <div className="w-18 h-18 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0 transition-all duration-300 relative z-[1] bg-warning/10 text-warning group-hover:transform group-hover:scale-110 group-hover:rotate-2">
            <i className="fas fa-star"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Satisfacción del Cliente</h3>
            <p className="text-3xl font-bold text-gray-900 leading-tight my-1">{calcularEvaluacionesPromedio()}/5.0</p>
            <span className="text-sm inline-flex items-center gap-1 py-1 px-3 rounded-full font-medium bg-success/10 text-success-dark">
              <i className="fas fa-arrow-up text-xs"></i> 0.3 vs mes anterior
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden flex items-center gap-6 group hover:transform hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-info before:transition-all before:duration-300 before:w-0 hover:before:w-2 after:content-[''] after:absolute after:-top-1/2 after:-right-1/5 after:w-30 after:h-30 after:bg-gradient-radial after:from-info/10 after:to-transparent after:rounded-full after:transition-all after:duration-300 hover:after:scale-150 hover:after:opacity-80">
          <div className="w-18 h-18 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0 transition-all duration-300 relative z-[1] bg-info/10 text-info group-hover:transform group-hover:scale-110 group-hover:rotate-2">
            <i className="fas fa-clock"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Tiempo Promedio de Resolución</h3>
            <p className="text-3xl font-bold text-gray-900 leading-tight my-1">{calcularTiempoPromedioResolucion()}</p>
            <span className="text-sm inline-flex items-center gap-1 py-1 px-3 rounded-full font-medium bg-danger/10 text-danger-dark">
              <i className="fas fa-arrow-down text-xs"></i> 0.5 días vs mes anterior
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden flex items-center gap-6 group hover:transform hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-primary before:transition-all before:duration-300 before:w-0 hover:before:w-2 after:content-[''] after:absolute after:-top-1/2 after:-right-1/5 after:w-30 after:h-30 after:bg-gradient-radial after:from-primary/10 after:to-transparent after:rounded-full after:transition-all after:duration-300 hover:after:scale-150 hover:after:opacity-80">
          <div className="w-18 h-18 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0 transition-all duration-300 relative z-[1] bg-primary/10 text-primary group-hover:transform group-hover:scale-110 group-hover:rotate-2">
            <i className="fas fa-tools"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Órdenes Completadas</h3>
            <p className="text-3xl font-bold text-gray-900 leading-tight my-1">{data.servicios.filter(s => s.estado === 'COMPLETADO').length}</p>
            <span className="text-sm inline-flex items-center gap-1 py-1 px-3 rounded-full font-medium bg-success/10 text-success-dark">
              <i className="fas fa-arrow-up text-xs"></i> 12 vs mes anterior
            </span>
          </div>
        </div>


        <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden flex items-center gap-6 group hover:transform hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-primary-dark before:transition-all before:duration-300 before:w-0 hover:before:w-2 after:content-[''] after:absolute after:-top-1/2 after:-right-1/5 after:w-30 after:h-30 after:bg-gradient-radial after:from-primary/20 after:to-transparent after:rounded-full after:transition-all after:duration-300 hover:after:scale-150 hover:after:opacity-80">
          <div className="w-18 h-18 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0 transition-all duration-300 relative z-[1] bg-primary/20 text-primary-dark group-hover:transform group-hover:scale-110 group-hover:rotate-2">
            <i className="fas fa-users"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Clientes Registrados</h3>
            <p className="text-3xl font-bold text-gray-900 leading-tight my-1">{data.clientes.length}</p>
            <span className="text-sm inline-flex items-center gap-1 py-1 px-3 rounded-full font-medium bg-success/10 text-success-dark">
              <i className="fas fa-arrow-up text-xs"></i> 2 nuevos este mes
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6 mb-8 animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden hover:shadow-xl hover:transform hover:-translate-y-1 hover:border-info/20 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-info before:to-info-light before:rounded-t-3xl before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-100">
          <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-3 before:content-['📈'] before:text-xl">Órdenes por Mes</h3>
          <div className="min-h-[250px] flex items-end justify-center p-4">
            <div className="flex items-end gap-4 w-full h-50">
              {chartData.serviciosPorMes.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-primary to-primary-light rounded-t-lg min-h-[20px] flex items-start justify-center pt-1 cursor-pointer transition-all duration-200 relative hover:bg-gradient-to-t hover:from-primary-light hover:to-primary-dark hover:transform hover:scale-105" 
                    style={{ 
                      height: `${Math.max(item.count * 20, 30)}px`,
                      animationDelay: `${index * 0.1}s`
                    }}
                    title={`${item.count} órdenes`}
                  >
                    <span className="text-white font-semibold text-sm">{item.count}</span>
                  </div>
                  <span className="text-gray-600 text-sm font-medium">{item.mes}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden hover:shadow-xl hover:transform hover:-translate-y-1 hover:border-info/20 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-info before:to-info-light before:rounded-t-3xl before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-100">
          <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-3 before:content-['📈'] before:text-xl">Distribución por Tipo de Orden</h3>
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:transform hover:translate-x-1">
                <span className="w-3 h-3 rounded-full flex-shrink-0 bg-primary"></span>
                <span>
                  <strong>Preventivo:</strong> {chartData.serviciosPorTipo.preventivo} órdenes
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:transform hover:translate-x-1">
                <span className="w-3 h-3 rounded-full flex-shrink-0 bg-warning"></span>
                <span>
                  <strong>Correctivo:</strong> {chartData.serviciosPorTipo.correctivo} órdenes
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-full bg-white rounded-3xl p-8 shadow-md border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden hover:shadow-xl hover:transform hover:-translate-y-1 hover:border-info/20 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-info before:to-info-light before:rounded-t-3xl before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-100">
          <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-3 before:content-['👥'] before:text-xl">Rendimiento por Técnico</h3>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Técnico</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Órdenes Completadas</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Evaluación Promedio</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Tiempo Promedio</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Eficiencia</th>
                </tr>
              </thead>
              <tbody>
                {data.tecnicos.map(tecnico => {
                  const servicios = data.servicios.filter(s => s.tecnicoId === tecnico.id);
                  const completados = servicios.filter(s => s.estado === 'COMPLETADO').length;
                  const evaluaciones = servicios.filter(s => s.evaluacion);
                  const promEval = evaluaciones.length > 0 
                    ? (evaluaciones.reduce((acc, s) => acc + s.evaluacion.calificacion, 0) / evaluaciones.length).toFixed(1)
                    : 'N/A';
                  
                  return (
                    <tr key={tecnico.id} className="transition-all duration-200 border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                      <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{tecnico.nombre} {tecnico.apellido}</td>
                      <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{completados}</td>
                      <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                        {promEval !== 'N/A' ? (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-star text-warning"></i>
                            <strong>{promEval}</strong>
                          </div>
                        ) : (
                          <span className="text-gray-500">Sin evaluaciones</span>
                        )}
                      </td>
                      <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                        <span className="text-info">
                          <i className="fas fa-clock"></i> 2.3 días
                        </span>
                      </td>
                      <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                        <div className="w-25 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-600" 
                            style={{ width: `${Math.min(completados * 10, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Resumen de Equipos Detallado */}
      <div className="mt-8">
        <h3 className="text-xl text-gray-900 mb-6 flex items-center gap-3 before:content-['🏢'] before:text-2xl">Análisis Detallado de Equipos</h3>
        
        {/* Estadísticas Generales de Equipos */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 transition-all duration-400 hover:shadow-xl hover:transform hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-blue-100 text-blue-600">
                <i className="fas fa-snowflake"></i>
              </div>
              <div>
                <h4 className="text-sm text-gray-600 font-medium uppercase tracking-wide">Total Equipos</h4>
                <p className="text-2xl font-bold text-gray-900">{data.equipos.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 transition-all duration-400 hover:shadow-xl hover:transform hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-green-100 text-green-600">
                <i className="fas fa-check-circle"></i>
              </div>
              <div>
                <h4 className="text-sm text-gray-600 font-medium uppercase tracking-wide">Operativos</h4>
                <p className="text-2xl font-bold text-gray-900">{data.equipos.filter(e => e.estadoOperativo === 'operativo').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 transition-all duration-400 hover:shadow-xl hover:transform hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-yellow-100 text-yellow-600">
                <i className="fas fa-tools"></i>
              </div>
              <div>
                <h4 className="text-sm text-gray-600 font-medium uppercase tracking-wide">En Mantenimiento</h4>
                <p className="text-2xl font-bold text-gray-900">{data.equipos.filter(e => e.estadoOperativo === 'mantenimiento').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 transition-all duration-400 hover:shadow-xl hover:transform hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-purple-100 text-purple-600">
                <i className="fas fa-chart-bar"></i>
              </div>
              <div>
                <h4 className="text-sm text-gray-600 font-medium uppercase tracking-wide">Capacidad Promedio</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {data.equipos.length > 0 
                    ? Math.round(data.equipos.reduce((acc, e) => acc + (parseInt(e.capacidad) || 0), 0) / data.equipos.length)
                    : 0} L
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Detallada de Equipos */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900">Inventario Detallado de Equipos</h4>
            <p className="text-sm text-gray-600 mt-1">Información completa de todos los equipos registrados</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Equipo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Marca/Modelo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">N° Serie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Capacidad</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha Compra</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha Instalación</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ubicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.equipos.map((equipo, index) => {
                  const cliente = data.clientes.find(c => c.id === equipo.clienteId);
                  const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                  
                  return (
                    <tr key={equipo.id} className={`${rowClass} hover:bg-gray-100 transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {equipo.imagenEquipo ? (
                            <img 
                              src={`/uploads/${equipo.imagenEquipo}`} 
                              alt={equipo.nombre}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-blue-500 to-blue-600 ${equipo.imagenEquipo ? 'hidden' : ''}`}>
                            {equipo.tipo?.charAt(0).toUpperCase() || 'E'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{equipo.nombre || `${equipo.tipo} ${equipo.marca}`}</p>
                            <p className="text-sm text-gray-600 capitalize">{equipo.tipo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {cliente ? (cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`) : 'Sin asignar'}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{equipo.marca}</p>
                          <p className="text-sm text-gray-600">{equipo.modelo}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {equipo.numeroSerie}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          <i className="fas fa-thermometer-half text-xs"></i>
                          {equipo.capacidad} L
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          equipo.estadoOperativo === 'operativo' ? 'bg-green-100 text-green-800' :
                          equipo.estadoOperativo === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                          equipo.estadoOperativo === 'fuera_servicio' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <i className={`fas ${
                            equipo.estadoOperativo === 'operativo' ? 'fa-check-circle' :
                            equipo.estadoOperativo === 'mantenimiento' ? 'fa-tools' :
                            equipo.estadoOperativo === 'fuera_servicio' ? 'fa-times-circle' :
                            'fa-question-circle'
                          }`}></i>
                          {equipo.estadoOperativo?.replace('_', ' ') || 'Sin estado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {equipo.fechaCompra ? new Date(equipo.fechaCompra).toLocaleDateString() : 'No registrada'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {equipo.fechaInstalacion ? new Date(equipo.fechaInstalacion).toLocaleDateString() : 'No registrada'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <i className="fas fa-map-marker-alt text-gray-400"></i>
                          {equipo.ubicacion || 'Sin ubicación'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen por Cliente */}
        <div className="mt-8">
          <h4 className="text-lg text-gray-900 mb-6 font-semibold">Equipos por Cliente</h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {data.clientes.map(cliente => {
              const equiposCliente = data.equipos.filter(e => e.clienteId === cliente.id);
              const operativos = equiposCliente.filter(e => e.estadoOperativo === 'operativo').length;
              const mantenimiento = equiposCliente.filter(e => e.estadoOperativo === 'mantenimiento').length;
              const fueraServicio = equiposCliente.filter(e => e.estadoOperativo === 'fuera_servicio').length;
              const capacidadTotal = equiposCliente.reduce((acc, e) => acc + (parseInt(e.capacidad) || 0), 0);
              
              return (
                <div key={cliente.id} className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 transition-all duration-400 hover:transform hover:-translate-y-1 hover:shadow-xl">
                  <h5 className="text-base text-gray-900 mb-4 font-semibold">{cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`}</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm flex items-center gap-2">
                        <i className="fas fa-snowflake text-blue-500"></i> Total Equipos
                      </span>
                      <span className="font-semibold text-gray-900">{equiposCliente.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm flex items-center gap-2">
                        <i className="fas fa-check-circle text-green-500"></i> Operativos
                      </span>
                      <span className="font-semibold text-green-600">{operativos}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm flex items-center gap-2">
                        <i className="fas fa-tools text-yellow-500"></i> En Mantenimiento
                      </span>
                      <span className="font-semibold text-yellow-600">{mantenimiento}</span>
                    </div>
                    {fueraServicio > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm flex items-center gap-2">
                          <i className="fas fa-times-circle text-red-500"></i> Fuera de Servicio
                        </span>
                        <span className="font-semibold text-red-600">{fueraServicio}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-gray-600 text-sm flex items-center gap-2">
                        <i className="fas fa-thermometer-half text-purple-500"></i> Capacidad Total
                      </span>
                      <span className="font-semibold text-purple-600">{capacidadTotal} L</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;