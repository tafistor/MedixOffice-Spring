import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmationDialog.css';

function ConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirmation-overlay" onClick={handleOverlayClick}>
      <div className="confirmation-dialog">
        <div className="confirmation-header">
          <div className={`confirmation-icon ${type}`}>
            <AlertTriangle className="icon" />
          </div>
          <button className="close-button" onClick={onClose}>
            <X className="icon" />
          </button>
        </div>
        
        <div className="confirmation-content">
          <h3 className="confirmation-title">{title}</h3>
          <p className="confirmation-message">{message}</p>
        </div>
        
        <div className="confirmation-actions">
          <button 
            className="cancel-button" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-button ${type}`} 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;