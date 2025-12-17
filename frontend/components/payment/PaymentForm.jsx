import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import PaymentText from "../input/PaymentText";

const currentYear = new Date().getFullYear();

export default function PaymentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    booking,
    isGuest = false,
    paymentId: initialPaymentId,
  } = location.state || {};

  const [paymentId, setPaymentId] = useState(initialPaymentId || "");
  const [paymentSession, setPaymentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [formData, setFormData] = useState({
    card_number: "",
    expiry_date: "",
    cvv: "",
    card_type: "",
    exp_year: "",
  });

  useEffect(() => {
    const initializePaymentSession = async () => {
      if (paymentId) {
        await fetchPaymentSession(paymentId);
      } else if (booking?.id) {
        await createPaymentSession();
      } else {
        navigate("/bus-booking/search-buses");
      }
    };
    initializePaymentSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPaymentSession = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/payments/create", {
        bookingId: booking.id,
        isGuest,
      });
      setPaymentId(response.data.paymentId);
      setPaymentSession({
        paymentId: response.data.paymentId,
        amount: response.data.amount,
        currency: response.data.currency,
        expiresAt: response.data.expiresAt,
        bookingReference: response.data.bookingReference,
      });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create payment session");
      navigate("/bus-booking/search-buses");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSession = async sessionId => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/payments/${sessionId}`);
      setPaymentSession(response.data.session);
    } catch (error) {
      alert(
        error.response?.data?.message || "Payment session not found or expired"
      );
      navigate("/bus-booking/search-buses");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setShowCancelConfirm(false);
    if (paymentId) {
      try {
        await axiosInstance.post(`/api/payments/${paymentId}/cancel`);
      } catch {
        /* ignore */
      }
    }
    navigate("/bus-booking/payment-failed", {
      state: {
        booking: booking || paymentSession?.bookingDetails,
        reason: "Payment cancelled by user",
      },
    });
  };

  const inputDataChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const formErrors = {};
    if (!formData.card_type) formErrors.card_type = "Card type is required";
    if (!formData.expiry_date) formErrors.expiry_date = "Month is required";
    if (!formData.exp_year) {
      formErrors.exp_year = "Expiration year is required";
    } else {
      const expYear = parseInt(formData.exp_year, 10);
      const expMonth = parseInt(formData.expiry_date, 10);
      if (
        Number.isNaN(expYear) ||
        expYear < currentYear ||
        (expYear === currentYear && expMonth < new Date().getMonth() + 1)
      ) {
        formErrors.exp_year = "Expiration date is invalid";
      }
    }

    if (!formData.card_number) {
      formErrors.card_number = "Card number is required";
    } else {
      const cardNumber = formData.card_number.replace(/\D/g, "");
      if (cardNumber.length !== 16) {
        formErrors.card_number = "Card number must be 16 digits";
      }
    }

    if (!formData.cvv) {
      formErrors.cvv = "CVV is required";
    } else {
      const cvv = formData.cvv.replace(/\D/g, "");
      if (formData.card_type === "amex" && cvv.length !== 4) {
        formErrors.cvv = "CVV for Amex must be 4 digits";
      } else if (formData.card_type !== "amex" && cvv.length !== 3) {
        formErrors.cvv = "CVV must be 3 digits";
      }
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handlePay = async event => {
    event.preventDefault();
    if (!validate()) return;

    setProcessingPayment(true);
    try {
      const paymentData = {
        paymentId,
        cardNumber: formData.card_number.replace(/\D/g, ""),
        cardType: formData.card_type,
        expiryMonth: formData.expiry_date,
        expiryYear: formData.exp_year,
        cvv: formData.cvv.replace(/\D/g, ""),
        simulateFailure:
          formData.card_number.replace(/\D/g, "") === "0000000000000000",
      };

      const response = await axiosInstance.post(
        "/api/payments/process",
        paymentData
      );

      if (response.data.status === "success") {
        navigate("/bus-booking/payment-success", {
          state: {
            bookingReference:
              response.data.bookingReference || booking?.bookingReference,
            isGuest,
            paymentReference: response.data.paymentReference,
          },
        });
      } else {
        navigate("/bus-booking/payment-failed", {
          state: {
            booking: booking || paymentSession?.bookingDetails,
            reason: response.data.message || "Payment processing failed",
          },
        });
      }
    } catch (error) {
      setProcessingPayment(false);
      navigate("/bus-booking/payment-failed", {
        state: {
          booking: booking || paymentSession?.bookingDetails,
          reason: error.response?.data?.message || "Payment processing failed",
        },
      });
    }
  };

  return (
    <>
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading payment session...</p>
        </div>
      )}

      {!loading && paymentSession && (
        <form onSubmit={handlePay} className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-info-500 p-4">
            <p className="text-sm text-info-800">
              <strong>Amount to Pay:</strong> {paymentSession.currency} {" "}
              {parseFloat(paymentSession.amount).toFixed(2)}
            </p>
            <p className="text-xs text-info-600 mt-1">
              Booking Reference: {" "}
              {booking?.bookingReference || paymentSession.bookingReference}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Type *
              </label>
              <select
                name="card_type"
                value={formData.card_type}
                onChange={inputDataChange}
                disabled={processingPayment}
                className={`w-full border rounded-lg p-2 ${
                  errors.card_type ? "border-error-500" : "border-gray-300"
                }`}
              >
                <option value="">Select card</option>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">American Express</option>
              </select>
              {errors.card_type && (
                <p className="text-xs text-error-500 mt-1">{errors.card_type}</p>
              )}
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Month *
                </label>
                <select
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={inputDataChange}
                  disabled={processingPayment}
                  className={`w-full border rounded-lg p-2 ${
                    errors.expiry_date ? "border-error-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {idx + 1}
                    </option>
                  ))}
                </select>
                {errors.expiry_date && (
                  <p className="text-xs text-error-500 mt-1">{errors.expiry_date}</p>
                )}
              </div>

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

            <PaymentText
              id="cvv"
              name="cvv"
              label="CVV *"
              label2="This code is printed on the back of your card."
              placeholder="CVV"
              value={formData.cvv}
              onChange={inputDataChange}
              error={errors.cvv}
              type="text"
              cardType={formData.card_type}
              maxLength={4}
              disabled={processingPayment}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              disabled={processingPayment}
              className="px-4 py-2 rounded-md border border-error-500 text-error-700 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processingPayment}
              className="px-6 py-2 rounded-md bg-success-500 text-black font-semibold hover:bg-success-600 disabled:opacity-50"
            >
              {processingPayment ? "Processing..." : "Pay"}
            </button>
          </div>
        </form>
      )}

      {!loading && !paymentSession && (
        <div className="text-center py-6 text-gray-600">
          No payment session found.
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Cancel payment?</h3>
            <p className="text-sm text-gray-600">
              Your seat reservation may expire if you leave this page.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 rounded border bg-white text-gray-700 hover:bg-gray-50"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded bg-error-500 text-white hover:bg-error-600"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
