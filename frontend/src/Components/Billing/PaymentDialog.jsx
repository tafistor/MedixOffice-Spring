import React from 'react';
import { CreditCard, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './PaymentDialog.css';

function PaymentDialog({ isOpen, onClose, onPaymentSelect, invoice }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const handlePaymentSelect = (method) => {
    onPaymentSelect(method);
    onClose();
  };

  return (
    <div className="payment-dialog-overlay">
      <div className="payment-dialog">
        <div className="payment-dialog-header">
          <h2>{t('payment.chooseMethod')}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="payment-dialog-content">
          <p className="payment-amount">
            {t('payment.amountToPay')} <strong>{Number(invoice?.amount || 0).toFixed(2)} €</strong>
          </p>

          <div className="payment-methods">
            <div
              className="payment-card paypal-card"
              onClick={() => handlePaymentSelect('paypal')}
            >
              <div className="payment-card-content">
                <div className="payment-logo paypal-logo">
                  <span>PayPal</span>
                </div>
                <p>{t('payment.payWithPaypal')}</p>
              </div>
            </div>

            <div
              className="payment-card stripe-card"
              onClick={() => handlePaymentSelect('stripe')}
            >
              <div className="payment-card-content">
                <CreditCard className="payment-icon" />
                <div className="payment-logo stripe-logo">
                  <span>Stripe</span>
                </div>
                <p>{t('payment.payWithStripe')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentDialog;