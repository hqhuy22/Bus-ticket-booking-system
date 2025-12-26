import BusBooking from '../models/busBooking.js';
import BusSchedule from '../models/busSchedule.js';
import Route from '../models/Route.js';
import Customer from '../models/Customer.js';
import sequelize from '../config/postgres.js';
import { Op } from 'sequelize';

/**
 * Get revenue analytics
 * Returns revenue metrics for different time periods
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'day' } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get total revenue
    const revenueData = await BusBooking.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'totalRevenue'],
        [sequelize.fn('SUM', sequelize.col('payment_busFare')), 'totalFare'],
        [sequelize.fn('SUM', sequelize.col('payment_convenienceFee')), 'totalConvenienceFee'],
        [sequelize.fn('SUM', sequelize.col('payment_bankCharge')), 'totalBankCharge'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalBookings'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    // Get revenue by time period (daily, weekly, monthly)
    // PostgreSQL TO_CHAR date format patterns
    const dateFormat = period === 'day' ? 'YYYY-MM-DD' : period === 'week' ? 'IYYY-IW' : 'YYYY-MM';

    const revenueByPeriod = await BusBooking.findAll({
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('createdAt'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      group: [sequelize.fn('TO_CHAR', sequelize.col('createdAt'), dateFormat)],
      order: [[sequelize.fn('TO_CHAR', sequelize.col('createdAt'), dateFormat), 'ASC']],
    });

    // Get revenue by route
    const revenueByRoute = await BusBooking.findAll({
      attributes: [
        'routeNo',
        'departure',
        'arrival',
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
        [sequelize.fn('AVG', sequelize.col('payment_totalPay')), 'avgRevenue'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      group: ['routeNo', 'departure', 'arrival'],
      order: [[sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'DESC']],
      limit: 10,
    });

    // Get booking status breakdown
    const bookingsByStatus = await BusBooking.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'revenue'],
      ],
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      group: ['status'],
    });

    // Calculate growth (compare with previous period)
    const periodLength = end - start;
    const previousStart = new Date(start - periodLength);
    const previousEnd = start;

    const previousRevenue = await BusBooking.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalBookings'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: {
          [Op.between]: [previousStart, previousEnd],
        },
      },
    });

    const currentRevenue = parseFloat(revenueData[0]?.dataValues.totalRevenue || 0);
    const prevRevenue = parseFloat(previousRevenue?.dataValues.totalRevenue || 0);
    const revenueGrowth =
      prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const currentBookings = parseInt(revenueData[0]?.dataValues.totalBookings || 0);
    const prevBookings = parseInt(previousRevenue?.dataValues.totalBookings || 0);
    const bookingsGrowth =
      prevBookings > 0 ? ((currentBookings - prevBookings) / prevBookings) * 100 : 0;

    res.json({
      summary: {
        totalRevenue: parseFloat(revenueData[0]?.dataValues.totalRevenue || 0),
        totalFare: parseFloat(revenueData[0]?.dataValues.totalFare || 0),
        totalConvenienceFee: parseFloat(revenueData[0]?.dataValues.totalConvenienceFee || 0),
        totalBankCharge: parseFloat(revenueData[0]?.dataValues.totalBankCharge || 0),
        totalBookings: parseInt(revenueData[0]?.dataValues.totalBookings || 0),
        averageBookingValue: currentBookings > 0 ? currentRevenue / currentBookings : 0,
        revenueGrowth: revenueGrowth.toFixed(2),
        bookingsGrowth: bookingsGrowth.toFixed(2),
      },
      revenueByPeriod: revenueByPeriod.map((item) => ({
        period: item.dataValues.period,
        revenue: parseFloat(item.dataValues.revenue || 0),
        bookings: parseInt(item.dataValues.bookings || 0),
      })),
      revenueByRoute: revenueByRoute.map((item) => ({
        routeNo: item.routeNo,
        departure: item.departure,
        arrival: item.arrival,
        revenue: parseFloat(item.dataValues.revenue || 0),
        bookings: parseInt(item.dataValues.bookings || 0),
        avgRevenue: parseFloat(item.dataValues.avgRevenue || 0),
      })),
      bookingsByStatus: bookingsByStatus.map((item) => ({
        status: item.status,
        count: parseInt(item.dataValues.count || 0),
        revenue: parseFloat(item.dataValues.revenue || 0),
      })),
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ message: 'Error fetching revenue analytics', error: error.message });
  }
};

/**
 * Get booking analytics and trends
 * Returns booking patterns, popular routes, conversion rates
 */
