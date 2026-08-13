import React, { useState, useEffect } from 'react';
import { X, Clock, Search, Calendar, Plus, Minus, Copy } from 'lucide-react';
import { doctors, workSchedules, secretarySpecialties } from '../../services/api';
import './ManageSchedule.css';

function ManageSchedule({ isOpen, onClose, onSubmit, doctor = null, currentUser, userSpecialties = [] }) {
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(getStartOfWeek(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const [secretarySpecialtyList, setSecretarySpecialtyList] = useState([]);
  const [searchError, setSearchError] = useState('');
  
  const getInitialSchedules = (weekStart) => {
    return daysOfWeek.map(day => ({
      dayOfWeek: day,
      date: getDateForDay(day, weekStart),
      timeSlots: [{
        startTime: '09:00',
        endTime: '12:00',
        durationMinutes: 30,
        isAvailable: true,
        slotOrder: 1
      }],
      isAvailable: true
    }));
  };

  const [schedules, setSchedules] = useState(getInitialSchedules(selectedWeek));

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getDateForDay(day, weekStart) {
    const dayIndex = daysOfWeek.indexOf(day);
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    return date.toISOString().split('T')[0];
  }
  
  function formatDateRange(date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 4);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  // Fonction pour vérifier si au moins un jour est disponible
  const hasAvailableDays = () => {
    return schedules.some(schedule => schedule.isAvailable);
  };

  const resetForm = () => {
    setSelectedDoctor(null);
    setSearchTerm('');
    setSearchError('');
    setSelectedWeek(getStartOfWeek(new Date()));
    setSchedules(getInitialSchedules(getStartOfWeek(new Date())));
    setDoctorData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateSearchField = (value) => {
    // Check for multiple spaces
    if (value.includes('  ')) {
      setSearchError('Multiple spaces are not allowed');
      return false;
    }
    
    // Check for valid characters (letters, single spaces, apostrophes, hyphens)
    const validPattern = /^[a-zA-ZÀ-ÿ',\s-]*$/;
    
    if (value && !validPattern.test(value)) {
      setSearchError('Only letters, single spaces, apostrophes, and hyphens are allowed');
      return false;
    }
    
    // Clear error if validation passes
    setSearchError('');
    return true;
  };

  const handleSearchChange = (e) => {
    const { value } = e.target;
    
    // Block spaces at the beginning
    if (value.startsWith(' ')) {
      return;
    }
    
    // Block multiple spaces
    if (value.includes('  ')) {
      setSearchError('Multiple spaces are not allowed');
      return;
    }
    
    // Block multiple apostrophes or hyphens
    if (value.includes("''") || value.includes('--')) {
      return;
    }
    
    // Check for valid characters
    const validPattern = /^[a-zA-ZÀ-ÿ',\s-]*$/;
    
    if (value && !validPattern.test(value)) {
      setSearchError('Only letters, single spaces, apostrophes, and hyphens are allowed');
      return;
    }
    
    // Clear error if validation passes
    setSearchError('');
    setSearchTerm(value);
  };

  const handleSearchBlur = (e) => {
    const { value } = e.target;
    validateSearchField(value);
  };

  useEffect(() => {
    if (isOpen) {
      if (doctor) {
        setSelectedDoctor(doctor);
        if (doctor.schedules && doctor.schedules.length > 0) {
          const firstSchedule = doctor.schedules.find(s => s.isAvailable);
          const firstDate = firstSchedule ? new Date(firstSchedule.date) : new Date();
          const weekStart = getStartOfWeek(firstDate);
          setSelectedWeek(weekStart);
          
          // Grouper les horaires par jour
          const schedulesGroupedByDay = doctor.schedules.reduce((acc, schedule) => {
            if (!acc[schedule.dayOfWeek]) {
              acc[schedule.dayOfWeek] = [];
            }
            acc[schedule.dayOfWeek].push(schedule);
            return acc;
          }, {});

          const newSchedules = daysOfWeek.map(day => {
            const daySchedules = schedulesGroupedByDay[day] || [];
            if (daySchedules.length > 0) {
              // Trier par slotOrder
              daySchedules.sort((a, b) => (a.slotOrder || 1) - (b.slotOrder || 1));
              return {
                dayOfWeek: day,
                date: getDateForDay(day, weekStart),
                timeSlots: daySchedules.map(s => ({
                  startTime: s.startTime,
                  endTime: s.endTime,
                  durationMinutes: s.durationMinutes,
                  isAvailable: s.isAvailable,
                  slotOrder: s.slotOrder || 1
                })),
                isAvailable: daySchedules.some(s => s.isAvailable)
              };
            }
            return {
              dayOfWeek: day,
              date: getDateForDay(day, weekStart),
              timeSlots: [{
                startTime: '09:00',
                endTime: '12:00',
                durationMinutes: 30,
                isAvailable: true,
                slotOrder: 1
              }],
              isAvailable: true
            };
          });

          setSchedules(newSchedules);
        } else {
          setSchedules(getInitialSchedules(selectedWeek));
        }
      } else if (currentUser.role === 'doctor') {
        loadDoctorData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, doctor]);

  useEffect(() => {
    if (isOpen && (currentUser.role === 'admin' || currentUser.role === 'secretary')) {
      loadDoctors();
    }
  }, [isOpen, currentUser.role]);

  const loadDoctorData = async () => {
    const response = await doctors.getDoctorByUserId(currentUser.id);
    const doctorInfo = response.data;
    setDoctorData(doctorInfo);
    setSelectedDoctor({
      id: doctorInfo.id,
      doctorId: doctorInfo.id,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName
    });
  };

  useEffect(() => {
    const newSchedules = schedules.map(schedule => ({
      ...schedule,
      date: getDateForDay(schedule.dayOfWeek, selectedWeek)
    }));
    setSchedules(newSchedules);
  }, [selectedWeek]);

  const loadDoctors = async () => {
    try {
      let response;
      
      if (currentUser.role === 'admin') {
        response = await doctors.getAll();
      } else if (currentUser.role === 'secretary') {
        // Récupérer les spécialités du secrétaire
        let secretarySpecialtiesData = [];
        try {
          const specialtiesResponse = await secretarySpecialties.getCurrentUserSpecialties();
          secretarySpecialtiesData = specialtiesResponse.data || [];
          setSecretarySpecialtyList(secretarySpecialtiesData);
        } catch (error) {
            //Erreur lors du chargement des spécialités du secrétaire
        }

        // Utiliser les spécialités pour filtrer les docteurs
        if (secretarySpecialtiesData.length > 0) {
          response = await doctors.getAllBySpecialties(secretarySpecialtiesData);
        } else {
          // Si pas de spécialités assignées, retourner une liste vide
          response = { data: [] };
        }
      } else {
        response = await doctors.getAll();
      }
      
      setDoctorsList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      //Erreur lors du chargement des docteurs
      setDoctorsList([]);
    }
  };

  const handleWeekChange = (direction) => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  const handleTimeSlotChange = (day, slotIndex, field, value) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.dayOfWeek === day ? {
        ...schedule,
        timeSlots: schedule.timeSlots.map((slot, index) =>
          index === slotIndex ? { ...slot, [field]: value } : slot
        )
      } : schedule
    ));
  };

  const handleDurationChange = (day, slotIndex, value) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.dayOfWeek === day ? {
        ...schedule,
        timeSlots: schedule.timeSlots.map((slot, index) =>
          index === slotIndex ? { ...slot, durationMinutes: parseInt(value) } : slot
        )
      } : schedule
    ));
  };

  const handleSlotAvailabilityChange = (day, slotIndex) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.dayOfWeek === day ? {
        ...schedule,
        timeSlots: schedule.timeSlots.map((slot, index) =>
          index === slotIndex ? {
            ...slot,
            isAvailable: !slot.isAvailable,
            ...(slot.isAvailable ? {
              startTime: '00:00',
              endTime: '00:00',
              durationMinutes: 0
            } : {
              startTime: '09:00',
              endTime: '12:00',
              durationMinutes: 30
            })
          } : slot
        )
      } : schedule
    ));
  };

  const handleDayAvailabilityChange = (day) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.dayOfWeek === day ? {
        ...schedule,
        isAvailable: !schedule.isAvailable,
        timeSlots: schedule.timeSlots.map(slot => ({
          ...slot,
          isAvailable: !schedule.isAvailable,
          ...(schedule.isAvailable ? {
            startTime: '00:00',
            endTime: '00:00',
            durationMinutes: 0
          } : {
            startTime: '09:00',
            endTime: '12:00',
            durationMinutes: 30
          })
        }))
      } : schedule
    ));
  };

  const addTimeSlot = (day) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.dayOfWeek === day ? {
        ...schedule,
        timeSlots: [
          ...schedule.timeSlots,
          {
            startTime: '14:00',
            endTime: '18:00',
            durationMinutes: 30,
            isAvailable: true,
            slotOrder: schedule.timeSlots.length + 1
          }
        ]
      } : schedule
    ));
  };

  const removeTimeSlot = (day, slotIndex) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.dayOfWeek === day && schedule.timeSlots.length > 1 ? {
        ...schedule,
        timeSlots: schedule.timeSlots.filter((_, index) => index !== slotIndex)
          .map((slot, index) => ({ ...slot, slotOrder: index + 1 }))
      } : schedule
    ));
  };

  const copyPreviousWeek = async () => {
    let doctorId;
    if (currentUser.role === 'doctor' && doctorData) {
      doctorId = doctorData.id;
    } else if (doctor) {
      doctorId = doctor.id;
    } else if (selectedDoctor) {
      doctorId = selectedDoctor.id || selectedDoctor.doctorId;
    }

    if (!doctorId) return;

    try {
      setIsSubmitting(true);
      const response = await workSchedules.copyPreviousWeek({
        doctorId,
        currentWeekStart: selectedWeek.toISOString().split('T')[0]
      });

      if (response.data && response.data.schedules) {
        // Regrouper les horaires par jour
        const schedulesGroupedByDay = response.data.schedules.reduce((acc, schedule) => {
          if (!acc[schedule.dayOfWeek]) {
            acc[schedule.dayOfWeek] = [];
          }
          acc[schedule.dayOfWeek].push(schedule);
          return acc;
        }, {});

        const newSchedules = daysOfWeek.map(day => {
          const daySchedules = schedulesGroupedByDay[day] || [];
          if (daySchedules.length > 0) {
            daySchedules.sort((a, b) => (a.slotOrder || 1) - (b.slotOrder || 1));
            return {
              dayOfWeek: day,
              date: getDateForDay(day, selectedWeek),
              timeSlots: daySchedules.map(s => ({
                startTime: s.startTime,
                endTime: s.endTime,
                durationMinutes: s.durationMinutes,
                isAvailable: s.isAvailable,
                slotOrder: s.slotOrder || 1
              })),
              isAvailable: daySchedules.some(s => s.isAvailable)
            };
          }
          return {
            dayOfWeek: day,
            date: getDateForDay(day, selectedWeek),
            timeSlots: [{
              startTime: '09:00',
              endTime: '12:00',
              durationMinutes: 30,
              isAvailable: true,
              slotOrder: 1
            }],
            isAvailable: true
          };
        });

        setSchedules(newSchedules);
      }
    } catch (error) {
      //Erreur lors de la copie
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
  
    let doctorId;
    if (currentUser.role === 'doctor' && doctorData) {
      doctorId = doctorData.id;
    } else if (doctor) {
      doctorId = doctor.id;
    } else if (selectedDoctor) {
      doctorId = selectedDoctor.id || selectedDoctor.doctorId;
    }
  
    if (!doctorId) {
      return;
    }
  
  
    setIsSubmitting(true);
  
    const schedulesData = [];
    schedules.forEach(schedule => {
      schedule.timeSlots.forEach((slot, index) => {
        schedulesData.push({
          doctorId,
          dayOfWeek: schedule.dayOfWeek,
          date: schedule.date,
          startTime: slot.isAvailable ? slot.startTime : '00:00',
          endTime: slot.isAvailable ? slot.endTime : '00:00',
          durationMinutes: slot.isAvailable ? slot.durationMinutes : 0,
          isAvailable: slot.isAvailable,
          slotOrder: index + 1
        });
      });
    });
  
    await onSubmit({ doctorId, schedules: schedulesData });
    handleClose();
    setIsSubmitting(false);
  };
  

  const handleSelectDoctor = (doctor) => {
    if (!doctor?.User) return;
    
    setSelectedDoctor({
      id: doctor.id,
      doctorId: doctor.id,
      User: doctor.User,
      firstName: doctor.User.firstName,
      lastName: doctor.User.lastName
    });
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-dialog-overlay">
      <div className="schedule-dialog-content">
        <div className="schedule-dialog-header">
          <h2>{doctor ? 'Edit Schedule' : 'Add New Schedule'}</h2>
          <button className="close-btn" onClick={handleClose} disabled={isSubmitting}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="schedule-form">
          {(currentUser.role === 'admin' || currentUser.role === 'secretary') && !doctor && (
            <div className="doctor-selection">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onBlur={handleSearchBlur}
                  className="search-input"
                  disabled={isSubmitting}
                />
              </div>
              {searchError && (
                <p className="error-text" style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {searchError}
                </p>
              )}
              {searchTerm && (
                <div className="doctors-dropdown">
                  {doctorsList.filter(doc => 
                    doc.User && 
                    `${doc.User.firstName} ${doc.User.lastName}`
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  ).map(doc => (
                    <div
                      key={doc.id}
                      className="doctor-option"
                      onClick={() => !isSubmitting && handleSelectDoctor(doc)}
                    >
                      <div className="doctor-name">Dr. {doc.User.firstName} {doc.User.lastName}</div>
                      <div className="doctor-specialization">{doc.specialization}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(selectedDoctor || doctor) && (
            <>
              <div className="selected-doctor">
                <h3>
                  Schedule for Dr. {selectedDoctor?.User?.lastName || selectedDoctor?.lastName || doctor?.lastName}
                </h3>
                <div className="week-selector">
                  <button type="button" onClick={() => handleWeekChange('prev')} disabled={isSubmitting}>&lt;</button>
                  <span className="week-display">
                    <Calendar className="calendar-icon" />
                    {formatDateRange(selectedWeek)}
                  </span>
                  <button type="button" onClick={() => handleWeekChange('next')} disabled={isSubmitting}>&gt;</button>
                  <button 
                    type="button" 
                    onClick={copyPreviousWeek} 
                    disabled={isSubmitting}
                    className="copy-previous-week-btn"
                    title="Copier les horaires de la semaine précédente"
                  >
                    <Copy className="copy-icon" />
                    Copier semaine précédente
                  </button>
                </div>
              </div>

              {schedules.map((schedule) => (
                <div key={schedule.dayOfWeek} className="schedule-day-row">
                  <div className="day-header">
                    <label className="day-label">
                      <input
                        type="checkbox"
                        checked={schedule.isAvailable}
                        onChange={() => !isSubmitting && handleDayAvailabilityChange(schedule.dayOfWeek)}
                        className="day-checkbox"
                        disabled={isSubmitting}
                      />
                      {schedule.dayOfWeek}
                      <span className="date-display">
                        {new Date(schedule.date).toLocaleDateString()}
                      </span>
                      {!schedule.isAvailable && <span className="absent-label">Unavailable</span>}
                    </label>
                  </div>

                  <div className={`time-slots-container ${!schedule.isAvailable ? 'absent' : ''}`}>
                    {schedule.timeSlots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="time-slot-row">
                        <div className="time-input-group">
                          <Clock className="time-icon" />
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleTimeSlotChange(schedule.dayOfWeek, slotIndex, 'startTime', e.target.value)}
                            disabled={!slot.isAvailable || isSubmitting}
                            className="time-input"
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleTimeSlotChange(schedule.dayOfWeek, slotIndex, 'endTime', e.target.value)}
                            disabled={!slot.isAvailable || isSubmitting}
                            className="time-input"
                          />
                          <select
                            value={slot.durationMinutes}
                            onChange={(e) => handleDurationChange(schedule.dayOfWeek, slotIndex, e.target.value)}
                            disabled={!slot.isAvailable || isSubmitting}
                            className="duration-select"
                          >
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min</option>
                          </select>
                          <input
                            type="checkbox"
                            checked={slot.isAvailable}
                            onChange={() => !isSubmitting && handleSlotAvailabilityChange(schedule.dayOfWeek, slotIndex)}
                            disabled={isSubmitting}
                            className="slot-checkbox"
                            title="Disponible"
                          />
                          {schedule.timeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTimeSlot(schedule.dayOfWeek, slotIndex)}
                              disabled={isSubmitting}
                              className="remove-slot-btn"
                              title="Supprimer ce créneau"
                            >
                              <Minus />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {schedule.isAvailable && (
                      <button
                        type="button"
                        onClick={() => addTimeSlot(schedule.dayOfWeek)}
                        disabled={isSubmitting}
                        className="add-slot-btn"
                        title="Ajouter un créneau"
                      >
                        <Plus />
                        Ajouter un créneau
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="schedule-dialog-actions">
                <button type="button" className="cancel-btn" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={isSubmitting || !hasAvailableDays()}
                >
                  {isSubmitting ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default ManageSchedule;