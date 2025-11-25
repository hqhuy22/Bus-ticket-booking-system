import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../utils/pricingCalculator';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [upcomingTrips, setUpcomingTrips] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, schedulesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/analytics/summary`, { headers }),
        axios.get(`${API_BASE_URL}/api/bus-schedules/admin`, { headers }),
      ]);

      setSummary(summaryRes.data);

      // Filter upcoming trips (next 7 days)
      const now = new Date();
      const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // API returns { schedules: [...], pagination: {...} }
      const allSchedules = schedulesRes.data.schedules || [];
      const upcoming = allSchedules
        .filter(schedule => {
          // Combine departure_date and departure_time to create Date object
          const scheduleDateTime = new Date(
            `${schedule.departure_date}T${schedule.departure_time}`
          );
          return (
            scheduleDateTime >= now &&
            scheduleDateTime <= next7Days &&
            !schedule.isCompleted
          );
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.departure_date}T${a.departure_time}`);
          const dateB = new Date(`${b.departure_date}T${b.departure_time}`);
          return dateA - dateB;
        })
        .slice(0, 5);

      setUpcomingTrips(upcoming);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    subtitle,
    trend,
  }) => (
    <div
      className="bg-white rounded-lg shadow p-6 border-l-4"
      style={{ borderColor: getColorCode(color) }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm ${
              parseFloat(trend) >= 0 ? 'text-success-600' : 'text-error-600'
            }`}
          >
            <TrendingUp
              size={16}
              className={parseFloat(trend) < 0 ? 'rotate-180' : ''}
            />
            <span>{Math.abs(parseFloat(trend))}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string,
    subtitle: PropTypes.string,
    trend: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  const getColorCode = color => {
    const colors = {
      blue: '#3B82F6',
      green: '#10B981',
      orange: '#F59E0B',
      purple: '#8B5CF6',
      red: '#EF4444',
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Today's Metrics */}
      {summary && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Today&apos;s Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Today's Revenue"
                value={formatCurrency(summary.today.revenue)}
                icon={DollarSign}
                color="green"
                subtitle={`${summary.today.bookings} bookings`}
              />
              <StatCard
                title="Today's Bookings"
                value={summary.today.bookings}
                icon={Ticket}
                color="blue"
                subtitle="Confirmed bookings"
              />
              <StatCard
                title="Pending Bookings"
                value={summary.pending}
                icon={Clock}
                color="orange"
                subtitle="Awaiting confirmation"
              />
              <StatCard
                title="Total Customers"
                value={summary.totalCustomers}
                icon={Users}
                color="purple"
                subtitle="Registered users"
              />
            </div>
          </div>
        </>
      )}

      {/* Upcoming Trips */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Trips (Next 7 Days)
        </h2>
        {upcomingTrips.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departure Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Seats
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingTrips.map(trip => (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {trip.departure_date}
                          </div>
                          <div className="text-sm text-gray-500">
                            {trip.departure_time}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {trip.departure_city} → {trip.arrival_city}
                      </div>
                      <div className="text-xs text-gray-500">
                        Route #{trip.routeNo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {trip.bus?.busNumber || trip.busScheduleID}
                      </div>
                      <div className="text-xs text-gray-500">
                        {trip.busType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trip.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <CheckCircle size={12} />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={12} />
                          Scheduled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">
                          {trip.availableSeats} /{' '}
                          {trip.bus?.totalSeats || 'N/A'}
                        </div>
                        {trip.availableSeats < 5 && trip.availableSeats > 0 && (
                          <AlertCircle
                            size={16}
                            className="text-orange-500"
                            title="Low availability"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              No upcoming trips in the next 7 days
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
