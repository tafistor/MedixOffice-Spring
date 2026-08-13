import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { specialisations } from '../../data/specializationsList';
import './AddEditDoctor.css';

const initialFormState = {
  firstName: '',
  lastName: '',
  specialization: '',
  licenseNumber: '',
  email: '',
  phone: ''
};

function AddEditDoctor({ isOpen, onClose, onSubmit, doctor }) { 
  const [formData, setFormData] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setFieldErrors({});
    } else if (doctor) {
      setFormData({
        firstName: doctor.User.firstName,
        lastName: doctor.User.lastName,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        email: doctor.email,
        phone: doctor.phone
      });
      setFieldErrors({});
    } else {
      setFormData(initialFormState);
      setFieldErrors({});
    }
  }, [doctor, isOpen]);

  const validateField = (value, fieldName) => {
    // First Name et Last Name
    if (fieldName === 'firstName' || fieldName === 'lastName') {
      if (!value.trim()) {
        setFieldErrors(prev => ({ ...prev, [fieldName]: `${fieldName} is required` }));
        return;
      }
      if (value.length < 3) {
        setFieldErrors(prev => ({ ...prev, [fieldName]: `${fieldName} must be at least 3 characters` }));
        return;
      }
      if (/\d/.test(value)) {
        setFieldErrors(prev => ({ ...prev, [fieldName]: `${fieldName} cannot contain numbers` }));
        return;
      }
      if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, [fieldName]: 'Only letters, spaces, apostrophes, and hyphens are allowed' }));
        return;
      }
    }
    
    // Email
    if (fieldName === 'email') {
      if (!value.trim()) {
        setFieldErrors(prev => ({ ...prev, email: 'Email is required' }));
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        return;
      }
    }
    
    // Phone
    if (fieldName === 'phone') {
      if (!value.trim()) {
        setFieldErrors(prev => ({ ...prev, phone: 'Phone is required' }));
        return;
      }
      if (value.length < 8 || value.length > 15) {
        setFieldErrors(prev => ({ ...prev, phone: 'Phone must be between 8 and 15 digits' }));
        return;
      }
    }
    
    // License Number
    if (fieldName === 'licenseNumber') {
      if (!value.trim()) {
        setFieldErrors(prev => ({ ...prev, licenseNumber: 'License number is required' }));
        return;
      }
    }
    
    // Specialization
    if (fieldName === 'specialization') {
      if (!value.trim()) {
        setFieldErrors(prev => ({ ...prev, specialization: 'Specialization is required' }));
        return;
      }
      if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, specialization: 'Only letters, spaces, apostrophes, and hyphens are allowed' }));
        return;
      }
    }
    
    // Clear error
    setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    if (name === 'phone') {
      let cleaned = value.replace(/[^0-9+]/g, '');
  
      // S'assurer que le "+" est uniquement au début
      if (cleaned.includes('+')) {
        // Supprimer tous les "+" sauf le premier
        cleaned = '+' + cleaned.replace(/\+/g, '').replace(/^/, '');
      }
  
      setFormData(prev => ({
        ...prev,
        [name]: cleaned
      }));
      return;
    }

    // Block invalid input for names
    if (name === 'firstName' || name === 'lastName') {
      if (value.startsWith(' ') || value.includes('  ') || /\d/.test(value) || 
          value.includes("''") || value.includes('--') || 
          (value && !/^[a-zA-ZÀ-ÿ\s'-]*$/.test(value))) {
        return;
      }
    }

    // Block invalid input for specialization
    if (name === 'specialization') {
      if (value.startsWith(' ') || value.includes('  ') || 
          value.includes("''") || value.includes('--') || 
          (value && !/^[a-zA-ZÀ-ÿ\s'-]*$/.test(value))) {
        return;
      }
    }
  
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(value, name);
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    if (!value) return;

    const currentValues = formData[name] ? formData[name].split(', ') : [];
    
    if (currentValues.includes(value)) {
      e.target.value = '';
      return;
    }
    
    const newValue = currentValues.length > 0 ? `${formData[name]}, ${value}` : value;
    
    // Clear error when selecting from dropdown
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    e.target.value = '';
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'specialization', 'licenseNumber', 'email', 'phone'];
    const hasRequiredFields = requiredFields.every(field => formData[field].trim() !== '');
    const hasNoErrors = Object.values(fieldErrors).every(error => !error);
    return hasRequiredFields && hasNoErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Forcer validation de tous les champs avant envoi
    Object.keys(formData).forEach(field => {
      validateField(formData[field], field);
    });
  
    if (!isFormValid()) {
      return; 
    }
  
    await onSubmit(formData);
    setFormData(initialFormState);
    onClose();
  };
  

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <h2>{doctor ? 'Edit Doctor' : 'Add New Doctor'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className={`input-field ${fieldErrors.firstName ? 'error' : ''}`}
                readOnly={doctor !== null}
              />
              {fieldErrors.firstName && <p className="error-text">{fieldErrors.firstName}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className={`input-field ${fieldErrors.lastName ? 'error' : ''}`}
                readOnly={doctor !== null}
              />
              {fieldErrors.lastName && <p className="error-text">{fieldErrors.lastName}</p>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="specialization">Specialization *</label>
            <input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              className={`input-field ${fieldErrors.specialization ? 'error' : ''}`}
              placeholder="Type or select specialization"
            />
            <select
              onChange={handleSelectChange}
              name="specialization"
              className="suggestion-select"
            >
              <option value="">Select a specialization</option>
              {specialisations.map((specialization, index) => (
                <option key={index} value={specialization}>{specialization}</option>
              ))}
            </select>
            {fieldErrors.specialization && <p className="error-text">{fieldErrors.specialization}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="licenseNumber">License Number *</label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              className={`input-field ${fieldErrors.licenseNumber ? 'error' : ''}`}
              readOnly={doctor !== null}
              disabled={doctor !== null}
            />
            {fieldErrors.licenseNumber && <p className="error-text">{fieldErrors.licenseNumber}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              className={`input-field ${fieldErrors.email ? 'error' : ''}`}
              readOnly={doctor !== null}
              disabled={doctor !== null}
            />
            {fieldErrors.email && <p className="error-text">{fieldErrors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter numbers only, e.g. +32471234567"
              pattern="^\+?[0-9]{8,15}$"
              maxLength="15"
              required
              className={`input-field ${fieldErrors.phone ? 'error' : ''}`}
            />
            {fieldErrors.phone && <p className="error-text">{fieldErrors.phone}</p>}
          </div>

          <div className="dialog-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={`submit-btn ${!isFormValid() ? 'disabled' : ''}`}
              disabled={!isFormValid()}
              style={{ 
                opacity: isFormValid() ? 1 : 0.5, 
                cursor: isFormValid() ? 'pointer' : 'not-allowed' 
              }}
            >
              {doctor ? 'Save Changes' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditDoctor;