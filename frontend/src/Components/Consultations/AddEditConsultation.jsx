import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { patients, doctors } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AddEditConsultation.css';

function AddEditConsultation({ isOpen, onClose, onSubmit, consultation = null }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
      patientId: '',
      doctorId: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      type: 'Regular Check-up',
      status: 'Scheduled',
      notes: '',
      vitals: {
        bloodPressure: null,
        temperature: null,
        heartRate: null
      }
    });
  
  const [patientsList, setPatientsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleDateKeyDown = (e) => {
    // Prevent typing in date field, only allow date picker
    e.preventDefault();
  };

  // Fonction de validation réutilisable pour les champs texte
  const validateTextOnlyField = (value, fieldName) => {
    // Check for multiple spaces
    if (value.includes('  ')) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: 'Multiple spaces are not allowed'
      }));
      return false;
    }
    
    // Check for valid characters (letters, single spaces, apostrophes, hyphens)
    const validPattern = /^[a-zA-ZÀ-ÿ',\s-]*$/;
    
    if (value && !validPattern.test(value)) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: 'Only letters, single spaces, apostrophes, and hyphens are allowed'
      }));
      return false;
    }
    
    // Clear error if validation passes
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
    return true;
  };

  // Fonction pour gérer les changements de texte avec validation
  const handleTextChange = (value, setter, fieldName) => {
    // Block spaces at the beginning
    if (value.startsWith(' ')) {
      return;
    }
    
    // Block multiple spaces
    if (value.includes('  ')) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: 'Multiple spaces are not allowed'
      }));
      return;
    }
    
    // Block multiple apostrophes or hyphens
    if (value.includes("''") || value.includes('--')) {
      return;
    }
    
    // Check for valid characters
    const validPattern = /^[a-zA-ZÀ-ÿ',\s-]*$/;
    
    if (value && !validPattern.test(value)) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: 'Only letters, single spaces, apostrophes, and hyphens are allowed'
      }));
      return;
    }
    
    // Clear error if validation passes
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
    
    setter(value);
  };

  // Validation pour les signes vitaux
  const validateVitalField = (value, fieldName) => {
    if (!value) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
      return true;
    }

    let pattern;
    let errorMessage;

    if (fieldName === 'vitals.bloodPressure') {
      // Pattern pour pression artérielle: nombre/nombre (ex: 120/80)
      pattern = /^\d+\/\d+$/;
      errorMessage = 'Format: number/number (e.g., 120/80)';
    } else if (fieldName === 'vitals.temperature') {
      // Pattern pour température: nombre.nombre (ex: 37.5)
      pattern = /^\d+\.\d+$/;
      errorMessage = 'Format: number.number (e.g., 37.5)';
    } else if (fieldName === 'vitals.heartRate') {
      // Pattern pour rythme cardiaque: seulement des nombres
      pattern = /^\d+$/;
      errorMessage = 'Only numbers allowed (e.g., 72)';
    }

    if (!pattern.test(value)) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: errorMessage
      }));
      return false;
    }

    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
    return true;
  };

  const handleVitalChange = (value, fieldName) => {
    if (fieldName === 'vitals.bloodPressure') {
      // Permettre seulement chiffres et un seul "/"
      const slashCount = (value.match(/\//g) || []).length;
      if (slashCount > 1) return;
      if (!/^[\d\/]*$/.test(value)) return;
    } else if (fieldName === 'vitals.temperature') {
      // Permettre seulement chiffres et un seul "."
      const dotCount = (value.match(/\./g) || []).length;
      if (dotCount > 1) return;
      if (!/^[\d\.]*$/.test(value)) return;
    } else if (fieldName === 'vitals.heartRate') {
      // Permettre seulement des chiffres
      if (!/^\d*$/.test(value)) return;
    }

    const vitalName = fieldName.split('.')[1];
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [vitalName]: value || null
      }
    }));
  };
  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      fetchDoctorId();
      if (consultation) {
        let parsedVitals = consultation.vitals;
        if (typeof consultation.vitals === 'string') {
          parsedVitals = JSON.parse(consultation.vitals);
        }
        setFormData({
          patientId: consultation.patientId,
          doctorId: consultation.doctorId,
          date: consultation.date,
          time: consultation.time,
          type: consultation.type,
          status: consultation.status,
          notes: consultation.notes || '',
          vitals: {
            bloodPressure: parsedVitals?.bloodPressure || '',
            temperature: parsedVitals?.temperature || '',
            heartRate: parsedVitals?.heartRate || ''
          }
        });

        if (consultation.Patient?.User) {
          setSearchTerm(`${consultation.Patient.User.firstName} ${consultation.Patient.User.lastName}`);
        }
      } else {
        setFormData({
          patientId: '',
          doctorId: '',
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          type: 'Regular Check-up',
          status: 'Scheduled',
          notes: '',
          vitals: {
            bloodPressure: '',
            temperature: '',
            heartRate: ''
          }
        });
        setSearchTerm('');
      }
    }
    
    // Reset field errors when modal opens
    setFieldErrors({});
  }, [isOpen, consultation]);
  const fetchDoctorId = async () => {
    const response = await doctors.getDoctorByUserId(user.id);
    setFormData(prev => ({
      ...prev,
      doctorId: response.data.id
    }));
  };

  const fetchPatients = async () => {
    const response = await patients.getAll();
    setPatientsList(response.data);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('vitals.')) {
      handleVitalChange(value, name);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePatientFocus = () => {
    if (!consultation) {
      setShowPatientSearch(true);
    }
  };

  const handleSearchTermChange = (e) => {
    handleTextChange(e.target.value, setSearchTerm, 'searchTerm');
    setShowPatientSearch(true);
  };

  const handleSearchTermBlur = (e) => {
    validateTextOnlyField(e.target.value, 'searchTerm');
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient.id
    }));
    setShowPatientSearch(false);
    setSearchTerm(`${patient.User?.firstName} ${patient.User?.lastName}`);
  };

  const handleVitalBlur = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('vitals.')) {
      validateVitalField(value, name);
    }
  };

  const isFormValid = () => {
    return formData.patientId !== '' &&
           formData.doctorId !== '' &&
           formData.date.trim() !== '' &&
           formData.time.trim() !== '' &&
           formData.type.trim() !== '' &&
           formData.status.trim() !== '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      vitals: {
        bloodPressure: formData.vitals.bloodPressure || null,
        temperature: formData.vitals.temperature || null,
        heartRate: formData.vitals.heartRate || null
      }
    };
    onSubmit(formattedData);
  };

  const filteredPatients = patientsList.filter(patient =>
    `${patient.User?.firstName} ${patient.User?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;
  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <h2>{consultation ? 'Edit Consultation' : 'New Consultation'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group patient-search">
            <label htmlFor="patient">Patient</label>
            <div className="search-input-wrapper">
              <input
                type="text"
                id="patient"
                value={searchTerm}
                onChange={handleSearchTermChange}
                onBlur={handleSearchTermBlur}
                onFocus={handlePatientFocus}
                placeholder={consultation ? '' : 'Click to select patient...'}
                autoComplete="off"
                disabled={!!consultation}
                className={consultation ? 'disabled-input' : ''}
              />
              {fieldErrors.searchTerm && (
                <p className="error-text">{fieldErrors.searchTerm}</p>
              )}
            </div>
            {showPatientSearch && !consultation && (
              <div className="search-results">
                {filteredPatients.map(patient => (
                  <div
                    key={patient.id}
                    className="search-result-item"
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <div className="patient-name">
                      {patient.User?.firstName} {patient.User?.lastName}
                    </div>
                    <div className="patient-email">{patient.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="doctor">Doctor</label>
            <input
              type="text"
              id="doctor"
              value={`Dr. ${user?.firstName} ${user?.lastName}`}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                onKeyDown={handleDateKeyDown}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="Regular Check-up">Regular Check-up</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Specialist Consultation">Specialist Consultation</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Vitals</h3>
            <div className="vitals-grid">
              <div className="form-group">
                <label htmlFor="bloodPressure">Blood Pressure</label>
                <input
                  type="text"
                  id="bloodPressure"
                  name="vitals.bloodPressure"
                  value={formData.vitals.bloodPressure || ''}
                  onChange={handleInputChange}
                  onBlur={handleVitalBlur}
                  placeholder="120/80"
                />
                {fieldErrors['vitals.bloodPressure'] && (
                  <p className="error-text">{fieldErrors['vitals.bloodPressure']}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="temperature">Temperature (°C)</label>
                <input
                  type="text"
                  id="temperature"
                  name="vitals.temperature"
                  value={formData.vitals.temperature || ''}
                  onChange={handleInputChange}
                  onBlur={handleVitalBlur}
                  placeholder="37.0"
                />
                {fieldErrors['vitals.temperature'] && (
                  <p className="error-text">{fieldErrors['vitals.temperature']}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="heartRate">Heart Rate (bpm)</label>
                <input
                  type="text"
                  id="heartRate"
                  name="vitals.heartRate"
                  value={formData.vitals.heartRate || ''}
                  onChange={handleInputChange}
                  onBlur={handleVitalBlur}
                  placeholder="72"
                />
                {fieldErrors['vitals.heartRate'] && (
                  <p className="error-text">{fieldErrors['vitals.heartRate']}</p>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="dialog-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={!isFormValid()}
              style={{ opacity: isFormValid() ? 1 : 0.5, cursor: isFormValid() ? 'pointer' : 'not-allowed' }}
            >
              {consultation ? 'Update Consultation' : 'Create Consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AddEditConsultation;
