import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doctors, patients } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Phone, MapPin, FileCheck, Stethoscope, Mail, HeartPulse } from 'lucide-react';
import { maladiesChroniques } from '../../data/chronicDiseasesList';
import { traitementsCourants } from '../../data/currentTreatmentsList';
import { listeAllergies } from '../../data/allergiesList';
import { specialisations } from '../../data/specializationsList';
import './CompleteProfile.css';

function CompleteProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    phone: '',
    email: user?.email || '',
    dateOfBirth: '',
    chronicDiseases: '',
    currentTreatments: '',
    allergies: '',
    address: '',
    specialization: '',
    licenseNumber: '',
  });
  
  const [fieldErrors, setFieldErrors] = useState({});

  const handleDateKeyDown = (e) => {
    // Prevent typing in date field, only allow date picker
    e.preventDefault();
  };

  const validateTextOnlyField = (value, fieldName) => {
    // Check for multiple spaces
    if (value.includes('  ')) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: 'Multiple spaces are not allowed'
      }));
      return;
    }
    
    // Check for valid characters
    const validPattern = fieldName === 'specialization' 
      ? /^[a-zA-ZÀ-ÿ\s]*$/
      : /^[a-zA-ZÀ-ÿ',\s-]*$/;
    
    if (value && !validPattern.test(value)) {
      const errorMessage = fieldName === 'specialization' 
        ? 'Only letters and single spaces are allowed'
        : 'Only letters, single spaces, apostrophes, hyphens, and commas are allowed';
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: errorMessage
      }));
      return;
    }
    
    // Clear error if validation passes
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
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
    
    // For text fields, only check for multiple spaces and invalid characters during typing
    if (['chronicDiseases', 'currentTreatments', 'allergies', 'specialization'].includes(name)) {
      // Block multiple spaces during typing
      if (value.includes('  ')) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'Multiple spaces are not allowed'
        }));
        return;
      }
      
      // Check for invalid characters
      const validPattern = name === 'specialization' 
        ? /^[a-zA-ZÀ-ÿ\s]*$/
        : /^[a-zA-ZÀ-ÿ',\s-]*$/;
      
      if (value && !validPattern.test(value)) {
        const errorMessage = name === 'specialization' 
          ? 'Only letters and single spaces are allowed'
          : 'Only letters, single spaces, apostrophes, hyphens, and commas are allowed';
        setFieldErrors(prev => ({
          ...prev,
          [name]: errorMessage
        }));
        return;
      }
      
    // For text fields, prevent spaces at start and multiple spaces
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
      // Block spaces at the beginning
      if (value.startsWith(' ')) {
        return;
      }
      
      // Block multiple spaces
      if (value.includes('  ')) {
        return;
      }
      
      // Block multiple apostrophes or hyphens
      if (value.includes("''") || value.includes('--')) {
        return;
      }
      
      // Check for valid characters
      const validPattern2 = name === 'specialization' 
        ? /^[a-zA-ZÀ-ÿ\s]*$/
        : /^[a-zA-ZÀ-ÿ',\s-]*$/;
      
      if (value && !validPattern2.test(value)) {
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
    
    if (['chronicDiseases', 'currentTreatments', 'allergies', 'specialization'].includes(name)) {
      validateTextOnlyField(value, name);
    }
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
    
    // Clear any existing error for this field when selecting from dropdown
    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    e.target.value = '';
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const hasRequiredFields = formData.phone && formData.email;
    
    if (user?.role === 'doctor') {
      return hasRequiredFields && formData.specialization && formData.licenseNumber;
    } else {
      return hasRequiredFields && formData.dateOfBirth && formData.address;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Sécurité côté JS : bloquer si invalide
    if (!isFormValid()) {
      return;
    }
  
    setError(''); // On vide l'erreur si le formulaire est valide
  
    const dataToSend = {
      userId: user.id,
      phone: formData.phone,
      email: formData.email,
      ...(user.role === 'doctor' ? {
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
      } : {
        dateOfBirth: formData.dateOfBirth,
        chronicDiseases: formData.chronicDiseases,
        currentTreatments: formData.currentTreatments,
        allergies: formData.allergies,
        address: formData.address,
      }),
    };
  
    try {
      const response = user.role === 'doctor'
        ? await doctors.completeProfile(dataToSend)
        : await patients.completeProfile(dataToSend);
  
      if (response.data) {
        updateUser({ ...user, profileCompleted: true });
        navigate('/dashboard');
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    }
  };
  

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="complete-profile-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-form-container"
      >
        <h2 className="profile-title">
          Complete your {user?.role === 'doctor' ? 'Doctor' : 'Patient'} Profile
        </h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label className="input-label">
              <Phone className="input-icon" />
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter numbers only, e.g. +32471234567"
              pattern="^\+?[0-9]{8,15}$"
              maxLength="15"
              required
            />
          </div>

          <div className="form-group">
            <label className="input-label">
              <Mail className="input-icon" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
              readOnly
            />
          </div>

          {user?.role === 'patient' && (
            <>
              <div className="form-group">
                <label className="input-label">
                  <Calendar className="input-icon" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  onKeyDown={handleDateKeyDown}
                  className="input-field"
                  max={today}
                  required
                />
              </div>

              <div className="form-group">
                <label className="input-label">
                  <HeartPulse className="input-icon" />
                  Chronic Diseases (optional)
                </label>
                <div className="input-with-select">
                  <textarea
                    name="chronicDiseases"
                    value={formData.chronicDiseases}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="input-field textarea"
                    placeholder="Type or select chronic diseases"
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
                {fieldErrors.chronicDiseases && (
                  <p className="error-text">{fieldErrors.chronicDiseases}</p>
                )}
              </div>

              <div className="form-group">
                <label className="input-label">
                  <FileCheck className="input-icon" />
                  Current Treatments (optional)
                </label>
                <div className="input-with-select">
                  <textarea
                    name="currentTreatments"
                    value={formData.currentTreatments}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="input-field textarea"
                    placeholder="Type or select treatments"
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
                {fieldErrors.currentTreatments && (
                  <p className="error-text">{fieldErrors.currentTreatments}</p>
                )}
              </div>

              <div className="form-group">
                <label className="input-label">
                  <FileCheck className="input-icon" />
                  Allergies
                </label>
                <div className="input-with-select">
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="input-field textarea"
                    placeholder="Type or select allergies"
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
                {fieldErrors.allergies && (
                  <p className="error-text">{fieldErrors.allergies}</p>
                )}
              </div>

              <div className="form-group">
                <label className="input-label">
                  <MapPin className="input-icon" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field textarea"
                  required
                />
              </div>
            </>
          )}

          {user?.role === 'doctor' && (
            <>
              <div className="form-group">
                <label className="input-label">
                  <Stethoscope className="input-icon" />
                  Specialization
                </label>
                <div className="input-with-select">
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="input-field"
                    placeholder="Type or select specialization"
                    required
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
                </div>
                {fieldErrors.specialization && (
                  <p className="error-text">{fieldErrors.specialization}</p>
                )}
              </div>

              <div className="form-group">
                <label className="input-label">
                  <FileCheck className="input-icon" />
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={!isFormValid()}
            style={{ 
              opacity: isFormValid() ? 1 : 0.5,
              cursor: isFormValid() ? 'pointer' : 'not-allowed'
            }}
          >
            Complete Profile
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default CompleteProfile;