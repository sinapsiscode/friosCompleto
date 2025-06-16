import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import Modal from '../../components/Common/Modal';
import ClienteForm from '../../components/Forms/ClienteForm';
import clienteService from '../../services/cliente.service';

const Clientes = () => {
  const { data } = useContext(DataContext);
  const { useBackend } = useContext(AuthContext);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar clientes del backend o datos estáticos
  useEffect(() => {
    const loadClientes = async () => {
      if (useBackend) {
        console.log('🌐 Cargando clientes desde el backend...');
        setLoading(true);
        const result = await clienteService.getAll();
        if (result.success) {
          console.log('✅ Clientes cargados:', result.data.length);
          setClientes(result.data || []);
        } else {
          console.error('❌ Error cargando clientes:', result.message);
          setClientes([]);
        }
        setLoading(false);
      } else {
        console.log('💾 Usando clientes de datos estáticos');
        setClientes(data.clientes || []);
        setLoading(false);
      }
    };
    
    loadClientes();
  }, [useBackend, refreshKey]);

  const filteredClientes = clientes.filter(cliente => {
    const nombre = cliente.tipo === 'empresa'
      ? cliente.razonSocial || 'Sin razón social'
      : `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || 'Sin nombre';

    const matchesSearch =
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.ruc && cliente.ruc.includes(searchTerm)) ||
      (cliente.dni && cliente.dni.includes(searchTerm));
    const matchesTipo = filterTipo === 'todos' || cliente.tipo === filterTipo;

    return matchesSearch && matchesTipo;
  });

  const handleNuevoCliente = () => {
    setSelectedCliente(null);
    setShowModal(true);
  };

  const handleEditCliente = (cliente) => {
    setSelectedCliente(cliente);
    setShowModal(true);
  };

  const getEquiposCount = (clienteId) => {
    const cliente = data.clientes.find(c => c.id === clienteId);
    return cliente?.equipos?.length || 0;
  };

  const getServiciosCount = (clienteId) => {
    return data.servicios.filter(s => s.clienteId === clienteId).length;
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-gray-900 m-0">Clientes</h2>
        <div className="flex gap-3">
          <button className="btn-primary-enhanced group" onClick={handleNuevoCliente}>
            <span>
              <i className="fas fa-user-plus text-lg"></i>
              <span>Nuevo Cliente</span>
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex items-center gap-4 flex-wrap border border-gray-200">
        <div className="flex-1 min-w-[280px] relative">
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-base pointer-events-none"></i>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 px-4 pl-12 border border-gray-300 rounded-lg text-base text-gray-900 bg-gray-50 transition-all duration-200 focus:outline-none focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_var(--primary-alpha-10)]"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tipo:</label>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="py-3 px-4 pr-8 border border-gray-300 rounded-lg text-base text-gray-900 bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:20px] appearance-none cursor-pointer transition-all duration-200 hover:border-gray-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-alpha-10)]"
          >
            <option value="todos">Todos</option>
            <option value="empresa">Empresa</option>
            <option value="personal">Personal</option>
          </select>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            className={`p-3 min-w-[40px] bg-transparent rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="fas fa-th-large"></i>
          </button>
          <button
            className={`p-3 min-w-[40px] bg-transparent rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <i className="fas fa-users text-6xl text-gray-300 mb-6"></i>
          <h3 className="text-xl text-gray-700 m-0 mb-3">No se encontraron clientes</h3>
          <p className="text-base text-gray-500 m-0 mb-8">No hay clientes que coincidan con los filtros aplicados.</p>
          <button className="btn-primary-enhanced group" onClick={handleNuevoCliente}>
            <span className="flex items-center gap-2">
              <i className="fas fa-plus"></i>
              <span>Agregar Primer Cliente</span>
            </span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 animate-fadeIn">
          {filteredClientes.map(cliente => {
            const nombre = cliente.tipo === 'empresa'
              ? cliente.razonSocial
              : `${cliente.nombre} ${cliente.apellido}`;
            const documento = cliente.tipo === 'empresa'
              ? `RUC: ${cliente.ruc}`
              : `DNI: ${cliente.dni}`;

            return (
              <div key={cliente.id} className="bg-white rounded-3xl shadow-md p-6 border border-gray-100 transition-all duration-400 cubic-bezier(0.4,0,0.2,1) relative overflow-hidden flex flex-col min-h-[400px] gap-2 group hover:transform hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-primary before:to-primary-light before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100" data-tipo={cliente.tipo}>
                <div className="flex items-start gap-6  relative pb-6 border-b border-gray-100">
                  {cliente.profileImage ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:2001'}/uploads/${cliente.profileImage}`} 
                      alt={nombre} 
                      className="rounded-2xl object-cover object-center border-4 border-gray-200 transition-all duration-300 flex-shrink-0 relative before:content-[''] before:absolute before:-top-0.5 before:-left-0.5 before:-right-0.5 before:-bottom-0.5 before:rounded-2xl before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent before:-z-[1] before:opacity-0 before:transition-all before:duration-300 group-hover:before:opacity-100"
                      style={{ width: '82px', height: '76px' }}
                      onError={(e) => {
                        console.log('❌ Error cargando imagen cliente:', e.target.src);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      className={`rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 flex-shrink-0 relative before:content-[''] before:absolute before:-top-0.5 before:-left-0.5 before:-right-0.5 before:-bottom-0.5 before:rounded-2xl before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent before:-z-[1] before:opacity-0 before:transition-all before:duration-300 group-hover:before:opacity-100 ${cliente.tipo === 'empresa' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}
                      style={{ width: '82px', height: '76px' }}
                    >
                      <i className={`fas ${cliente.tipo === 'empresa' ? 'fa-building' : 'fa-user'}`}></i>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 m-0 leading-tight">{nombre}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm text-gray-600 font-medium m-0 bg-gray-100 py-1 px-3 rounded-lg inline-block w-fit">{documento}</p>
                      <span className={`py-1 px-3 rounded-full text-xs font-medium uppercase tracking-wide inline-block w-fit ${cliente.tipo === 'empresa' ? 'bg-primary/20 text-primary-dark' : 'bg-secondary/10 text-secondary-dark'}`}>
                        {cliente.tipo}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 text-gray-700 text-sm transition-all duration-200 py-3 hover:text-gray-900 hover:transform hover:translate-x-0.5">
                      <i className="fas fa-phone w-5 flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 text-success"></i>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal font-medium">{cliente.telefono}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700 text-sm transition-all duration-200 py-3 hover:text-gray-900 hover:transform hover:translate-x-0.5">
                      <i className="fas fa-envelope w-5 flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 text-primary"></i>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal font-medium">{cliente.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700 text-sm transition-all duration-200 py-3 hover:text-gray-900 hover:transform hover:translate-x-0.5">
                      <i className="fas fa-map-marker-alt w-5 flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 text-warning"></i>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal font-medium">{cliente.direccion}, {cliente.distrito}</span>
                    </div>
                    {cliente.tipo === 'empresa' && (
                      <div className="flex items-center gap-4 text-gray-700 text-sm transition-all duration-200 py-3 hover:text-gray-900 hover:transform hover:translate-x-0.5">
                        <i className="fas fa-industry w-5 flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 text-secondary"></i>
                        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-normal font-medium">{cliente.sector}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-h-12 ">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 text-center border border-gray-200 transition-all duration-300 flex flex-col items-center justify-center min-h-[70px] relative overflow-hidden group before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary before:to-primary-light before:scale-x-0 before:transition-all before:duration-300 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/20 hover:border-primary/20 hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:before:scale-x-100">
                      <span className="block text-2xl font-bold text-gray-900 leading-tight mb-1">{getEquiposCount(cliente.id)}</span>
                      <span className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Equipos</span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 text-center border border-gray-200 transition-all duration-300 flex flex-col items-center justify-center min-h-[70px] relative overflow-hidden group before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary before:to-primary-light before:scale-x-0 before:transition-all before:duration-300 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/20 hover:border-primary/20 hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:before:scale-x-100">
                      <span className="block text-2xl font-bold text-gray-900 leading-tight mb-1">{getServiciosCount(cliente.id)}</span>
                      <span className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Servicios</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end border-t border-gray-100 pt-2 mt-0">
                  <button
                    className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-info flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-info-dark"
                    title="Ver perfil del cliente"
                    onClick={() => handleEditCliente(cliente)}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button
                    className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-primary flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-primary-dark"
                    title="Editar información del cliente"
                    onClick={() => handleEditCliente(cliente)}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-fadeIn">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Tipo</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Nombre/Razón Social</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Documento</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Teléfono</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Email</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Dirección</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Equipos</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Servicios</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(cliente => {
                const nombre = cliente.tipo === 'empresa'
                  ? cliente.razonSocial
                  : `${cliente.nombre} ${cliente.apellido}`;
                const documento = cliente.tipo === 'empresa'
                  ? cliente.ruc
                  : cliente.dni;

                return (
                  <tr key={cliente.id} className="transition-all duration-200 border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                      <span className={`inline-flex items-center py-1 px-3 rounded-full text-xs font-medium uppercase tracking-wide ${cliente.tipo === 'empresa' ? 'bg-primary/20 text-primary-dark' : 'bg-secondary/10 text-secondary-dark'}`}>
                        {cliente.tipo}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                      <div className="flex items-center gap-3">
                        {cliente.profileImage ? (
                          <img 
                            src={`${process.env.REACT_APP_API_URL || 'http://localhost:2001'}/uploads/${cliente.profileImage}`} 
                            alt={nombre} 
                            className="w-10 h-10 rounded-2xl object-cover border-2 border-gray-200"
                            onError={(e) => {
                              console.log('❌ Error cargando imagen cliente lista:', e.target.src);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base transition-all duration-300 flex-shrink-0 ${cliente.tipo === 'empresa' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                            <i className={`fas ${cliente.tipo === 'empresa' ? 'fa-building' : 'fa-user'}`}></i>
                          </div>
                        )}
                        <span>{nombre}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{documento}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{cliente.telefono}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{cliente.email}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{cliente.direccion}, {cliente.distrito}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{getEquiposCount(cliente.id)}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">{getServiciosCount(cliente.id)}</td>
                    <td className="py-4 px-6 border-b border-gray-100 text-gray-800 text-base">
                      <button
                        className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-info flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-info-dark"
                        title="Ver perfil"
                        onClick={() => handleEditCliente(cliente)}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="w-9 h-9 rounded-lg border-0 flex items-center justify-center text-base cursor-pointer transition-all duration-300 cubic-bezier(0.4,0,0.2,1) bg-transparent text-primary flex-shrink-0 hover:transform hover:-translate-y-0.5 hover:scale-110 hover:text-primary-dark ml-2"
                        title="Editar"
                        onClick={() => handleEditCliente(cliente)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedCliente ? `Cliente: ${selectedCliente.razonSocial || selectedCliente.nombre}` : 'Nuevo Cliente'}
        size="large"
      >
        <ClienteForm
          cliente={selectedCliente}
          onClose={() => setShowModal(false)}
          onSuccess={(clienteActualizado) => {
            console.log('✅ Cliente actualizado exitosamente:', clienteActualizado);
            setShowModal(false);
            
            // Actualizar el cliente en la lista local inmediatamente
            if (clienteActualizado && clienteActualizado.id) {
              setClientes(prevClientes => 
                prevClientes.map(cliente => 
                  cliente.id === clienteActualizado.id 
                    ? { ...cliente, ...clienteActualizado }
                    : cliente
                )
              );
              console.log('🔄 Cliente actualizado en lista local:', clienteActualizado);
            }
            
            // También actualizar con refreshKey como respaldo
            setRefreshKey(prev => prev + 1);
          }}
        />
      </Modal>
    </div>
  );
};

export default Clientes;