import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Ticket, Search, Home } from "lucide-react";
import { useState } from "react";

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingReference, isGuest } = location.state || {};
  const [copied, setCopied] = useState(false);

  if (!bookingReference) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No Booking Information
          </h1>
          <button
            onClick={() => navigate("/bus-booking/search-buses")}
            className="px-6 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700"
          >
            Search Buses
          </button>
        </div>
      </div>
    );
  }

  const handleCopyReference = () => {
    navigator.clipboard.writeText(bookingReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-success-50 to-info-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success-500 rounded-full mb-4 animate-bounce">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Your payment has been processed successfully.
          </p>
          <div className="mt-4 bg-info-50 border border-info-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-info-800">
              <span className="font-semibold">⏳ Booking Status:</span> Pending
              Confirmation
            </p>
            <p className="text-xs text-info-600 mt-1">
              Your booking will be confirmed by our admin team shortly.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <Ticket size={40} className="text-info-600 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Your Booking Reference
            </h2>
            <p className="text-sm text-gray-600">
              Save this reference number to manage your booking
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Booking Reference</p>
            <p className="text-3xl font-bold text-info-600 font-mono tracking-wider mb-4">
              {bookingReference}
            </p>
            <button
              onClick={handleCopyReference}
              className="px-6 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors text-sm font-semibold"
            >
              {copied ? "✓ Copied!" : "Copy Reference"}
            </button>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 text-xl">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Important
                </h3>
                <p className="text-sm text-yellow-700">
                  Please save your booking reference number. You will need it
                  along with your email or phone number to view or manage your
                  booking.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-sm text-info-800 text-center">
            📧 A confirmation email with your booking details and reference
            number has been sent to your email address.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {isGuest ? (
            <button
              onClick={() => navigate("/bus-booking/guest-lookup")}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors font-semibold"
            >
              <Search size={20} />
              View My Booking
            </button>
          ) : (
            <button
              onClick={() => navigate("/bus-booking/dashboard")}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors font-semibold"
            >
              <Ticket size={20} />
              View My Bookings
            </button>
          )}
          <button
            onClick={() => navigate("/bus-booking/search-buses")}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            <Home size={20} />
            Book Another Trip
          </button>
        </div>

        {isGuest && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              How to View Your Booking
            </h3>
            <ol className="space-y-3 text-sm text-gray-700">
              {[
                "Go to 'View My Booking' or visit the booking lookup page",
                `Enter your booking reference: ${bookingReference}`,
                "Enter the email or phone number you used when booking",
                "View your complete booking details, including journey and passengers",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-info-600 rounded-full mr-3 flex-shrink-0 font-semibold">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!isGuest && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              What's Next?
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                "Your booking has been saved to your account",
                "A confirmation email has been sent",
                "You can view and manage your booking from your dashboard",
                `Your booking reference is: ${bookingReference}`,
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-info-600 rounded-full mr-3 flex-shrink-0">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need help? Contact our support team</p>
          <p className="mt-1">
            Email:{" "}
            <a
              href="mailto:support@busticket.com"
              className="text-info-600 hover:underline"
            >
              support@busticket.com
            </a>{" "}
            | Phone:{" "}
            <a href="tel:+1234567890" className="text-info-600 hover:underline">
              +123 456 7890
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
