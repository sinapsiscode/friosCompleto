import React, { useState, useContext } from 'react';
import { DataContext } from '../../context/DataContext';
import { showConfirm } from '../../utils/sweetAlert';

const Repuestos = () => {
  const { data, addItem, updateItem, deleteItem } = useContext(DataContext);
  const [showModal, setShowModal] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'repuesto',
    disponible: true
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Inicializar repuestos si no existen
  const repuestos = data.repuestos || [];

  // Filtrar repuestos
  const filteredRepuestos = repuestos.filter(repuesto => {
    return repuesto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           repuesto.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingRepuesto) {
      updateItem('repuestos', editingRepuesto.id, formData);
    } else {
      const newRepuesto = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      addItem('repuestos', newRepuesto);
    }
    
    handleCloseModal();
  };

  const handleEdit = (repuesto) => {
    setEditingRepuesto(repuesto);
    setFormData({
      nombre: repuesto.nombre,
      descripcion: repuesto.descripcion || '',
      categoria: repuesto.categoria,
      disponible: repuesto.disponible !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await showConfirm(
      '¿Eliminar repuesto?',
      '¿Está seguro de eliminar este repuesto?',
      'Sí, eliminar',
      'Cancelar'
    );
    
    if (result.isConfirmed) {
      deleteItem('repuestos', id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRepuesto(null);
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: 'repuesto',
      disponible: true
    });
  };

  const toggleDisponibilidad = (repuesto) => {
    updateItem('repuestos', repuesto.id, { disponible: !repuesto.disponible });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl text-gray-900 font-semibold m-0 flex items-center gap-4 before:content-[''] before:w-1 before:h-7 before:bg-primary before:rounded-sm">
            <i className="fas fa-wrench text-primary"></i>
            Gestión de Repuestos y Materiales
          </h2>
          <p className="text-gray-600 mt-2">Administra los repuestos disponibles para los servicios</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          <span>Nuevo Repuesto</span>
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Buscar repuesto o material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Lista de repuestos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepuestos.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
            <i className="fas fa-wrench text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 text-lg">No se encontraron repuestos</p>
            <p className="text-gray-400 mt-2">Comienza agregando tu primer repuesto</p>
          </div>
        ) : (
          filteredRepuestos.map(repuesto => (
            <div 
              key={repuesto.id} 
              className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all ${!repuesto.disponible ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{repuesto.nombre}</h3>
                  {repuesto.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">{repuesto.descripcion}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDisponibilidad(repuesto)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      repuesto.disponible ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={repuesto.disponible ? 'Disponible' : 'No disponible'}
                  >
                    <div className={`absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      repuesto.disponible ? 'transform translate-x-6' : 'transform translate-x-0.5'
                    } top-0.5`}></div>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  repuesto.disponible 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {repuesto.disponible ? 'Disponible' : 'No disponible'}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(repuesto)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(repuesto.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingRepuesto ? 'Editar Repuesto' : 'Nuevo Repuesto'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del repuesto *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Filtro de aire"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="3"
                    placeholder="Descripción detallada del repuesto..."
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.disponible}
                      onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Disponible para usar en servicios
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  {editingRepuesto ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repuestos;