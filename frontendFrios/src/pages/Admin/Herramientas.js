import React, { useState, useContext } from 'react';
import { DataContext } from '../../context/DataContext';
import { showConfirm } from '../../utils/sweetAlert';

const Herramientas = () => {
  const { data, addItem, updateItem, deleteItem } = useContext(DataContext);
  const [showModal, setShowModal] = useState(false);
  const [editingHerramienta, setEditingHerramienta] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'repuesto',
    stock: 0,
    unidad: 'unidad'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('todos');

  // Inicializar herramientas si no existen
  const herramientas = data.herramientas || [];

  // Filtrar herramientas
  const filteredHerramientas = herramientas.filter(herramienta => {
    const matchesSearch = herramienta.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === 'todos' || herramienta.categoria === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingHerramienta) {
      updateItem('herramientas', editingHerramienta.id, formData);
    } else {
      const newHerramienta = {
        ...formData,
        id: Date.now(),
        stock: parseInt(formData.stock)
      };
      addItem('herramientas', newHerramienta);
    }
    
    handleCloseModal();
  };

  const handleEdit = (herramienta) => {
    setEditingHerramienta(herramienta);
    setFormData({
      nombre: herramienta.nombre,
      categoria: herramienta.categoria,
      stock: herramienta.stock,
      unidad: herramienta.unidad
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await showConfirm(
      '¿Eliminar herramienta/material?',
      '¿Está seguro de eliminar esta herramienta/material?',
      'Sí, eliminar',
      'Cancelar'
    );
    
    if (result.isConfirmed) {
      deleteItem('herramientas', id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingHerramienta(null);
    setFormData({
      nombre: '',
      categoria: 'repuesto',
      stock: 0,
      unidad: 'unidad'
    });
  };

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'repuesto': return 'bg-blue-100 text-blue-800';
      case 'material': return 'bg-green-100 text-green-800';
      case 'herramienta': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-2xl text-gray-900 font-semibold m-0 flex items-center gap-4 before:content-[''] before:w-1 before:h-7 before:bg-primary before:rounded-sm">
          <i className="fas fa-tools text-primary"></i>
          Gestión de Herramientas y Materiales
        </h2>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          <span>Nueva Herramienta</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar herramienta o material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="todos">Todas las categorías</option>
            <option value="repuesto">Repuestos</option>
            <option value="material">Materiales</option>
            <option value="herramienta">Herramientas</option>
          </select>
        </div>
      </div>

      {/* Lista de herramientas */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidad
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredHerramientas.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  <i className="fas fa-tools text-4xl text-gray-300 mb-4 block"></i>
                  No se encontraron herramientas o materiales
                </td>
              </tr>
            ) : (
              filteredHerramientas.map(herramienta => (
                <tr key={herramienta.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {herramienta.nombre}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoriaColor(herramienta.categoria)}`}>
                      {herramienta.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {herramienta.stock}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {herramienta.unidad}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEdit(herramienta)}
                      className="text-primary hover:text-primary-dark mx-2"
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(herramienta.id)}
                      className="text-red-600 hover:text-red-800 mx-2"
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingHerramienta ? 'Editar Herramienta/Material' : 'Nueva Herramienta/Material'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="repuesto">Repuesto</option>
                    <option value="material">Material</option>
                    <option value="herramienta">Herramienta</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock inicial
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad de medida
                  </label>
                  <select
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="metro">Metro</option>
                    <option value="kilogramo">Kilogramo</option>
                    <option value="litro">Litro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
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
                  {editingHerramienta ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Herramientas;