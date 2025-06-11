import React, { useState, useContext } from 'react';
import { DataContext } from '../../context/DataContext';
import { showAlert } from '../../utils/sweetAlert';

const RegistroForm = ({ userType, onRegisterSuccess, onCancel }) => {
  const [registerData, setRegisterData] = useState({});
  const { addItem, getNextId } = useContext(DataContext);

  const handleRegisterInputChange = (field, value) => {
    setRegisterData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const requiredFields = userType === 'tecnico' 
      ? ['nombre', 'apellido', 'especialidad', 'dni', 'telefono', 'email', 'experiencia', 'usuario', 'password']
      : userType === 'cliente' && registerData.tipo === 'empresa'
      ? ['tipo', 'razonSocial', 'ruc', 'sector', 'email', 'telefono', 'direccion', 'ciudad', 'distrito', 'usuario', 'password']
      : ['tipo', 'nombre', 'apellido', 'dni', 'email', 'telefono', 'direccion', 'ciudad', 'distrito', 'usuario', 'password'];

    const missingFields = requiredFields.filter(field => !registerData[field]);
    
    if (missingFields.length > 0) {
      showAlert(`Por favor complete los siguientes campos: ${missingFields.join(', ')}`, 'warning');
      return;
    }

    if (userType === 'tecnico') {
      const newTecnico = {
        id: getNextId('tecnicos'),
        ...registerData,
        experiencia: parseInt(registerData.experiencia)
      };
      addItem('tecnicos', newTecnico);
    } else {
      const newCliente = {
        id: getNextId('clientes'),
        ...registerData,
        equipos: []
      };
      addItem('clientes', newCliente);
    }

    showAlert('Usuario registrado exitosamente', 'success');
    onRegisterSuccess(registerData.usuario, registerData.password);
  };

  return (
    <form className="registro-form" onSubmit={handleSubmit}>
      {userType === 'tecnico' ? (
        <>
          {/* Información Personal */}
          <div className="form-section">
            <h4 className="section-title">Información Personal</h4>
            <div className="form-row">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={registerData.nombre || ''}
                  onChange={(e) => handleRegisterInputChange('nombre', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Apellido"
                  value={registerData.apellido || ''}
                  onChange={(e) => handleRegisterInputChange('apellido', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="DNI"
                  value={registerData.dni || ''}
                  onChange={(e) => handleRegisterInputChange('dni', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={registerData.telefono || ''}
                  onChange={(e) => handleRegisterInputChange('telefono', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={registerData.email || ''}
                onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Información Profesional */}
          <div className="form-section">
            <h4 className="section-title">Información Profesional</h4>
            <div className="form-row">
              <div className="input-group">
                <select
                  value={registerData.especialidad || ''}
                  onChange={(e) => handleRegisterInputChange('especialidad', e.target.value)}
                  required
                >
                  <option value="">Seleccionar especialidad</option>
                  <option value="refrigeracion">Refrigeración</option>
                  <option value="congelacion">Congelación</option>
                  <option value="camaras">Cámaras frigoríficas</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Años de experiencia"
                  value={registerData.experiencia || ''}
                  onChange={(e) => handleRegisterInputChange('experiencia', e.target.value)}
                  required
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>

          {/* Credenciales de Acceso */}
          <div className="form-section">
            <h4 className="section-title">Credenciales de Acceso</h4>
            <div className="form-row">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Usuario"
                  value={registerData.usuario || ''}
                  onChange={(e) => handleRegisterInputChange('usuario', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={registerData.password || ''}
                  onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                  required
                  minLength="6"
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Tipo de Cliente */}
          <div className="form-section">
            <h4 className="section-title">Tipo de Cliente</h4>
            <div className="input-group">
              <select
                value={registerData.tipo || ''}
                onChange={(e) => handleRegisterInputChange('tipo', e.target.value)}
                required
              >
                <option value="">Seleccionar tipo de cliente</option>
                <option value="empresa">Empresa</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>

          {/* Información según tipo */}
          {registerData.tipo === 'empresa' ? (
            <div className="form-section">
              <h4 className="section-title">Información de la Empresa</h4>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Razón Social"
                  value={registerData.razonSocial || ''}
                  onChange={(e) => handleRegisterInputChange('razonSocial', e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="RUC"
                    value={registerData.ruc || ''}
                    onChange={(e) => handleRegisterInputChange('ruc', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <select
                    value={registerData.sector || ''}
                    onChange={(e) => handleRegisterInputChange('sector', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar sector</option>
                    <option value="alimentacion">Alimentación</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="salud">Salud</option>
                    <option value="farmaceutico">Farmacéutico</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
              </div>
            </div>
          ) : registerData.tipo === 'personal' ? (
            <div className="form-section">
              <h4 className="section-title">Información Personal</h4>
              <div className="form-row">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={registerData.nombre || ''}
                    onChange={(e) => handleRegisterInputChange('nombre', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={registerData.apellido || ''}
                    onChange={(e) => handleRegisterInputChange('apellido', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="DNI"
                  value={registerData.dni || ''}
                  onChange={(e) => handleRegisterInputChange('dni', e.target.value)}
                  required
                />
              </div>
            </div>
          ) : null}

          {/* Información de Contacto */}
          {registerData.tipo && (
            <div className="form-section">
              <h4 className="section-title">Información de Contacto</h4>
              <div className="form-row">
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerData.email || ''}
                    onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={registerData.telefono || ''}
                    onChange={(e) => handleRegisterInputChange('telefono', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dirección */}
          {registerData.tipo && (
            <div className="form-section">
              <h4 className="section-title">Dirección</h4>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Dirección completa"
                  value={registerData.direccion || ''}
                  onChange={(e) => handleRegisterInputChange('direccion', e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Ciudad"
                    value={registerData.ciudad || ''}
                    onChange={(e) => handleRegisterInputChange('ciudad', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Distrito"
                    value={registerData.distrito || ''}
                    onChange={(e) => handleRegisterInputChange('distrito', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Credenciales de Acceso */}
          {registerData.tipo && (
            <div className="form-section">
              <h4 className="section-title">Credenciales de Acceso</h4>
              <div className="form-row">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={registerData.usuario || ''}
                    onChange={(e) => handleRegisterInputChange('usuario', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={registerData.password || ''}
                    onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                    required
                    minLength="6"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Registrarse
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default RegistroForm;