export const getBookingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Popular routes (top 10 by booking count)
    const popularRoutes = await BusBooking.findAll({
      attributes: [
        'routeNo',
        'departure',
        'arrival',
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookingCount'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'totalRevenue'],
        [
          sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('customerId'))),
          'uniqueCustomers',
        ],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      group: ['routeNo', 'departure', 'arrival'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
    });

    // Booking trends by day of week
    const bookingsByDayOfWeek = await BusBooking.findAll({
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('createdAt'), 'Day'), 'dayName'],
        [sequelize.fn('EXTRACT', sequelize.literal('DOW FROM "createdAt"')), 'dayNumber'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookingCount'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'revenue'],
      ],
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      group: [
        sequelize.fn('TO_CHAR', sequelize.col('createdAt'), 'Day'),
        sequelize.fn('EXTRACT', sequelize.literal('DOW FROM "createdAt"')),
      ],
      order: [[sequelize.fn('EXTRACT', sequelize.literal('DOW FROM "createdAt"')), 'ASC']],
    });

    // Booking trends by hour
    const bookingsByHour = await BusBooking.findAll({
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM "createdAt"')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookingCount'],
      ],
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      group: [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM "createdAt"'))],
      order: [[sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM "createdAt"')), 'ASC']],
    });

    // Conversion rate (confirmed vs all bookings)
    const conversionData = await BusBooking.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      group: ['status'],
    });

    const totalBookings = conversionData.reduce(
      (sum, item) => sum + parseInt(item.dataValues.count),
      0
    );
    const confirmedBookings = conversionData
      .filter((item) => ['confirmed', 'completed'].includes(item.status))
      .reduce((sum, item) => sum + parseInt(item.dataValues.count), 0);
    const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

    // Average seats per booking
    const seatsAnalysis = await BusBooking.findAll({
      attributes: [
        [
          sequelize.fn('AVG', sequelize.fn('ARRAY_LENGTH', sequelize.col('seatNumbers'), 1)),
          'avgSeatsPerBooking',
        ],
        [
          sequelize.fn('SUM', sequelize.fn('ARRAY_LENGTH', sequelize.col('seatNumbers'), 1)),
          'totalSeatsBooked',
        ],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    // Customer segmentation
    const customerSegments = await BusBooking.findAll({
      attributes: [
        'customerId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookingCount'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'totalSpent'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      group: ['customerId'],
      order: [[sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'DESC']],
    });

    // Segment customers
    const topCustomers = customerSegments.slice(0, 10);
    const oneTimeCustomers = customerSegments.filter(
      (c) => parseInt(c.dataValues.bookingCount) === 1
    ).length;
    const repeatCustomers = customerSegments.filter(
      (c) => parseInt(c.dataValues.bookingCount) > 1
    ).length;
    const loyalCustomers = customerSegments.filter(
      (c) => parseInt(c.dataValues.bookingCount) >= 5
    ).length;

    // Cancellation analysis
    const cancellationData = await BusBooking.findAll({
      attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: {
        status: 'cancelled',
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    const cancelledCount = parseInt(cancellationData[0]?.dataValues.count || 0);
    const cancellationRate = totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0;

    res.json({
      popularRoutes: popularRoutes.map((route) => ({
        routeNo: route.routeNo,
        departure: route.departure,
        arrival: route.arrival,
        bookingCount: parseInt(route.dataValues.bookingCount),
        revenue: parseFloat(route.dataValues.totalRevenue || 0),
        uniqueCustomers: parseInt(route.dataValues.uniqueCustomers),
      })),
      bookingTrends: {
        byDayOfWeek: bookingsByDayOfWeek.map((item) => ({
          dayName: item.dataValues.dayName.trim(),
          dayNumber: parseInt(item.dataValues.dayNumber),
          bookingCount: parseInt(item.dataValues.bookingCount),
          revenue: parseFloat(item.dataValues.revenue || 0),
        })),
        byHour: bookingsByHour.map((item) => ({
          hour: parseInt(item.dataValues.hour),
          bookingCount: parseInt(item.dataValues.bookingCount),
        })),
      },
      conversionMetrics: {
        totalBookings,
        confirmedBookings,
        conversionRate: conversionRate.toFixed(2),
        cancelledBookings: cancelledCount,
        cancellationRate: cancellationRate.toFixed(2),
        statusBreakdown: conversionData.map((item) => ({
          status: item.status,
          count: parseInt(item.dataValues.count),
        })),
      },
      seatsMetrics: {
        avgSeatsPerBooking: parseFloat(
          seatsAnalysis[0]?.dataValues.avgSeatsPerBooking || 0
        ).toFixed(2),
        totalSeatsBooked: parseInt(seatsAnalysis[0]?.dataValues.totalSeatsBooked || 0),
      },
      customerMetrics: {
        totalCustomers: customerSegments.length,
        oneTimeCustomers,
        repeatCustomers,
        loyalCustomers,
        topCustomers: topCustomers.map((c) => ({
          customerId: c.customerId,
          bookingCount: parseInt(c.dataValues.bookingCount),
          totalSpent: parseFloat(c.dataValues.totalSpent),
        })),
      },
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get booking analytics error:', error);
    res.status(500).json({ message: 'Error fetching booking analytics', error: error.message });
  }
};

/**
 * Get financial reports
 * Returns detailed financial breakdown
 */
export const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Revenue breakdown by payment components
    const revenueBreakdown = await BusBooking.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('payment_busFare')), 'totalBusFare'],
        [sequelize.fn('SUM', sequelize.col('payment_convenienceFee')), 'totalConvenienceFee'],
        [sequelize.fn('SUM', sequelize.col('payment_bankCharge')), 'totalBankCharge'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    // Revenue by date (daily breakdown)
    const dailyRevenue = await BusBooking.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'revenue'],
        [sequelize.fn('SUM', sequelize.col('payment_busFare')), 'busFare'],
        [sequelize.fn('SUM', sequelize.col('payment_convenienceFee')), 'convenienceFee'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactions'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
    });

    // Refunds (cancelled bookings)
    const refundData = await BusBooking.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'totalRefunds'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'refundCount'],
      ],
      where: {
        status: 'cancelled',
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    const breakdown = revenueBreakdown[0]?.dataValues || {};
    const totalBusFare = parseFloat(breakdown.totalBusFare || 0);
    const totalConvenienceFee = parseFloat(breakdown.totalConvenienceFee || 0);
    const totalBankCharge = parseFloat(breakdown.totalBankCharge || 0);
    const totalRevenue = parseFloat(breakdown.totalRevenue || 0);
    const totalRefunds = parseFloat(refundData[0]?.dataValues.totalRefunds || 0);

    res.json({
      summary: {
        totalRevenue,
        netRevenue: totalRevenue - totalRefunds,
        totalBusFare,
        totalConvenienceFee,
        totalBankCharge,
        totalRefunds,
        totalTransactions: parseInt(breakdown.totalTransactions || 0),
        refundCount: parseInt(refundData[0]?.dataValues.refundCount || 0),
        averageTransactionValue:
          parseInt(breakdown.totalTransactions) > 0
            ? totalRevenue / parseInt(breakdown.totalTransactions)
            : 0,
      },
      revenueComposition: {
        busFarePercentage: totalRevenue > 0 ? ((totalBusFare / totalRevenue) * 100).toFixed(2) : 0,
        convenienceFeePercentage:
          totalRevenue > 0 ? ((totalConvenienceFee / totalRevenue) * 100).toFixed(2) : 0,
        bankChargePercentage:
          totalRevenue > 0 ? ((totalBankCharge / totalRevenue) * 100).toFixed(2) : 0,
      },
      dailyRevenue: dailyRevenue.map((item) => ({
        date: item.dataValues.date,
        revenue: parseFloat(item.dataValues.revenue || 0),
        busFare: parseFloat(item.dataValues.busFare || 0),
        convenienceFee: parseFloat(item.dataValues.convenienceFee || 0),
        transactions: parseInt(item.dataValues.transactions || 0),
      })),
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({ message: 'Error fetching financial report', error: error.message });
  }
};

/**
 * Get dashboard summary
 * Quick overview of key metrics
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Today's metrics
    const todayMetrics = await BusBooking.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'revenue'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: { [Op.gte]: startOfToday },
      },
    });

    // This month's metrics
    const monthMetrics = await BusBooking.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'revenue'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: { [Op.gte]: startOfMonth },
      },
    });

    // This year's metrics
    const yearMetrics = await BusBooking.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
        [sequelize.fn('SUM', sequelize.col('payment_totalPay')), 'revenue'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] },
        createdAt: { [Op.gte]: startOfYear },
      },
    });

    // Pending bookings
    const pendingCount = await BusBooking.count({
      where: { status: 'pending' },
    });

    // Total customers
    const totalCustomers = await Customer.count();

    res.json({
      today: {
        bookings: parseInt(todayMetrics?.dataValues.bookings || 0),
        revenue: parseFloat(todayMetrics?.dataValues.revenue || 0),
      },
      month: {
        bookings: parseInt(monthMetrics?.dataValues.bookings || 0),
        revenue: parseFloat(monthMetrics?.dataValues.revenue || 0),
      },
      year: {
        bookings: parseInt(yearMetrics?.dataValues.bookings || 0),
        revenue: parseFloat(yearMetrics?.dataValues.revenue || 0),
      },
      pending: pendingCount,
      totalCustomers,
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ message: 'Error fetching dashboard summary', error: error.message });
  }
};
