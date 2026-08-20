import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, Stethoscope, ArrowLeft, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AddEditAppointment from './AddEditAppointment';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { appointments, patients, doctors, secretarySpecialties } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Appointments.css';

function Appointments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [secretarySpecialtyList, setSecretarySpecialtyList] = useState([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    // Récupérer les spécialités du secrétaire si c'est un secrétaire
    let secretarySpecialtiesData = [];
    if (user.role === 'secretary') {
      try {
        const specialtiesResponse = await secretarySpecialties.getCurrentUserSpecialties();
        secretarySpecialtiesData = specialtiesResponse.data || [];
        setSecretarySpecialtyList(secretarySpecialtiesData);
      } catch (error) {
        //Ignorer l'erreur et définir une liste vide
        setSecretarySpecialtyList([]);
      }
    }

    const response = await appointments.getAll();
    let filteredAppointments = response.data;
    
    if (user.role === 'patient') {
      const patientId = await patients.getPatientByUserId(user.id);
      filteredAppointments = filteredAppointments.filter(
        (appt) => appt.patientId === patientId.data.id
      );
    } else if (user.role === 'doctor') {
      const doctorId = await doctors.getDoctorByUserId(user.id);
      filteredAppointments = filteredAppointments.filter(
        (appt) => appt.doctorId === doctorId.data.id
      );
    } else if (user.role === 'secretary' && secretarySpecialtiesData.length > 0) {
      // Filtrer les rendez-vous pour ne montrer que ceux des docteurs avec les spécialités autorisées
      filteredAppointments = filteredAppointments.filter((appt) => {
        if (!appt.Doctor?.specialization) return false;
        
        const doctorSpecialties = appt.Doctor.specialization.split(',').map(s => s.trim());
        return doctorSpecialties.some(specialty => secretarySpecialtiesData.includes(specialty));
      });
    } else if (user.role === 'secretary' && secretarySpecialtiesData.length === 0) {
      // Si le secrétaire n'a pas de spécialités assignées, ne montrer aucun rendez-vous
      filteredAppointments = [];
    }
    
    setAppointmentsList(filteredAppointments);
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setShowAddEdit(true);
  };

  const handleClose = () => {
    setShowAddEdit(false);
    setEditingAppointment(null);
    fetchAppointments();
  };

  const handleCancel = async (appointmentId) => {
    setAppointmentToCancel(appointmentId);
    setIsConfirmDialogOpen(true);
  };

  const confirmCancelAppointment = async () => {
    if (appointmentToCancel) {
      await appointments.cancel(appointmentToCancel);
      setAppointmentsList(prevList => 
        prevList.filter(appointment => appointment.id !== appointmentToCancel)
      );
      setAppointmentToCancel(null);
    }
  };

  return (
    <div className="appointments-page">
      <div className="appointments-container">
        <div className="appointments-header">
          <div className="header-nav">
            <Link to="/dashboard" className="nav-back">
              <ArrowLeft className="nav-back-icon" />
            </Link>
            <h1>{t('appointments.title')}</h1>
          </div>
          {(user.role === 'patient' || user.role === 'secretary' ) && (
            <button
              onClick={() => {
                setEditingAppointment(null);
                setShowAddEdit(true);
              }}
              className="btn-new-appointment"
            >
              <Plus className="btn-new-appointment-icon" />
              {t('appointments.newAppointment')}
            </button>
          )}
        </div>

        <div className="appointments-table-wrapper">
          {appointmentsList.length === 0 ? (
            <div className="no-appointments">
              <Calendar className="no-appointments-icon" />
              <h3>{t('appointments.noAppointmentsTitle')}</h3>
              <p>{t('appointments.noAppointmentsText')}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('appointments.table.patient')}</th>
                  <th>{t('appointments.table.doctor')}</th>
                  <th>{t('appointments.table.date')}</th>
                  <th>{t('appointments.table.time')}</th>
                  <th>{t('appointments.table.visitDescription')}</th>
                  <th>{t('appointments.table.amount')}</th>
                  <th>{t('appointments.table.status')}</th>
                  <th>{t('appointments.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {appointmentsList.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="info-row">
                        <div className="icon-circle patient-icon-wrapper">
                          <User className="icon" />
                        </div>
                        <div>
                          <div className="info-title">
                            {appointment.Patient?.User?.firstName} {appointment.Patient?.User?.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="info-row">
                        <div className="icon-circle doctor-icon-wrapper">
                          <Stethoscope className="icon" />
                        </div>
                        <div>
                          <div className="info-title">
                            {appointment.Doctor?.User?.firstName} {appointment.Doctor?.User?.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="info-row">
                        <div className="icon-circle date-icon-wrapper">
                          <Calendar className="icon" />
                        </div>
                        <span>{appointment.date}</span>
                      </div>
                    </td>
                    <td>
                      <div className="info-row">
                        <div className="icon-circle time-icon-wrapper">
                          <Clock className="icon" />
                        </div>
                        <span>{appointment.time}</span>
                      </div>
                    </td>
                    <td>
                      <span className="visit-info">{appointment.visitDescription}</span>
                    </td>
                    <td>
                      <div className="info-row">
                        <div className="icon-circle amount-icon-wrapper">
                          <DollarSign className="icon" />
                        </div>
                        <span className="amount-value">{parseFloat(appointment.amount || 0).toFixed(2)}€</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-tag status-tag-${appointment.status}`}>
                        {t(`common.status.${appointment.status}`)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {(user.role === 'secretary' || user.role === 'doctor') && (
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="btn-edit"
                          >
                            {t('appointments.edit')}
                          </button>
                        )}
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(appointment.id)}
                            className="btn-cancel"
                          >
                            {t('appointments.cancel')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddEdit && (
        <AddEditAppointment
          appointment={editingAppointment}
          onClose={handleClose}
        />
      )}
      
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setAppointmentToCancel(null);
        }}
        onConfirm={confirmCancelAppointment}
        title={t('appointments.cancelDialog.title')}
        message={t('appointments.cancelDialog.message')}
        confirmText={t('appointments.cancelDialog.confirm')}
        cancelText={t('appointments.cancelDialog.keep')}
        type="warning"
      />
    </div>
  );
}

export default Appointments;