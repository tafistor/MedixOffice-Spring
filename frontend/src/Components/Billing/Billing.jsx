import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, FileText, Download, Eye, Plus, ArrowLeft, Trash, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Billing.css';
import axios from 'axios';
import AddEditInvoice from './AddEditInvoice';
import PaymentDialog from './PaymentDialog';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { useNavigate } from 'react-router-dom';
import { invoices, patients, payments } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';

function Billing() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);
  const [invoicesList, setInvoicesList] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadInvoices();
    checkPaymentReturn();
  }, []);

  const checkPaymentReturn = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const invoiceId = urlParams.get('invoice_id');
    // PayPal appends its own order id as `token` when redirecting back to
    // return_url; Stripe's success_url has no such param. Use it to tell the
    // two return flows apart, since only PayPal needs a server-side capture.
    const paypalOrderId = urlParams.get('token');

    if (paymentSuccess === 'true' && invoiceId && paypalOrderId) {
      capturePaypalPayment(paypalOrderId, invoiceId);
      window.history.replaceState({}, document.title, '/billing');
    } else if (paymentSuccess === 'true' && invoiceId) {
      updateInvoiceStatus(invoiceId, 'paid');
      window.history.replaceState({}, document.title, '/billing');
    }
  };

  const capturePaypalPayment = async (orderId, invoiceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      await payments.capturePaypal(orderId, invoiceId);
      await loadInvoices();
    } catch (error) {
      if (error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  const updateInvoiceStatus = async (invoiceId, status) => {
    try {
      // Vérifier que l'utilisateur est connecté
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      
      const response = await invoices.update(invoiceId, { status });
      await loadInvoices();
    } catch (error) {      
      if (error.response?.status === 403) {
        // Rediriger vers la page de connexion
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };
  const loadInvoices = async () => {
    try {
      const response = await invoices.getAll();
      let filteredInvoices = response.data;
      
      // Filter invoices if user is a patient
      if (user?.role === 'patient') {
        const patientResponse = await patients.getPatientByUserId(user.id);
        setCurrentPatient(patientResponse.data);
        filteredInvoices = response.data.filter(invoice => 
          invoice.patientId === patientResponse.data.id
        );
      }
      
      setInvoicesList(filteredInvoices);
    } catch (error) {
      //error loading invoices
    }
  };

  const filteredInvoices = activeFilter === 'all' 
    ? invoicesList 
    : invoicesList.filter(invoice => invoice.status.toLowerCase() === activeFilter);

  const handlePatientClick = () => {
    navigate('/dashboard');
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'overdue':
        return 'status-overdue';
      default:
        return '';
    }
  };

  const handleAddInvoice = () => {
    setSelectedInvoice(null);
    setIsDialogOpen(true);
  };

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDialogOpen(true);
  };

  const handleViewInvoice = async (invoice) => {
    try {
      // Si c'est un patient, on récupère les détails complets de la facture
      if (user?.role === 'patient') {
        const response = await invoices.getWithDetails(invoice.id);
        setSelectedInvoice(response.data);
      } else {
        setSelectedInvoice(invoice);
      }
      setIsDialogOpen(true);
    } catch (error) {
      // En cas d'erreur, on utilise la facture de base
      setSelectedInvoice(invoice);
      setIsDialogOpen(true);
    }
  };

  const handleSubmitInvoice = async (formData) => {
    try {
      if (selectedInvoice) {
        await invoices.update(selectedInvoice.id, formData);
      } else {
        await invoices.create(formData);
      }
      await loadInvoices();
      setIsDialogOpen(false);
    } catch (error) {
      //error submitting invoice
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    setInvoiceToDelete(invoiceId);
    setIsConfirmDialogOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (invoiceToDelete) {
      try {
        await invoices.delete(invoiceToDelete);
        await loadInvoices();
        setInvoiceToDelete(null);
      } catch (error) {
        //error deletting invoice
      }
    }
  };

  
  const handlePayInvoice = async (invoice) => {
    setInvoiceForPayment(invoice);
    setPaymentError(null);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSelect = async (paymentMethod) => {
    setPaymentError(null);
    try {
      let response;
      if (paymentMethod.toLowerCase() === 'paypal') {
        response = await payments.payWithPaypal(invoiceForPayment.amount, invoiceForPayment.id);
      } else if (paymentMethod.toLowerCase() === 'stripe') {
        response = await payments.payWithStripe(invoiceForPayment.amount, invoiceForPayment.id);
      } else {
        return;
      }

      if (response && response.data && response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      setPaymentError(error.response?.data?.message || t('billing.paymentError'));
    }
  };

const handleDownloadInvoice = async (invoice) => {

    try {
      // Récupérer les détails complets de la facture
      const response = await invoices.getWithDetails(invoice.id);
      const invoiceWithDetails = response.data;
      
      // Générer et télécharger le PDF
      generateInvoicePDF(invoiceWithDetails);
    } catch (error) {
      //error downloading invoice
    }
  };

  return (
    <div className="billing-container">
      <div className="billing-header">
        <div className="billing-content">
          <button onClick={handlePatientClick} className="add-billing">
            <ArrowLeft className="icons" />
          </button>
          <div>
            <h1 className="header-title">{t('billing.title')}</h1>
          </div>
        </div>
        <div className="billing-header-actions">
          <LanguageSwitcher />
          {user?.role !== 'patient' && (
            <button className="add-billing" onClick={handleAddInvoice}>
              <Plus className="icons" />
              {t('billing.newInvoice')}
            </button>
          )}
        </div>
      </div>

      {paymentError && (
        <div className="error-message" role="alert">
          {paymentError}
          <button type="button" onClick={() => setPaymentError(null)} className="close-button">
            ×
          </button>
        </div>
      )}

      <div className="invoices-section">
        <div className="section-header">
          <h2 className="section-title">{t('billing.recentInvoices')}</h2>
          <div className="invoice-filters">
            <button
              className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              {t('billing.filters.all')}
            </button>
            <button
              className={`filter-button ${activeFilter === 'paid' ? 'active' : ''}`}
              onClick={() => setActiveFilter('paid')}
            >
              {t('billing.filters.paid')}
            </button>
            <button
              className={`filter-button ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              {t('billing.filters.pending')}
            </button>
            <button
              className={`filter-button ${activeFilter === 'overdue' ? 'active' : ''}`}
              onClick={() => setActiveFilter('overdue')}
            >
              {t('billing.filters.overdue')}
            </button>
          </div>
        </div>
        <table className="invoices-table">
          <thead>
            <tr className="table-header">
              <th>{t('billing.table.invoiceDetails')}</th>
              <th>{t('billing.table.service')}</th>
              <th>{t('billing.table.amount')}</th>
              <th>{t('billing.table.status')}</th>
              <th>{t('billing.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="invoice-row">
                <td>
                  <div className="invoice-info">
                    <FileText className="invoice-icons" />
                    <div className="invoice-details">
                      <h3>
                        {user?.role === 'patient' && currentPatient 
                          ? `${currentPatient.User?.lastName || ''} ${currentPatient.User?.firstName || ''}`.trim()
                          : `${invoice.Patient?.User?.lastName || ''} ${invoice.Patient?.User?.firstName || ''}`.trim() || t('billing.unknownPatient')
                        }
                      </h3>
                      <p>{invoice.invoiceNumber} • {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="text-sm text-gray-900">{invoice.service}</span>
                </td>
                <td>
                  <span className="invoice-amount">{Number(invoice.amount).toFixed(2)} €</span>
                </td>
                <td>
                  <span className={`invoice-status ${getStatusClass(invoice.status)}`}>
                    {t(`common.status.${invoice.status.toLowerCase()}`)}
                  </span>
                </td>
                <td>
                  <div className="invoice-actions">
                    <button
                      className="action-link"
                      onClick={() => user?.role === 'patient' ? handleViewInvoice(invoice) : handleEditInvoice(invoice)}
                      title={t('billing.viewDetailsTitle')}
                    >
                      <Eye className="mon-element" />
                      {t('billing.view')}
                    </button>
                    {invoice.status.toLowerCase() !== 'paid' && (
                      <button
                        className="action-link"
                        onClick={() => handlePayInvoice(invoice)}
                        title={t('billing.pay')}
                      >
                        <CreditCard className="mon-element" />
                        {t('billing.pay')}
                      </button>
                    )}
                    <button
                      className="action-link"
                      onClick={() => handleDownloadInvoice(invoice)}
                      title={t('billing.downloadPdf')}
                    >
                      <Download className="mon-element" />
                      {t('billing.downloadPdf')}
                    </button>
                    {user?.role !== 'patient' && (
                      <button
                        className="action-link delete-action"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        title={t('billing.delete')}
                      >
                        <Trash className="mon-element" />
                        {t('billing.delete')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(user?.role !== 'patient' || selectedInvoice) && (
        <AddEditInvoice
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleSubmitInvoice}
          invoice={selectedInvoice}
          isReadOnly={user?.role === 'patient'}
          currentPatient={currentPatient}
        />
      )}

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onPaymentSelect={handlePaymentSelect}
        invoice={invoiceForPayment}
      />
      
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={confirmDeleteInvoice}
        title={t('billing.deleteDialog.title')}
        message={t('billing.deleteDialog.message')}
        confirmText={t('billing.deleteDialog.confirm')}
        cancelText={t('billing.deleteDialog.cancel')}
        type="danger"
      />
    </div>
  );
}

export default Billing;