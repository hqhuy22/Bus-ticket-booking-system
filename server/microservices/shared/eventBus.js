/**
 * Event Bus for Inter-Service Communication
 * Simulates message queue (RabbitMQ/Kafka) using in-memory events
 * In production, replace with actual message queue
 */

import EventEmitter from 'events';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase for multiple services
  }

  /**
   * Publish an event to the bus
   * @param {string} event - Event name (e.g., 'booking.created')
   * @param {object} data - Event payload
   */
  publish(event, data) {
    console.log(`[EventBus] Publishing: ${event}`, JSON.stringify(data, null, 2));
    this.emit(event, data);
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} handler - Event handler function
   */
  subscribe(event, handler) {
    console.log(`[EventBus] Service subscribed to: ${event}`);
    this.on(event, handler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {function} handler - Event handler function
   */
  unsubscribe(event, handler) {
    this.off(event, handler);
  }
}

// Singleton instance
const eventBus = new EventBus();

export default eventBus;

// Event Types (for documentation and type safety)
export const EventTypes = {
  // Auth Events
  USER_REGISTERED: 'auth.user.registered',
  USER_LOGGED_IN: 'auth.user.logged_in',
  USER_VERIFIED: 'auth.user.verified',
  PASSWORD_RESET: 'auth.password.reset',

  // Booking Events
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_UPDATED: 'booking.updated',

  // Payment Events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Notification Events
  EMAIL_SEND_REQUESTED: 'notification.email.send_requested',
  EMAIL_SENT: 'notification.email.sent',
  EMAIL_FAILED: 'notification.email.failed',
  SMS_SEND_REQUESTED: 'notification.sms.send_requested',
  REMINDER_SCHEDULED: 'notification.reminder.scheduled',
};
