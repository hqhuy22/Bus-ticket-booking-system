import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

/**
 * SeatLock model - Temporary seat reservation to prevent double bookings
 * Seats are locked for a limited time during checkout process
 */
const SeatLock = sequelize.define(
  'SeatLock',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    scheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seatNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('locked', 'confirmed', 'released', 'expired'),
      allowNull: false,
      defaultValue: 'locked',
    },
  },
  {
    timestamps: true,
    tableName: 'seat_locks',
    indexes: [
      // Fast lookup for schedule seat availability
      { fields: ['scheduleId', 'seatNumber'] },
      // Session-based queries
      { fields: ['sessionId'] },
      // Cleanup expired locks
      { fields: ['expiresAt', 'status'] },
      // Note: Unique constraint on active locks is handled in controller logic
      // Database allows multiple records for same seat with different statuses
    ],
  }
);

export default SeatLock;
