/**
 * Microservices Index
 * Export all microservices for easy import
 */

// Shared components
export { default as eventBus, EventTypes } from './shared/eventBus.js';
export { default as serviceRegistry, ServiceNames } from './shared/serviceRegistry.js';

// Services
export { default as authService } from './auth-service/authService.js';
export { default as bookingService } from './booking-service/bookingService.js';
export { default as paymentService } from './payment-service/paymentService.js';
export { default as notificationService } from './notification-service/notificationService.js';

/**
 * Initialize all microservices
 */
export function initializeMicroservices() {
  console.log('\n🚀 Initializing Microservices Architecture...\n');

  // Services are auto-initialized on import
  // This function is for explicit initialization if needed

  console.log('✅ All microservices initialized successfully\n');
}

/**
 * Health check for all services
 */
export async function healthCheckAll() {
  const { default: authService } = await import('./auth-service/authService.js');
  const { default: bookingService } = await import('./booking-service/bookingService.js');
  const { default: paymentService } = await import('./payment-service/paymentService.js');
  const { default: notificationService } =
    await import('./notification-service/notificationService.js');
  const { default: serviceRegistry } = await import('./shared/serviceRegistry.js');

  return {
    services: {
      auth: authService.healthCheck(),
      booking: bookingService.healthCheck(),
      payment: paymentService.healthCheck(),
      notification: notificationService.healthCheck(),
    },
    registry: serviceRegistry.healthCheck(),
    timestamp: new Date(),
  };
}
