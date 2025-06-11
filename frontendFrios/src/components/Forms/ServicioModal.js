import React, { useState } from 'react';
import Modal from '../Common/Modal';
import ServicioForm from './ServicioForm';

const ServicioModal = ({ isOpen, onClose, servicio }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  const customHeader = (
    <div className="form-tabs">
      <div 
        className={`tab ${activeTab === 0 ? 'active' : ''}`}
        onClick={() => setActiveTab(0)}
      >
        Información General
      </div>
      {servicio && (
        <div 
          className={`tab ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => setActiveTab(1)}
        >
          Detalles del Servicio
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      customHeader={customHeader}
      size="large"
    >
      <ServicioForm 
        servicio={servicio}
        onClose={onClose}
        activeTab={activeTab}
      />
    </Modal>
  );
};

export default ServicioModal;