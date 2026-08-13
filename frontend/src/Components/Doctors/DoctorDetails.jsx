import React from 'react';
import { X, Mail, Phone, Stethoscope, Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import './DoctorDetails.css';

function DoctorDetails({ isOpen, onClose, doctor, schedule, appointments, selectedDate, onDateChange, isDashboard = false }) {
  if (!isOpen || !doctor) return null;
  
  const getStatusClass = (status) => {
    const statusClasses = {
      pending: 'dr-details-status-pending',
      confirmed: 'dr-details-status-confirmed',
      completed: 'dr-details-status-completed',
      cancelled: 'dr-details-status-cancelled'
    };
    return `dr-details-appointment-status ${statusClasses[status] || ''}`;
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const formatWeekRange = () => {
    const monday = new Date(selectedDate);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);

    const formatDate = (date) => {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    return `${formatDate(monday)} - ${formatDate(friday)}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); 
  };

  const content = (
    <>
      <div className={isDashboard ? "dashboard-header" : "dr-details-header"}>
        <h2>Doctor Details</h2>
        {!isDashboard && (
          <button className="dr-details-close-button" onClick={onClose}>
            <X size={24} />
          </button>
        )}
      </div>

      <div className="dr-details-info-section">
        <h3>Personal Information</h3>
        <div className="dr-details-info-grid">
          <div className="dr-details-info-item">
            <User />
            <span>Dr. {doctor.User?.firstName} {doctor.User?.lastName}</span>
          </div>
          <div className="dr-details-info-item">
            <Stethoscope />
            <span>{doctor.specialization}</span>
          </div>
          <div className="dr-details-info-item">
            <Mail />
            <span>{doctor.email}</span>
          </div>
          <div className="dr-details-info-item">
            <Phone />
            <span>{doctor.phone}</span>
          </div>
        </div>
      </div>

      <div className="dr-details-schedule-section">
        <div className="dr-details-week-navigation">
          <button onClick={handlePreviousWeek} className="nav-button">
            <ChevronLeft size={20} />
          </button>
          <h3>{formatWeekRange()}</h3>
          <button onClick={handleNextWeek} className="nav-button">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="dr-details-schedule-grid">
          {schedule && schedule.schedules && schedule.schedules.length > 0 ? (
            schedule.schedules.map((sch) => (
              <div key={sch.id} className="dr-details-schedule-card">
                <div className="dr-details-schedule-day">{sch.dayOfWeek}</div>
                <div className="dr-details-schedule-time">
                  <Clock size={16} className="dr-details-inline-icon" />
                  {formatTime(sch.startTime)} - {formatTime(sch.endTime)}
                </div>
                <div className="dr-details-schedule-duration">
                  Duration: {sch.durationMinutes} minutes
                </div>
                <div className={`dr-details-schedule-status ${sch.isAvailable ? 'available' : 'unavailable'}`}>
                  {sch.isAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>
            ))
          ) : (
            <div className="dr-details-no-schedule">
              No schedule available for this week
            </div>
          )}
        </div>
      </div>

      <div className="dr-details-appointments-section">
        <h3>Appointments for the Week</h3>
        <div className="dr-details-appointments-list">
          {Array.isArray(appointments) && appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div key={appointment.id} className="dr-details-appointment-item">
                <div className="dr-details-appointment-date">
                  <Calendar size={16} className="dr-details-inline-icon" />
                  {appointment.date} {appointment.time}
                </div>
                <div className="dr-details-appointment-patient">
                  <User size={16} className="dr-details-inline-icon" />
                  {appointment.Patient?.User?.firstName} {appointment.Patient?.User?.lastName}
                </div>
                <div className={getStatusClass(appointment.status)}>
                  {appointment.status}
                </div>
              </div>
            ))
          ) : (
            <div className="dr-details-no-appointments">
              No appointments scheduled for this week
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (isDashboard) {
    return <div className="dashboard-doctor-view">{content}</div>;
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog-content view-doctor-dialog">
        {content}
      </div>
    </div>
  );
}

export default DoctorDetails;