import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Calendar, Heart, Pill, AlertTriangle, Clock, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { appointments } from '../../services/api';
import './ViewPatient.css';

function ViewPatient({ isOpen, onClose, patient, isDashboard = false }) {
  const { t } = useTranslation();
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
    if (!dateString) return t('patient.notSpecified');
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const content = (
    <>
      <div className={isDashboard ? "dashboard-header" : "dialog-header"}>
        <h2>{t('patient.title')}</h2>
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
          <h4>{t('patient.todaysAppointments')}</h4>
          {loading ? (
            <p>{t('patient.loadingAppointments')}</p>
          ) : todayAppointments.length > 0 ? (
            <div className="appointments-list">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="appointment-item">
                  <Clock size={16} className="appointment-icon" />
                  <div className="appointment-details">
                    <span className="appointment-time">{apt.time}</span>
                    <span className="appointment-doctor">
                      {t('patient.drPrefix')} {apt.Doctor.User.firstName} {apt.Doctor.User.lastName}
                    </span>
                  </div>
                  <span className={`appointment-status status-${apt.status}`}>
                    {t(`common.status.${apt.status}`)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-appointments">{t('patient.noAppointmentsToday')}</p>
          )}
        </div>

        <div className="info-section">
          <h4>{t('patient.personalInformation')}</h4>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">
                <Calendar size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">{t('patient.dateOfBirth')}</span>
                <span className="info-value">{formatDate(patient.dateOfBirth)}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Phone size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">{t('patient.phone')}</span>
                <span className="info-value">{patient.phone || t('patient.notProvided')}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Mail size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">{t('patient.email')}</span>
                <span className="info-value">{patient.email || patient.User.email}</span>
              </div>
            </div>

            <div className="info-item full-width">
              <div className="info-icon">
                <MapPin size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">{t('patient.address')}</span>
                <span className="info-value">{patient.address || t('patient.notProvided')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h4>{t('patient.medicalInformation')}</h4>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">
                <Heart size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">{t('patient.chronicDiseases')}</span>
                <span className="info-value">{patient.chronicDiseases || t('patient.none')}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Pill size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">{t('patient.currentTreatments')}</span>
                <span className="info-value">{patient.currentTreatments || t('patient.none')}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <AlertTriangle size={16} />
              </div>
              <div className="info-content">
                <span className="info-label">{t('patient.allergies')}</span>
                <span className="info-value">{patient.allergies || t('patient.none')}</span>
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