import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

const BusSchedule = sequelize.define(
  'BusSchedule',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    routeNo: { type: DataTypes.INTEGER, allowNull: false },
    busId: { type: DataTypes.INTEGER, allowNull: true }, // Foreign key to Bus
    routeId: { type: DataTypes.INTEGER, allowNull: true }, // Foreign key to Route
    departure_city: { type: DataTypes.STRING, allowNull: false },
    departure_date: { type: DataTypes.DATEONLY, allowNull: false },
    departure_time: { type: DataTypes.STRING, allowNull: false },
    arrival_city: { type: DataTypes.STRING, allowNull: false },
    arrival_date: { type: DataTypes.DATEONLY, allowNull: false },
    arrival_time: { type: DataTypes.STRING, allowNull: false },
    duration: { type: DataTypes.STRING, allowNull: false },
    busType: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING, allowNull: false },
    busScheduleID: { type: DataTypes.STRING, allowNull: false },
    depotName: { type: DataTypes.STRING, allowNull: false },
    bookingClosingDate: { type: DataTypes.DATEONLY, allowNull: false },
    bookingClosingTime: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL, allowNull: false },
    availableSeats: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Scheduled',
    },
    isCompleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    departedAt: { type: DataTypes.DATE, allowNull: true }, // When trip status changed to "In Progress"
    completedAt: { type: DataTypes.DATE, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    cancelledBy: { type: DataTypes.INTEGER, allowNull: true }, // Admin user ID who cancelled
    cancellationReason: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    timestamps: true,
    tableName: 'bus_schedules',
    indexes: [
      { fields: ['departure_city'] },
      { fields: ['arrival_city'] },
      { fields: ['departure_date'] },
      { fields: ['price'] },
      { fields: ['busType'] },
      { fields: ['departure_city', 'arrival_city', 'departure_date'] },
      { fields: ['busId', 'departure_date', 'departure_time'] },
    ],
  }
);

export default BusSchedule;
