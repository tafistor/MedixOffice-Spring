import axios from 'axios';

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData)
  };
export const patients = {
  getAll: () => api.get('/patients'),
  getOne: (id) => api.get(`/patients/${id}`),
  create: (patientData) => api.post('/patients', patientData),
  update: (id, patientData) => api.put(`/patients/${id}`, patientData),
  completeProfile: (profileData) => api.post('/patients/completeProfile', profileData),
  getCount: () => api.get('/patients/count'),
  getPatientByUserId: (userId) => api.get(`/patients/byUser/${userId}`),
  delete: (id) => api.delete(`/patients/${id}`),
};
export const doctors = {
  getAll: () => api.get('/doctors'),
  getAllBySpecialties: (specialties) => api.get('/doctors', { params: { specialties: specialties.join(',') } }),
  update: (id, doctorData) => api.put(`/doctors/${id}`, doctorData),
  completeProfile: (profileData) => api.post('/doctors/completeProfile', profileData),
  create: (doctorData) => api.post('/doctors', doctorData),
  getCount: () => api.get('/doctors/count'),
  getDoctorByUserId: (userId) => api.get(`/doctors/byUser/${userId}`),
  delete: (id) => api.delete(`/doctors/${id}`),
}; 
export const appointments = {
  getAll: () => api.get('/appointments'),
  create: (appointmentData) => api.post('/appointments', appointmentData),
  update: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
  cancel: (id) => api.delete(`/appointments/${id}`),
  getCountByDate: (date) => api.get('/appointments/count', { params: { date } }),
  getDoctorAppointments: (doctorId, startDate, endDate) => api.get(`/appointments/doctor/${doctorId}`, {  params: { startDate, endDate } }),
  getPatientAppointments: (patientId) => api.get(`/appointments/patient/${patientId}/today`),
};
export const workSchedules = {
  getAll: (startDate, endDate) => 
    api.get(`/work-schedules?startDate=${startDate}&endDate=${endDate}`),
  getAllBySpecialties: (startDate, endDate, specialties) => 
    api.get(`/work-schedules?startDate=${startDate}&endDate=${endDate}&specialties=${specialties.join(',')}`),
  
  getDoctorSchedule: (doctorId, startDate, endDate) => 
    api.get(`/work-schedules/doctor/${doctorId}?startDate=${startDate}&endDate=${endDate}`),
  
  create: (data) => 
    api.post('/work-schedules', data),
  
  update: (doctorId, data) => 
    api.put(`/work-schedules/${doctorId}`, data),
  
  delete: (doctorId, startDate, endDate) => 
    api.delete(`/work-schedules/doctor/${doctorId}?startDate=${startDate}&endDate=${endDate}`),
  
  copyPreviousWeek: (data) => 
    api.post('/work-schedules/copy-previous-week', data)
};
export const consultations = {
  getAll: () => api.get('/consultations'),
  getForPatient: (patientId) => api.get(`/consultations/patient/${patientId}`),
  create: (consultationData) => api.post('/consultations', consultationData),
  update: (id, consultationData) => api.put(`/consultations/${id}`, consultationData),
  getConsultationById: (id) => api.get(`/consultations/${id}`),
  delete: (id) => api.delete(`/consultations/${id}`),
  getConsultationCountByDate: (date) => api.get('/consultations/count', { params: { date } }),
};
export const invoices = {
  getAll: () => api.get('/invoices'),
  getWithDetails: (id) => api.get(`/invoices/${id}`),
  create: (invoiceData) => api.post('/invoices', invoiceData),
  update: (id, invoiceData) => api.put(`/invoices/${id}`, invoiceData),
  delete: (id) => api.delete(`/invoices/${id}`),
};
export const medicalRecords = {
  getAll: () => api.get('/medical-records'),
  create: (formData) => {
    return api.post('/medical-records', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, formData) => {
    return api.put(`/medical-records/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id) => api.delete(`/medical-records/${id}`),
  generatePDF: (id) => api.get(`/medical-records/${id}/pdf`, {
    responseType: 'blob'
  }),
  downloadComplete: (id) => api.get(`/medical-records/${id}/download-complete`, {
    responseType: 'blob'
  })
};
export const secretarySpecialties = {
  getSecretaries: () => api.get('/secretary-specialties/secretaries'),
  updateSpecialties: (data) => api.post('/secretary-specialties/update', data),
  getUserSpecialties: (userId) => api.get(`/secretary-specialties/user/${userId}`),
  getCurrentUserSpecialties: () => api.get('/secretary-specialties/current-user'),
};
export const notifications = {
  getUnreadNotifications: (userId) => api.get(`/notifications/user/${userId}/unread`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: (userId) => api.put(`/notifications/user/${userId}/read-all`),
};
export const payments = {
  payWithPaypal: (amount, invoiceId) => api.post('/payments/paypal', { amount, invoiceId }),
  payWithStripe: (amount, invoiceId) => api.post('/payments/stripe', { amount, invoiceId }),
  capturePaypal: (orderId, invoiceId) => api.post('/payments/paypal/capture', { orderId, invoiceId }),
};

export const passwordReset = {
  requestCode: (email) => api.post('/password-reset/request-code', { email }),
  verifyCode: (email, code) => api.post('/password-reset/verify-code', { email, code }),
  resetPassword: (email, code, newPassword) => api.post('/password-reset/reset-password', { email, code, newPassword }),
};

export default api;