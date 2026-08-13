import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManageSchedule from './ManageSchedule';
import { workSchedules, doctors, secretarySpecialties } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Schedule.css';

function Schedule() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState(getStartOfWeek(new Date()));
    const [userSpecialties, setUserSpecialties] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];    
    
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }
    
    function formatDateRange(date) {
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 4);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    useEffect(() => {
      if (user?.role === 'secretary') {
          loadUserSpecialties();
      } else {
          loadSchedules();
      }
  }, [user, selectedWeek]);

  const loadUserSpecialties = async () => {
      try {
          const response = await secretarySpecialties.getCurrentUserSpecialties();
          setUserSpecialties(response.data);
          loadSchedules(response.data);
      } catch (error) {
        //Erreur lors du chargement des spécialités
          setLoading(false);
      }
  };

  const loadSchedules = async (specialties = null) => {
    setLoading(true);
    let doctorId = user?.id;
    
    if (user?.role === 'doctor') {
      const doctorResponse = await doctors.getDoctorByUserId(user?.id);
      doctorId = doctorResponse.data.id;
    }
    
    if (user?.role === 'admin' || (user?.role === 'secretary' && specialties)) {
      const startDate = selectedWeek.toISOString().split('T')[0];
      const endDate = new Date(selectedWeek);
      endDate.setDate(endDate.getDate() + 4);
      const endDateStr = endDate.toISOString().split('T')[0];

      let allSchedules = [];

      if (user?.role === 'admin') {
        // Admin voit tous les docteurs
        const doctorsResponse = await doctors.getAll();
        const doctorsList = doctorsResponse.data;

        for (const doctor of doctorsList) {
          const response = await workSchedules.getDoctorSchedule(doctor.id, startDate, endDateStr);
          if (response.data) {
            allSchedules.push({
              id: doctor.id,
              doctor: {
                firstName: doctor.firstName || doctor.User?.firstName,
                lastName: doctor.lastName || doctor.User?.lastName
              },
              schedules: Array.isArray(response.data.schedules) ? response.data.schedules : []
            });
          }
        }
      } else if (user?.role === 'secretary' && specialties && specialties.length > 0) {
        // Secrétaire voit seulement les docteurs de ses spécialités
        const response = await workSchedules.getAllBySpecialties(startDate, endDateStr, specialties);
        allSchedules = response.data;
      }

      setSchedules(allSchedules);
    } else if (user?.role === 'doctor') {
      const startDate = selectedWeek.toISOString().split('T')[0];
      const endDate = new Date(selectedWeek);
      endDate.setDate(endDate.getDate() + 4);
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await workSchedules.getDoctorSchedule(doctorId, startDate, endDateStr);
      if (response.data) {
        setSchedules([{
          id: doctorId,
          doctor: {
            firstName: user.firstName,
            lastName: user.lastName
          },
          schedules: Array.isArray(response.data.schedules) ? response.data.schedules : []
        }]);
      }
    }
    setLoading(false);
};

    
    const handleWeekChange = (direction) => {
        const newDate = new Date(selectedWeek);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setSelectedWeek(newDate);
    };
    
    const handleManageSchedule = (doctor = null) => {
        setSelectedDoctor(doctor);
        setIsDialogOpen(true);
    };
    
    const handleSubmitSchedule = async (scheduleData) => {
      if (selectedDoctor) {
        await workSchedules.update(selectedDoctor.id, scheduleData);
      } else {
        await workSchedules.create(scheduleData);
      }
      if (user?.role === 'secretary') {
        loadUserSpecialties();
      } else {
        await loadSchedules();
      }
      setIsDialogOpen(false);
  };
    
    const formatTime = (time) => {
        if (!time) return '';
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
    };

    const groupSchedulesByDay = (schedules) => {
        return schedules.reduce((acc, schedule) => {
            const key = `${schedule.date}-${schedule.dayOfWeek}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(schedule);
            return acc;
        }, {});
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    } 

    const canManageSchedules = ['admin', 'secretary', 'doctor'].includes(user?.role);
    
    return (
        <div className="schedule-container">
          <div className="schedule-header">
            <div className="header-content">
              <button onClick={() => navigate('/dashboard')} className="add-patient-btn">
                <ArrowLeft className="icon" />
              </button>
              <div className="header-text">
                <h1>Planning des Docteurs</h1>
              </div>
            </div>
            <div className="schedule-controls">
              <div className="week-selector">
                <button onClick={() => handleWeekChange('prev')}>&lt;</button>
                <span className="week-display">
                  <Calendar className="calendar-icon" />
                  {formatDateRange(selectedWeek)}
                </span>
                <button onClick={() => handleWeekChange('next')}>&gt;</button>
              </div>
              {canManageSchedules && (
                <button className="add-patient-btn" onClick={() => handleManageSchedule()}>
                  <Plus className="icon" />
                  Add a schedule
                </button>
              )}
            </div>
          </div>
    
          <div className="schedule-grid">
            <div className="time-slots-header">
              <div className="doctor-column">Docteur</div>
              {days.map((day, index) => {
                const date = new Date(selectedWeek);
                date.setDate(date.getDate() + index);
                return (
                  <div key={day} className="day-column">
                    <div className="day-name">{day}</div>
                    <div className="day-date">{date.toLocaleDateString()}</div>
                  </div>
                );
              })}
            </div>
    
            {schedules.map((item) => (
              <div key={item.id} className="schedule-row">
                <div className="doctor-info">
                  <User className="doctor-icon" />
                  <div className="doctor-name">
                    Dr. {item.doctor.firstName} {item.doctor.lastName}
                  </div>
                </div>
                
                {days.map((day, index) => {
                  const date = new Date(selectedWeek);
                  date.setDate(date.getDate() + index);
                  const dateStr = date.toISOString().split('T')[0];
                  const daySchedules = item.schedules?.filter(s => s.date === dateStr) || [];
                  
                  // Trier par slotOrder
                  daySchedules.sort((a, b) => (a.slotOrder || 1) - (b.slotOrder || 1));

                  return (
                    <div key={`${item.id}-${day}`} className="time-slot">
                      {daySchedules.length > 0 ? (
                        <>
                          <div className="time-slots-list">
                            {daySchedules.map((daySchedule, slotIndex) => (
                              <div key={slotIndex} className="time-slot-item">
                                <div className="time-info">
                                  <Clock className="time-icon" />
                                  <span>
                                    {formatTime(daySchedule.startTime)} - {formatTime(daySchedule.endTime)}
                                  </span>
                                </div>
                                <div className="duration-info">
                                  {daySchedule.durationMinutes} min
                                </div>
                                <span className={`status-badge ${daySchedule.isAvailable ? 'available' : 'busy'}`}>
                                  {daySchedule.isAvailable ? 'Disponible' : 'Non disponible'}
                                </span>
                              </div>
                            ))}
                          </div>
                          {canManageSchedules && (
                            <button 
                              className="edit-schedule-btn"
                              onClick={() => handleManageSchedule({
                                id: item.id,
                                firstName: item.doctor.firstName,
                                lastName: item.doctor.lastName,
                                schedules: item.schedules.map(s => ({
                                  ...s,
                                  dayOfWeek: days[new Date(s.date).getDay() - 1]
                                }))
                              })}
                            >
                              Edit
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="no-schedule">Pas d'horaire</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
    
          <ManageSchedule
            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false);
              loadSchedules();
            }}
            onSubmit={handleSubmitSchedule}
            doctor={selectedDoctor}
            currentUser={user}
          />
        </div>
    );
}

export default Schedule;