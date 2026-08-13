import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { maladiesChroniques } from '../../data/chronicDiseasesList';
import { traitementsCourants } from '../../data/currentTreatmentsList';
import { listeAllergies } from '../../data/allergiesList';
import './AddEditPatient.css';

function AddEditPatient({ isOpen, onClose, onSubmit, patient = null }) {
  const initialFormState = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    chronicDiseases: '',
    currentTreatments: '',
    allergies: '',
    phone: '',
    email: '',
    address: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setFieldErrors({});
    } else if (patient) {
      setFormData({
        firstName: patient.User?.firstName || '',
        lastName: patient.User?.lastName || '',
        dateOfBirth: patient.dateOfBirth || '',
        chronicDiseases: patient.chronicDiseases || '',
        currentTreatments: patient.currentTreatments || '',
        allergies: patient.allergies || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || ''
      });
      setFieldErrors({});
    } else {
      setFormData(initialFormState);
      setFieldErrors({});
    }
  }, [isOpen, patient]);

  const handleDateKeyDown = (e) => {
    e.preventDefault();
  };

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
    
    // Address
    if (fieldName === 'address') {
      if (!value.trim()) {
        setFieldErrors(prev => ({ ...prev, address: 'Address is required' }));
        return;
      }
    }
    
    // Date
    if (fieldName === 'dateOfBirth') {
      if (!value) {
        setFieldErrors(prev => ({ ...prev, dateOfBirth: 'Date of birth is required' }));
        return;
      }
      if (new Date(value) > new Date()) {
        setFieldErrors(prev => ({ ...prev, dateOfBirth: 'Date of birth cannot be in the future' }));
        return;
      }
    }
    
    // Optional text fields
    if (['chronicDiseases', 'currentTreatments', 'allergies'].includes(fieldName)) {
      if (value && !/^[a-zA-ZÀ-ÿ',\s-]*$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, [fieldName]: 'Only letters, spaces, apostrophes, hyphens, and commas are allowed' }));
        return;
      }
    }
    
    // Clear error
    setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleChange = (e) => {
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
    
    // Block invalid input for text fields
    if (['chronicDiseases', 'currentTreatments', 'allergies'].includes(name)) {
      if (value.startsWith(' ') || value.includes('  ') || 
          value.includes("''") || value.includes('--') || 
          (value && !/^[a-zA-ZÀ-ÿ',\s-]*$/.test(value))) {
        return;
      }
    }

    // Block multiple spaces for address
    if (name === 'address') {
      if (value.startsWith(' ') || value.includes('  ')) {
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
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
    
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({ ...prev, [name]: newValue }));
    e.target.value = '';
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'phone', 'email', 'address'];
    const hasRequiredFields = requiredFields.every(field => formData[field].trim() !== '');
    const hasNoErrors = Object.values(fieldErrors).every(error => !error);
    return hasRequiredFields && hasNoErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      validateField(formData[field], field);
    });
    if (!isFormValid()) {
      return; 
    }
    
    if (isFormValid()) {
      onSubmit(formData);
      onClose();
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <h2>{patient ? 'Edit Patient' : 'Add Patient'}</h2>
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
                onChange={handleChange}
                onBlur={handleBlur}
                readOnly={patient !== null}
                required
                className={fieldErrors.firstName ? 'error' : ''}
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
                onChange={handleChange}
                onBlur={handleBlur}
                readOnly={patient !== null}
                required
                className={fieldErrors.lastName ? 'error' : ''}
              />
              {fieldErrors.lastName && <p className="error-text">{fieldErrors.lastName}</p>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth *</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleDateKeyDown}
              max={today}
              required
              className={fieldErrors.dateOfBirth ? 'error' : ''}
            />
            {fieldErrors.dateOfBirth && <p className="error-text">{fieldErrors.dateOfBirth}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              readOnly={patient !== null}
              className={`${patient ? 'readonly' : ''} ${fieldErrors.email ? 'error' : ''}`}
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
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter numbers only, e.g. +32471234567"
              pattern="^\+?[0-9]{8,15}$"
              maxLength="15"
              required
              className={fieldErrors.phone ? 'error' : ''}
            />
            {fieldErrors.phone && <p className="error-text">{fieldErrors.phone}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              rows="3"
              className={fieldErrors.address ? 'error' : ''}
            />
            {fieldErrors.address && <p className="error-text">{fieldErrors.address}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="chronicDiseases">Chronic Diseases</label>
            <div className="input-with-select">
              <textarea
                id="chronicDiseases"
                name="chronicDiseases"
                value={formData.chronicDiseases}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="2"
                placeholder="Type or select chronic diseases"
                className={fieldErrors.chronicDiseases ? 'error' : ''}
              />
              <select
                onChange={handleSelectChange}
                name="chronicDiseases"
                className="suggestion-select"
              >
                <option value="">Select a disease</option>
                {maladiesChroniques.map((disease, index) => (
                  <option key={index} value={disease}>{disease}</option>
                ))}
              </select>
            </div>
            {fieldErrors.chronicDiseases && <p className="error-text">{fieldErrors.chronicDiseases}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="currentTreatments">Current Treatment</label>
            <div className="input-with-select">
              <textarea
                id="currentTreatments"
                name="currentTreatments"
                value={formData.currentTreatments}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="2"
                placeholder="Type or select treatments"
                className={fieldErrors.currentTreatments ? 'error' : ''}
              />
              <select
                onChange={handleSelectChange}
                name="currentTreatments"
                className="suggestion-select"
              >
                <option value="">Select a treatment</option>
                {traitementsCourants.map((treatment, index) => (
                  <option key={index} value={treatment}>{treatment}</option>
                ))}
              </select>
            </div>
            {fieldErrors.currentTreatments && <p className="error-text">{fieldErrors.currentTreatments}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="allergies">Allergies</label>
            <div className="input-with-select">
              <textarea
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="2"
                placeholder="Type or select allergies"
                className={fieldErrors.allergies ? 'error' : ''}
              />
              <select
                onChange={handleSelectChange}
                name="allergies"
                className="suggestion-select"
              >
                <option value="">Select an allergy</option>
                {listeAllergies.map((allergy, index) => (
                  <option key={index} value={allergy}>{allergy}</option>
                ))}
              </select>
            </div>
            {fieldErrors.allergies && <p className="error-text">{fieldErrors.allergies}</p>}
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
              {patient ? 'Save Changes' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditPatient;