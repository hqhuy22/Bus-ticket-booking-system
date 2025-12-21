import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Ban,
} from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

/**
 * Booking History Component
 * Displays user's booking history with filtering and management options
 */
export default function BookingHistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingBooking, setCancellingBooking] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Map frontend filter to backend status parameter
      let statusParam = '';
      if (filter !== 'all') {
        // 'cancelled' tab should fetch history (completed, cancelled, expired)
        const backendStatus = filter === 'cancelled' ? 'history' : filter;
        statusParam = `?status=${backendStatus}`;
      }

      const response = await axiosInstance.get(
        `/api/bookings/my-bookings${statusParam}`
      );

      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async bookingId => {
    try {
      setCancellingBooking(bookingId);

      await axiosInstance.post(`/api/bookings/${bookingId}/cancel`, {
        reason: cancelReason || 'Cancelled by user',
      });

      // Refresh bookings
      await fetchBookings();

      setShowCancelModal(false);
      setCancelReason('');
      setSelectedBooking(null);

      alert('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingBooking(null);
    }
  };

  const getStatusBadge = status => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <AlertCircle size={16} />,
        text: 'Pending',
      },
      confirmed: {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle size={16} />,
        text: 'Confirmed',
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        icon: <XCircle size={16} />,
        text: 'Cancelled',
      },
      completed: {
        color: 'bg-blue-100 text-info-800',
        icon: <CheckCircle size={16} />,
        text: 'Completed',
      },
      expired: {
        color: 'bg-gray-100 text-gray-800',
        icon: <XCircle size={16} />,
        text: 'Expired',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        {config.icon}
        {config.text}
      </span>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['pending'].includes(booking.status);
    if (filter === 'confirmed') return booking.status === 'confirmed';
    if (filter === 'cancelled')
      return ['cancelled', 'expired', 'completed'].includes(booking.status);
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-600">
            View and manage your bus ticket bookings
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'all', label: 'All Bookings' },
              { value: 'upcoming', label: 'Upcoming (Pending)' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled/Completed' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === value
                    ? 'bg-info-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No bookings found</p>
            <button
              onClick={() => navigate('/bus-booking/search-buses')}
              className="px-6 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors"
            >
              Book a Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">
                            {booking.bookingReference}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar size={16} />
                          <span>
                            Booked on:{' '}
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin size={18} className="text-info-500" />
                          <div>
                            <p className="text-sm text-gray-600">Route</p>
                            <p className="font-semibold">
                              {booking.departure} → {booking.arrival}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock size={18} className="text-info-500" />
                          <div>
                            <p className="text-sm text-gray-600">Departure</p>
                            <p className="font-semibold">
                              {new Date(
                                booking.journeyDate
                              ).toLocaleDateString()}{' '}
                              at {booking.booking_startTime}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users size={18} className="text-info-500" />
                          <div>
                            <p className="text-sm text-gray-600">Seats</p>
                            <p className="font-semibold">
                              {booking.seatNumbers?.join(', ') || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <CreditCard size={18} className="text-info-500" />
                          <div>
                            <p className="text-sm text-gray-600">Total Paid</p>
                            <p className="font-semibold text-success-600">
                              Rs.{' '}
                              {parseFloat(booking.payment_totalPay).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <button
                      onClick={() =>
                        navigate(`/bus-booking/booking-details/${booking.id}`)
                      }
                      className="flex-1 lg:flex-none px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={18} />
                      View Details
                    </button>

                    {['pending', 'confirmed'].includes(booking.status) &&
                      !booking.schedule?.isCompleted && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowCancelModal(true);
                          }}
                          className="flex-1 lg:flex-none px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Ban size={18} />
                          Cancel
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Cancel Booking
            </h3>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to cancel booking{' '}
                <strong>{selectedBooking.bookingReference}</strong>?
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Route: {selectedBooking.departure} → {selectedBooking.arrival}
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Please provide a reason..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancelReason('');
                }}
                disabled={cancellingBooking}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking(selectedBooking.id)}
                disabled={cancellingBooking}
                className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50"
              >
                {cancellingBooking ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
