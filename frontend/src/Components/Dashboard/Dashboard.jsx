import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Calendar, Stethoscope, LogOut, FileText, CreditCard, ClipboardList, Menu, LayoutDashboard, Clock, Settings, Bell, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { doctors, patients, appointments, workSchedules, consultations, notifications } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo/Logo';
import DoctorDetails from '../Doctors/DoctorDetails';
import ViewPatient from '../Patients/ViewPatient';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import './Dashboard.css';

function Dashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [doctorCount, setDoctorCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [consultationCount, setConsultationCount] = useState(0);
  const [doctorData, setDoctorData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === 'doctor') {
        const doctorResponse = await doctors.getDoctorByUserId(user?.id);
        const doctor = doctorResponse.data;
        setDoctorData(doctor);

        const { monday, friday } = getWeekDates(selectedDate);
        const startDate = monday.toISOString().split('T')[0];
        const endDate = friday.toISOString().split('T')[0];

        const [scheduleRes, appointmentsRes] = await Promise.all([
          workSchedules.getDoctorSchedule(doctor.id, startDate, endDate),
          appointments.getDoctorAppointments(doctor.id, startDate, endDate)
        ]);

        setDoctorSchedule(scheduleRes.data);
        setDoctorAppointments(appointmentsRes.data);
      } else if (user?.role === 'patient') {
        const patientResponse = await patients.getPatientByUserId(user?.id);
        setPatientData(patientResponse.data);
      } else if (user?.role === 'secretary') {
        // Charger les notifications non lues pour le secrétaire
        try {
          const notificationsResponse = await notifications.getUnreadNotifications(user.id);
          setUnreadNotifications(notificationsResponse.data);
        } catch (error) {
          //erreur lors du chargement des notifications
        }

        const [doctorsRes, patientsRes, appointmentsRes, consultationsRes] = await Promise.all([
          doctors.getCount(),
          patients.getCount(),
          appointments.getCountByDate(new Date().toISOString().split('T')[0]),
          consultations.getConsultationCountByDate(new Date().toISOString().split('T')[0])
        ]);
        
        setDoctorCount(doctorsRes.data.count);
        setPatientCount(patientsRes.data.count);
        setAppointmentCount(appointmentsRes.data.count);
        setConsultationCount(consultationsRes.data.count);
      } else {
        const [doctorsRes, patientsRes, appointmentsRes, consultationsRes] = await Promise.all([
          doctors.getCount(),
          patients.getCount(),
          appointments.getCountByDate(new Date().toISOString().split('T')[0]),
          consultations.getConsultationCountByDate(new Date().toISOString().split('T')[0])
        ]);
        
        setDoctorCount(doctorsRes.data.count);
        setPatientCount(patientsRes.data.count);
        setAppointmentCount(appointmentsRes.data.count);
        setConsultationCount(consultationsRes.data.count);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, selectedDate]);

  // Fonction pour rafraîchir les notifications
  const refreshNotifications = async () => {
    if (user?.role === 'secretary') {
      try {
        const notificationsResponse = await notifications.getUnreadNotifications(user.id);
        setUnreadNotifications(notificationsResponse.data);
      } catch (error) {
        //Erreur lors du rafraîchissement des notifications
      }
    }
  };

  // Rafraîchir les notifications toutes les 30 secondes
  useEffect(() => {
    if (user?.role === 'secretary') {
      const interval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const getWeekDates = (date) => {
    const monday = new Date(date);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    
    return { monday, friday };
  };

  const handleDateChange = async (newDate) => {
    setSelectedDate(newDate);
    if (doctorData) {
      const { monday, friday } = getWeekDates(newDate);
      const startDate = monday.toISOString().split('T')[0];
      const endDate = friday.toISOString().split('T')[0];

      const [scheduleRes, appointmentsRes] = await Promise.all([
        workSchedules.getDoctorSchedule(doctorData.id, startDate, endDate),
        appointments.getDoctorAppointments(doctorData.id, startDate, endDate)
      ]);
      
      setDoctorSchedule(scheduleRes.data);
      setDoctorAppointments(appointmentsRes.data);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await notifications.markAsRead(notification.id);
      setUnreadNotifications(prev => prev.filter(n => n.id !== notification.id));
      navigate('/appointments');
      setShowNotificationDropdown(false);
    } catch (error) {
      //Erreur lors de la navigation
    }
  };

  const stats = [
    { title: t('dashboard.stats.doctors'), count: doctorCount, icon: Users, className: "icon-doctors" },
    { title: t('dashboard.stats.patients'), count: patientCount, icon: UserPlus, className: "icon-patients" },
    { title: t('dashboard.stats.appointments'), count: appointmentCount, icon: Calendar, className: "icon-appointments" },
    { title: t('dashboard.stats.consultations'), count: consultationCount, icon: Stethoscope, className: "icon-consultations" },
  ];

  const menuItems = [
    { title: t('dashboard.menu.dashboard'), icon: LayoutDashboard, path: '/dashboard',access: ['admin', 'secretary', 'doctor', 'patient'] },
    { title: t('dashboard.menu.doctors'), icon: Users, path: '/doctors', access: ['admin', 'secretary'] },
    { title: t('dashboard.menu.patients'), icon: UserPlus, path: '/patients',access: ['admin', 'secretary', 'doctor']  },
    { title: t('dashboard.menu.appointments'), icon: Calendar, path: '/appointments',access: ['admin', 'secretary', 'patient']  },
    { title: t('dashboard.menu.consultations'),  icon: ClipboardList,  path: '/consultations', access: ['admin', 'doctor', 'patient'] },
    { title: t('dashboard.menu.medicalRecords'),  icon: FileText,  path: '/medical-records', access: ['admin', 'doctor', 'patient'] },
    { title: t('dashboard.menu.billing'), icon: CreditCard, path: '/billing',access: ['admin', 'secretary', 'patient'] },
    { title: t('dashboard.menu.schedule'), icon: Clock, path: '/schedule',access: ['admin', 'doctor', 'secretary'] },
    { title: t('dashboard.menu.secretaryManagement'), icon: Settings, path: '/secretary-management', access: ['admin'] },
  ];

  const handleLogout = () => {
    logout();
  };
  
  const renderDashboardContent = () => {
    if (user?.role === 'doctor') {
      return (
        <DoctorDetails
          isOpen={true}
          doctor={doctorData}
          schedule={doctorSchedule}
          appointments={doctorAppointments}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          isDashboard={true}
        />
      );
    } else if (user?.role === 'patient') {
      return (
        <ViewPatient
          isOpen={true}
          patient={patientData}
          onClose={() => {}}
          isDashboard={true}
        />
      );
    } else {
      return (
        <div className="dashboard-content">
          <div className="stats-grid">
            {stats.map((item) => (
              <motion.div
                key={item.title}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className={`stat-icon-container ${item.className}`}>
                  <item.icon className="stat-icon" />
                </div>
                <div className="stat-details">
                  <h3 className="stat-title">{item.title}</h3>
                  <p className="stat-count">{item.count}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="flex items-center gap-4">
            <button 
              className="menu-button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <Logo />
          <div className="navbar-right">
            <LanguageSwitcher />
            <span className="welcome-text">
              {t('dashboard.welcome', { name: `${user?.firstName} ${user?.lastName}` })}
            </span>

            {/* Bouton de notification pour les secrétaires */}
            {user?.role === 'secretary' && unreadNotifications.length > 0 && (
              <div className="notification-container">
                <button 
                  className="notification-button"
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                >
                  <Bell className="notification-icon" />
                  <span className="notification-badge">{unreadNotifications.length}</span>
                </button>
                
                {showNotificationDropdown && (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      <span>{t('dashboard.notifications')} ({unreadNotifications.length})</span>
                      <button 
                        onClick={() => setShowNotificationDropdown(false)}
                        className="close-dropdown-btn"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="notification-list">
                      {unreadNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="notification-item"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="notification-message">
                            {notification.message}
                          </div>
                          <div className="notification-time">
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button className="logout-button" onClick={handleLogout}>
              <LogOut className="h-5 w-5 sm:mr-1" />
              <span className="hidden sm:inline">{t('dashboard.logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-content">
          {menuItems
            .filter(item => item.access.includes(user?.role))
            .map((item) => (
              <a key={item.title} href={item.path} className="sidebar-item">
                <item.icon className="sidebar-icon" />
                <span>{item.title}</span>
              </a>
            ))
          }
        </div>
      </div>

      <main className={`main-content ${isSidebarOpen ? 'content-shifted' : ''}`}>
        {renderDashboardContent()}
      </main>
    </div>
  );
}

export default Dashboard;