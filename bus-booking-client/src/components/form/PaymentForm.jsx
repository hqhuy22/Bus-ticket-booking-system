import { useState, useEffect } from 'react';
import RadioInput from '../input/RadioInput';
import Button from '../button/Button';
import Modal from '../Modal/Modal';
import PaymentText from '../input/PaymentText';
import SelectInputText from '../input/SelectInputText';
import { BankCNV } from '../../utils/index.js';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function PaymentForm() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    booking,
    isGuest,
    paymentId: initialPaymentId,
  } = location.state || {};

  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const [paymentSession, setPaymentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    card_number: '',
    expiry_date: '',
    cvv: '',
    card_type: '',
    exp_year: '',
  });
  const [errors, setErrors] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);

  // Create payment session on component mount if not provided
  useEffect(() => {
    const initializePaymentSession = async () => {
      if (paymentId) {
        // Payment ID already provided, fetch session details
        await fetchPaymentSession(paymentId);
      } else if (booking?.id) {
        // Create new payment session
        await createPaymentSession();
      } else {
        // No booking data, redirect
        navigate('/bus-booking/search-buses');
      }
    };

    initializePaymentSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPaymentSession = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/payments/create`,
        {
          bookingId: booking.id,
          isGuest: isGuest || false,
        },
        token
          ? {
              headers: { Authorization: `Bearer ${token}` },
            }
          : {}
      );

      setPaymentId(response.data.paymentId);
      setPaymentSession({
        paymentId: response.data.paymentId,
        amount: response.data.amount,
        currency: response.data.currency,
        expiresAt: response.data.expiresAt,
      });
    } catch (error) {
      console.error('Error creating payment session:', error);
      alert(
        error.response?.data?.message || 'Failed to create payment session'
      );
      navigate('/bus-booking/search-buses');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSession = async sessionId => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/payments/${sessionId}`
      );
      setPaymentSession(response.data.session);
    } catch (error) {
      console.error('Error fetching payment session:', error);
      alert(
        error.response?.data?.message || 'Payment session not found or expired'
      );
      navigate('/bus-booking/search-buses');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setModalVisible(false);

    // Cancel payment session on backend
    if (paymentId) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/payments/${paymentId}/cancel`
        );
      } catch (error) {
        console.error('Error cancelling payment:', error);
      }
    }

    navigate('/bus-booking/BookingPayment/Failed', {
      state: {
        booking: booking || paymentSession?.bookingDetails,
        reason: 'Payment cancelled by user',
      },
    });
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  const inputDataChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setModalVisible(true);
  };

  const handlePay = async event => {
    event.preventDefault();

    let formErrors = {};

    if (!formData.card_type) {
      formErrors.card_type = 'Card type is required';
    }
    if (!formData.expiry_date) {
      formErrors.expiry_date = 'month is required';
    }
    if (!formData.exp_year) {
      formErrors.exp_year = 'Expiration year is required';
    } else {
      const expYear = parseInt(formData.exp_year);
      if (
        expYear < currentYear ||
        (expYear === currentYear &&
          parseInt(formData.expiry_date) < new Date().getMonth() + 1)
      ) {
        formErrors.exp_year = 'Expiration date is invalid';
      }
    }

    if (!formData.card_number) {
      formErrors.card_number = 'Card number is required';
    } else {
      const cardNumber = formData.card_number.replace(/\D/g, '');
      if (cardNumber.length !== 16) {
        formErrors.card_number = 'Card number must be 16 digits';
      }
    }

    if (!formData.cvv) {
      formErrors.cvv = 'CVV is required';
    } else {
      const cvv = formData.cvv.replace(/\D/g, '');
      if (formData.card_type === 'amex' && cvv.length !== 4) {
        formErrors.cvv = 'CVV for Amex must be 4 digits';
      } else if (formData.card_type !== 'amex' && cvv.length !== 3) {
        formErrors.cvv = 'CVV must be 3 digits for this card type';
      }
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Process payment through sandbox gateway
    setProcessingPayment(true);
    try {
      const paymentData = {
        paymentId,
        cardNumber: formData.card_number.replace(/\D/g, ''),
        cardType: formData.card_type,
        expiryMonth: formData.expiry_date,
        expiryYear: formData.exp_year,
        cvv: formData.cvv.replace(/\D/g, ''),
        // For testing: use cardNumber '0000000000000000' to simulate failure
        simulateFailure:
          formData.card_number.replace(/\D/g, '') === '0000000000000000',
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/payments/process`,
        paymentData
      );

      // Payment successful - booking remains 'pending' for admin to confirm
      if (response.data.status === 'success') {
        // DON'T auto-confirm - let admin do it manually
        // await confirmBooking(response.data.paymentReference);

        // Navigate to success page
        navigate('/bus-booking/payment-success', {
          state: {
            bookingReference: response.data.bookingReference,
            isGuest: isGuest || false,
            paymentReference: response.data.paymentReference,
          },
        });
      }
    } catch (error) {
      // Payment failed - this is expected for invalid cards
      setProcessingPayment(false);

      // Navigate to failure page
      navigate('/bus-booking/BookingPayment/Failed', {
        state: {
          booking: booking || paymentSession?.bookingDetails,
          reason: error.response?.data?.message || 'Payment processing failed',
        },
      });
    }
  };

  // DISABLED: Auto-confirm booking after payment
  // Admin will manually confirm bookings from admin panel
  /*
    const confirmBooking = async (paymentReference) => {
        try {
            const token = localStorage.getItem('token');
            const bookingData = booking || paymentSession?.bookingDetails;
            
            if (isGuest) {
                // For guest bookings, we need email/phone from location state
                const guestInfo = location.state?.guestInfo || {};
                await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/bookings/guest/${booking?.bookingReference || bookingData?.bookingReference}/confirm`,
                    { 
                        paymentReference,
                        email: guestInfo.email,
                        phone: guestInfo.phone
                    }
                );
            } else {
                // For authenticated users
                await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/bookings/${booking?.id || bookingData?.id}/confirm`,
                    { paymentReference },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            // Don't throw - payment already succeeded
        }
    };
    */

  return (
    <>
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading payment session...</p>
        </div>
      )}

      {!loading && paymentSession && (
        <form
          onSubmit={handlePay}
          className="sm:space-y-2.5 space-y-3.5 min-w-full "
        >
          {/* Payment Info Banner */}
          <div className="bg-blue-50 border-l-4 border-info-500 p-4 mb-4 mt-4">
            <p className="text-sm text-info-800">
              <strong>Amount to Pay:</strong> {paymentSession.currency}{' '}
              {parseFloat(paymentSession.amount).toFixed(2)}
            </p>
            <p className="text-xs text-info-600 mt-1">
              Booking Reference:{' '}
              {booking?.bookingReference || paymentSession.bookingReference}
            </p>
          </div>

          <div className="flex justify-end items-center py-1">
            <p className="text-sm font-normal tracking-wide align-text-top cursor-pointer">
              * Required Field
            </p>
          </div>
          <div className="sm:space-y-2.5 space-y-4">
            <RadioInput
              id="card_type"
              label="Card Type *"
              name="card_type"
              options={[
                { label: 'Visa', value: 'visa' },
                { label: 'Mastercard', value: 'mastercard' },
              ]}
              value={formData.card_type}
              onChange={inputDataChange}
              error={errors.card_type}
              disabled={processingPayment}
            />
            <PaymentText
              id="card_number"
              name="card_number"
              label="Card Number *"
              placeholder="xxxx xxxx xxxx xxxx"
              value={formData.card_number}
              onChange={inputDataChange}
              error={errors.card_number}
              type="text"
              disabled={processingPayment}
            />
            <div
              className={`flex flex-row  justify-between  sm:gap-20  sm:items-center`}
            >
              <SelectInputText
                id={formData.expiry_date}
                name="expiry_date"
                label="Expiration Month *"
                value={formData.expiry_date}
                onChange={inputDataChange}
                error={errors.expiry_date}
                planText={'month'}
                index={10}
                disabled={processingPayment}
              />
              <div className="flex-grow ">
                <PaymentText
                  id="exp_year"
                  name="exp_year"
                  label="Expiration Year *"
                  placeholder="Year"
                  value={formData.exp_year}
                  onChange={inputDataChange}
                  error={errors.exp_year}
                  type="text"
                  maxLength={4}
                  disabled={processingPayment}
                />
              </div>
            </div>
            <PaymentText
              id="cvv"
              name="cvv"
              label="CVN *"
              label2="This code is a three or four-digit number printed on the back or front of credit cards."
              placeholder=""
              value={formData.cvv}
              onChange={inputDataChange}
              error={errors.cvv}
              type="text"
              cardType={formData.card_type}
              maxLength={4}
              sourceURL={BankCNV}
              disabled={processingPayment}
            />
          </div>
          <div className="flex justify-between items-center min-w-full pt-8 sm:translate-y-0 translate-y-32">
            <Button
              Icon={true}
              label="Cancel"
              className="bg-error-500  rounded-md  text-black px-8 font-bold tracking-wide text-base"
              onClick={handleCancel}
              disabled={processingPayment}
            />
            <Button
              Icon={false}
              label={processingPayment ? 'Processing...' : 'Pay'}
              className="bg-success-500  rounded-md  text-black px-8 font-bold tracking-wide"
              onClick={handlePay}
              disabled={processingPayment}
            />
          </div>
        </form>
      )}
      <Modal
        isVisible={isModalVisible}
        header="Cancel Order"
        body="Are you sure you want to cancel the payment?"
        footer={
          <>
            <button
              onClick={handleClose}
              className=" sm:px-4 px-5 sm:py-2 bg-gray-300 rounded text-sm font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCancel}
              className=" sm:px-4 px-5 py-2 bg-error-500 text-white rounded text-sm font-bold"
            >
              Confirm
            </button>
          </>
        }
        onClose={handleClose}
      />
    </>
  );
}
