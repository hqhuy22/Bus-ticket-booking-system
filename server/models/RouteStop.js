import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

const RouteStop = sequelize.define(
  'RouteStop',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    routeId: { type: DataTypes.INTEGER, allowNull: false },
    stopOrder: { type: DataTypes.INTEGER, allowNull: false }, // Order of the stop in the route
    stopName: { type: DataTypes.STRING, allowNull: false },
    stopType: { type: DataTypes.STRING, allowNull: false }, // pickup, dropoff, both
    arrivalTime: { type: DataTypes.STRING, allowNull: true }, // Relative time from start (e.g., "+2:00")
    departureTime: { type: DataTypes.STRING, allowNull: true },
  },
  {
    timestamps: true,
    tableName: 'route_stops',
    indexes: [{ fields: ['routeId', 'stopOrder'] }],
  }
);

export default RouteStop;
