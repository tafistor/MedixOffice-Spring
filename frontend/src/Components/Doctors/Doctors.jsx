import React, { useState, useEffect } from 'react';
import { Search, Plus, Stethoscope, Mail, Phone, ArrowLeft, Edit, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doctors, workSchedules, appointments, secretarySpecialties } from '../../services/api';
import AddEditDoctor from './AddEditDoctor';
import DoctorDetails from './DoctorDetails';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { useAuth } from '../../context/AuthContext';
import './Doctors.css';

function Doctors() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [doctorList, setDoctorList] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [doctorSchedule, setDoctorSchedule] = useState([]);
    const [doctorAppointments, setDoctorAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [userSpecialties, setUserSpecialties] = useState([]);
   const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
   const [doctorToDelete, setDoctorToDelete] = useState(null);
    useEffect(() => {
      if (user?.role === 'secretary') {
        loadUserSpecialties();
      } else {
        fetchDoctors();
      }
    }, [user]);
    const loadUserSpecialties = async () => {
      try {
        const response = await secretarySpecialties.getCurrentUserSpecialties();
        setUserSpecialties(response.data);
        fetchDoctors(response.data);
      } catch (error) {
        //erreur lors du chargement des spécialités
      }
    };
    const fetchDoctors = async (specialties = null) => {
      try {
        let response;
        if (user?.role === 'admin') {
          response = await doctors.getAll();
        } else if (user?.role === 'secretary' && specialties && specialties.length > 0) {
          response = await doctors.getAllBySpecialties(specialties);
        } else {
          response = await doctors.getAll();
        }
        setDoctorList(response.data);
      } catch (error) {
        //erreur lors du chargement des docteurs
      }
    };
    const filteredDoctors = doctorList.filter((doctor) =>
      `${doctor.User.firstName} ${doctor.User.lastName} ${doctor.specialization}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    const handleAddDoctor = () => {
      setSelectedDoctor(null);
      setIsDialogOpen(true);
    };

    const handleEditDoctor = (doctor) => {
      setSelectedDoctor(doctor);
      setIsDialogOpen(true);
    };

    const getWeekDates = (date) => {
      const monday = new Date(date);
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      
      const friday = new Date(monday);
      friday.setDate(friday.getDate() + 4);
      
      return { monday, friday };
    };

    const handleViewDetails = async (doctor) => {
      setSelectedDoctor(doctor);
      
      const { monday, friday } = getWeekDates(selectedDate);
      const startDate = monday.toISOString().split('T')[0];
      const endDate = friday.toISOString().split('T')[0];

      const [scheduleRes, appointmentsRes] = await Promise.all([
        workSchedules.getDoctorSchedule(doctor.id, startDate, endDate),
        appointments.getDoctorAppointments(doctor.id, startDate, endDate)
      ]);
      
      setDoctorSchedule(scheduleRes.data);
      setDoctorAppointments(appointmentsRes.data);
      setIsDetailsOpen(true);
    };

    const handleDateChange = async (newDate) => {
      setSelectedDate(newDate);
      if (selectedDoctor && isDetailsOpen) {
        const { monday, friday } = getWeekDates(newDate);
        const startDate = monday.toISOString().split('T')[0];
        const endDate = friday.toISOString().split('T')[0];

        const [scheduleRes, appointmentsRes] = await Promise.all([
          workSchedules.getDoctorSchedule(selectedDoctor.id, startDate, endDate),
          appointments.getDoctorAppointments(selectedDoctor.id, startDate, endDate)
        ]);
        
        setDoctorSchedule(scheduleRes.data);
        setDoctorAppointments(appointmentsRes.data);
      }
    };

    /*const handleDeleteDoctor = async (doctorId) => {
      await doctors.delete(doctorId);
      const response = await doctors.getAll();
      setDoctorList(response.data);
    };*/
    const handleDeleteDoctor = async (doctorId) => {
      setDoctorToDelete(doctorId);
      setIsConfirmDialogOpen(true);
    };

    const confirmDeleteDoctor = async () => {
      if (doctorToDelete) {
        await doctors.delete(doctorToDelete);
        if (user?.role === 'secretary') {
          loadUserSpecialties();
        } else {
          fetchDoctors();
        }
        setDoctorToDelete(null);
      }
    };

    const handleSubmit = async (formData) => {
      if (selectedDoctor) {
        await doctors.update(selectedDoctor.id, formData);
      } else {
        await doctors.create(formData);
      }
      
      const response = await doctors.getAll();
      setDoctorList(response.data);
      
      setIsDialogOpen(false);
    };
    

    return (
      <div className="doctors-container">
        <div className="doctors-header">
          <div className="header-content-doctor">
            <Link to="/dashboard" className="add-doctor-btn">
                <ArrowLeft className="icon-doctor" />
            </Link>
            <div className="header-text-doctor">
              <h1>Doctors</h1>
            </div>
          </div>
          <button className="add-doctor-btn" onClick={handleAddDoctor}>
            <Plus className="icon-doctor" />
            Add New Doctor
          </button>
        </div>

        <div className="search-container">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search doctors by name, specialization, or contact info..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="doctors-grid">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="doctor-card">
              <div className="doctor-info">
                <div className="doctor-header">
                  <div className="icon-wrapper">
                    <Stethoscope className="doctor-icon" />
                  </div>
                  <div className="doctor-title">
                    <h2>Dr. {doctor.User.firstName} {doctor.User.lastName}</h2>
                    <p>{doctor.specialization}</p>
                  </div>
                </div>

                <div className="contact-info">
                  <div className="contact-item">
                    <Mail className="icon-doctor" />
                    <a href={`mailto:${doctor.email}`}>{doctor.email}</a>
                  </div>
                  <div className="contact-item">
                    <Phone className="icon-doctor" />
                    <a href={`tel:${doctor.phone}`}>{doctor.phone}</a>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditDoctor(doctor)}
                  >
                    <Edit className="button-icon" />
                    Edit
                  </button>
                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewDetails(doctor)}
                  >
                    <Eye className="button-icon" />
                    View Details
                  </button>
                  <button 
                    className="edit-btn"
                    onClick={() => handleDeleteDoctor(doctor.id)}
                  >
                    <Trash2 className="button-icon" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <AddEditDoctor
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedDoctor(null);
          }}
          onSubmit={handleSubmit}
          doctor={selectedDoctor}
        />

        <DoctorDetails
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedDoctor(null);
          }}
          doctor={selectedDoctor}
          schedule={doctorSchedule}
          appointments={doctorAppointments}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
       
       <ConfirmationDialog
         isOpen={isConfirmDialogOpen}
         onClose={() => {
           setIsConfirmDialogOpen(false);
           setDoctorToDelete(null);
         }}
         onConfirm={confirmDeleteDoctor}
         title="Delete Doctor"
         message="Are you sure you want to delete this doctor? This action cannot be undone and will affect all related appointments and records."
         confirmText="Delete"
         cancelText="Cancel"
         type="danger"
       />
      </div>
    );
}

export default Doctors;