import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

const Bus = sequelize.define(
  'Bus',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    busNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    plateNumber: { type: DataTypes.STRING(20), allowNull: true, unique: true }, // License plate number
    busType: { type: DataTypes.STRING, allowNull: false }, // Normal, AC, Sleeper, Semi-Sleeper
    model: { type: DataTypes.STRING, allowNull: false },
    totalSeats: { type: DataTypes.INTEGER, allowNull: false },
    seatMapConfig: { type: DataTypes.JSONB, allowNull: true }, // Store seat layout configuration
    amenities: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }, // WiFi, AC, Water, etc.
    status: { type: DataTypes.STRING, defaultValue: 'active' }, // active, maintenance, retired
    depotName: { type: DataTypes.STRING, allowNull: false },
    photos: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }, // Array of photo URLs
  },
  {
    timestamps: true,
    tableName: 'buses',
    indexes: [
      { fields: ['busNumber'] },
      { fields: ['plateNumber'] },
      { fields: ['busType'] },
      { fields: ['status'] },
    ],
  }
);

export default Bus;
