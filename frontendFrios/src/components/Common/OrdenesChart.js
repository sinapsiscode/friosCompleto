import React from 'react';

const OrdenesChart = ({ programadas, realizadas }) => {
  const total = programadas + realizadas;
  const maxValue = Math.max(programadas, realizadas);
  const chartHeight = 200;
  const barWidth = 80;
  const spacing = 60;
  
  // Calculate percentages
  const programadasPercent = programadas > 0 ? (programadas / maxValue) * 100 : 0;
  const realizadasPercent = realizadas > 0 ? (realizadas / maxValue) * 100 : 0;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-light rounded-sm"></div>
          Órdenes Programadas vs Realizadas
        </h3>
        <p className="text-sm text-gray-600">Comparación del mes actual</p>
      </div>
      
      <div className="flex justify-center items-end mb-6" style={{ height: `${chartHeight + 50}px` }}>
        <div className="relative flex items-end gap-12">
          {/* Programadas Bar */}
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">{programadas}</div>
            <div 
              className="relative bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-700 ease-out hover:from-blue-600 hover:to-blue-500"
              style={{ 
                width: `${barWidth}px`, 
                height: `${(programadasPercent / 100) * chartHeight}px`,
                minHeight: '10px'
              }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                {programadas > 0 ? `${((programadas / total) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="mt-3 text-sm font-medium text-gray-700">Programadas</div>
          </div>
          
          {/* Realizadas Bar */}
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">{realizadas}</div>
            <div 
              className="relative bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-700 ease-out hover:from-green-600 hover:to-green-500"
              style={{ 
                width: `${barWidth}px`, 
                height: `${(realizadasPercent / 100) * chartHeight}px`,
                minHeight: '10px'
              }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                {realizadas > 0 ? `${((realizadas / total) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="mt-3 text-sm font-medium text-gray-700">Realizadas</div>
          </div>
        </div>
      </div>
      
      {/* Statistics Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-600 mt-1">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {programadas > 0 ? `${((realizadas / programadas) * 100).toFixed(0)}%` : '0%'}
          </div>
          <div className="text-xs text-gray-600 mt-1">Cumplimiento</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{programadas - realizadas}</div>
          <div className="text-xs text-gray-600 mt-1">Pendientes</div>
        </div>
      </div>
      
      {/* Progress Indicator */}
      {/* <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso del mes</span>
          <span className="text-sm font-medium text-gray-900">
            {programadas > 0 ? `${((realizadas / programadas) * 100).toFixed(0)}%` : '0%'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-700"
            style={{ width: programadas > 0 ? `${(realizadas / programadas) * 100}%` : '0%' }}
          ></div>
        </div>
      </div> */}
    </div>
  );
};

export default OrdenesChart;