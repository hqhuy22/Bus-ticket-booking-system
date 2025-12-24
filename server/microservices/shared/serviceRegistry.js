/**
 * Service Registry for Service Discovery
 * Simulates Consul/Eureka service discovery
 * In production, replace with actual service discovery solution
 */

class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }

  /**
   * Register a service
   * @param {string} serviceName - Name of the service
   * @param {object} config - Service configuration
   */
  register(serviceName, config) {
    this.services.set(serviceName, {
      ...config,
      status: 'healthy',
      registeredAt: new Date(),
      lastHealthCheck: new Date(),
    });
    console.log(`[ServiceRegistry] Registered: ${serviceName}`);
  }

  /**
   * Get service information
   * @param {string} serviceName - Name of the service
   * @returns {object} Service configuration
   */
  getService(serviceName) {
    return this.services.get(serviceName);
  }

  /**
   * Get all registered services
   * @returns {Map} All services
   */
  getAllServices() {
    return this.services;
  }

  /**
   * Update service health status
   * @param {string} serviceName - Name of the service
   * @param {string} status - Health status
   */
  updateHealthStatus(serviceName, status) {
    const service = this.services.get(serviceName);
    if (service) {
      service.status = status;
      service.lastHealthCheck = new Date();
    }
  }

  /**
   * Deregister a service
   * @param {string} serviceName - Name of the service
   */
  deregister(serviceName) {
    this.services.delete(serviceName);
    console.log(`[ServiceRegistry] Deregistered: ${serviceName}`);
  }

  /**
   * Health check for all services
   * @returns {object} Health status of all services
   */
  healthCheck() {
    const health = {};
    for (const [name, service] of this.services.entries()) {
      health[name] = {
        status: service.status,
        lastHealthCheck: service.lastHealthCheck,
        uptime: Date.now() - service.registeredAt.getTime(),
      };
    }
    return health;
  }
}

// Singleton instance
const serviceRegistry = new ServiceRegistry();

export default serviceRegistry;

// Service Names (constants)
export const ServiceNames = {
  AUTH_SERVICE: 'auth-service',
  BOOKING_SERVICE: 'booking-service',
  PAYMENT_SERVICE: 'payment-service',
  NOTIFICATION_SERVICE: 'notification-service',
};
