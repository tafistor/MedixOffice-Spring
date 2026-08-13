import React, { useState, useEffect } from 'react';
import { Search, Plus, User, ArrowLeft } from 'lucide-react';
import AddEditPatient from '../AddEditPatient/AddEditPatient';
import ViewPatient from './ViewPatient';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { useNavigate } from 'react-router-dom';
import { patients } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Patients.css';

function Patients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [search, setSearch] = useState("");
  const [patientList, setPatientList] = useState([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const isDoctor = user.role === 'doctor';

  useEffect(() => {
    const fetchPatients = async () => {
      const response = await patients.getAll();
      setPatientList(response.data);
    };

    fetchPatients();
  }, []);

  const filteredPatients = patientList.filter((patient) =>
    `${patient.User.firstName} ${patient.User.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setIsDialogOpen(true);
  };

  const handleViewPatient = async (patient) => {
    const response = await patients.getOne(patient.id);
    setViewPatient(response.data);
    setIsViewDialogOpen(true);
  };

  const handleEditPatient = async (patient) => {
    const response = await patients.getOne(patient.id);
    setSelectedPatient(response.data);
    setIsDialogOpen(true);
  };

  const handleDeletePatient = async (patient) => {
    setPatientToDelete(patient);
    setIsConfirmDialogOpen(true);
  };

  const confirmDeletePatient = async () => {
    if (patientToDelete) {
      await patients.delete(patientToDelete.id);
      setPatientList(patientList.filter(p => p.id !== patientToDelete.id));
      setPatientToDelete(null);
    }
  };

  const handleSubmit = async (formData) => {
    if (selectedPatient) {
      await patients.update(selectedPatient.id, formData);
    } else {
      await patients.create(formData);
    }
    
    const response = await patients.getAll();
    setPatientList(response.data);
    
    setIsDialogOpen(false);
  };
  

  const handlePatientClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="patients-container">
      <div className="patients-header">
        <div className="header-content">
          <button onClick={handlePatientClick} className="add-patient-btn">
            <ArrowLeft className="icon" />
          </button>
          <div className="header-text">
            <h1>Patients</h1>
          </div>
        </div>
        {!isDoctor && (
          <button 
          className="add-patient-btn"
          onClick={handleAddPatient}
        >
          <Plus className="icon" />
          New Patient
        </button>
        )} 
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search patients..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="patients-table">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  <div className="patient-info">
                    <User className="patient-icon" />
                    <div>
                      <div className="patient-name">{patient.User.firstName} {patient.User.lastName}</div>
                      <div className="patient-email">{patient.email}</div>
                    </div>
                  </div>
                </td>
                <td>{patient.age ? `${patient.age} years` : 'N/A'}</td>
                <td>{patient.phone}</td>
                <td>
                  <button 
                    className="action-btn"
                    onClick={() => handleViewPatient(patient)}
                  >
                    View
                  </button>
                  {!isDoctor && ( <>
                    <span className="separator">|</span>
                  <button 
                    className="action-btn"
                    onClick={() => handleEditPatient(patient)}
                  >
                    Edit
                  </button>
                  <span className="separator">|</span>
                  <button
                  className="action-btn"
                  onClick={() => handleDeletePatient(patient)}
                  >
                    Delete
                  </button> </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddEditPatient
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPatient(null);
        }}
        onSubmit={handleSubmit}
        patient={selectedPatient}
      />

      <ViewPatient
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setViewPatient(null);
        }}
        patient={viewPatient}
      />
      
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setPatientToDelete(null);
        }}
        onConfirm={confirmDeletePatient}
        title="Delete Patient"
        message={`Are you sure you want to delete ${patientToDelete?.User?.firstName} ${patientToDelete?.User?.lastName}? This action cannot be undone and will affect all related appointments and records.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default Patients;