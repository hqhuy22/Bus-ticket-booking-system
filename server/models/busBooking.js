import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

const BusBooking = sequelize.define(
  'BusBooking',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'customers', key: 'id' },
    },
    busScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'bus_schedules', key: 'id' },
    },
    routeNo: { type: DataTypes.INTEGER, allowNull: false },
    departure: { type: DataTypes.STRING, allowNull: false },
    arrival: { type: DataTypes.STRING, allowNull: false },
    depotName: { type: DataTypes.STRING, allowNull: false },
    seatNumbers: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false }, // Multiple seats
    booking_startSession: { type: DataTypes.DATE, allowNull: true },
    booking_endSession: { type: DataTypes.DATE, allowNull: true },
    booking_startTime: { type: DataTypes.STRING, allowNull: false },
    booking_endTime: { type: DataTypes.STRING, allowNull: false },
    journeyDate: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    expiresAt: { type: DataTypes.DATE, allowNull: true }, // Booking expiration time
    payment_busFare: { type: DataTypes.DECIMAL, allowNull: false },
    payment_convenienceFee: { type: DataTypes.DECIMAL, allowNull: false },
    payment_bankCharge: { type: DataTypes.DECIMAL, allowNull: false },
    payment_totalPay: { type: DataTypes.DECIMAL, allowNull: false },
    passengers: { type: DataTypes.JSONB, allowNull: false }, // Array of passenger details
    bookingReference: { type: DataTypes.STRING, unique: true, allowNull: false },
    pickupPoint: { type: DataTypes.STRING, allowNull: true },
    dropoffPoint: { type: DataTypes.STRING, allowNull: true },
    cancellationReason: { type: DataTypes.TEXT, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    reminderSentAt: { type: DataTypes.DATE, allowNull: true }, // Track when trip reminder was sent
  },
  {
    timestamps: true,
    tableName: 'bus_bookings',
    hooks: {
      beforeValidate: (booking) => {
        // Generate unique booking reference early so validation passes
        if (!booking.bookingReference) {
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          booking.bookingReference = `BKG-${timestamp}-${random}`;
        }
        // Set expiration time (15 minutes from creation for pending bookings)
        if (booking.status === 'pending' && !booking.expiresAt) {
          booking.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        }
      },
    },
  }
);

export default BusBooking;
