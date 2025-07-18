import React, { useContext, useState, useMemo, useEffect } from "react";
import { DataContext } from "../../context/DataContext";
import { formatearFecha } from "../../utils/dateUtils";
import servicioService from "../../services/servicio.service";
import clienteService from "../../services/cliente.service";
import tecnicoService from "../../services/tecnico.service";
import equipoService from "../../services/equipo.service";

const DiagramaGantt = () => {
  const { data } = useContext(DataContext);

  // Debug: verificar datos en DiagramaGantt
  console.log("📅 === DIAGRAMA GANTT DEBUG ===");
  console.log("  - data completo:", data);
  console.log("  - servicios array:", data.servicios);
  console.log("  - servicios length:", data.servicios?.length || 0);
  console.log("  - clientes length:", data.clientes?.length || 0);
  console.log("  - equipos length:", data.equipos?.length || 0);
  console.log("  - tecnicos length:", data.tecnicos?.length || 0);

  if (data.servicios && data.servicios.length > 0) {
    console.log("  - Servicios encontrados:");
    data.servicios.forEach((s, i) => {
      console.log(
        `    ${i + 1}. ID: ${s.id}, Tipo: ${s.tipoServicio}, Estado: ${
          s.estado
        }, Cliente: ${s.clienteId}`
      );
    });
  } else {
    console.log("  - ⚠️ NO HAY SERVICIOS O ARRAY VACIO");
  }
  const [viewMode, setViewMode] = useState("gantt"); // 'gantt' o 'table'
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterPeriodo, setFilterPeriodo] = useState("todos");
  const [filterCliente, setFilterCliente] = useState("todos");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(null);

  // Obtener todos los servicios
  const todosServicios = useMemo(() => {
    console.log("🔄 MEMO: Recalculando todosServicios");
    console.log("     - data.servicios existe:", !!data.servicios);
    console.log("     - data.servicios.length:", data.servicios?.length || 0);
    const result = data.servicios || [];
    console.log("     - resultado final length:", result.length);
    return result;
  }, [data.servicios]);

  // Filtrar servicios
  const filteredServicios = useMemo(() => {
    let servicios = [...todosServicios];

    // Filtro por cliente
    if (filterCliente !== "todos") {
      servicios = servicios.filter(
        (s) => s.clienteId === parseInt(filterCliente)
      );
    }

    // Filtro por estado
    if (filterEstado !== "todos") {
      servicios = servicios.filter((s) => s.estado === filterEstado);
    }

    // Filtro por tipo
    if (filterTipo !== "todos") {
      servicios = servicios.filter((s) => s.tipo === filterTipo);
    }

    // Filtro por período
    if (filterPeriodo !== "todos") {
      const hoy = new Date();
      const fechaLimite = new Date();

      switch (filterPeriodo) {
        case "semana":
          fechaLimite.setDate(hoy.getDate() + 7);
          break;
        case "mes":
          fechaLimite.setMonth(hoy.getMonth() + 1);
          break;
        case "trimestre":
          fechaLimite.setMonth(hoy.getMonth() + 3);
          break;
        case "pasados":
          return servicios.filter(
            (s) => new Date(s.fechaProgramada || s.fechaSolicitud) < hoy
          );
      }

      if (filterPeriodo !== "pasados") {
        servicios = servicios.filter((s) => {
          const fechaServicio = new Date(s.fechaProgramada || s.fechaSolicitud);
          return fechaServicio >= hoy && fechaServicio <= fechaLimite;
        });
      }
    }

    const result = servicios.sort(
      (a, b) =>
        new Date(a.fechaProgramada || a.fechaSolicitud) -
        new Date(b.fechaProgramada || b.fechaSolicitud)
    );
    console.log(
      "     - ✅ RESULTADO FINAL:",
      result.length,
      "servicios filtrados"
    );
    if (result.length > 0) {
      console.log("     - Primer servicio filtrado:", {
        id: result[0].id,
        tipo: result[0].tipoServicio,
        estado: result[0].estado,
        fecha: result[0].fechaProgramada || result[0].fechaSolicitud,
      });
    }
    return result;
  }, [todosServicios, filterCliente, filterEstado, filterTipo, filterPeriodo]);

  // Calcular fechas para el diagrama de Gantt
  const { minDate, maxDate } = useMemo(() => {
    if (filteredServicios.length === 0) {
      const hoy = new Date();
      return {
        minDate: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
        maxDate: new Date(hoy.getFullYear(), hoy.getMonth() + 3, 0),
      };
    }

    const fechas = filteredServicios.map(
      (s) => new Date(s.fechaProgramada || s.fechaSolicitud)
    );
    console.log("     - 📅 Fechas extraídas para Gantt:", fechas);
    const min = new Date(Math.min(...fechas));
    const max = new Date(Math.max(...fechas));

    // Agregar padding de 15 días antes y después
    min.setDate(min.getDate() - 15);
    max.setDate(max.getDate() + 15);

    return { minDate: min, maxDate: max };
  }, [filteredServicios]);

  // Calcular días totales para el Gantt
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

  // Función para calcular la posición en el Gantt
  const getPositionPercentage = (date) => {
    const serviceDate = new Date(date);
    const daysDiff = Math.ceil((serviceDate - minDate) / (1000 * 60 * 60 * 24));
    return (daysDiff / totalDays) * 100;
  };

  // Función para obtener el color según el estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-500";
      case "proceso":
        return "bg-blue-500";
      case "completado":
        return "bg-green-500";
      case "cancelado":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Función para abrir el modal con detalles del servicio
  const handleServiceClick = (servicio) => {
    setSelectedServicio(servicio);
    setModalVisible(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedServicio(null);
  };

  // Generar etiquetas de meses para el Gantt
  const monthLabels = useMemo(() => {
    const labels = [];
    const current = new Date(minDate);

    while (current <= maxDate) {
      labels.push({
        month: current.toLocaleDateString("es", {
          month: "short",
          year: "numeric",
        }),
        position: getPositionPercentage(current),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return labels;
  }, [minDate, maxDate]);

  // No agrupar servicios - mostrar todos en un solo diagrama
  const serviciosPorCliente = useMemo(() => {
    return filteredServicios;
  }, [filteredServicios]);

  return (
    <div className="w-full min-h-screen p-4 lg:p-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 lg:p-10 rounded-xl lg:rounded-3xl mb-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-4xl font-bold m-0 flex items-center gap-2 lg:gap-4">
            <i className="fas fa-chart-gantt text-xl lg:text-3xl opacity-90"></i>
            Diagrama de Gantt - Órdenes de Servicio
          </h1>
          <p className="text-sm lg:text-lg mt-2 opacity-90">
            Visualiza todas las órdenes de servicio de todos los clientes
          </p>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Selector de vista */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("gantt")}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === "gantt"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <i className="fas fa-chart-gantt mr-2"></i>
              Diagrama
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === "table"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <i className="fas fa-table mr-2"></i>
              Tabla
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="todos">Todos los clientes</option>
              {data.clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.tipo === "empresa"
                    ? cliente.razonSocial
                    : `${cliente.nombre} ${cliente.apellido}`}
                </option>
              ))}
            </select>

            <select
              value={filterPeriodo}
              onChange={(e) => setFilterPeriodo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="todos">Todos los períodos</option>
              <option value="semana">Próxima semana</option>
              <option value="mes">Próximo mes</option>
              <option value="trimestre">Próximo trimestre</option>
              <option value="pasados">Pasados</option>
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="PROCESO">En proceso</option>
              <option value="COMPLETADO">Completados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="todos">Todos los tipos</option>
              <option value="programado">Programados</option>
              <option value="correctivo">Correctivos</option>
              <option value="preventivo">Preventivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vista Gantt Mejorada */}
      {viewMode === "gantt" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Diagrama de Gantt - Órdenes de Servicio
              </h2>
              <div className="text-sm text-gray-500">
                {filteredServicios.length} orden
                {filteredServicios.length !== 1 ? "es" : ""}
              </div>
            </div>

            {filteredServicios.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <i className="fas fa-calendar-times text-5xl mb-4"></i>
                <p className="text-lg">
                  No hay órdenes para mostrar con los filtros seleccionados
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  {/* Encabezado con fechas */}
                  <div className="grid grid-cols-[250px_1fr] gap-4 mb-2">
                    <div className="font-medium text-sm text-gray-700 py-2">
                      Orden / Cliente
                    </div>
                    <div className="relative h-8 border-b border-gray-200">
                      {/* Meses */}
                      {monthLabels.map((label, index) => (
                        <div
                          key={index}
                          className="absolute text-xs font-medium text-gray-700"
                          style={{ left: `${label.position}%` }}
                        >
                          {label.month}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Servicios */}
                  <div className="space-y-2">
                    {serviciosPorCliente.map((servicio) => {
                      const cliente = data.clientes.find(
                        (c) => c.id === servicio.clienteId
                      );
                      const tecnico = data.tecnicos.find(
                        (t) => t.id === servicio.tecnicoId
                      );
                      const fechaServicio =
                        servicio.fechaProgramada || servicio.fechaSolicitud;
                      const position = getPositionPercentage(fechaServicio);

                      // Duración estimada según el tipo
                      const duracionDias =
                        servicio.tipoServicio === "correctivo"
                          ? 1
                          : servicio.tipoServicio === "preventivo"
                          ? 2
                          : 3;
                      const width = (duracionDias / totalDays) * 100;

                      // Color según estado
                      const estadoColor =
                        servicio.estado === "COMPLETADO"
                          ? "bg-green-500"
                          : servicio.estado === "PROCESO"
                          ? "bg-blue-500"
                          : servicio.estado === "PENDIENTE"
                          ? "bg-yellow-500"
                          : servicio.estado === "CANCELADO"
                          ? "bg-red-500"
                          : "bg-gray-500";

                      return (
                        <div
                          key={servicio.id}
                          className="grid grid-cols-[250px_1fr] gap-4 group"
                        >
                          {/* Información del servicio */}
                          <div className="py-2 px-3 flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    servicio.tipoServicio === "programado"
                                      ? "bg-blue-100 text-blue-700"
                                      : servicio.tipoServicio === "correctivo"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : servicio.tipoServicio === "preventivo"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {servicio.tipoServicio
                                    .charAt(0)
                                    .toUpperCase() +
                                    servicio.tipoServicio.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {cliente
                                  ? cliente.tipo === "empresa"
                                    ? cliente.razonSocial
                                    : `${cliente.nombre} ${cliente.apellido}`
                                  : "Sin cliente"}
                              </p>
                            </div>
                          </div>

                          {/* Barra del Gantt */}
                          <div className="relative h-12 py-1">
                            {/* Línea de fondo */}
                            <div className="absolute inset-0 bg-gray-50 rounded"></div>

                            {/* Barra del servicio */}
                            <div
                              className={`absolute h-10 top-1 ${estadoColor} rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center px-3 overflow-hidden group-hover:opacity-90`}
                              style={{
                                left: `${position}%`,
                                width: `${Math.max(width, 3)}%`,
                                minWidth: "80px",
                              }}
                              onClick={() => handleServiceClick(servicio)}
                            >
                              <div className="flex items-center gap-2 text-white text-xs font-medium">
                                <i
                                  className={`fas ${
                                    servicio.estado === "COMPLETADO"
                                      ? "fa-check-circle"
                                      : servicio.estado === "PROCESO"
                                      ? "fa-spinner fa-spin"
                                      : servicio.estado === "PENDIENTE"
                                      ? "fa-clock"
                                      : "fa-times-circle"
                                  }`}
                                ></i>
                                <span className="whitespace-nowrap">
                                  {new Date(fechaServicio).toLocaleDateString(
                                    "es",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Tooltip */}
                            <div
                              className="absolute bottom-full mb-2 left-0 bg-gray-900 text-white p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-80"
                              style={{ left: `${position}%` }}
                            >
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-gray-400">
                                    Cliente:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {cliente
                                      ? cliente.tipo === "empresa"
                                        ? cliente.razonSocial
                                        : `${cliente.nombre} ${cliente.apellido}`
                                      : "Sin cliente"}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-gray-400">Tipo:</span>
                                    <span className="ml-2 font-medium capitalize">
                                      {servicio.tipoServicio}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Estado:
                                    </span>
                                    <span className="ml-2 font-medium">
                                      {servicio.estado}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Fecha:
                                    </span>
                                    <span className="ml-2 font-medium">
                                      {new Date(
                                        fechaServicio
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Técnico:
                                    </span>
                                    <span className="ml-2 font-medium">
                                      {tecnico
                                        ? `${tecnico.nombre} ${tecnico.apellido}`
                                        : "No asignado"}
                                    </span>
                                  </div>
                                </div>
                                {servicio.descripcion && (
                                  <div>
                                    <span className="text-gray-400">
                                      Descripción:
                                    </span>
                                    <p className="mt-1 font-medium">
                                      {servicio.descripcion
                                        .replace(
                                          /Mi Calificación \d+\.\d+\/\d+\.\d+ ?/g,
                                          ""
                                        )
                                        .trim()}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="absolute top-full left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Línea de hoy */}
                  <div className="relative h-8 mt-4">
                    <div className="grid grid-cols-[250px_1fr] gap-4">
                      <div></div>
                      <div className="relative">
                        <div
                          className="absolute w-0.5 bg-red-500 z-20"
                          style={{
                            left: `${getPositionPercentage(new Date())}%`,
                            top: `-${serviciosPorCliente.length * 56 + 40}px`,
                            height: `${serviciosPorCliente.length * 56 + 48}px`,
                          }}
                        >
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                            Hoy
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista Tabla */}
      {viewMode === "table" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServicios.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <i className="fas fa-table text-5xl mb-4"></i>
                      <p className="text-lg">No hay órdenes para mostrar</p>
                    </td>
                  </tr>
                ) : (
                  filteredServicios.map((servicio) => {
                    const cliente = data.clientes.find(
                      (c) => c.id === servicio.clienteId
                    );
                    const tecnico = data.tecnicos.find(
                      (t) => t.id === servicio.tecnicoId
                    );

                    return (
                      <tr key={servicio.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {servicio.tipoServicio === "programado"
                            ? "Mantenimiento Programado"
                            : "Servicio Correctivo"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente
                            ? cliente.tipo === "empresa"
                              ? cliente.razonSocial
                              : `${cliente.nombre} ${cliente.apellido}`
                            : "Sin cliente"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatearFecha(servicio.fechaSolicitud)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {servicio.descripcion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tecnico
                            ? `${tecnico.nombre} ${tecnico.apellido}`
                            : "No asignado"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              servicio.estado === "PENDIENTE"
                                ? "bg-yellow-100 text-yellow-800"
                                : servicio.estado === "PROCESO"
                                ? "bg-blue-100 text-blue-800"
                                : servicio.estado === "COMPLETADO"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {servicio.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              servicio.prioridad === "ALTA" ||
                              servicio.prioridad === "URGENTE"
                                ? "bg-red-100 text-red-800"
                                : servicio.prioridad === "MEDIA"
                                ? "bg-yellow-100 text-yellow-800"
                                : servicio.prioridad === "BAJA"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {servicio.prioridad}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Leyenda de estados
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">En proceso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Cancelado</span>
          </div>
        </div>
      </div>

      {/* Modal de detalles del servicio - DISEÑO MINIMALISTA */}
      {modalVisible && selectedServicio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header simplificado */}
            <div className="relative bg-gradient-to-r from-gray-50 to-white p-6 border-b">
              <button
                onClick={closeModal}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-lg"></i>
              </button>

              <h2 className="text-xl font-semibold text-gray-900">
                Detalle de la Orden
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedServicio.tipoServicio === "programado"
                  ? "Mantenimiento Programado"
                  : selectedServicio.tipoServicio === "correctivo"
                  ? "Servicio Correctivo"
                  : selectedServicio.tipoServicio === "preventivo"
                  ? "Servicio Preventivo"
                  : selectedServicio.tipoServicio}
              </p>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="p-6 space-y-6">
                {/* Cliente - Diseño minimalista */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Cliente
                  </h3>
                  {(() => {
                    const cliente = data.clientes.find(
                      (c) => c.id === selectedServicio.clienteId
                    );
                    return cliente ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                          {cliente.tipo === "empresa"
                            ? cliente.razonSocial.charAt(0).toUpperCase()
                            : `${cliente.nombre.charAt(
                                0
                              )}${cliente.apellido.charAt(0)}`.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {cliente.tipo === "empresa"
                              ? cliente.razonSocial
                              : `${cliente.nombre} ${cliente.apellido}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {cliente.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Cliente no encontrado
                      </p>
                    );
                  })()}
                </div>

                {/* Estados - Más sutiles */}
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      selectedServicio.estado === "PENDIENTE"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : selectedServicio.estado === "PROCESO"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : selectedServicio.estado === "COMPLETADO"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {selectedServicio.estado}
                  </span>
                  <span
                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      selectedServicio.tipoServicio === "programado"
                        ? "bg-slate-50 text-slate-700 border border-slate-200"
                        : selectedServicio.tipoServicio === "correctivo"
                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                        : "bg-teal-50 text-teal-700 border border-teal-200"
                    }`}
                  >
                    {selectedServicio.tipoServicio.charAt(0).toUpperCase() +
                      selectedServicio.tipoServicio.slice(1)}
                  </span>
                  {selectedServicio.prioridad && (
                    <span
                      className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        selectedServicio.prioridad === "ALTA" ||
                        selectedServicio.prioridad === "URGENTE"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : selectedServicio.prioridad === "MEDIA"
                          ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                    >
                      Prioridad {selectedServicio.prioridad}
                    </span>
                  )}
                </div>

                {/* Información general - Grid minimalista */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Información general
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Fecha programada
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedServicio.fechaProgramada ||
                        selectedServicio.fechaSolicitud
                          ? new Date(
                              selectedServicio.fechaProgramada ||
                                selectedServicio.fechaSolicitud
                            ).toLocaleDateString("es", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Sin fecha"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Hora</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedServicio.hora || "09:00"}
                      </p>
                    </div>
                  </div>
                  {selectedServicio.descripcion && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-1">Descripción</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedServicio.descripcion
                          .replace(/Mi Calificación \d+\.\d+\/\d+\.\d+ ?/g, "")
                          .trim()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Técnico asignado - Simplificado */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Técnico asignado
                  </h3>
                  {(() => {
                    const tecnico = data.tecnicos.find(
                      (t) => t.id === selectedServicio.tecnicoId
                    );
                    return tecnico ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                          {tecnico.nombre.charAt(0)}
                          {tecnico.apellido.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tecnico.nombre} {tecnico.apellido}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tecnico.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No hay técnico asignado
                      </p>
                    );
                  })()}
                </div>

                {/* Equipos - Diseño de tarjetas minimalistas */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Equipos
                  </h3>
                  {(() => {
                    const equipos = selectedServicio.equipoId
                      ? data.equipos.filter(
                          (e) => e.id === selectedServicio.equipoId
                        )
                      : selectedServicio.detalles &&
                        typeof selectedServicio.detalles === "string"
                      ? JSON.parse(selectedServicio.detalles)
                          .equiposSeleccionados
                        ? data.equipos.filter((e) =>
                            JSON.parse(
                              selectedServicio.detalles
                            ).equiposSeleccionados.includes(e.id)
                          )
                        : []
                      : selectedServicio.detalles &&
                        selectedServicio.detalles.equiposSeleccionados
                      ? data.equipos.filter((e) =>
                          selectedServicio.detalles.equiposSeleccionados.includes(
                            e.id
                          )
                        )
                      : [];

                    return equipos.length > 0 ? (
                      <div className="space-y-3">
                        {equipos.map((equipo) => (
                          <div
                            key={equipo.id}
                            className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
                                {equipo.tipo?.charAt(0).toUpperCase() || "E"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">
                                  {equipo.nombre ||
                                    `${equipo.tipo} ${equipo.marca}`}
                                </h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Marca:
                                    </span>
                                    <span className="text-gray-700 font-medium">
                                      {equipo.marca}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Modelo:
                                    </span>
                                    <span className="text-gray-700 font-medium">
                                      {equipo.modelo}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Capacidad:
                                    </span>
                                    <span className="text-gray-700 font-medium">
                                      {equipo.capacidad} L
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Estado:
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        equipo.estadoOperativo === "operativo"
                                          ? "text-green-600"
                                          : equipo.estadoOperativo ===
                                            "mantenimiento"
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {equipo.estadoOperativo?.replace(
                                        "_",
                                        " "
                                      ) || "Sin estado"}
                                    </span>
                                  </div>
                                  <div className="col-span-2 flex justify-between">
                                    <span className="text-gray-500">
                                      N° Serie:
                                    </span>
                                    <span className="text-gray-700 font-mono text-xs">
                                      {equipo.numeroSerie}
                                    </span>
                                  </div>
                                  {equipo.ubicacion && (
                                    <div className="col-span-2 flex justify-between">
                                      <span className="text-gray-500">
                                        Ubicación:
                                      </span>
                                      <span className="text-gray-700 font-medium">
                                        {equipo.ubicacion}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No hay equipos especificados
                      </p>
                    );
                  })()}
                </div>

                {/* Observaciones - Si existen */}
                {selectedServicio.observaciones && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Observaciones
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
                      {selectedServicio.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer minimalista */}
            <div className="border-t p-4">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                style={{
                  backgroundColor: "#2073ad",
                  ":hover": { backgroundColor: "#1a5f8f" },
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#1a5f8f")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#2073ad")
                }
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagramaGantt;
