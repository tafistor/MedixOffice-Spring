import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, X, Save, Loader, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { secretarySpecialties } from '../../services/api';
import { specialisations } from '../../data/specializationsList';
import './SecretaryManagement.css';

const initialNewSecretary = { firstName: '', lastName: '', email: '' };

function SecretaryManagement() {
  const navigate = useNavigate();
  const [secretaries, setSecretaries] = useState([]);
  const [selectedSecretary, setSelectedSecretary] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSecretary, setNewSecretary] = useState(initialNewSecretary);
  const [addError, setAddError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

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

  const handleAddSecretary = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      setAddError(null);
      const response = await secretarySpecialties.create(newSecretary);
      await loadSecretaries();
      setCreatedCredentials({
        email: response.data.secretary.email,
        temporaryPassword: response.data.temporaryPassword
      });
      setNewSecretary(initialNewSecretary);
    } catch (error) {
      setAddError(error.response?.data?.message || 'Error creating secretary. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
    setNewSecretary(initialNewSecretary);
    setAddError(null);
    setCreatedCredentials(null);
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
        <button className="edit-specialties-btn" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="btn-icon" />
          Add Secretary
        </button>
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

      {isAddDialogOpen && createdCredentials && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <div className="dialog-header">
              <h2>Secretary Created</h2>
              <button className="close-btn" onClick={handleCloseAddDialog}>
                <X />
              </button>
            </div>

            <div className="dialog-body">
              <p className="dialog-description">
                Email sending isn't wired up yet, so this won't be sent automatically — copy it now and share it with
                {' '}{newSecretary.firstName || 'the secretary'} yourself. It won't be shown again.
              </p>

              <div className="secretary-form-group">
                <label className="secretary-form-label">Email</label>
                <input
                  type="text"
                  className="secretary-form-input"
                  value={createdCredentials.email}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div className="secretary-form-group">
                <label className="secretary-form-label">Temporary Password</label>
                <input
                  type="text"
                  className="secretary-form-input"
                  value={createdCredentials.temporaryPassword}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>

            <div className="dialog-actions">
              <button className="save-btn" onClick={handleCloseAddDialog}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddDialogOpen && !createdCredentials && (
        <div className="dialog-overlay">
          <form className="dialog-content" onSubmit={handleAddSecretary}>
            <div className="dialog-header">
              <h2>Add Secretary</h2>
              <button
                type="button"
                className="close-btn"
                onClick={handleCloseAddDialog}
                disabled={adding}
              >
                <X />
              </button>
            </div>

            {addError && (
              <div className="dialog-error">
                <AlertCircle className="error-icon-small" />
                <span>{addError}</span>
              </div>
            )}

            <div className="dialog-body">
              <p className="dialog-description">
                A temporary password will be generated. You'll be shown it once after creation — you can assign specialties afterwards.
              </p>

              <div className="secretary-form-group">
                <label className="secretary-form-label">First Name</label>
                <input
                  type="text"
                  className="secretary-form-input"
                  value={newSecretary.firstName}
                  onChange={(e) => setNewSecretary(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  disabled={adding}
                />
              </div>
              <div className="secretary-form-group">
                <label className="secretary-form-label">Last Name</label>
                <input
                  type="text"
                  className="secretary-form-input"
                  value={newSecretary.lastName}
                  onChange={(e) => setNewSecretary(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  disabled={adding}
                />
              </div>
              <div className="secretary-form-group">
                <label className="secretary-form-label">Email</label>
                <input
                  type="email"
                  className="secretary-form-input"
                  value={newSecretary.email}
                  onChange={(e) => setNewSecretary(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={adding}
                />
              </div>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCloseAddDialog}
                disabled={adding}
              >
                Cancel
              </button>
              <button className="save-btn" disabled={adding}>
                {adding ? (
                  <>
                    <Loader className="btn-icon spinning" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="btn-icon" />
                    Create Secretary
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SecretaryManagement;