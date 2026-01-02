import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Ban,
  CheckCircle,
  AlertCircle,
  XCircle,
  Mail,
  Info,
  Clock,
} from 'lucide-react';
import axiosInstance from '../utils/axiosConfig';
import BookingSummary from '../components/booking/BookingSummary';
import useTripStatus from '../hooks/useTripStatus';
import {
  TripStatusBadge,
  TripStatusIndicator,
  TripTimeline,
} from '../components/trip/TripStatusComponents';
import {
  calculateCancellationFee,
  formatCurrency,
} from '../utils/pricingCalculator';

/**
 * Booking Details Page
 * Shows complete details of a single booking with real-time trip status
 */
export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedPassengers, setEditedPassengers] = useState([]);
  const [savingPassengers, setSavingPassengers] = useState(false);
  const [emailingTicket, setEmailingTicket] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Real-time trip status updates (only for confirmed/completed bookings)
  const shouldEnableTripStatus =
    booking && ['confirmed', 'completed'].includes(booking.status);
  const { tripStatus, isConnected, lastUpdate } = useTripStatus(
    id,
    30000,
    shouldEnableTripStatus
  );

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/bookings/${id}`);
        setBooking(response.data.booking);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(
          err.response?.data?.message || 'Failed to fetch booking details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id]);

  // Calculate refund information
  const getRefundInfo = booking => {
    if (!booking || !booking.journeyDate || !booking.booking_startTime) {
      return null;
    }

    try {
      // Parse journey date and time - handle different date formats
      let journeyDateTime;

      // If journeyDate is already a Date object
      if (booking.journeyDate instanceof Date) {
        journeyDateTime = new Date(booking.journeyDate);
      } else {
        // If it's a string, try to parse it
        const dateStr = booking.journeyDate.split('T')[0]; // Get just the date part
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

  const handleCancelBooking = async () => {
    // Show modal instead of direct confirm
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    try {
      setCancelling(true);
      await axiosInstance.post(`/api/bookings/${id}/cancel`, {
        reason: cancelReason || 'Cancelled by user from booking details',
      });

      // Refresh booking details
      try {
        const resp = await axiosInstance.get(`/api/bookings/${id}`);
        setBooking(resp.data.booking);
      } catch (e) {
        console.error('Failed to refresh booking after cancel:', e);
      }

      setShowCancelModal(false);
      setCancelReason('');
      alert('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadTicket = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/bookings/${id}/download-ticket`,
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${booking.bookingReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading ticket:', err);
      alert(err.response?.data?.message || 'Failed to download ticket');
    }
  };

  const handleEmailTicket = async email => {
    try {
      setEmailingTicket(true);
      await axiosInstance.post(`/api/bookings/${id}/email-ticket`, {
        email: email || undefined, // Send to user's email if not specified
      });
      alert(`E-ticket sent successfully to ${email || 'your email'}`);
      setShowShareModal(false);
      setShareEmail('');
    } catch (err) {
      console.error('Error emailing ticket:', err);
      alert(err.response?.data?.message || 'Failed to send e-ticket');
    } finally {
      setEmailingTicket(false);
    }
  };

  const handleShareTicket = () => {
    setShowShareModal(true);
  };

  const startEditPassengers = () => {
    setEditedPassengers((booking.passengers || []).map(p => ({ ...p })));
    setEditing(true);
  };

  const cancelEditPassengers = () => {
    setEditedPassengers([]);
    setEditing(false);
  };

  const updatePassengerField = (index, field, value) => {
    setEditedPassengers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const savePassengers = async () => {
    // basic validation: require name and seatNumber
    for (const p of editedPassengers) {
      if (!p.name || !p.seatNumber) {
        alert('Each passenger must have a name and seat number');
        return;
      }
    }

    try {
      setSavingPassengers(true);
      const res = await axiosInstance.put(`/api/bookings/${id}`, {
        passengers: editedPassengers,
      });
      // update local booking state
      setBooking(res.data.booking);
      setEditing(false);
      setEditedPassengers([]);
      alert('Passenger details updated');
    } catch (err) {
      console.error('Failed to save passengers', err);
      alert(err.response?.data?.message || 'Failed to update passengers');
    } finally {
      setSavingPassengers(false);
    }
  };

  const getStatusConfig = status => {
    const configs = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <AlertCircle size={20} />,
        text: 'Payment Pending',
      },
      confirmed: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle size={20} />,
        text: 'Confirmed',
      },
      cancelled: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: <XCircle size={20} />,
        text: 'Cancelled',
      },
      completed: {
        color: 'bg-blue-100 text-info-800 border-blue-300',
        icon: <CheckCircle size={20} />,
        text: 'Completed',
      },
      expired: {
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: <XCircle size={20} />,
        text: 'Expired',
      },
    };

    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error || 'Booking not found'}</p>
            <button
              onClick={() => navigate('/bus-booking/bookings')}
              className="px-6 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700"
            >
              Go to My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/bus-booking/bookings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to My Bookings
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Booking Details
              </h1>
              <p className="text-gray-600">
                Reference:{' '}
                <span className="font-semibold">
                  {booking.bookingReference}
                </span>
              </p>
            </div>
            <div
              className={`px-4 py-2 border-2 rounded-lg ${statusConfig.color} flex items-center gap-2`}
            >
              {statusConfig.icon}
              <span className="font-semibold">{statusConfig.text}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Real-time Trip Status Section */}
          {shouldEnableTripStatus && tripStatus && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Trip Status</h2>
                <div className="flex items-center gap-4">
                  <TripStatusBadge status={tripStatus.tripStatus} />
                  <TripStatusIndicator
                    isConnected={isConnected}
                    lastUpdate={lastUpdate}
                  />
                </div>
              </div>

              {/* Trip Timeline */}
              <TripTimeline tripStatus={tripStatus} />

              {/* Trip Details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-gray-600 mb-1">Scheduled Departure</div>
                  <div className="font-semibold">
                    {tripStatus.departure?.date} at {tripStatus.departure?.time}
                  </div>
                  {tripStatus.departure?.actualTime && (
                    <div className="text-success-600 text-xs mt-1">
                      ✓ Departed:{' '}
                      {new Date(
                        tripStatus.departure.actualTime
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-gray-600 mb-1">Expected Arrival</div>
                  <div className="font-semibold">
                    {tripStatus.arrival?.date} at {tripStatus.arrival?.time}
                  </div>
                  {tripStatus.arrival?.actualTime && (
                    <div className="text-success-600 text-xs mt-1">
                      ✓ Arrived:{' '}
                      {new Date(tripStatus.arrival.actualTime).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reuse BookingSummary so details match booking summary used during booking flow */}
          {booking &&
            (() => {
              const bookingData = {
                schedule: {
                  departure: booking.departure,
                  arrival: booking.arrival,
                  journeyDate: booking.journeyDate,
                  departureTime: booking.booking_startTime,
                  routeNo: booking.routeNo,
                  routeName:
                    booking?.schedule?.route?.routeName ||
                    booking.routeName ||
                    null,
                  depotName: booking.depotName,
                },
                seatNumbers: booking.seatNumbers || [],
                passengers: booking.passengers || [],
                pricing: {
                  busFare: parseFloat(booking.payment_busFare) || 0,
                  convenienceFee:
                    parseFloat(booking.payment_convenienceFee) || 0,
                  bankCharge: parseFloat(booking.payment_bankCharge) || 0,
                  totalPay: parseFloat(booking.payment_totalPay) || 0,
                },
                pickupPoint: booking.pickupPoint,
                dropoffPoint: booking.dropoffPoint,
              };

              return (
                <BookingSummary
                  bookingData={bookingData}
                  onGoBack={() => navigate('/bus-booking/bookings')}
                  onProceedToPayment={() => {}}
                  pickupPoint={booking.pickupPoint}
                  dropoffPoint={booking.dropoffPoint}
                  showActions={false}
                />
              );
            })()}

          {/* Booking Metadata */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Booking Information
            </h2>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Booked On:</span>
                <span className="ml-2 font-medium">
                  {new Date(booking.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <span className="ml-2 font-medium">
                  {new Date(booking.updatedAt).toLocaleString()}
                </span>
              </div>
              {booking.status === 'cancelled' && booking.cancelledAt && (
                <>
                  <div>
                    <span className="text-gray-600">Cancelled On:</span>
                    <span className="ml-2 font-medium">
                      {new Date(booking.cancelledAt).toLocaleString()}
                    </span>
                  </div>
                  {booking.cancellationReason && (
                    <div className="col-span-2">
                      <span className="text-gray-600">
                        Cancellation Reason:
                      </span>
                      <span className="ml-2 font-medium">
                        {booking.cancellationReason}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Passenger edit controls (when booking is pending) */}
          {booking.status === 'pending' && !editing && (
            <div className="flex mb-4">
              <button
                onClick={startEditPassengers}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Edit Passengers
              </button>
            </div>
          )}

          {editing && (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h3 className="text-lg font-semibold">Edit Passengers</h3>
              {editedPassengers.map((p, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                >
                  <div>
                    <label className="block text-sm text-gray-600">Name</label>
                    <input
                      value={p.name || ''}
                      onChange={e =>
                        updatePassengerField(idx, 'name', e.target.value)
                      }
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">
                      Seat Number
                    </label>
                    <input
                      value={p.seatNumber || ''}
                      onChange={e =>
                        updatePassengerField(idx, 'seatNumber', e.target.value)
                      }
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Phone</label>
                    <input
                      value={p.phone || ''}
                      onChange={e =>
                        updatePassengerField(idx, 'phone', e.target.value)
                      }
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-600">Age</label>
                      <input
                        type="number"
                        min="0"
                        value={p.age || ''}
                        onChange={e =>
                          updatePassengerField(idx, 'age', e.target.value)
                        }
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">
                        Gender
                      </label>
                      <select
                        value={p.gender || ''}
                        onChange={e =>
                          updatePassengerField(idx, 'gender', e.target.value)
                        }
                        className="w-full border px-3 py-2 rounded"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  onClick={savePassengers}
                  disabled={savingPassengers}
                  className="px-4 py-2 bg-info-600 text-white rounded-lg"
                >
                  {savingPassengers ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEditPassengers}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {(booking.status === 'confirmed' ||
              booking.status === 'completed') && (
              <>
                <button
                  onClick={handleDownloadTicket}
                  className="flex-1 px-6 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download E-Ticket
                </button>
                <button
                  onClick={handleShareTicket}
                  className="flex-1 px-6 py-3 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Mail size={20} />
                  Email E-Ticket
                </button>
              </>
            )}

            {['pending', 'confirmed'].includes(booking.status) &&
              !booking.schedule?.isCompleted && (
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="flex-1 px-6 py-3 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Ban size={20} />
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Email E-Ticket
            </h3>
            <p className="text-gray-600 mb-4">
              Send the e-ticket to an email address. Leave blank to send to your
              registered email.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleEmailTicket(shareEmail)}
                disabled={emailingTicket}
                className="flex-1 px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors disabled:opacity-50"
              >
                {emailingTicket ? 'Sending...' : 'Send E-Ticket'}
              </button>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareEmail('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal with Refund Policy */}
      {showCancelModal && booking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50] p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Cancel Booking
            </h3>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to cancel booking{' '}
                <strong>{booking.bookingReference}</strong>?
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Route: {booking.departure} → {booking.arrival}
              </p>

              {/* Refund Policy Display */}
              {(() => {
                const refundData = getRefundInfo(booking);

                if (!refundData) {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <Info
                          className="text-yellow-600 mt-0.5 flex-shrink-0"
                          size={20}
                        />
                        <p className="text-sm text-yellow-800">
                          Unable to calculate refund information. Please contact
                          support.
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

                        {/* Time remaining */}
                        <div className="text-sm text-blue-800 mb-3">
                          <p className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>
                              <strong>{hoursBeforeDeparture} hours</strong>{' '}
                              remaining before departure
                            </span>
                          </p>
                        </div>

                        {/* Refund breakdown */}
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

                        {/* Policy explanation */}
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
                }}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={cancelling || !getRefundInfo(booking)?.canCancel}
                className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
