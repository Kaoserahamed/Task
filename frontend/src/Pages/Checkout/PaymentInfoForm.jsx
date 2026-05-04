import React from 'react';
import { CreditCard, Calendar, User } from 'lucide-react';
import './PaymentInfoForm.css';

const PaymentInfoForm = ({ formData, handleChange, handlePaymentSubmit, setStep }) => {
  return (
    <div className="card">
      <h2 className="card-title">Payment Information</h2>
      <form onSubmit={handlePaymentSubmit}>
        <div className="form-group">
          <label className="label">Payment Method</label>
          <div className="payment-method-grid">
            <label className={`payment-method-option ${formData.paymentMethod === 'credit-card' ? 'payment-method-selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="credit-card"
                checked={formData.paymentMethod === 'credit-card'}
                onChange={handleChange}
                className="radio-input"
              />
              <CreditCard size={16} className="payment-method-icon" />
              <span>Credit Card</span>
            </label>
            <label className={`payment-method-option ${formData.paymentMethod === 'paypal' ? 'payment-method-selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                checked={formData.paymentMethod === 'paypal'}
                onChange={handleChange}
                className="radio-input"
              />
              <span>PayPal</span>
            </label>
            <label className={`payment-method-option ${formData.paymentMethod === 'bank-transfer' ? 'payment-method-selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="bank-transfer"
                checked={formData.paymentMethod === 'bank-transfer'}
                onChange={handleChange}
                className="radio-input"
              />
              <span>Bank Transfer</span>
            </label>
          </div>
        </div>

        {formData.paymentMethod === 'credit-card' && (
          <>
            <div className="form-group">
              <label htmlFor="cardNumber" className="label">Card Number</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <CreditCard size={16} />
                </div>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cardHolder" className="label">Card Holder Name</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  id="cardHolder"
                  name="cardHolder"
                  value={formData.cardHolder}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="form-grid form-grid-2col">
              <div className="form-group">
                <label htmlFor="expiryDate" className="label">Expiry Date</label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="cvv" className="label">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  className="input-no-icon"
                  required
                />
              </div>
            </div>
          </>
        )}

        {formData.paymentMethod === 'paypal' && (
          <div className="payment-info-box">
            <p style={{textAlign: 'center'}}>
              You will be redirected to PayPal to complete your payment after you click "Complete Booking".
            </p>
          </div>
        )}

        {formData.paymentMethod === 'bank-transfer' && (
          <div className="payment-info-box">
            <h3 className="payment-info-title">Bank Transfer Details:</h3>
            <p className="contact-info-text">Bank: Global Bank</p>
            <p className="contact-info-text">Account Name: Travel Adventures</p>
            <p className="contact-info-text">Account Number: 1234567890</p>
            <p className="contact-info-text">SWIFT/BIC: GLBANK123</p>
            <p className="note">Please include your booking reference in the transfer description.</p>
          </div>
        )}

        <div className="flex-between">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="button button-secondary"
          >
            Back
          </button>
          <button type="submit" className="button button-primary">
            Complete Booking
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentInfoForm;
