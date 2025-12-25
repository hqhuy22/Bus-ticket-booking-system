// Trip Operations Component - Admin only
// View passenger list, check-in passengers, update trip status
import { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export default function TripOperations() {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });

  useEffect(() => {
    fetchActiveSchedules();
  }, []);

  const fetchActiveSchedules = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bus-schedules/admin');
      // Filter to show only Scheduled and In Progress trips
      const activeTrips = (response.data.schedules || []).filter(
        s => s.status === 'Scheduled' || s.status === 'In Progress'
      );
      setSchedules(activeTrips);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchPassengers = async scheduleId => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `/api/bus-schedule/${scheduleId}/passengers`
      );
      setPassengers(response.data.passengers || []);
      setStats({
        total: response.data.totalPassengers || 0,
        checkedIn: response.data.checkedInCount || 0,
      });
      setSelectedSchedule(response.data.schedule);
    } catch (err) {
      console.error('Error fetching passengers:', err);
      setError(err.response?.data?.error || 'Failed to load passenger list');
      setPassengers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId, passengerIndex) => {
    try {
      await axios.post(`/api/bus-schedule/${selectedSchedule.id}/checkin`, {
        bookingId,
        passengerIndex,
      });

      // Refresh passenger list
      fetchPassengers(selectedSchedule.id);
      alert('Passenger checked in successfully!');
    } catch (err) {
      console.error('Check-in error:', err);
      alert(err.response?.data?.error || 'Failed to check-in passenger');
    }
  };

  const handleUpdateTripStatus = async newStatus => {
    const statusText = newStatus === 'In Progress' ? 'Departed' : 'Arrived';
    if (
      !window.confirm(
        `Are you sure you want to mark this trip as ${statusText}?`
      )
    ) {
      return;
    }

    try {
      await axios.post(
        `/api/bus-schedule/${selectedSchedule.id}/update-status`,
        {
          status: newStatus,
        }
      );

      alert(`Trip marked as ${statusText} successfully!`);

      // Refresh data
      await fetchActiveSchedules();
      if (newStatus === 'Completed') {
        // Trip completed, clear selection
        setSelectedSchedule(null);
        setPassengers([]);
      } else {
        // Refresh passenger list
        fetchPassengers(selectedSchedule.id);
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert(err.response?.data?.error || 'Failed to update trip status');
    }
  };

  const getStatusBadge = status => {
    const configs = {
      Scheduled: { bg: 'bg-blue-100', text: 'text-info-800', icon: '📅' },
      'In Progress': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: '🚌',
      },
    };
    const config = configs[status] || configs['Scheduled'];
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {config.icon} {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Trip Operations
        </h2>
        <p className="text-gray-600">
          Manage passenger check-ins and trip status
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Trip List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MapPin size={20} />
                Active Trips
              </h3>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading && !selectedSchedule ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading...
                </div>
              ) : schedules.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No active trips found
                </div>
              ) : (
                schedules.map(schedule => (
                  <button
                    key={schedule.id}
                    onClick={() => fetchPassengers(schedule.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedSchedule?.id === schedule.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-gray-900">
                        {schedule.departure_city} → {schedule.arrival_city}
                      </div>
                      {getStatusBadge(schedule.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Route #{schedule.routeNo}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <Clock size={14} />
                      {schedule.departure_date} {schedule.departure_time}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Passenger List */}
        <div className="lg:col-span-2">
          {selectedSchedule ? (
            <div className="bg-white rounded-lg shadow">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {selectedSchedule.departure_city} →{' '}
                      {selectedSchedule.arrival_city}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedSchedule.departure_date}{' '}
                      {selectedSchedule.departure_time} • Route #
                      {selectedSchedule.routeNo}
                    </p>
                  </div>
                  {getStatusBadge(selectedSchedule.status)}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Total Passengers
                    </div>
                    <div className="text-2xl font-bold text-info-600">
                      {stats.total}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Checked In</div>
                    <div className="text-2xl font-bold text-success-600">
                      {stats.checkedIn} / {stats.total}
                    </div>
                  </div>
                </div>

                {/* Trip Status Actions */}
                <div className="mt-4 flex gap-2">
                  {selectedSchedule.status === 'Scheduled' && (
                    <button
                      onClick={() => handleUpdateTripStatus('In Progress')}
                      className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      🚌 Mark as Departed
                    </button>
                  )}
                  {selectedSchedule.status === 'In Progress' && (
                    <button
                      onClick={() => handleUpdateTripStatus('Completed')}
                      className="flex-1 bg-success-600 text-white px-4 py-2 rounded-lg hover:bg-success-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      ✓ Mark as Arrived
                    </button>
                  )}
                </div>
              </div>

              {/* Passenger List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Passenger
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Ref
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          Loading passengers...
                        </td>
                      </tr>
                    ) : passengers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No passengers found
                        </td>
                      </tr>
                    ) : (
                      passengers.map((passenger, idx) => (
                        <tr
                          key={`${passenger.bookingId}-${idx}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-info-800 rounded-full font-semibold">
                              {passenger.seatNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {passenger.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {passenger.age} yrs • {passenger.gender}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {passenger.phone}
                            </div>
                            <div className="text-xs text-gray-500">
                              {passenger.customerEmail}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {passenger.bookingReference}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {passenger.checkedIn ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle size={14} />
                                Checked In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <XCircle size={14} />
                                Not Checked In
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {!passenger.checkedIn && (
                              <button
                                onClick={() =>
                                  handleCheckIn(
                                    passenger.bookingId,
                                    passenger.passengerIndex
                                  )
                                }
                                className="text-info-600 hover:text-info-800 font-medium text-sm"
                              >
                                Check In
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Users size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a Trip
              </h3>
              <p className="text-gray-600">
                Choose a trip from the list to view passengers and manage
                check-ins
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
