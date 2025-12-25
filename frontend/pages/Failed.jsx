import Logo from '../components/logo/Logo';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function Failed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, reason } = location.state || {};

  const handleClick = () => {
    navigate('/bus-booking/search-buses');
  };

  // Format booking details if available
  const getBookingDetails = () => {
    if (!booking) {
      return [
        'No booking details available',
        'Please try again',
        new Date().toLocaleDateString(),
      ];
    }

    return [
      `Seats: ${Array.isArray(booking.seatNumbers) ? booking.seatNumbers.join(', ') : booking.seatNumbers || 'N/A'}`,
      `${booking.departure || 'Departure'} - ${booking.arrival || 'Arrival'}`,
      `${booking.journeyDate ? new Date(booking.journeyDate).toLocaleDateString() : new Date().toLocaleDateString()}`,
    ];
  };

  const bookingDetails = getBookingDetails();

  return (
    <div
      className={`flex justify-center items-center min-h-[70vh] md:px-8 pt-28 pb-16`}
    >
      <div
        className={`flex justify-start items-center flex-col sm:border-2 shadow shadow-red-400 min-h-96 sm:min-w-96 min-w-64  rounded-xl p-8 space-y-4 cursor-pointer`}
      >
        {/* Error Icon */}
        <div className="mb-2">
          <XCircle size={64} className="text-error-500" />
        </div>

        <h1
          className={`text-2xl sm:text-xl font-semibold text-error-500 capitalize tracking-wide text-center`}
        >
          Payment unsuccessful
        </h1>

        {/* Failure Reason */}
        {reason && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
            <p className="text-sm text-red-700">
              <strong>Reason:</strong> {reason}
            </p>
          </div>
        )}

        {/* Booking Details */}
        <ul
          className={`text-center space-y-0.5 text-info-800 font-semibold tracking-wide capitalize`}
        >
          {bookingDetails.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>

        <h2 className="text-sm font-semibold text-black capitalize tracking-wide text-center">
          Your reservation has been cancelled
        </h2>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded w-full">
          <p className="text-xs text-yellow-800 text-center">
            💡 <strong>Tip:</strong> Make sure your card has sufficient funds
            and is activated for online transactions.
          </p>
        </div>

        <h2 className="text-sm font-semibold text-error-500 capitalize tracking-wide">
          Need help? Call Hotline: 0001
        </h2>

        <button
          className={`capitalize text-sm  rounded-lg sm:px-6 sm:py-2 px-4 py-1 bg-tertiary text-white shadow-lg hover:bg-info-700 transition-colors`}
          onClick={handleClick}
        >
          try again
        </button>

        <ul
          className={`text-center space-y-0.5 text-black font-normal tracking-wide capitalize`}
        >
          {[
            'Thank you',
            'Bus Ticket Booking System',
            'Secure Payment Gateway',
          ].map((item, index) => (
            <li key={index} className="text-sm cursor-pointer">
              {item}
            </li>
          ))}
        </ul>

        <h2 className="text-sm font-semibold text-info-800 lowercase tracking-wide">
          support@busticket.com
        </h2>

        <div className="flex justify-center items-center min-w-full translate-x-6">
          <Logo />
        </div>
      </div>
    </div>
  );
}
