import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, Stethoscope, ArrowLeft, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddEditAppointment from './AddEditAppointment';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { appointments, patients, doctors, secretarySpecialties } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Appointments.css';

function Appointments() {
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
            <h1>Appointments</h1>
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
              New Appointment
            </button>
          )}
        </div>

        <div className="appointments-table-wrapper">
          {appointmentsList.length === 0 ? (
            <div className="no-appointments">
              <Calendar className="no-appointments-icon" />
              <h3>No Appointments Found</h3>
              <p>There are no appointments to display.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Visit Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {(user.role === 'secretary' || user.role === 'doctor') && (
                          <button 
                            onClick={() => handleEdit(appointment)}
                            className="btn-edit"
                          >
                            Edit
                          </button>
                        )}
                        {appointment.status === 'pending' && (
                          <button 
                            onClick={() => handleCancel(appointment.id)}
                            className="btn-cancel"
                          >
                            Cancel
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
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        type="warning"
      />
    </div>
  );
}

export default Appointments;