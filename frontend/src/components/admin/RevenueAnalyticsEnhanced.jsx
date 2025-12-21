import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../utils/pricingCalculator';
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Color palette for charts
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  pink: '#ec4899',
};

const PIE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#6366f1',
];

export default function RevenueAnalyticsEnhanced() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [revenueData, setRevenueData] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [activeChart, setActiveChart] = useState('revenue'); // revenue, bookings, routes

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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{' '}
              {entry.name.includes('Revenue') || entry.name.includes('revenue')
                ? formatCurrency(entry.value)
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.string,
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    subtitle,
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              parseFloat(trend) >= 0 ? 'text-success-600' : 'text-error-600'
            }`}
          >
            <TrendingUp
              size={16}
              className={parseFloat(trend) < 0 ? 'rotate-180' : ''}
            />
            <span>{Math.abs(parseFloat(trend)).toFixed(1)}%</span>
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

  // Prepare data for charts
  const revenueChartData =
    revenueData?.revenueByPeriod.map(item => ({
      period: item.period,
      revenue: parseFloat(item.revenue),
      bookings: parseInt(item.bookings),
    })) || [];

  const topRoutesData =
    revenueData?.revenueByRoute.slice(0, 10).map(route => ({
      name: `${route.departure.substring(0, 10)} → ${route.arrival.substring(0, 10)}`,
      revenue: parseFloat(route.revenue),
      bookings: parseInt(route.bookings),
      avgRevenue: parseFloat(route.avgRevenue),
    })) || [];

  const statusPieData =
    revenueData?.bookingsByStatus.map(item => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: parseInt(item.count),
    })) || [];

  const dayOfWeekData =
    bookingData?.bookingTrends.byDayOfWeek.map(day => ({
      day: day.dayName.trim(),
      bookings: parseInt(day.bookingCount),
      revenue: parseFloat(day.revenue),
    })) || [];

  const revenueCompositionData = financialData
    ? [
        {
          name: 'Bus Fare',
          value: parseFloat(financialData.summary.totalFare || 0),
        },
        {
          name: 'Convenience Fee',
          value: parseFloat(financialData.summary.totalConvenienceFee || 0),
        },
        {
          name: 'Bank Charges',
          value: parseFloat(financialData.summary.totalBankCharge || 0),
        },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-info-600" size={32} />
            Revenue Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track revenue, bookings, and financial performance with interactive
            charts
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors shadow-md"
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
            subtitle={`${summaryData.today.bookings} bookings today`}
          />
          <StatCard
            title="This Month"
            value={formatCurrency(summaryData.month.revenue)}
            icon={Calendar}
            color="blue"
            subtitle={`${summaryData.month.bookings} bookings this month`}
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

      {/* Chart Type Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveChart('revenue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeChart === 'revenue'
                ? 'bg-info-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity size={18} />
            Revenue Trends
          </button>
          <button
            onClick={() => setActiveChart('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeChart === 'bookings'
                ? 'bg-info-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 size={18} />
            Bookings Analysis
          </button>
          <button
            onClick={() => setActiveChart('routes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeChart === 'routes'
                ? 'bg-info-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PieChart size={18} />
            Route Performance
          </button>
        </div>
      </div>

      {/* Interactive Charts */}
      {activeChart === 'revenue' && revenueChartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="text-info-600" size={24} />
            Revenue Trends Over Time
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.primary}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.primary}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={value => `₫${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.primary}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue (VND)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeChart === 'bookings' && dayOfWeekData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings by Day of Week */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="text-info-600" size={24} />
              Bookings by Day of Week
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="day"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="bookings"
                  fill={COLORS.primary}
                  name="Bookings"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Booking Status Distribution */}
          {statusPieData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <PieChart className="text-info-600" size={24} />
                Booking Status Distribution
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <RechartsPie>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeChart === 'routes' && topRoutesData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Routes by Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="text-info-600" size={24} />
              Top Routes by Revenue
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topRoutesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={value => `₫${(value / 1000000).toFixed(1)}M`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="revenue"
                  fill={COLORS.success}
                  name="Revenue (VND)"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Composition */}
          {revenueCompositionData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <PieChart className="text-info-600" size={24} />
                Revenue Composition
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsPie>
                  <Pie
                    data={revenueCompositionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) =>
                      `${name}: ${formatCurrency(value)}`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueCompositionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Routes Table */}
        {revenueData && revenueData.revenueByRoute.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top Revenue Routes
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.revenueByRoute
                    .slice(0, 5)
                    .map((route, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {route.departure} → {route.arrival}
                          </div>
                          <div className="text-xs text-gray-500">
                            Route #{route.routeNo}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          {route.bookings}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(route.revenue)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Insights */}
        {bookingData && (
          <div className="bg-white rounded-lg shadow-md p-6">
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
                  <p className="text-xs text-gray-500 mt-1">5+ bookings</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-600">One-time Customers</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(bookingData.customerMetrics.oneTimeCustomers)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-600">Repeat Customers</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(bookingData.customerMetrics.repeatCustomers)}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-success-600 mt-1">
                  {bookingData.conversionMetrics.conversionRate}%
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {bookingData.conversionMetrics.confirmedBookings} of{' '}
                  {bookingData.conversionMetrics.totalBookings} confirmed
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      {financialData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Financial Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Gross Revenue</p>
              <p className="text-3xl font-bold text-success-700">
                {formatCurrency(financialData.summary.grossRevenue)}
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Refunds</p>
              <p className="text-3xl font-bold text-red-700">
                {formatCurrency(financialData.summary.totalRefunds)}
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Net Revenue</p>
              <p className="text-3xl font-bold text-info-700">
                {formatCurrency(financialData.summary.netRevenue)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
