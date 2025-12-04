import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';
import bcrypt from 'bcryptjs';

const Customer = sequelize.define(
  'Customer',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: true }, // nullable for guests
    username: { type: DataTypes.STRING, allowNull: true }, // nullable for guests
    password: { type: DataTypes.STRING, allowNull: true }, // nullable for OAuth users and guests
    fullName: { type: DataTypes.STRING, allowNull: true }, // Full name for registered users
    position: { type: DataTypes.STRING, allowNull: false, defaultValue: 'customer' },
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    verificationToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
    googleId: { type: DataTypes.STRING, allowNull: true, unique: true },
    provider: { type: DataTypes.STRING, allowNull: false, defaultValue: 'local' }, // 'local', 'google', or 'guest'
    isGuest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    guestEmail: { type: DataTypes.STRING, allowNull: true }, // For guest bookings
    guestPhone: { type: DataTypes.STRING, allowNull: true }, // For guest bookings
    guestName: { type: DataTypes.STRING, allowNull: true }, // For guest bookings
    phoneNumber: { type: DataTypes.STRING, allowNull: true }, // Phone number for registered users
    avatar: { type: DataTypes.STRING, allowNull: true }, // Profile photo URL
    preferences: { type: DataTypes.JSON, allowNull: true }, // User preferences (notifications, language, etc.)
  },
  {
    timestamps: true,
    tableName: 'customers',
  }
);

Customer.beforeCreate(async (user, options) => {
  // Only hash password when a password is provided (local users).
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// IMPORTANT: Don't hash on update - password is already hashed in controller
// This prevents double hashing which would make login fail
Customer.beforeUpdate(async (user, options) => {
  // Skip password hashing on update
  // The controller is responsible for hashing before update
  console.log('[Customer Model] beforeUpdate hook - password changed:', user.changed('password'));
});

Customer.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default Customer;
