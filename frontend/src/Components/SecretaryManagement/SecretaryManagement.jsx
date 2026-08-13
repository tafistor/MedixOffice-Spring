import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, X, Save, Loader, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { secretarySpecialties } from '../../services/api';
import { specialisations } from '../../data/specializationsList';
import './SecretaryManagement.css';

function SecretaryManagement() {
  const navigate = useNavigate();
  const [secretaries, setSecretaries] = useState([]);
  const [selectedSecretary, setSelectedSecretary] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSecretaries();
  }, []);

  const loadSecretaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await secretarySpecialties.getSecretaries();
      setSecretaries(response.data || []);
    } catch (error) {
      setError('Failed to load secretaries. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSpecialties = (secretary) => {
    setSelectedSecretary(secretary);
    setSelectedSpecialties(secretary.specialties || []);
    setIsDialogOpen(true);
    setError(null);
  };

  const handleSpecialtyToggle = (specialty) => {
    setSelectedSpecialties(prev => {
      if (prev.includes(specialty)) {
        return prev.filter(s => s !== specialty);
      } else {
        return [...prev, specialty];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await secretarySpecialties.updateSpecialties({
        userId: selectedSecretary.id,
        specialties: selectedSpecialties
      });

      // Reload data after saving
      await loadSecretaries();
      
      setIsDialogOpen(false);
      setSelectedSecretary(null);
      setSelectedSpecialties([]);
    } catch (error) {
      setError('Error saving changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedSecretary(null);
    setSelectedSpecialties([]);
    setError(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Loader className="loading-spinner" />
          <span>Loading secretaries...</span>
        </div>
      </div>
    );
  }

  if (error && !isDialogOpen) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-header">
            <AlertCircle className="error-icon" />
            <span>Error</span>
          </div>
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={loadSecretaries}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="secretary-management-container">
      <div className="secretary-management-header">
        <div className="header-content">
          <button onClick={() => navigate('/dashboard')} className="add-patient-btn">
            <ArrowLeft className="icon" />
          </button>
          <div className="header-text">
            <h1>Secretary Management</h1>
            <p>Manage specialties assigned to secretaries</p>
          </div>
        </div>
      </div>

      <div className="secretaries-grid">
        {secretaries.length === 0 ? (
          <div className="no-secretaries">
            <Users className="no-secretaries-icon" />
            <h3>No Secretaries Found</h3>
            <p>There are currently no secretaries in the system.</p>
          </div>
        ) : (
          secretaries.map((secretary) => (
            <div key={secretary.id} className="secretary-card">
              <div className="secretary-info">
                <div className="secretary-header">
                  <div className="icon-wrapper">
                    <Users className="secretary-icon" />
                  </div>
                  <div className="secretary-details">
                    <h3>{secretary.firstName} {secretary.lastName}</h3>
                    <p className="secretary-email">{secretary.email}</p>
                  </div>
                </div>

                <div className="specialties-section">
                  <h4>Assigned Specialties:</h4>
                  <div className="specialties-list">
                    {secretary.specialties && secretary.specialties.length > 0 ? (
                      secretary.specialties.map((specialty, index) => (
                        <span key={index} className="specialty-tag">
                          {specialty}
                        </span>
                      ))
                    ) : (
                      <span className="no-specialties">No specialties assigned</span>
                    )}
                  </div>
                </div>

                <div className="secretary-actions">
                  <button 
                    className="edit-specialties-btn"
                    onClick={() => handleEditSpecialties(secretary)}
                  >
                    <Plus className="btn-icon" />
                    Manage Specialties
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isDialogOpen && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <div className="dialog-header">
              <h2>
                Manage Specialties - {selectedSecretary?.firstName} {selectedSecretary?.lastName}
              </h2>
              <button 
                className="close-btn" 
                onClick={handleClose}
                disabled={saving}
              >
                <X />
              </button>
            </div>

            {error && (
              <div className="dialog-error">
                <AlertCircle className="error-icon-small" />
                <span>{error}</span>
              </div>
            )}

            <div className="dialog-body">
              <p className="dialog-description">
                Select the specialties this secretary can manage:
              </p>
              
              <div className="specialties-grid">
                {specialisations.map((specialty) => (
                  <label key={specialty} className="specialty-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSpecialties.includes(specialty)}
                      onChange={() => handleSpecialtyToggle(specialty)}
                      disabled={saving}
                    />
                    <span className="checkmark"></span>
                    <span className="specialty-name">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="dialog-actions">
              <button 
                className="cancel-btn" 
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader className="btn-icon spinning" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="btn-icon" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecretaryManagement;