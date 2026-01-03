import { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SideNavigation from '../components/header/SideNavigation';
import { Calendar, Clock, MapPin, Shield, Info, XCircle } from 'lucide-react';
import {
  calculateCancellationFee,
  formatCurrency,
} from '../utils/pricingCalculator';

export default function Dashboard() {
  const navigate = useNavigate();
  const mobileOpen = useSelector(state => state.theme.isMobileOpen);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const Theme = useSelector(state => state.theme.lightTheme);
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  const activeTab = useSelector(state => state.dashboard.activeTab);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !isLoggedIn) {
      navigate('/bus-booking/login');
      return;
    }

    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    const fetchWelcomeMessage = async () => {
      try {
        const response = await axiosInstance.get('/');
        setWelcomeMessage(response.data.message);
      } catch (error) {
        console.error('Error fetching the welcome message:', error);
        setError('Failed to load welcome message. Please try again later.');
      }
    };

    if (isLoggedIn) {
      fetchWelcomeMessage();
      // fetch user bookings
      (async () => {
        try {
          const res = await axiosInstance.get('/api/bookings/my-bookings');
          setBookings(res.data.bookings || []);
        } catch (err) {
          console.error('Failed to fetch bookings:', err);
        }
      })();
    }
  }, [isLoggedIn, navigate]);

  // derive upcoming and history from fetched bookings
  // Filter out bookings with completed schedules from upcoming
  // Exclude expired bookings from upcoming trips (check both status and expiresAt)
  const upcomingBookings = bookings.filter(b => {
    const isExpired =
      b.status === 'expired' ||
      (b.expiresAt && new Date(b.expiresAt) < new Date());
    return (
      ['pending', 'confirmed'].includes(b.status) &&
      !isExpired &&
      !b.schedule?.isCompleted
    );
  });
  const bookingHistory = bookings.filter(b => {
    const isExpired =
      b.status === 'expired' ||
      (b.expiresAt && new Date(b.expiresAt) < new Date());
    return ['completed', 'cancelled'].includes(b.status) || isExpired;
  });

  // Calculate refund information
  const getRefundInfo = booking => {
    if (!booking || !booking.journeyDate || !booking.booking_startTime) {
      return null;
    }

    try {
      let journeyDateTime;
      if (booking.journeyDate instanceof Date) {
        journeyDateTime = new Date(booking.journeyDate);
      } else {
        const dateStr = booking.journeyDate.split('T')[0];
        journeyDateTime = new Date(`${dateStr}T${booking.booking_startTime}`);
      }

      const now = new Date();
      const hoursBeforeDeparture = (journeyDateTime - now) / (1000 * 60 * 60);

      if (hoursBeforeDeparture < 0) {
        return {
          canCancel: false,
          message: 'Cannot cancel - trip has already departed',
          refundInfo: null,
        };
      }

      const totalPay = parseFloat(booking.payment_totalPay) || 0;
      const refundInfo = calculateCancellationFee(
        totalPay,
        hoursBeforeDeparture
      );

      return {
        canCancel: true,
        hoursBeforeDeparture: Math.floor(hoursBeforeDeparture),
        refundInfo,
      };
    } catch (error) {
      console.error('Error calculating refund:', error);
      return null;
    }
  };

  const handleCancelClick = booking => {
    // Check if booking has expired
    const isExpired =
      booking.status === 'expired' ||
      (booking.expiresAt && new Date(booking.expiresAt) < new Date());

    if (isExpired) {
      alert('Cannot cancel - this booking has expired');
      return;
    }

    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleCancel = async bookingId => {
    try {
      setCancelling(true);
      await axiosInstance.post(`/api/bookings/${bookingId}/cancel`, {
        reason: cancelReason || 'Cancelled by user',
      });
      // refresh bookings
      const res = await axiosInstance.get('/api/bookings/my-bookings');
      setBookings(res.data.bookings || []);
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedBooking(null);
      alert('Booking cancelled');
    } catch (err) {
      console.error('Cancel failed', err);
      alert(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row ${Theme ? 'bg-white' : 'bg-gray-900'} min-h-screen`}
    >
      <SideNavigation />
      <main
        className={`flex-grow transition-all duration-300 ${mobileOpen ? 'sm:ml-0' : 'sm:ml-64'} sm:pt-4 pt-20 px-4`}
      >
        <div className="rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-info-500">
                Welcome back, {user?.username || 'User'}
              </h1>
              {user?.position === 'admin' && (
                <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  <Shield size={16} />
                  Admin
                </span>
              )}
            </div>
            {user?.position === 'admin' && (
              <button
                onClick={() => navigate('/bus-booking/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors shadow"
              >
                <Shield size={18} />
                Go to Admin Panel
              </button>
            )}
          </div>
          {error ? (
            <p className="mt-2 text-lg text-error-500">{error}</p>
          ) : (
            <p className="mt-2 text-base">{welcomeMessage || 'Loading...'}</p>
          )}
        </div>

        {activeTab === 'upcoming' && (
          <div className="space-y-6 pt-10 px-2 sm:px-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Upcoming Trips
              </h3>
              <button
                onClick={() => navigate('/bus-booking/bookings')}
                className="px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors text-sm font-medium"
              >
                View All Bookings
              </button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {upcomingBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={18} />
                      <span>
                        {booking.departure} → {booking.arrival}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={18} />
                      <span>
                        {new Date(booking.journeyDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={18} />
                      <span>{booking.booking_startTime}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center border-t pt-4">
                    <span className="text-sm text-gray-600">
                      Seat: {booking.seatNumbers?.join(', ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigate(`/bus-booking/booking-details/${booking.id}`)
                        }
                        className="px-3 py-1 text-sm text-info-600 bg-blue-100 hover:bg-blue-200 rounded transition"
                      >
                        Details
                      </button>
                      {(() => {
                        // Double-check booking hasn't expired since page load
                        const isExpired =
                          booking.status === 'expired' ||
                          (booking.expiresAt &&
                            new Date(booking.expiresAt) < new Date());
                        if (!isExpired) {
                          return (
                            <button
                              onClick={() => handleCancelClick(booking)}
                              className="px-3 py-1 text-sm text-error-600 bg-red-100 hover:bg-red-200 rounded transition"
                            >
                              Cancel
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 overflow-x-auto w-full px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Booking History
              </h3>
              <button
                onClick={() => navigate('/bus-booking/bookings')}
                className="px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors text-sm font-medium"
              >
                View All Bookings
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200 w-full">
              <table className="w-full min-w-[500px] sm:min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                      Route
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                      Time
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                      Price
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookingHistory.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3">
                        {booking.departure} → {booking.arrival}
                      </td>
                      <td className="px-3 sm:px-6 py-3">
                        {new Date(booking.journeyDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-3">
                        {booking.booking_startTime}
                      </td>
                      <td className="px-3 sm:px-6 py-3">
                        Rs. {parseFloat(booking.payment_totalPay).toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-3">
                        <span className="px-2 py-1 text-xs font-medium text-success-700 bg-green-50 rounded">
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Cancel Booking Modal with Refund Policy */}
      {showCancelModal && selectedBooking && (
        <>
          {/* Backdrop overlay - covers everything including sidebar */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />

          {/* Modal content */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto">
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

                {/* Refund Policy Display */}
                {(() => {
                  const refundData = getRefundInfo(selectedBooking);

                  if (!refundData) {
                    return (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <Info
                            className="text-yellow-600 mt-0.5 flex-shrink-0"
                            size={20}
                          />
                          <p className="text-sm text-yellow-800">
                            Unable to calculate refund information. Please
                            contact support.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (!refundData.canCancel) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <XCircle
                            className="text-red-600 mt-0.5 flex-shrink-0"
                            size={20}
                          />
                          <p className="text-sm text-red-800 font-medium">
                            {refundData.message}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  const { refundInfo, hoursBeforeDeparture } = refundData;

                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2 mb-3">
                        <Info
                          className="text-blue-600 mt-0.5 flex-shrink-0"
                          size={20}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            Refund Policy
                          </h4>

                          <div className="text-sm text-blue-800 mb-3">
                            <p className="flex items-center gap-1">
                              <Clock size={16} />
                              <span>
                                <strong>{hoursBeforeDeparture} hours</strong>{' '}
                                remaining before departure
                              </span>
                            </p>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-800">
                                Original Amount:
                              </span>
                              <span className="font-semibold text-blue-900">
                                {formatCurrency(refundInfo.totalPay)}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-blue-800">
                                Refund Rate:{' '}
                                {(refundInfo.refundRate * 100).toFixed(0)}%
                              </span>
                              <span
                                className={`font-semibold ${refundInfo.refundRate > 0 ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {refundInfo.refundRate > 0 ? '✓' : '✗'}
                              </span>
                            </div>

                            {refundInfo.cancellationFee > 0 && (
                              <div className="flex justify-between">
                                <span className="text-blue-800">
                                  Cancellation Fee:
                                </span>
                                <span className="font-semibold text-red-600">
                                  - {formatCurrency(refundInfo.cancellationFee)}
                                </span>
                              </div>
                            )}

                            <div className="border-t border-blue-300 pt-2 mt-2">
                              <div className="flex justify-between">
                                <span className="font-semibold text-blue-900">
                                  You will receive:
                                </span>
                                <span className="font-bold text-lg text-green-600">
                                  {formatCurrency(refundInfo.refundAmount)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-blue-700 font-medium mb-1">
                              Cancellation Policy:
                            </p>
                            <ul className="text-xs text-blue-700 space-y-1">
                              <li>• 24+ hours before: 100% refund</li>
                              <li>• 12-24 hours before: 50% refund</li>
                              <li>• Less than 12 hours: No refund</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
                    setCancelReason('');
                    setSelectedBooking(null);
                  }}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  onClick={() => handleCancel(selectedBooking.id)}
                  disabled={
                    cancelling || !getRefundInfo(selectedBooking)?.canCancel
                  }
                  className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
