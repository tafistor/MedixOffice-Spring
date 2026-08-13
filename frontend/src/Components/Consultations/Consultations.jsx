import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, Clock, Stethoscope, FileText, Edit, Trash, Plus, ArrowLeft, Heart, Thermometer, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { consultations, doctors, patients } from '../../services/api';
import AddEditConsultation from './AddEditConsultation';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { useAuth } from '../../context/AuthContext';
import './Consultations.css';

function Consultations() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultationsList, setConsultationsList] = useState([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState(null);
  const navigate = useNavigate(); 
  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    const response = await consultations.getAll();
    let filteredConsultations = response.data;
        if (user?.role === 'doctor') {
      const doctorResponse = await doctors.getDoctorByUserId(user.id);
      filteredConsultations = response.data.filter(
        consultation => consultation.doctorId === doctorResponse.data.id
      );
    } else if (user?.role === 'patient') {
      const patientResponse = await patients.getPatientByUserId(user.id);
      filteredConsultations = response.data.filter(
        consultation => consultation.patientId === patientResponse.data.id
      );
    }
    
    setConsultationsList(filteredConsultations);
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
    
    return `${age} years old`;
  };
  const getStatusClass = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'status-scheduled';
      case 'In Progress':
        return 'status-in-progress';
      case 'Completed':
        return 'status-completed';
      default:
        return '';
    }
  };
  const handlePatientClick = () => {
    navigate('/dashboard');
  };

  const handleNewConsultation = () => {
    setSelectedConsultation(null);
    setIsDialogOpen(true);
  };

  const handleEditConsultation = (consultation) => {
    setSelectedConsultation(consultation);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedConsultation(null);
  }; 
  const handleDialogSubmit = async (formData) => {
    if (selectedConsultation) {
      await consultations.update(selectedConsultation.id, formData);
    } else {
      await consultations.create(formData);
    }
    fetchConsultations();
    handleDialogClose();
  };

  const handleDeleteConsultation = async (id) => {
    setConsultationToDelete(id);
    setIsConfirmDialogOpen(true);
  };

  const confirmDeleteConsultation = async () => {
    if (consultationToDelete) {
      await consultations.delete(consultationToDelete);
      fetchConsultations();
      setConsultationToDelete(null);
    }
  };

  const filteredConsultations = consultationsList.filter(consultation =>
    `${consultation.Patient?.User?.firstName} ${consultation.Patient?.User?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${consultation.Doctor?.User?.firstName} ${consultation.Doctor?.User?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultation.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isDoctor = user?.role === 'doctor';
  return (
    <div className="consultations-container">
      <div className="consultations-header">
        <div className="header-content">
          <button onClick={handlePatientClick} className="add-consultation">
            <ArrowLeft className="icon" />
          </button>
          <div>
            <h1 className="header-title">Consultations</h1>
          </div>
        </div>
        {isDoctor && (
          <button className="add-consultation" onClick={handleNewConsultation}>
            <Plus className="icon" />
            New Consultation
          </button>
        )}
      </div>
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon w-5 h-5" />
          <input
            type="text"
            placeholder="Search consultations by patient, doctor, or type..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="consultations-grid">
        {filteredConsultations.map((consultation) => (
          <div key={consultation.id} className="consultation-card">
            <div className="consultation-header">
              <div className="patient-info">
                <div className="patient-avatar">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
                <div className="patient-details">
                  <h3>
                    {consultation.Patient?.User?.firstName} {consultation.Patient?.User?.lastName}
                  </h3>
                  <p>{calculateAge(consultation.Patient?.dateOfBirth)}</p>
                </div>
              </div>
              <span className={`consultation-status ${getStatusClass(consultation.status)}`}>
                {consultation.status}
              </span>
            </div>

            <div className="consultation-body">
              <div className="consultation-info">
                <div className="info-item">
                  <Stethoscope className="info-icon w-5 h-5" />
                  <span className="info-text">
                    Dr. {consultation.Doctor?.User?.firstName} {consultation.Doctor?.User?.lastName}
                  </span>
                </div>
                <div className="info-item">
                  <Calendar className="info-icon w-5 h-5" />
                  <span className="info-text">{consultation.date}</span>
                </div>
                <div className="info-item">
                  <Clock className="info-icon w-5 h-5" />
                  <span className="info-text">{consultation.time}</span>
                </div>
                <div className="info-item">
                  <FileText className="info-icon w-5 h-5" />
                  <span className="info-text">{consultation.type}</span>
                </div>
              </div>
              <div className="consultation-notes">
                <h4 className="notes-title">Consultation Notes</h4>
                <p className="notes-content">{consultation.notes || 'No notes available'}</p>
              </div>

              {isDoctor && consultation.Doctor.userId === user.id && (
                <div className="consultation-actions">
                  <button
                    className="action-button primary-button"
                    onClick={() => handleEditConsultation(consultation)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Details
                  </button>
                  <button
                    className="action-button secondary-button"
                    onClick={() => handleDeleteConsultation(consultation.id)}
                  >
                    <Trash className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <AddEditConsultation
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        consultation={selectedConsultation}
      />
      
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setConsultationToDelete(null);
        }}
        onConfirm={confirmDeleteConsultation}
        title="Delete Consultation"
        message="Are you sure you want to delete this consultation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
export default Consultations;