import React, { useState, useContext } from 'react';
import { DataContext } from '../../context/DataContext';
import './CalendarioServicios.css';

const CalendarioServicios = ({ onBack, servicios }) => {
  const { data } = useContext(DataContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getServiciosForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const serviciosToUse = servicios || data.servicios;
    return serviciosToUse.filter(s => s.fecha === dateStr);
  };

  const handleDayClick = (date, servicios) => {
    if (servicios.length > 0) {
      setSelectedDate(date);
      setSelectedServices(servicios);
      setShowDetailModal(true);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendario-day other-month"></div>);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const servicios = getServiciosForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div 
          key={day} 
          className={`calendario-day ${isToday ? 'today' : ''} ${servicios.length > 0 ? 'has-services' : ''}`}
          onClick={() => handleDayClick(date, servicios)}
        >
          <div className="calendario-day-number">{day}</div>
          {servicios.length > 0 && (
            <div className="calendario-services">
              {servicios.slice(0, 2).map((servicio, idx) => {
                const cliente = data.clientes.find(c => c.id === servicio.clienteId);
                return (
                  <div key={idx} className={`calendario-service ${servicio.tipo}`}>
                    <span className="calendario-service-time">{servicio.hora}</span>
                    <span className="calendario-service-client">
                      {cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}
                    </span>
                  </div>
                );
              })}
              {servicios.length > 2 && (
                <div className="calendario-more">+{servicios.length - 2} más</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const getSelectedDateServices = () => {
    if (!selectedDate) return [];
    return getServiciosForDate(selectedDate);
  };

  return (
    <div className="calendario-container">
      <div className="calendario-header">
        <div className="calendario-nav">
          <h2 className="calendario-title">
            <i className="fas fa-calendar-alt"></i>
            Calendario de Órdenes de Servicio
          </h2>
          <button className="btn-back" onClick={onBack}>
            <i className="fas fa-arrow-left"></i> Volver
          </button>
        </div>
        <div className="calendario-controls">
          <button className="calendario-nav-btn" onClick={previousMonth}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <h3 className="calendario-month">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <button className="calendario-nav-btn" onClick={nextMonth}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="calendario-grid">
        <div className="calendario-weekdays">
          <div className="calendario-weekday">Dom</div>
          <div className="calendario-weekday">Lun</div>
          <div className="calendario-weekday">Mar</div>
          <div className="calendario-weekday">Mié</div>
          <div className="calendario-weekday">Jue</div>
          <div className="calendario-weekday">Vie</div>
          <div className="calendario-weekday">Sáb</div>
        </div>
        <div className="calendario-days">
          {renderCalendarDays()}
        </div>
      </div>

      <div className="calendario-legend">
        <h4 className="calendario-legend-title">Leyenda</h4>
        <div className="calendario-legend-items">
          <div className="calendario-legend-item">
            <span className="calendario-legend-color mantenimiento"></span>
            <span className="calendario-legend-label">Mantenimiento</span>
          </div>
          <div className="calendario-legend-item">
            <span className="calendario-legend-color reparacion"></span>
            <span className="calendario-legend-label">Reparación</span>
          </div>
          <div className="calendario-legend-item">
            <span className="calendario-legend-color instalacion"></span>
            <span className="calendario-legend-label">Instalación</span>
          </div>
        </div>
      </div>

      {showDetailModal && selectedDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden animate-fadeIn shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-1">
                    Órdenes del Día
                  </h3>
                  <p className="text-white/80">
                    {selectedDate.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(85vh - 180px)'}}>
              {selectedServices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay órdenes programadas para este día</p>
              ) : (
                <div className="space-y-4">
                  {selectedServices.map(servicio => {
                    const cliente = data.clientes.find(c => c.id === servicio.clienteId);
                    const tecnico = data.tecnicos.find(t => t.id === servicio.tecnicoId);
                    const equipos = servicio.equipos?.map(eId => data.equipos.find(e => e.id === eId)).filter(Boolean) || [];
                    
                    return (
                      <div key={servicio.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                  servicio.tipo === 'mantenimiento' ? 'bg-blue-100 text-blue-800' :
                                  servicio.tipo === 'reparacion' ? 'bg-red-100 text-red-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  <i className={`fas ${
                                    servicio.tipo === 'mantenimiento' ? 'fa-tools' :
                                    servicio.tipo === 'reparacion' ? 'fa-wrench' :
                                    'fa-cog'
                                  }`}></i>
                                  {servicio.tipo.charAt(0).toUpperCase() + servicio.tipo.slice(1)}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                  servicio.estado === 'completado' ? 'bg-green-100 text-green-800' :
                                  servicio.estado === 'proceso' ? 'bg-blue-100 text-blue-800' :
                                  servicio.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  <i className={`fas ${
                                    servicio.estado === 'completado' ? 'fa-check-circle' :
                                    servicio.estado === 'proceso' ? 'fa-spinner' :
                                    servicio.estado === 'cancelado' ? 'fa-times-circle' :
                                    'fa-clock'
                                  }`}></i>
                                  {servicio.estado.charAt(0).toUpperCase() + servicio.estado.slice(1)}
                                </span>
                                {servicio.prioridad === 'alta' && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    <i className="fas fa-exclamation-circle"></i>
                                    Prioridad Alta
                                  </span>
                                )}
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {servicio.descripcion}
                              </h4>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 text-gray-600">
                                <i className="fas fa-clock"></i>
                                <span className="font-medium">{servicio.hora || '09:00'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="px-6 py-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-sm font-semibold text-gray-600 mb-2">Cliente</h5>
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <i className="fas fa-building text-primary"></i>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}
                                  </p>
                                  <p className="text-sm text-gray-600">{cliente?.telefono}</p>
                                  {cliente?.direccion && (
                                    <p className="text-sm text-gray-600">{cliente?.direccion}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-semibold text-gray-600 mb-2">Técnico Asignado</h5>
                              {tecnico ? (
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <i className="fas fa-user-cog text-success"></i>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {tecnico.nombre} {tecnico.apellido}
                                    </p>
                                    <p className="text-sm text-gray-600">{tecnico.especialidad}</p>
                                    <p className="text-sm text-gray-600">{tecnico.telefono}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-amber-600 font-medium">
                                  <i className="fas fa-exclamation-triangle mr-2"></i>
                                  Sin técnico asignado
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {equipos.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-600 mb-2">Equipos a Revisar</h5>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="space-y-2">
                                  {equipos.map(equipo => (
                                    <div key={equipo.id} className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <i className="fas fa-snowflake text-primary"></i>
                                        <span className="text-sm">
                                          {equipo.tipo} - {equipo.marca} {equipo.modelo}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        Serie: {equipo.serial}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {servicio.diagnostico && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-600 mb-2">Diagnóstico</h5>
                              <p className="text-gray-700 bg-blue-50 rounded-lg p-3">
                                {servicio.diagnostico}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Total de órdenes: <span className="font-semibold">{selectedServices.length}</span>
                </p>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioServicios;