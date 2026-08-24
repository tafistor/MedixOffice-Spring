import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { patients, doctors, workSchedules, appointments, secretarySpecialties } from '../../services/api';
import { visitTypesWithAmounts } from '../../data/visitTypesWithAmounts';
import './AddEditAppointment.css';

function AddEditAppointment({ appointment, onClose }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [selectedDoctor, setSelectedDoctor] = useState(appointment?.doctorId || null);
    const [selectedDoctorSpecialty, setSelectedDoctorSpecialty] = useState(appointment?.Doctor?.specialization || '');
    const [selectedPatient, setSelectedPatient] = useState(appointment?.patientId || null);
    const [visitType, setVisitType] = useState(appointment?.visitDescription || '');
    const [customVisitType, setCustomVisitType] = useState('');
    const [amount, setAmount] = useState(appointment?.amount || 0);
    const [date, setDate] = useState(appointment?.date || '');
    const [time, setTime] = useState(appointment?.time || '');
    const [status, setStatus] = useState(appointment?.status || 'pending');
    const [allPatients, setAllPatients] = useState([]);
    const [allDoctors, setAllDoctors] = useState([]);
    const [patientFilter, setPatientFilter] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [doctorSchedules, setDoctorSchedules] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [availableVisitTypes, setAvailableVisitTypes] = useState([]);
    const [secretarySpecialtyList, setSecretarySpecialtyList] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    
    const patientRef = useRef(null);
    const doctorRef = useRef(null);  

    // Fonction de validation réutilisable
    const validateTextOnlyField = (value, fieldName) => {
        // Check for multiple spaces
        if (value.includes('  ')) {
            setFieldErrors(prev => ({
                ...prev,
                [fieldName]: t('appointmentForm.errors.multipleSpaces')
            }));
            return false;
        }
        
        // Check for valid characters (letters, single spaces, apostrophes, hyphens)
        const validPattern = /^[a-zA-ZÀ-ÿ',\s-]*$/;
        
        if (value && !validPattern.test(value)) {
            setFieldErrors(prev => ({
                ...prev,
                [fieldName]: t('appointmentForm.errors.invalidChars')
            }));
            return false;
        }
        
        // Clear error if validation passes
        setFieldErrors(prev => ({
            ...prev,
            [fieldName]: ''
        }));
        return true;
    };

    // Fonction pour gérer les changements de texte avec validation
    const handleTextChange = (value, setter, fieldName) => {
        // Block spaces at the beginning
        if (value.startsWith(' ')) {
            return;
        }
        
        // Block multiple spaces
        if (value.includes('  ')) {
            setFieldErrors(prev => ({
                ...prev,
                [fieldName]: t('appointmentForm.errors.multipleSpaces')
            }));
            return;
        }
        
        // Block multiple apostrophes or hyphens
        if (value.includes("''") || value.includes('--')) {
            return;
        }
        
        // Check for valid characters
        const validPattern = /^[a-zA-ZÀ-ÿ',\s-]*$/;
        
        if (value && !validPattern.test(value)) {
            setFieldErrors(prev => ({
                ...prev,
                [fieldName]: t('appointmentForm.errors.invalidChars')
            }));
            return;
        }
        
        // Clear error if validation passes
        setFieldErrors(prev => ({
            ...prev,
            [fieldName]: ''
        }));
        
        setter(value);
    };
    useEffect(() => {
        const fetchData = async () => {
          // Récupérer les spécialités du secrétaire si c'est un secrétaire
          let secretarySpecialtiesData = [];
          if (user.role === 'secretary') {
            try {
              const specialtiesResponse = await secretarySpecialties.getCurrentUserSpecialties();
              secretarySpecialtiesData = specialtiesResponse.data || [];
              setSecretarySpecialtyList(secretarySpecialtiesData);
            } catch (error) {
              //Erreur lors du chargement des spécialités du secrétaire
            }
          }

          if (user.role === 'patient') {
            const patientResponse = await patients.getPatientByUserId(user.id);
            setAllPatients([patientResponse.data]);
            setSelectedPatient(patientResponse.data.id);
            setPatientFilter(`${user.firstName} ${user.lastName}`);
          } else {
            const patientsResponse = await patients.getAll();
            setAllPatients(patientsResponse.data);
            
            if (appointment) {
              const patient = patientsResponse.data.find(p => p.id === appointment.patientId);
              if (patient) {
                setPatientFilter(`${patient.User.firstName} ${patient.User.lastName}`);
              }
            }
          }
          
          // Récupérer les docteurs selon le rôle
          let doctorsResponse;
          if (user.role === 'secretary' && secretarySpecialtiesData.length > 0) {
            // Filtrer les docteurs par spécialités du secrétaire
            doctorsResponse = await doctors.getAllBySpecialties(secretarySpecialtiesData);
          } else {
            // Récupérer tous les docteurs pour les autres rôles
            doctorsResponse = await doctors.getAll();
          }
          
          setAllDoctors(doctorsResponse.data);
          
          if (appointment) {
            const doctor = doctorsResponse.data.find(d => d.id === appointment.doctorId);
            if (doctor) {
              setDoctorFilter(`${doctor.User.firstName} ${doctor.User.lastName} - ${doctor.specialization}`);
              setSelectedDoctorSpecialty(doctor.specialization);
              updateAvailableVisitTypes(doctor.specialization);
            }
          }
        };
        
        fetchData();
      }, [user, appointment]);

    const handleDateKeyDown = (e) => {
        // Prevent typing in date field, only allow date picker
        e.preventDefault();
    };

    const handlePatientFilterChange = (e) => {
        handleTextChange(e.target.value, setPatientFilter, 'patientFilter');
        setShowPatientDropdown(true);
    };

    const handleDoctorFilterChange = (e) => {
        handleTextChange(e.target.value, setDoctorFilter, 'doctorFilter');
        setShowDoctorDropdown(true);
    };

    const handleCustomVisitTypeChange = (e) => {
        handleTextChange(e.target.value, setCustomVisitType, 'customVisitType');
    };

    const handlePatientFilterBlur = (e) => {
        validateTextOnlyField(e.target.value, 'patientFilter');
    };

    const handleDoctorFilterBlur = (e) => {
        validateTextOnlyField(e.target.value, 'doctorFilter');
    };

    const handleCustomVisitTypeBlur = (e) => {
        validateTextOnlyField(e.target.value, 'customVisitType');
    };
    
      useEffect(() => {
        updateAvailableVisitTypes(selectedDoctorSpecialty);
      }, [selectedDoctorSpecialty]);    

    const updateAvailableVisitTypes = (specialty) => {
        if (!specialty) {
          setAvailableVisitTypes([]);
          return;
        }
    
        let visitTypes = [];
        
        if (specialty.includes(',')) {
          const specialtyList = specialty.split(',').map(s => s.trim());
          const combinedTypes = [];
          
          specialtyList.forEach(spec => {
            if (visitTypesWithAmounts[spec]) {
              combinedTypes.push(...Object.keys(visitTypesWithAmounts[spec]));
            }
          });
          
          visitTypes = [...new Set(combinedTypes)];
        } else {
          visitTypes = Object.keys(visitTypesWithAmounts[specialty] || {});
        }
        
        // Ajouter "Other" seulement s'il n'existe pas déjà
        if (!visitTypes.includes('Other')) {
          visitTypes.push('Other');
        }
        
        setAvailableVisitTypes(visitTypes);
      };

      const getAmountForVisitType = (specialty, visitType) => {
        if (!specialty || !visitType || visitType === 'Other') {
          return 100.00; // Default amount for "Other"
        }

        if (specialty.includes(',')) {
          const specialtyList = specialty.split(',').map(s => s.trim());
          for (const spec of specialtyList) {
            if (visitTypesWithAmounts[spec] && visitTypesWithAmounts[spec][visitType]) {
              return visitTypesWithAmounts[spec][visitType];
            }
          }
        } else {
          if (visitTypesWithAmounts[specialty] && visitTypesWithAmounts[specialty][visitType]) {
            return visitTypesWithAmounts[specialty][visitType];
          }
        }
        
        return 100.00; // Default amount
      };

      const handleVisitTypeChange = (selectedVisitType) => {
        setVisitType(selectedVisitType);
        if (selectedVisitType !== 'Other') {
          setCustomVisitType('');
          const newAmount = getAmountForVisitType(selectedDoctorSpecialty, selectedVisitType);
          setAmount(newAmount);
        } else {
          setAmount(100.00); // Default amount for "Other"
        }
      };
    
      const generateTimeSlots = (startTime, endTime, durationMinutes) => {
        if (!startTime || !endTime || !durationMinutes) return [];
    
        const slots = [];
        let currentTime = new Date(`2000-01-01T${startTime}`);
        const endDateTime = new Date(`2000-01-01T${endTime}`);
    
        while (currentTime < endDateTime) {
          const slotStart = currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          });
          
          const nextTime = new Date(currentTime.getTime() + durationMinutes * 60000);
          
          if (nextTime <= endDateTime) {
            const slotEnd = nextTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            });
            
            slots.push(`${slotStart} to ${slotEnd}`);
          }
          currentTime = nextTime;
        }
        return slots;
      };

      const isPastSlot = (slotDate, slot) => {
        const todayStr = new Date().toISOString().split('T')[0];
        if (slotDate !== todayStr) return false;
        const startTime = slot.split(' to ')[0];
        const [hours, minutes] = startTime.split(':').map(Number);
        const slotDateTime = new Date();
        slotDateTime.setHours(hours, minutes, 0, 0);
        return slotDateTime < new Date();
      };

      useEffect(() => {
        const fetchScheduleAndBookings = async () => {
          if (!selectedDoctor || !date) {
            setAvailableTimeSlots([]);
            setDoctorSchedules([]);
            setBookedSlots([]);
            return;
          }
    
          setIsLoadingSlots(true);
    
          try {
            const scheduleResponse = await workSchedules.getDoctorSchedule(
              selectedDoctor,
              date,
              date
            );
    
            const daySchedules = scheduleResponse.data.schedules || [];
            
            const availableSchedules = daySchedules.filter(schedule => 
              schedule.date === date && schedule.isAvailable
            );
            
            setDoctorSchedules(availableSchedules);
            
            if (availableSchedules.length === 0) {
              setAvailableTimeSlots([]);
              setIsLoadingSlots(false);
              return;
            }
    
            const appointmentsResponse = await appointments.getAll();
            const doctorAppointments = appointmentsResponse.data.filter(apt => 
              apt.doctorId === selectedDoctor && 
              apt.date === date && 
              apt.status !== 'cancelled' &&
              (!appointment || apt.id !== appointment.id)
            );
    
            const booked = doctorAppointments.map(apt => apt.time);
            setBookedSlots(booked);
    
            const allSlots = [];
            
            availableSchedules.forEach(schedule => {
              const scheduleSlots = generateTimeSlots(
                schedule.startTime,
                schedule.endTime,
                schedule.durationMinutes
              );
              allSlots.push(...scheduleSlots);
            });
    
            const uniqueSlots = [...new Set(allSlots)];
            uniqueSlots.sort((a, b) => {
              const timeA = a.split(' to ')[0];
              const timeB = b.split(' to ')[0];
              return timeA.localeCompare(timeB);
            });
    
            const available = uniqueSlots.filter(slot => !booked.includes(slot) && !isPastSlot(date, slot));
            setAvailableTimeSlots(available);
    
            if (time && !available.includes(time)) {
              setTime('');
            }
          } catch (error) {
            setAvailableTimeSlots([]);
            setDoctorSchedules([]);
          }
    
          setIsLoadingSlots(false);
        };
    
        fetchScheduleAndBookings();
      }, [selectedDoctor, date, appointment]);
    
      useEffect(() => {
        const handleClickOutside = (event) => {
          if (patientRef.current && !patientRef.current.contains(event.target)) {
            setShowPatientDropdown(false);
          }
          if (doctorRef.current && !doctorRef.current.contains(event.target)) {
            setShowDoctorDropdown(false);
          }
        };
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      const filteredPatients = allPatients.filter(patient => 
        (patient.User?.firstName?.toLowerCase().includes(patientFilter.toLowerCase()) ||
         patient.User?.lastName?.toLowerCase().includes(patientFilter.toLowerCase()))
      );
    
      // Filtrer les docteurs selon le rôle et les spécialités
      const filteredDoctors = allDoctors.filter(doctor => {
        const matchesSearch = doctor.User?.firstName?.toLowerCase().includes(doctorFilter.toLowerCase()) ||
                             doctor.User?.lastName?.toLowerCase().includes(doctorFilter.toLowerCase()) ||
                             doctor.specialization?.toLowerCase().includes(doctorFilter.toLowerCase());
        
        return matchesSearch;
      });
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        
        const appointmentData = {
          patientId: selectedPatient,
          doctorId: selectedDoctor,
          date,
          time,
          visitDescription: visitType === 'Other' ? customVisitType : visitType,
          amount: parseFloat(amount),
          // Envoyer le statut seulement si c'est un secrétaire
          ...(user.role === 'secretary' && { status })
        };
    
        try {
          if (appointment) {
            await appointments.update(appointment.id, appointmentData);
          } else {
            await appointments.create(appointmentData);
          }
          onClose();
        } catch (error) {
          //Erreur lors de la sauvegarde du rendez-vous
        }
      };
    
      const renderTimeSlots = () => {
        if (isLoadingSlots) {
          return <div className="loading-slots">{t('appointmentForm.loadingSlots')}</div>;
        }

        if (!selectedDoctor || !date) {
          return <div className="no-slots-message">{t('appointmentForm.selectDoctorAndDate')}</div>;
        }

        if (doctorSchedules.length === 0) {
          return <div className="no-slots-message">{t('appointmentForm.doctorNotWorking')}</div>;
        }

        if (availableTimeSlots.length === 0) {
          return <div className="no-slots-message">{t('appointmentForm.noSlotsAvailable')}</div>;
        }

        return (
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="form-select"
          >
            <option value="">{t('appointmentForm.selectTimeSlot')}</option>
            {availableTimeSlots.map((slot, index) => (
              <option key={index} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        );
      };

      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {appointment ? t('appointmentForm.editTitle') : t('appointmentForm.newTitle')}
              </h2>
              <button onClick={onClose} className="close-button">
                <X className="close-icon" />
              </button>
            </div>
    
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-fields">
                <div className="form-group" ref={patientRef}>
                  <label className="form-label">{t('appointmentForm.patientLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('appointmentForm.patientSearchPlaceholder')}
                    value={patientFilter}
                    onChange={handlePatientFilterChange}
                    onBlur={handlePatientFilterBlur}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="form-input"
                    disabled={user.role === 'patient'}
                  />
                  {fieldErrors.patientFilter && (
                    <p className="error-text">{fieldErrors.patientFilter}</p>
                  )}
                  {showPatientDropdown && user.role !== 'patient' && (
                    <div className="dropdown-list">
                      {filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedPatient(patient.id);
                            setPatientFilter(`${patient.User?.firstName} ${patient.User?.lastName}`);
                            setShowPatientDropdown(false);
                          }}
                        >
                          {patient.User?.firstName} {patient.User?.lastName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
    
                <div className="form-group" ref={doctorRef}>
                  <label className="form-label">{t('appointmentForm.doctorLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('appointmentForm.doctorSearchPlaceholder')}
                    value={doctorFilter}
                    onChange={handleDoctorFilterChange}
                    onBlur={handleDoctorFilterBlur}
                    onFocus={() => setShowDoctorDropdown(true)}
                    className="form-input"
                  />
                  {fieldErrors.doctorFilter && (
                    <p className="error-text">{fieldErrors.doctorFilter}</p>
                  )}
                  {showDoctorDropdown && (
                    <div className="dropdown-list">
                      {filteredDoctors.length === 0 ? (
                        <div className="dropdown-item disabled">
                          {t('appointmentForm.noDoctorsFound')}
                        </div>
                      ) : (
                        filteredDoctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            className="dropdown-item"
                            onClick={() => {
                              setSelectedDoctor(doctor.id);
                              setSelectedDoctorSpecialty(doctor.specialization);
                              setDoctorFilter(`${doctor.User?.firstName} ${doctor.User?.lastName} - ${doctor.specialization}`);
                              setShowDoctorDropdown(false);
                              setVisitType('');
                              setCustomVisitType('');
                              setAmount(0);
                            }}
                          >
                            {doctor.User?.firstName} {doctor.User?.lastName} - {doctor.specialization}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
    
                <div className="form-group">
                  <label className="form-label">{t('appointmentForm.visitTypeLabel')}</label>
                  <select
                    value={visitType}
                    onChange={(e) => handleVisitTypeChange(e.target.value)}
                    disabled={!selectedDoctor}
                    className="form-select"
                  >
                    <option value="">{t('appointmentForm.selectVisitType')}</option>
                    {availableVisitTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type === 'Other' ? t('appointmentForm.other') : type}
                      </option>
                    ))}
                  </select>
                  {visitType === 'Other' && (
                    <>
                      <input
                        type="text"
                        value={customVisitType}
                        onChange={handleCustomVisitTypeChange}
                        onBlur={handleCustomVisitTypeBlur}
                        placeholder={t('appointmentForm.customVisitTypePlaceholder')}
                        className="form-input mt-2"
                      />
                      {fieldErrors.customVisitType && (
                        <p className="error-text">{fieldErrors.customVisitType}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('appointmentForm.amountLabel')}</label>
                  <div className="amount-display">
                    <input
                      type="number"
                      value={amount}
                      readOnly
                      className="form-input amount-input"
                      step="0.01"
                      min="0"
                    />
                    <span className="currency">€</span>
                  </div>
                </div>
    
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{t('appointmentForm.dateLabel')}</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      onKeyDown={handleDateKeyDown}
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('appointmentForm.timeLabel')}</label>
                    {renderTimeSlots()}
                  </div>
                </div>

                {user.role === 'secretary' && (
                  <div className="form-group">
                    <label className="form-label">{t('appointmentForm.statusLabel')}</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="form-select"
                    >
                      <option value="pending">{t('common.status.pending')}</option>
                      <option value="confirmed">{t('common.status.confirmed')}</option>
                      <option value="completed">{t('common.status.completed')}</option>
                      <option value="cancelled">{t('common.status.cancelled')}</option>
                    </select>
                  </div>
                )}
              </div>
    
              <div className="button-group">
                <button
                  type="button"
                  onClick={onClose}
                  className="button button-secondary"
                >
                  {t('appointmentForm.cancel')}
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={!selectedDoctor || !date || !time || (!visitType || (visitType === 'Other' && !customVisitType))}
                >
                  {appointment ? t('appointmentForm.updateAppointment') : t('appointmentForm.createAppointment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      );        
}

export default AddEditAppointment;