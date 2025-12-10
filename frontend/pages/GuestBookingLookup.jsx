import { useState } from "react";
import { Search, Mail, Ticket } from "lucide-react";
import axiosInstance from "../utils/axiosConfig";

export default function GuestBookingLookup() {
  const [formData, setFormData] = useState({ bookingReference: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.bookingReference.trim()) {
      setError("Please enter your booking reference");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email address");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        bookingReference: formData.bookingReference.trim(),
        email: formData.email.trim(),
      };
      await axiosInstance.post("/api/bookings/guest/lookup/request", payload);
      setSent(true);
      setSentTo(formData.email.trim());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send verification email. Please check your booking reference and email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Ticket size={32} className="text-info-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Find Your Booking
          </h1>
          <p className="text-gray-600">
            Enter your booking reference and contact information to view your
            booking details
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleLookup}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Reference *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.bookingReference}
                  onChange={(e) =>
                    handleInputChange(
                      "bookingReference",
                      e.target.value.toUpperCase()
                    )
                  }
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 text-lg font-mono"
                  placeholder="BKG-XXXXXX-YYYY"
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your booking reference can be found in your confirmation email
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500"
                  placeholder="your.email@example.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                We will send a one-time verification link to this email.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {sent && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  A verification email was sent to <strong>{sentTo}</strong>.
                  Please check your inbox and click the verification link. The
                  link expires in 15 minutes.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || sent}
              className="w-full py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : sent ? (
                "Verification Sent"
              ) : (
                <>
                  <Search size={20} />
                  Send Verification Email
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
