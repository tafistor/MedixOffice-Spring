import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RouteProtection from './utils/routeProtection';

import Dashboard from './Components/Dashboard/Dashboard';
import Login from './Components/Login/Login';
import Signup from './Components/Signup/Signup';
import PasswordReset from './Components/PasswordReset/PasswordReset';
import CompleteProfile from './Components/CompleteProfile/CompleteProfile';
import Doctors from './Components/Doctors/Doctors';
import AddEditDoctor from './Components/Doctors/AddEditDoctor';
import Patients from './Components/Patients/Patients';
import AddEditPatient from './Components/AddEditPatient/AddEditPatient';
import Schedule from './Components/Schedule/Schedule';
import Appointments from './Components/Appointments/Appointments';
import MedicalRecords from './Components/MedicalRecords/MedicalRecords';
import Consultations from './Components/Consultations/Consultations';
import DoctorDetails from './Components/Doctors/DoctorDetails';
import Billing from './Components/Billing/Billing';
import SecretaryManagement from './Components/SecretaryManagement/SecretaryManagement';

const { ProtectedRoute, RoleBasedRoute, AccessDenied, NotFound } = RouteProtection;
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },
  {  path: '/signup',  element: <Signup />  },
  {  path: '/password-reset',  element: <PasswordReset />  },
  {  path: '/password-reset',  element: <PasswordReset />  },
  {  path: '/complete-profile',  element: <ProtectedRoute><CompleteProfile /></ProtectedRoute> },
  {  path: '/dashboard',  element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  {  path: '/doctors', element: <RoleBasedRoute allowedRoles={['admin', 'secretary']}><Doctors /></RoleBasedRoute>  },
  { path: '/doctordetails', element: <RoleBasedRoute allowedRoles={['admin', 'secretary']}><DoctorDetails /></RoleBasedRoute> },
  {  path: '/addEditDoctor',  element: <RoleBasedRoute allowedRoles={['admin']}><AddEditDoctor /></RoleBasedRoute> },
  { path: '/patients',  element: <RoleBasedRoute allowedRoles={['admin', 'secretary', 'doctor']}><Patients /></RoleBasedRoute> },
  {  path: '/addEditPatient', element: <RoleBasedRoute allowedRoles={['admin', 'secretary']}><AddEditPatient /></RoleBasedRoute> },
  {  path: '/appointments',  element: <RoleBasedRoute allowedRoles={['admin', 'secretary', 'patient']}><Appointments /></RoleBasedRoute> },
  {  path: '/consultations',  element: <RoleBasedRoute allowedRoles={['admin', 'doctor', 'patient']}><Consultations /></RoleBasedRoute> },
  {  path: '/medical-records',  element: <RoleBasedRoute allowedRoles={['admin', 'doctor', 'patient']}><MedicalRecords /></RoleBasedRoute> },
  {  path: '/billing',  element: <RoleBasedRoute allowedRoles={['admin', 'secretary', 'patient']}><Billing /></RoleBasedRoute> },
  { path: '/schedule',  element: <RoleBasedRoute allowedRoles={['admin', 'doctor', 'secretary']}><Schedule /></RoleBasedRoute> },
  { path: '/secretary-management',  element: <RoleBasedRoute allowedRoles={['admin']}><SecretaryManagement /></RoleBasedRoute> },
  {  path: '/access-denied',  element: <AccessDenied /> },
  {  path: '*',  element: <NotFound /> }
]);

function App() {
  
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
export default App;