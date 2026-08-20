import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { patients } from '../../services/api';
import './AddEditInvoice.css';

function AddEditInvoice({ isOpen, onClose, onSubmit, invoice = null, isReadOnly = false, currentPatient = null }) {
  const { t } = useTranslation();
  const initialFormState = {
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    service: '',
    status: 'Pending',
    invoiceNumber: `INV-${Date.now()}`,
    consultationId: null
  };

  const [formData, setFormData] = useState(initialFormState);
  const [patientsList, setPatientsList] = useState([]);
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      if (invoice) {
        setFormData({
          patientId: invoice.patientId || '',
          date: invoice.date ? invoice.date.split('T')[0] : new Date().toISOString().split('T')[0],
          amount: invoice.amount || '',
          service: invoice.service || '',
          status: invoice.status || 'Pending',
          invoiceNumber: invoice.invoiceNumber || `INV-${Date.now()}`,
          consultationId: invoice.consultationId || null
        });
      } else {
        setFormData({
          ...initialFormState,
          invoiceNumber: `INV-${Date.now()}`
        });
      }
      setServiceError('');
    }
  }, [isOpen, invoice]);

  const loadPatients = async () => {
    try {
      // Ne charger les patients que si ce n'est pas en mode lecture seule
      if (!isReadOnly) {
        const response = await patients.getAll();
        setPatientsList(response.data);
      }
    } catch (error) {
      // En cas d'erreur, on continue sans charger les patients
      setPatientsList([]);
    }
  };

  const handleDateKeyDown = (e) => {
    e.preventDefault();
  };

  const handleServiceChange = (e) => {
    const { value } = e.target;
    
    if (value.startsWith(' ')) {
      return;
    }
    
    if (value.includes('  ')) {
      setServiceError(t('invoiceForm.errors.multipleSpaces'));
      return;
    }

    if (value.includes("''") || value.includes('--')) {
      return;
    }

    const validPattern = /^[a-zA-ZÀ-ÿ',\s-]*$/;

    if (value && !validPattern.test(value)) {
      setServiceError(t('invoiceForm.errors.invalidChars'));
      return;
    }

    setServiceError('');
    setFormData(prev => ({
      ...prev,
      service: value
    }));
  };

  const handleServiceBlur = (e) => {
    const { value } = e.target;

    if (value.includes('  ')) {
      setServiceError(t('invoiceForm.errors.multipleSpaces'));
      return;
    }

    const validPattern = /^[a-zA-ZÀ-ÿ',\s-]*$/;

    if (value && !validPattern.test(value)) {
      setServiceError(t('invoiceForm.errors.invalidChars'));
      return;
    }

    setServiceError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'service') {
      handleServiceChange(e);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /*const handleSubmit = (e) => {
    e.preventDefault();
    if (!isReadOnly) {
      onSubmit(formData);
    }
  };*/
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isReadOnly) {
      if (!isFormValid()) {
        return; // Blocage si formulaire invalide
      }
      onSubmit(formData);
    }
  };
  

  const handleClose = () => {
    setServiceError('');
    onClose();
  };

  const isFormValid = () => {
    return formData.patientId !== '' &&
           formData.date !== '' &&
           formData.amount !== '' &&
           formData.service.trim() !== '' &&
           formData.status !== '';
  };

  // Fonction pour obtenir le nom du patient
  const getPatientDisplayName = () => {
    if (isReadOnly && currentPatient) {
      // Mode lecture seule pour un patient connecté
      return `${currentPatient.User?.lastName || ''} ${currentPatient.User?.firstName || ''}`.trim();
    } else if (invoice && invoice.Patient && invoice.Patient.User) {
      // Mode édition avec facture existante
      return `${invoice.Patient.User.lastName || ''} ${invoice.Patient.User.firstName || ''}`.trim();
    } else {
      // Recherche dans la liste des patients
      const selectedPatient = patientsList.find(p => p.id === formData.patientId);
      if (selectedPatient && selectedPatient.User) {
        return `${selectedPatient.User.lastName || ''} ${selectedPatient.User.firstName || ''}`.trim();
      }
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <h2>
            {isReadOnly
              ? t('invoiceForm.viewTitle')
              : (invoice ? t('invoiceForm.editTitle') : t('invoiceForm.createTitle'))
            }
          </h2>
          <button className="close-btn" onClick={handleClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label htmlFor="patientId">{t('invoiceForm.patientLabel')}</label>
            {isReadOnly ? (
              <div className="form-display-value">
                {getPatientDisplayName() || t('invoiceForm.unknownPatient')}
              </div>
            ) : (
              <select
                id="patientId"
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                required
                disabled={invoice !== null}
              >
                <option value="">{t('invoiceForm.selectPatient')}</option>
                {patientsList.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.User?.lastName} {patient.User?.firstName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">{t('invoiceForm.dateLabel')}</label>
              {isReadOnly ? (
                <div className="form-display-value">
                  {new Date(formData.date).toLocaleDateString('fr-FR')}
                </div>
              ) : (
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  onKeyDown={handleDateKeyDown}
                  required
                />
              )}
            </div>
            <div className="form-group">
              <label htmlFor="invoiceNumber">{t('invoiceForm.invoiceNumberLabel')}</label>
              { isReadOnly ? (
                    <div className="form-display-value">
                    {formData.invoiceNumber}
                  </div>
              ) : (
                <input 
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                required
                readOnly
                
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="service">{t('invoiceForm.serviceLabel')}</label>
              {isReadOnly ? (
                <div className="form-display-value">
                  {formData.service}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    onBlur={handleServiceBlur}
                    required
                    placeholder={t('invoiceForm.servicePlaceholder')}
                  />
                  {serviceError && (
                    <p className="error-text" style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {serviceError}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="amount">{t('invoiceForm.amountLabel')}</label>
              {isReadOnly ? (
                <div className="form-display-value">
                  {Number(formData.amount).toFixed(2)} €
                </div>
              ) : (
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">{t('invoiceForm.statusLabel')}</label>
            {isReadOnly ? (
              <div className="form-display-value">
                <span className={`status-badge status-${formData.status.toLowerCase()}`}>
                  {t(`common.status.${formData.status.toLowerCase()}`)}
                </span>
              </div>
            ) : (
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="Pending">{t('common.status.pending')}</option>
                <option value="Paid">{t('common.status.paid')}</option>
                <option value="Overdue">{t('common.status.overdue')}</option>
                <option value="Cancelled">{t('common.status.cancelled')}</option>
              </select>
            )}
          </div>

          <div className="dialog-actions">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              {isReadOnly ? t('invoiceForm.close') : t('invoiceForm.cancel')}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="submit-btn"
                disabled={!isFormValid()}
                style={{ opacity: isFormValid() ? 1 : 0.5, cursor: isFormValid() ? 'pointer' : 'not-allowed' }}
              >
                {invoice ? t('invoiceForm.updateInvoice') : t('invoiceForm.createInvoice')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditInvoice;