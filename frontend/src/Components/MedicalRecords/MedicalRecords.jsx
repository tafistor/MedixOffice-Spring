import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, FileText, Activity, Heart, Thermometer, Edit, Download, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import './MedicalRecords.css';
import AddEditMedicalRecord from './AddEditMedicalRecord';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { medicalRecords, doctors, patients, consultations } from '../../services/api';

function MedicalRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [consultationsData, setConsultationsData] = useState({});
  const navigate = useNavigate();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'doctor') {
        fetchDoctorInfo();
      } else if (user.role === 'patient') {
        fetchPatientInfo();
      }
    }
  }, [user]);

  useEffect(() => {
    if (currentDoctor || currentPatient) {
      fetchRecords();
    }
  }, [currentDoctor, currentPatient]);

  useEffect(() => {
    const fetchConsultationsData = async () => {
      const consultationsMap = {};
      for (const record of records) {
        if (record.consultationId) {
          const response = await consultations.getConsultationById(record.consultationId);
          consultationsMap[record.consultationId] = response.data;
        }
      }
      setConsultationsData(consultationsMap);
    };

    if (records.length > 0) {
      fetchConsultationsData();
    }
  }, [records]);

  const fetchDoctorInfo = async () => {
    const doctorResponse = await doctors.getDoctorByUserId(user.id);
    setCurrentDoctor(doctorResponse.data);
  };

  const fetchPatientInfo = async () => {
    const patientResponse = await patients.getPatientByUserId(user.id);
    setCurrentPatient(patientResponse.data);
  };

  const fetchRecords = async () => {
    const response = await medicalRecords.getAll();
    let filteredRecords = response.data;

    if (user?.role === 'doctor' && currentDoctor) {
      filteredRecords = response.data.filter(
        record => record.doctorId === currentDoctor.id
      );
    } else if (user?.role === 'patient' && currentPatient) {
      filteredRecords = response.data.filter(
        record => record.patientId === currentPatient.id
      );
    }

    setRecords(filteredRecords);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age}`;
  };

  const handlePatientClick = () => {
    navigate('/dashboard');
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'complete':
        return 'status-complete';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  const handleNewRecord = () => {
    setSelectedRecord(null);
    setIsDialogOpen(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setIsDialogOpen(true);
  };

  const handleDeleteRecord = async (id) => {
    setRecordToDelete(id);
    setIsConfirmDialogOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (recordToDelete) {
      await medicalRecords.delete(recordToDelete);
      await fetchRecords();
      setRecordToDelete(null);
    }
  };

  const handleDownloadPDF = async (recordId) => {
    try {
      const response = await medicalRecords.generatePDF(recordId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dossier_medical_${recordId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      //Erreur lors du téléchargement du PDF
    }
  };

  const handleDownloadComplete = async (recordId) => {
    try {
      const response = await medicalRecords.downloadComplete(recordId);
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dossier_complet_${recordId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      //Erreur lors du téléchargement du dossier complet
    }
  };
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedRecord(null);
  };

  const handleDialogSubmit = async (formData) => {
    try {
      // Créer FormData pour l'envoi des fichiers
      const submitFormData = new FormData();
      
      // Ajouter les données du formulaire
      submitFormData.append('patientId', formData.patientId);
      submitFormData.append('doctorId', currentDoctor.id);
      submitFormData.append('consultationId', formData.consultationId);
      submitFormData.append('recordType', formData.recordType);
      submitFormData.append('diagnosis', formData.diagnosis);
      submitFormData.append('treatment', formData.treatment);
      submitFormData.append('prescription', formData.prescription);
      submitFormData.append('status', formData.status);
      submitFormData.append('isConfidential', formData.isConfidential);

      // Ajouter les fichiers lab results
      if (formData.labResultFiles && formData.labResultFiles.length > 0) {
        formData.labResultFiles.forEach(file => {
          submitFormData.append('labResults', file);
        });
      }

      // Ajouter les fichiers attachments
      if (formData.attachmentFiles && formData.attachmentFiles.length > 0) {
        formData.attachmentFiles.forEach(file => {
          submitFormData.append('attachments', file);
        });
      }

      if (selectedRecord) {
        // Existing files the user kept (already excludes anything removed via
        // the Trash button) - lets the backend do a real merge instead of
        // wiping every stored file whenever any new one is uploaded.
        const keptLabResults = (formData.labResults || []).filter(f => f.path);
        const keptAttachments = (formData.attachments || []).filter(f => f.path);
        submitFormData.append('existingLabResults', JSON.stringify(keptLabResults));
        submitFormData.append('existingAttachments', JSON.stringify(keptAttachments));

        await medicalRecords.update(selectedRecord.id, submitFormData);
      } else {
        await medicalRecords.create(submitFormData);
      }
      
      await fetchRecords();
      handleDialogClose();
    } catch (error) {
      //Error saving medical record. Please try again
    }
  };

  const filteredRecords = records.filter(record =>
    `${record.Patient?.User?.firstName} ${record.Patient?.User?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${record.Doctor?.User?.firstName} ${record.Doctor?.User?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="medical-records-container">
      <div className="records-header">
        <div className="records-content">
          <button onClick={handlePatientClick} className="add-records">
            <ArrowLeft className="iconss" />
          </button>
          <div>
            <h1 className="header-title">Medical Records</h1>
          </div>
        </div>
        {user?.role === 'doctor' && (
          <button className="add-records" onClick={handleNewRecord}>
            <Plus className="iconss" />
            New Record
          </button>
        )}
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon w-5 h-5" />
          <input
            type="text"
            placeholder="Search records by patient, doctor, or diagnosis..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="records-grid">
        {filteredRecords.map((record) => {
          const consultationData = consultationsData[record.consultationId];
          const vitals = consultationData?.vitals ? JSON.parse(consultationData.vitals) : null;
          
          return (
            <div key={record.id} className="record-card">
              <div className="record-header">
                <div className="patient-info">
                  <div className="patient-avatar">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="patient-details">
                    <h3>{record.Patient?.User?.firstName} {record.Patient?.User?.lastName}</h3>
                    <p>{calculateAge(record.Patient?.dateOfBirth)} years old</p>
                  </div>
                </div>
                <span className={`record-status ${getStatusClass(record.status)}`}>
                  {record.status}
                </span>
              </div>

              <div className="record-body">
                <div className="record-info">
                  <div className="info-item">
                    <Calendar className="info-icon w-5 h-5" />
                    <span className="info-text">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <FileText className="info-icon w-5 h-5" />
                    <span className="info-text">{record.recordType}</span>
                  </div>
                  <div className="info-item">
                    <User className="info-icon w-5 h-5" />
                    <span className="info-text">Dr. {record.Doctor?.User?.firstName} {record.Doctor?.User?.lastName}</span>
                  </div>
                  <div className="info-item">
                    <Activity className="info-icon w-5 h-5" />
                    <span className="info-text">{record.diagnosis}</span>
                  </div>
                </div>

                <div className="record-section">
                  <h4 className="section-title">Vitals</h4>
                  <div className="vitals-grid">
                    <div className="vital-item">
                      <Heart className="w-5 h-5 mx-auto mb-2 text-red-500" />
                      <span className="vital-label">Blood Pressure</span>
                      <div className="vital-value">{vitals?.bloodPressure || 'N/A'}</div>
                    </div>
                    <div className="vital-item">
                      <Thermometer className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                      <span className="vital-label">Temperature</span>
                      <div className="vital-value">{vitals?.temperature || 'N/A'}</div>
                    </div>
                    <div className="vital-item">
                      <Activity className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                      <span className="vital-label">Heart Rate</span>
                      <div className="vital-value">{vitals?.heartRate || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="record-section">
                  <h4 className="section-title">Treatment</h4>
                  <p className="section-content">{record.treatment}</p>
                </div>

                <div className="record-section">
                  <h4 className="section-title">Prescription</h4>
                  <p className="section-content">{record.prescription}</p>
                </div>

                <div className="record-actions">
                  {user?.role === 'doctor' && record.doctorId === currentDoctor?.id && (
                    <>
                      <button className="action-button primary-button" onClick={() => handleEditRecord(record)}>
                        <Edit className="w-4 h-4" />
                        Edit Record
                      </button>
                      <button 
                        className="action-button danger-button" 
                        onClick={() => handleDeleteRecord(record.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                  <button 
                    className="action-button secondary-button"
                    onClick={() => handleDownloadPDF(record.id)}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button 
                    className="action-button secondary-button"
                    onClick={() => handleDownloadComplete(record.id)}
                  >
                    <Download className="w-4 h-4" />
                    Dossier Complet (ZIP)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <AddEditMedicalRecord
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        record={selectedRecord}
        currentDoctor={currentDoctor}
      />
      
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={confirmDeleteRecord}
        title="Delete Medical Record"
        message="Are you sure you want to delete this medical record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default MedicalRecords;