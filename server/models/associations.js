/**
 * Model Associations
 * Defines relationships between database models
 */
import BusSchedule from './busSchedule.js';
import Bus from './Bus.js';
import Route from './Route.js';
import SeatLock from './SeatLock.js';
import BusBooking from './busBooking.js';
import Customer from './Customer.js';
import NotificationPreferences from './NotificationPreferences.js';
import ChatHistory from './ChatHistory.js';
import Review from './Review.js';
import ReviewVote from './ReviewVote.js';

// Bus <-> BusSchedule relationship
BusSchedule.belongsTo(Bus, { foreignKey: 'busId', as: 'bus' });
Bus.hasMany(BusSchedule, { foreignKey: 'busId', as: 'schedules' });

// Route <-> BusSchedule relationship
BusSchedule.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });
Route.hasMany(BusSchedule, { foreignKey: 'routeId', as: 'schedules' });

// BusSchedule <-> SeatLock relationship
SeatLock.belongsTo(BusSchedule, { foreignKey: 'scheduleId', as: 'schedule' });
BusSchedule.hasMany(SeatLock, { foreignKey: 'scheduleId', as: 'seatLocks' });

// BusBooking relationships
BusBooking.belongsTo(BusSchedule, { foreignKey: 'busScheduleId', as: 'schedule' });
BusSchedule.hasMany(BusBooking, { foreignKey: 'busScheduleId', as: 'bookings' });

BusBooking.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(BusBooking, { foreignKey: 'customerId', as: 'bookings' });

// Customer <-> NotificationPreferences relationship
Customer.hasOne(NotificationPreferences, {
  foreignKey: 'customerId',
  as: 'notificationPreferences',
});
NotificationPreferences.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Customer <-> ChatHistory relationship
// Use constraints: false to prevent sync order issues
ChatHistory.belongsTo(Customer, {
  foreignKey: 'userId',
  as: 'user',
  constraints: false, // This prevents foreign key constraint during initial sync
});
Customer.hasMany(ChatHistory, {
  foreignKey: 'userId',
  as: 'chatHistory',
  constraints: false,
});

// Review relationships
Review.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Review, { foreignKey: 'customerId', as: 'reviews' });

Review.belongsTo(BusSchedule, { foreignKey: 'busScheduleId', as: 'busSchedule' });
BusSchedule.hasMany(Review, { foreignKey: 'busScheduleId', as: 'reviews' });

Review.belongsTo(BusBooking, { foreignKey: 'bookingId', as: 'booking' });
BusBooking.hasOne(Review, { foreignKey: 'bookingId', as: 'review' });

// ReviewVote relationships
ReviewVote.belongsTo(Review, { foreignKey: 'reviewId', as: 'review' });
Review.hasMany(ReviewVote, { foreignKey: 'reviewId', as: 'votes' });

ReviewVote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(ReviewVote, { foreignKey: 'customerId', as: 'reviewVotes' });

export {
  BusSchedule,
  Bus,
  Route,
  SeatLock,
  BusBooking,
  Customer,
  NotificationPreferences,
  ChatHistory,
  Review,
  ReviewVote,
};

// Debug log to confirm associations are registered during server startup
try {
  console.log(
    'Model associations initialized: BusSchedule, Bus, Route, SeatLock, BusBooking, Customer, NotificationPreferences, ChatHistory, Review, ReviewVote'
  );
} catch (e) {
  // ignore in environments where console is overridden
}
