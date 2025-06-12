import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TestConexion = () => {
  const [resultados, setResultados] = useState({
    health: null,
    servicios: null,
    error: null
  });

  useEffect(() => {
    const probarConexion = async () => {
      console.log('🔍 === INICIANDO TEST DE CONEXIÓN ===');
      
      try {
        // Test 1: Health check
        console.log('1. Probando health check...');
        const healthResponse = await fetch('http://localhost:2001/health');
        const healthData = await healthResponse.text();
        console.log('✅ Health check exitoso:', healthData);
        
        // Test 2: API con token
        console.log('2. Probando API con token...');
        const serviciosResponse = await api.get('/api/servicios?limit=5');
        console.log('✅ API exitoso:', serviciosResponse.data);
        
        setResultados({
          health: healthData,
          servicios: serviciosResponse.data,
          error: null
        });
        
      } catch (error) {
        console.error('❌ Error en test:', error);
        setResultados({
          health: null,
          servicios: null,
          error: error.message
        });
      }
    };

    probarConexion();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Test de Conexión Backend</h1>
      
      <div className="space-y-6">
        {/* Health Check */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Health Check</h2>
          {resultados.health ? (
            <div className="text-green-600">✅ {resultados.health}</div>
          ) : (
            <div className="text-red-600">❌ No response</div>
          )}
        </div>

        {/* Servicios API */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">API Servicios</h2>
          {resultados.servicios ? (
            <div className="text-green-600">
              ✅ {resultados.servicios.data?.length || 0} servicios encontrados
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(resultados.servicios, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-red-600">❌ No data</div>
          )}
        </div>

        {/* Error */}
        {resultados.error && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-red-600">Error</h2>
            <div className="text-red-700">{resultados.error}</div>
          </div>
        )}

        {/* Token Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Token Info</h2>
          <div>Token: {sessionStorage.getItem('token') || 'No token'}</div>
          <div>User: {sessionStorage.getItem('user') || 'No user'}</div>
        </div>
      </div>
    </div>
  );
};

export default TestConexion;