import { useNavigate, useLocation } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentFailed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, reason } = location.state || {};

  const handleRetry = () => navigate("/bus-booking/search-buses");

  const bookingDetails = (() => {
    if (!booking) {
      return [
        "No booking details available",
        "Please try again",
        new Date().toLocaleDateString(),
      ];
    }
    return [
      `Seats: ${Array.isArray(booking.seatNumbers) ? booking.seatNumbers.join(", ") : booking.seatNumbers || "N/A"}`,
      `${booking.departure || "Departure"} - ${booking.arrival || "Arrival"}`,
      `${booking.journeyDate ? new Date(booking.journeyDate).toLocaleDateString() : new Date().toLocaleDateString()}`,
    ];
  })();

  return (
    <div className="flex justify-center items-center min-h-[70vh] md:px-8 pt-28 pb-16">
      <div className="flex justify-start items-center flex-col sm:border-2 shadow shadow-red-400 min-h-96 sm:min-w-96 min-w-64 rounded-xl p-8 space-y-4 bg-white">
        <div className="mb-2">
          <XCircle size={64} className="text-error-500" />
        </div>
        <h1 className="text-2xl font-semibold text-error-500 tracking-wide text-center">
          Payment unsuccessful
        </h1>

        {reason && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded w-full">
            <p className="text-sm text-red-700">
              <strong>Reason:</strong> {reason}
            </p>
          </div>
        )}

        <ul className="text-center space-y-0.5 text-info-800 font-semibold tracking-wide capitalize">
          {bookingDetails.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded w-full">
          <p className="text-xs text-yellow-800 text-center">
            💡 <strong>Tip:</strong> Make sure your card has sufficient funds and is activated for online transactions.
          </p>
        </div>

        <p className="text-sm font-semibold text-error-500 tracking-wide">Need help? Hotline: 0001</p>

        <button
          className="capitalize text-sm rounded-lg sm:px-6 sm:py-2 px-4 py-1 bg-info-600 text-white shadow-lg hover:bg-info-700 transition-colors"
          onClick={handleRetry}
        >
          try again
        </button>

        <ul className="text-center space-y-0.5 text-black font-normal tracking-wide capitalize">
          {["Thank you", "Bus Ticket Booking System", "Secure Payment Gateway"].map((item, index) => (
            <li key={index} className="text-sm">
              {item}
            </li>
          ))}
        </ul>

        <p className="text-sm font-semibold text-info-800">support@busticket.com</p>
      </div>
    </div>
  );
}
