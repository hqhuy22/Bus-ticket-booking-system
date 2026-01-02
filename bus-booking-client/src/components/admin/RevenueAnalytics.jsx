import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../utils/pricingCalculator';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function RevenueAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [revenueData, setRevenueData] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: dateRange <= 7 ? 'day' : dateRange <= 30 ? 'day' : 'week',
      };

      const [revenue, bookings, financial, summary] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/analytics/revenue`, { headers, params }),
        axios.get(`${API_BASE_URL}/api/analytics/bookings`, {
          headers,
          params,
        }),
        axios.get(`${API_BASE_URL}/api/analytics/financial`, {
          headers,
          params,
        }),
        axios.get(`${API_BASE_URL}/api/analytics/summary`, { headers }),
      ]);

      setRevenueData(revenue.data);
      setBookingData(bookings.data);
      setFinancialData(financial.data);
      setSummaryData(summary.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatNumber = num => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    subtitle,
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
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
    trend: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    color: PropTypes.string,
    subtitle: PropTypes.string,
  };

  if (loading && !revenueData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Revenue Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Track revenue, bookings, and financial performance
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(summaryData.today.revenue)}
            icon={DollarSign}
            color="green"
            subtitle={`${summaryData.today.bookings} bookings`}
          />
          <StatCard
            title="This Month"
            value={formatCurrency(summaryData.month.revenue)}
            icon={Calendar}
            color="blue"
            subtitle={`${summaryData.month.bookings} bookings`}
          />
          <StatCard
            title="Total Customers"
            value={formatNumber(summaryData.totalCustomers)}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Pending Bookings"
            value={formatNumber(summaryData.pending)}
            icon={ShoppingCart}
            color="orange"
          />
        </div>
      )}

      {/* Main Revenue Metrics */}
      {revenueData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(revenueData.summary.totalRevenue)}
            icon={DollarSign}
            trend={revenueData.summary.revenueGrowth}
            color="green"
            subtitle={`${formatNumber(revenueData.summary.totalBookings)} bookings`}
          />
          <StatCard
            title="Average Booking Value"
            value={formatCurrency(revenueData.summary.averageBookingValue)}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Bus Fare Revenue"
            value={formatCurrency(revenueData.summary.totalFare)}
            icon={DollarSign}
            color="indigo"
          />
          <StatCard
            title="Service Fees"
            value={formatCurrency(revenueData.summary.totalConvenienceFee)}
            icon={DollarSign}
            color="purple"
          />
        </div>
      )}

      {/* Revenue Chart */}
      {revenueData && revenueData.revenueByPeriod.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trends
          </h2>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Simple bar chart visualization */}
              <div className="space-y-3">
                {revenueData.revenueByPeriod.map((item, index) => {
                  const maxRevenue = Math.max(
                    ...revenueData.revenueByPeriod.map(i => i.revenue)
                  );
                  const width = (item.revenue / maxRevenue) * 100;

                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-gray-600 font-medium">
                        {item.period}
                      </div>
                      <div className="flex-1 relative">
                        <div className="h-8 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-info-500 rounded flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${width}%` }}
                          >
                            {width > 20 && (
                              <span className="text-xs font-semibold text-white">
                                {formatCurrency(item.revenue)}
                              </span>
                            )}
                          </div>
                        </div>
                        {width <= 20 && (
                          <span className="text-xs font-semibold text-gray-700 ml-2">
                            {formatCurrency(item.revenue)}
                          </span>
                        )}
                      </div>
                      <div className="w-20 text-sm text-gray-600 text-right">
                        {item.bookings} bookings
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Routes & Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Routes */}
        {revenueData && revenueData.revenueByRoute.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top Revenue Routes
            </h2>
            <div className="space-y-3">
              {revenueData.revenueByRoute.slice(0, 5).map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {route.departure} → {route.arrival}
                    </p>
                    <p className="text-sm text-gray-600">
                      Route #{route.routeNo} • {route.bookings} bookings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(route.revenue)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Avg: {formatCurrency(route.avgRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue Composition */}
        {financialData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue Composition
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Bus Fare</span>
                  <span className="font-medium">
                    {financialData.revenueComposition.busFarePercentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-info-500"
                    style={{
                      width: `${financialData.revenueComposition.busFarePercentage}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Convenience Fee</span>
                  <span className="font-medium">
                    {financialData.revenueComposition.convenienceFeePercentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{
                      width: `${financialData.revenueComposition.convenienceFeePercentage}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Bank Charges</span>
                  <span className="font-medium">
                    {financialData.revenueComposition.bankChargePercentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{
                      width: `${financialData.revenueComposition.bankChargePercentage}%`,
                    }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-semibold">
                    Net Revenue
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {formatCurrency(financialData.summary.netRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Total Refunds</span>
                  <span className="text-error-600">
                    -{formatCurrency(financialData.summary.totalRefunds)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Analytics */}
      {bookingData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Conversion Metrics
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-success-600 mt-1">
                  {bookingData.conversionMetrics.conversionRate}%
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {bookingData.conversionMetrics.confirmedBookings} of{' '}
                  {bookingData.conversionMetrics.totalBookings} bookings
                  confirmed
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Cancellation Rate</p>
                <p className="text-3xl font-bold text-error-600 mt-1">
                  {bookingData.conversionMetrics.cancellationRate}%
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {bookingData.conversionMetrics.cancelledBookings} bookings
                  cancelled
                </p>
              </div>
              <div className="space-y-2">
                {bookingData.conversionMetrics.statusBreakdown.map(
                  (status, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-600 capitalize">
                        {status.status}
                      </span>
                      <span className="font-medium">{status.count}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Customer Insights */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Insights
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-info-600 mt-1">
                    {formatNumber(bookingData.customerMetrics.totalCustomers)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Loyal Customers</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {formatNumber(bookingData.customerMetrics.loyalCustomers)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">One-time</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(bookingData.customerMetrics.oneTimeCustomers)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Repeat</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(bookingData.customerMetrics.repeatCustomers)}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 mb-2">
                  Average Seats per Booking
                </p>
                <p className="text-2xl font-bold">
                  {bookingData.seatsMetrics.avgSeatsPerBooking}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Total:{' '}
                  {formatNumber(bookingData.seatsMetrics.totalSeatsBooked)}{' '}
                  seats
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Trends by Day */}
      {bookingData && bookingData.bookingTrends.byDayOfWeek.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bookings by Day of Week
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {bookingData.bookingTrends.byDayOfWeek.map((day, index) => {
              const maxBookings = Math.max(
                ...bookingData.bookingTrends.byDayOfWeek.map(
                  d => d.bookingCount
                )
              );
              const height = (day.bookingCount / maxBookings) * 100;

              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-full h-32 flex items-end justify-center mb-2">
                    <div
                      className="w-full bg-info-500 rounded-t transition-all duration-500 flex items-end justify-center pb-1"
                      style={{ height: `${height}%` }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {day.bookingCount}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium text-center">
                    {day.dayName.trim().substring(0, 3)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(day.revenue)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
