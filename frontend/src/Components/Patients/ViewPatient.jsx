import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Calendar, Heart, Pill, AlertTriangle, Clock, Mail } from 'lucide-react';
import { appointments } from '../../services/api';
import './ViewPatient.css';

function ViewPatient({ isOpen, onClose, patient, isDashboard = false }) {
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      if (patient) {
        setLoading(true);
        const response = await appointments.getPatientAppointments(patient.id);
        setTodayAppointments(response.data);
        setLoading(false);
      }
    };

    fetchTodayAppointments();
  }, [patient]);

  if (!isOpen || !patient) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const content = (
    <>
      <div className={isDashboard ? "dashboard-header" : "dialog-header"}>
        <h2>Patient Information</h2>
        {!isDashboard && (
          <button className="close-button" onClick={onClose}>
            <X className="close-icon" />
          </button>
        )}
      </div>
      
      <div className="dialog-body">
        <div className="patient-profile-header">
          <div className="patient-avatar-large">
            <User className="patient-icon" />
          </div>
          <div className="patient-profile-name">
            <h3>{patient.User.firstName} {patient.User.lastName}</h3>
          </div>
        </div>

        <div className="info-section">
          <h4>Today's Appointments</h4>
          {loading ? (
            <p>Loading appointments...</p>
          ) : todayAppointments.length > 0 ? (
            <div className="appointments-list">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="appointment-item">
                  <Clock size={16} className="appointment-icon" />
                  <div className="appointment-details">
                    <span className="appointment-time">{apt.time}</span>
                    <span className="appointment-doctor">
                      Dr. {apt.Doctor.User.firstName} {apt.Doctor.User.lastName}
                    </span>
                  </div>
                  <span className={`appointment-status status-${apt.status}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-appointments">No appointments scheduled for today</p>
          )}
        </div>

        <div className="info-section">
          <h4>Personal Information</h4>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">
                <Calendar size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">Date of Birth</span>
                <span className="info-value">{formatDate(patient.dateOfBirth)}</span>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">
                <Phone size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">Phone</span>
                <span className="info-value">{patient.phone || 'Not provided'}</span>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">
                <Mail size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">Email</span>
                <span className="info-value">{patient.email || patient.User.email}</span>
              </div>
            </div>
            
            <div className="info-item full-width">
              <div className="info-icon">
                <MapPin size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">Address</span>
                <span className="info-value">{patient.address || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h4>Medical Information</h4>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">
                <Heart size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">Chronic Diseases</span>
                <span className="info-value">{patient.chronicDiseases || 'None'}</span>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">
                <Pill size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">Current Treatments</span>
                <span className="info-value">{patient.currentTreatments || 'None'}</span>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">
                <AlertTriangle size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">Allergies</span>
                <span className="info-value">{patient.allergies || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (isDashboard) {
    return <div className="dashboard-patient-view">{content}</div>;
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog-content view-patient-dialog">
        {content}
      </div>
    </div>
  );
}

export default ViewPatient;