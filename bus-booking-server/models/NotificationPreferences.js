import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

const NotificationPreferences = sequelize.define(
  'NotificationPreferences',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'customers',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    // Email notifications
    emailBookingConfirmation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    emailTripReminders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    emailCancellations: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    emailPromotions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailNewsletter: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    // SMS notifications
    smsBookingConfirmation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    smsTripReminders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    smsCancellations: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    // Push notifications (for future mobile app)
    pushBookingConfirmation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    pushTripReminders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    pushPromotions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    // Communication preferences
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reminderTiming: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24, // hours before trip
      validate: {
        isIn: [[1, 3, 6, 12, 24, 48]], // Allowed reminder times
      },
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Asia/Kolkata',
    },
  },
  {
    timestamps: true,
    tableName: 'notification_preferences',
  }
);

export default NotificationPreferences;
