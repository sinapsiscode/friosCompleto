import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import repuestoFormularioService from '../../services/repuestoFormulario.service';
import { showConfirm, showAlert } from '../../utils/sweetAlert';

const RepuestosFormulario = () => {
  const { useBackend } = useContext(AuthContext);
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    disponible: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (useBackend) {
      loadRepuestos();
    }
  }, [useBackend, pagination.page, searchTerm]);

  const loadRepuestos = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm
      };
      
      const response = await repuestoFormularioService.getAll(params);
      setRepuestos(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error al cargar repuestos:', error);
      showAlert('Error al cargar repuestos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      showAlert('El nombre del repuesto es obligatorio', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      if (editingRepuesto) {
        await repuestoFormularioService.update(editingRepuesto.id, formData);
        showAlert('Repuesto actualizado exitosamente', 'success');
      } else {
        await repuestoFormularioService.create(formData);
        showAlert('Repuesto creado exitosamente', 'success');
      }
      
      handleCloseModal();
      loadRepuestos();
    } catch (error) {
      console.error('Error al guardar repuesto:', error);
      showAlert('Error al guardar repuesto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (repuesto) => {
    setEditingRepuesto(repuesto);
    setFormData({
      nombre: repuesto.nombre,
      descripcion: repuesto.descripcion || '',
      disponible: repuesto.disponible
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
      try {
        setLoading(true);
        await repuestoFormularioService.delete(id);
        showAlert('Repuesto eliminado exitosamente', 'success');
        loadRepuestos();
      } catch (error) {
        console.error('Error al eliminar repuesto:', error);
        showAlert('Error al eliminar repuesto', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRepuesto(null);
    setFormData({
      nombre: '',
      descripcion: '',
      disponible: true
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (!useBackend) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-database text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Backend requerido</h2>
          <p className="text-gray-500">Esta funcionalidad requiere conexión al backend</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
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
          disabled={loading}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <i className="fas fa-plus"></i>
          <span>Nuevo Repuesto</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar repuestos..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div className="text-sm text-gray-600">
            {pagination.total} repuesto{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Cargando repuestos...
                  </td>
                </tr>
              ) : repuestos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No hay repuestos registrados
                  </td>
                </tr>
              ) : (
                repuestos.map(repuesto => (
                  <tr key={repuesto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{repuesto.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700 max-w-xs truncate">
                        {repuesto.descripcion || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        repuesto.disponible 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {repuesto.disponible ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(repuesto.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(repuesto)}
                          className="text-primary hover:text-primary-dark p-2 rounded-lg hover:bg-gray-100"
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(repuesto.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-gray-100"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {pagination.page} de {pagination.pages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRepuesto ? 'Editar Repuesto' : 'Nuevo Repuesto'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del repuesto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Filtro de aire"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  placeholder="Descripción detallada del repuesto..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="disponible"
                  checked={formData.disponible}
                  onChange={(e) => setFormData({...formData, disponible: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="disponible" className="text-sm text-gray-700">
                  Disponible para usar en servicios
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepuestosFormulario;