import { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Mail,
  Eye,
} from 'lucide-react';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 20,
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: currentPage,
        limit: 20,
      };
      if (selectedStatus) {
        params.status = selectedStatus;
      }
      if (createdDate) {
        params.createdDate = createdDate;
      }

      const response = await axios.get('/api/bookings', { params });
      setBookings(response.data.bookings);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, createdDate, currentPage]);

  const handleConfirmBooking = async bookingId => {
    if (
      !window.confirm(
        'Are you sure you want to confirm this booking? A confirmation email will be sent to the customer.'
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(`/api/bookings/admin/${bookingId}/confirm`);
      alert(
        'Booking confirmed successfully! Email notification sent to customer.'
      );
      fetchBookings();
      setSelectedBooking(null);
    } catch (err) {
      console.error('Error confirming booking:', err);
      alert(err.response?.data?.message || 'Failed to confirm booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(`/api/bookings/admin/${selectedBooking.id}/cancel`, {
        reason: cancelReason,
      });
      alert(
        'Booking cancelled successfully! Cancellation email sent to customer.'
      );
      setShowCancelModal(false);
      setCancelReason('');
      fetchBookings();
      setSelectedBooking(null);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const openCancelModal = booking => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
    setCancelReason('');
  };

  const getStatusBadge = status => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { color: 'bg-blue-100 text-info-800', icon: CheckCircle },
      expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredBookings = bookings; // Remove client-side filtering, rely on backend

  const viewBookingDetails = booking => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">All Bookings</h2>
        <p className="text-gray-600">
          Manage and monitor all customer bookings
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Created Date
          </label>
          <input
            type="date"
            value={createdDate}
            onChange={e => {
              setCreatedDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Select created date"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Bookings Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Journey Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No bookings found
                </td>
              </tr>
            ) : (
              filteredBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.bookingReference}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {booking.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="font-medium">{booking.departure}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium">{booking.arrival}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(booking.journeyDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.booking_startTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Users size={14} className="text-gray-400" />
                      {Array.isArray(booking.seatNumbers)
                        ? booking.seatNumbers.join(', ')
                        : booking.seatNumbers}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <DollarSign size={14} className="text-gray-400" />$
                      {parseFloat(booking.payment_totalPay).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => viewBookingDetails(booking)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors"
                        title="View booking details"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleConfirmBooking(booking.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Confirm booking and send email"
                          >
                            <CheckCircle size={14} />
                            <Mail size={14} />
                            Confirm
                          </button>
                          <button
                            onClick={() => openCancelModal(booking)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-error-600 text-white rounded-lg hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Cancel booking and send email"
                          >
                            <XCircle size={14} />
                            <Mail size={14} />
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <div className="flex items-center gap-2 text-success-600">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Confirmed</span>
                        </div>
                      )}
                      {booking.status === 'completed' && (
                        <div className="flex items-center gap-2 text-info-600">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                      {['cancelled', 'expired'].includes(booking.status) && (
                        <span className="text-gray-400 text-sm">
                          No actions
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total bookings)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(prev =>
                  Math.min(pagination.totalPages, prev + 1)
                )
              }
              disabled={currentPage === pagination.totalPages}
              className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cancel Booking
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel booking{' '}
              <strong>{selectedBooking?.bookingReference}</strong>? A
              cancellation email will be sent to the customer.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason <span className="text-error-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Enter the reason for cancellation..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={actionLoading || !cancelReason.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    <Mail size={16} />
                    Confirm Cancellation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 my-8">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Booking Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Booking Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-3">
                  Booking Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">
                      Booking Reference
                    </span>
                    <p className="font-medium text-lg">
                      {selectedBooking.bookingReference}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Booking ID</span>
                    <p className="font-medium">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status</span>
                    <div className="mt-1">
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Created At</span>
                    <p className="font-medium">
                      {new Date(selectedBooking.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Journey Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-3">
                  Journey Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Route</span>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      {selectedBooking.departure} → {selectedBooking.arrival}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Journey Date</span>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      {new Date(
                        selectedBooking.journeyDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      Departure Time
                    </span>
                    <p className="font-medium">
                      {selectedBooking.booking_startTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Seat Numbers</span>
                    <p className="font-medium flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      {Array.isArray(selectedBooking.seatNumbers)
                        ? selectedBooking.seatNumbers.join(', ')
                        : selectedBooking.seatNumbers}
                    </p>
                  </div>
                </div>
              </div>

              {/* Passenger Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-3">
                  Passenger Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Customer ID</span>
                    <p className="font-medium">{selectedBooking.customerId}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      Passenger Name
                    </span>
                    <p className="font-medium">
                      {selectedBooking.passengerName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Contact Phone</span>
                    <p className="font-medium">
                      {selectedBooking.contactPhone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Contact Email</span>
                    <p className="font-medium">
                      {selectedBooking.contactEmail || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-3">
                  Payment Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <p className="font-medium text-xl flex items-center gap-2">
                      <DollarSign size={20} className="text-gray-400" />$
                      {parseFloat(selectedBooking.payment_totalPay).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      Payment Status
                    </span>
                    <p className="font-medium">
                      {selectedBooking.status === 'pending' &&
                        'Pending Payment'}
                      {selectedBooking.status === 'confirmed' && 'Paid'}
                      {selectedBooking.status === 'completed' &&
                        'Paid & Completed'}
                      {selectedBooking.status === 'cancelled' &&
                        'Refunded/Cancelled'}
                      {selectedBooking.status === 'expired' && 'Expired'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      Payment Method
                    </span>
                    <p className="font-medium">
                      {selectedBooking.payment_paymentMethod || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      Transaction ID
                    </span>
                    <p className="font-medium text-sm break-all">
                      {selectedBooking.payment_transactionId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedBooking.cancellationReason ||
                selectedBooking.notes) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-3">
                    Additional Information
                  </h4>
                  {selectedBooking.cancellationReason && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">
                        Cancellation Reason
                      </span>
                      <p className="font-medium text-error-600">
                        {selectedBooking.cancellationReason}
                      </p>
                    </div>
                  )}
                  {selectedBooking.notes && (
                    <div>
                      <span className="text-sm text-gray-600">Notes</span>
                      <p className="font-medium">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
