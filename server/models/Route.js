import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

const Route = sequelize.define(
  'Route',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    routeName: { type: DataTypes.STRING, allowNull: false },
    routeNo: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    origin: { type: DataTypes.STRING, allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    distance: { type: DataTypes.DECIMAL, allowNull: true }, // in km
    estimatedDuration: { type: DataTypes.STRING, allowNull: true }, // e.g., "10:00" (hours:minutes)
    status: { type: DataTypes.STRING, defaultValue: 'active' }, // active, inactive
  },
  {
    timestamps: true,
    tableName: 'routes',
    indexes: [{ fields: ['routeNo'] }, { fields: ['origin', 'destination'] }],
  }
);

export default Route;
