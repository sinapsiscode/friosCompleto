import Swal from 'sweetalert2';

// Success alerts
export const showSuccess = (title, text = '') => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#10b981',
    timer: 3000,
    timerProgressBar: true
  });
};

// Error alerts
export const showError = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#ef4444'
  });
};

// Warning alerts
export const showWarning = (title, text = '') => {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: text,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#f59e0b'
  });
};

// Info alerts
export const showInfo = (title, text = '') => {
  return Swal.fire({
    icon: 'info',
    title: title,
    text: text,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#3b82f6'
  });
};

// Confirmation alerts
export const showConfirm = (title, text = '', confirmButtonText = 'Sí', cancelButtonText = 'Cancelar') => {
  return Swal.fire({
    icon: 'question',
    title: title,
    text: text,
    showCancelButton: true,
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280'
  });
};

// Simple alert replacement
export const showAlert = (message, type = 'info') => {
  const config = {
    text: message,
    confirmButtonText: 'Aceptar',
    timer: 3000,
    timerProgressBar: true
  };

  switch (type) {
    case 'success':
      return Swal.fire({
        ...config,
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
    case 'error':
      return Swal.fire({
        ...config,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        timer: null,
        timerProgressBar: false
      });
    case 'warning':
      return Swal.fire({
        ...config,
        icon: 'warning',
        confirmButtonColor: '#f59e0b'
      });
    default:
      return Swal.fire({
        ...config,
        icon: 'info',
        confirmButtonColor: '#3b82f6'
      });
  }
};