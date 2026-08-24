import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Upload, Trash } from 'lucide-react';
import './AddEditMedicalRecord.css';
import { patients, consultations } from '../../services/api';

const initialFormState = {
  patientId: '',
  doctorId: '',
  consultationId: '',
  recordType: 'CONSULTATION',
  diagnosis: '',
  treatment: '',
  prescription: '',
  labResults: [],
  attachments: [],
  status: 'Draft',
  isConfidential: false
};

function AddEditMedicalRecord({ isOpen, onClose, onSubmit, record = null, currentDoctor }) {
  const [formData, setFormData] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientError, setPatientError] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [consultationsList, setConsultationsList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [labResultFiles, setLabResultFiles] = useState([]);
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (record) {
        const parsedLabResults = typeof record.labResults === 'string' 
          ? JSON.parse(record.labResults) 
          : record.labResults;
        
        const parsedAttachments = typeof record.attachments === 'string'
          ? JSON.parse(record.attachments)
          : record.attachments;

        setFormData({
          patientId: record.patientId || '',
          doctorId: record.doctorId || currentDoctor?.id || '',
          consultationId: record.consultationId || '',
          recordType: record.recordType || 'CONSULTATION',
          diagnosis: record.diagnosis || '',
          treatment: record.treatment || '',
          prescription: record.prescription || '',
          labResults: Array.isArray(parsedLabResults) ? parsedLabResults : [],
          attachments: Array.isArray(parsedAttachments) ? parsedAttachments : [],
          status: record.status || 'Draft',
          isConfidential: record.isConfidential || false
        });
        
        if (record.Patient?.User) {
          setSearchTerm(`${record.Patient.User.firstName} ${record.Patient.User.lastName}`);
          setSelectedPatient(record.Patient);
          setPatientError('');
        }

        // The dialog stays mounted between opens (isOpen just toggles), so
        // without this, raw File objects picked in a previous session (create,
        // or an earlier edit) would still be sitting in state and get
        // re-uploaded alongside whatever's newly picked this time.
        setLabResultFiles([]);
        setAttachmentFiles([]);
      } else {
        setFormData({
          ...initialFormState,
          doctorId: currentDoctor?.id || ''
        });
        setSearchTerm('');
        setSelectedPatient(null);
        setPatientError('');
        setLabResultFiles([]);
        setAttachmentFiles([]);
      }
    }
  }, [isOpen, record, currentDoctor]);

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.patientId) {
      fetchConsultations(formData.patientId);
    }
  }, [formData.patientId]);

  const fetchPatients = async () => {
    try {
      const response = await patients.getAll();
      setPatientsList(response.data);
    } catch (error) {
      //Error fetching patients
    }
  };

  const fetchConsultations = async (patientId) => {
    try {
      const response = await consultations.getForPatient(patientId);
      setConsultationsList(response.data);
    } catch (error) {
      //Error fetching consultations
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePatientSearch = (e) => {
    if (!record) {
      const value = e.target.value;
      
      // Block invalid input in real-time (same as currentTreatments validation)
      if (value.startsWith(' ') || value.includes('  ') || 
          value.includes("''") || value.includes('--') || 
          (value && !/^[a-zA-ZÀ-ÿ\s'-]*$/.test(value))) {
        setPatientError('Only letters, spaces, apostrophes, and hyphens are allowed');
        return;
      }
      
      setPatientError('');
      setSearchTerm(value);
      setShowPatientSearch(true);
    }
  };

  const handlePatientSelect = (patient) => {
    if (!record) {
      setFormData(prev => ({
        ...prev,
        patientId: patient.id
      }));
      setSelectedPatient(patient);
      setSearchTerm(`${patient.User.firstName} ${patient.User.lastName}`);
      setShowPatientSearch(false);
      setPatientError('');
    }
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    
    if (type === 'labResults') {
      setLabResultFiles(prev => [...prev, ...files]);
      // Ajouter les noms des fichiers pour l'affichage
      const fileNames = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      setFormData(prev => ({
        ...prev,
        labResults: [...(prev.labResults || []), ...fileNames]
      }));
    } else if (type === 'attachments') {
      setAttachmentFiles(prev => [...prev, ...files]);
      // Ajouter les noms des fichiers pour l'affichage
      const fileNames = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...fileNames]
      }));
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleRemoveFile = (type, index) => {
    if (type === 'labResults') {
      setLabResultFiles(prev => prev.filter((_, i) => i !== index));
      setFormData(prev => ({
        ...prev,
        labResults: (prev.labResults || []).filter((_, i) => i !== index)
      }));
    } else if (type === 'attachments') {
      setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
      setFormData(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter((_, i) => i !== index)
      }));
    }
  };

  const isFormValid = () => {
    return formData.patientId !== '' &&
           formData.consultationId !== '' &&
           formData.recordType !== '' &&
           formData.status !== '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Créer FormData pour l'envoi des fichiers
    const submitData = {
      ...formData,
      labResultFiles: labResultFiles,
      attachmentFiles: attachmentFiles
    };
    
    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setSearchTerm('');
    setPatientError('');
    setSelectedPatient(null);
    setShowPatientSearch(false);
    setLabResultFiles([]);
    setAttachmentFiles([]);
    onClose();
  };

  const filteredPatients = patientsList.filter(patient =>
    `${patient.User?.firstName} ${patient.User?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <h2>{record ? 'Edit Medical Record' : 'New Medical Record'}</h2>
          <button className="close-btn" onClick={handleClose}>
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
                onChange={handlePatientSearch}
                placeholder="Search patient..."
                autoComplete="off"
                disabled={!!record}
                className={record ? 'disabled' : ''}
              />
              {patientError && <p className="error-text">{patientError}</p>}
            </div>
            {showPatientSearch && searchTerm && !record && (
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
                    <div className="patient-email">{patient.User?.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="consultation">Consultation</label>
              <select
                id="consultation"
                name="consultationId"
                value={formData.consultationId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Consultation</option>
                {consultationsList.map(consultation => (
                  <option key={consultation.id} value={consultation.id}>
                    {new Date(consultation.date).toLocaleDateString()} - {consultation.type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="recordType">Record Type</label>
              <select
                id="recordType"
                name="recordType"
                value={formData.recordType}
                onChange={handleInputChange}
                required
              >
                <option value="CONSULTATION">Consultation</option>
                <option value="LAB_RESULT">Lab Result</option>
                <option value="PRESCRIPTION">Prescription</option>
                <option value="SURGERY">Surgery</option>
                <option value="VACCINATION">Vaccination</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="Draft">Draft</option>
                <option value="Complete">Complete</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="diagnosis">Diagnosis</label>
            <textarea
              id="diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter diagnosis details..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="treatment">Treatment</label>
            <textarea
              id="treatment"
              name="treatment"
              value={formData.treatment}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter treatment details..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="prescription">Prescription</label>
            <textarea
              id="prescription"
              name="prescription"
              value={formData.prescription}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter medication details, dosage, and instructions..."
            />
          </div>

          <div className="form-section">
            <h3>Lab Results</h3>
            <div className="file-upload">
              <input
                type="file"
                id="labResults"
                onChange={(e) => handleFileUpload(e, 'labResults')}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                className="hidden-input"
              />
              <label htmlFor="labResults" className="upload-button">
                <Upload className="w-4 h-4" />
                Upload Lab Results
              </label>
              <div className="file-list">
                {(formData.labResults || []).map((file, index) => (
                  <div key={index} className="file-item">
                    <FileText className="w-4 h-4" />
                    <div className="file-info">
                      <span className="file-name">{file.name || file.filename}</span>
                      {file.size && (
                        <span className="file-size">({formatFileSize(file.size)})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('labResults', index)}
                      className="remove-file"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Attachments</h3>
            <div className="file-upload">
              <input
                type="file"
                id="attachments"
                onChange={(e) => handleFileUpload(e, 'attachments')}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                className="hidden-input"
              />
              <label htmlFor="attachments" className="upload-button">
                <Upload className="w-4 h-4" />
                Upload Attachments
              </label>
              <div className="file-list">
                {(formData.attachments || []).map((file, index) => (
                  <div key={index} className="file-item">
                    <FileText className="w-4 h-4" />
                    <div className="file-info">
                      <span className="file-name">{file.name || file.filename}</span>
                      {file.size && (
                        <span className="file-size">({formatFileSize(file.size)})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('attachments', index)}
                      className="remove-file"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isConfidential"
                checked={formData.isConfidential}
                onChange={handleInputChange}
              />
              Mark as Confidential
            </label>
          </div>

          <div className="dialog-actions">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={!isFormValid()}
              style={{ opacity: isFormValid() ? 1 : 0.5, cursor: isFormValid() ? 'pointer' : 'not-allowed' }}
            >
              {record ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditMedicalRecord;