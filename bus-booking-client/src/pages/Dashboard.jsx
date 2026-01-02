import { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SideNavigation from '../components/header/SideNavigation';
import { Calendar, Clock, MapPin, Shield } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const mobileOpen = useSelector(state => state.theme.isMobileOpen);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
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
  const upcomingBookings = bookings.filter(
    b => ['pending', 'confirmed'].includes(b.status) && !b.schedule?.isCompleted
  );
  const bookingHistory = bookings.filter(b =>
    ['completed', 'cancelled', 'expired'].includes(b.status)
  );

  const handleCancel = async bookingId => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?'
    );
    if (!confirmed) return;
    try {
      await axiosInstance.post(`/api/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by user',
      });
      // refresh bookings
      const res = await axiosInstance.get('/api/bookings/my-bookings');
      setBookings(res.data.bookings || []);
      alert('Booking cancelled');
    } catch (err) {
      console.error('Cancel failed', err);
      alert(err.response?.data?.message || 'Failed to cancel');
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
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="px-3 py-1 text-sm text-error-600 bg-red-100 hover:bg-red-200 rounded transition"
                      >
                        Cancel
                      </button>
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
    </div>
  );
}
