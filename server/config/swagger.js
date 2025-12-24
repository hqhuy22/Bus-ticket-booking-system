import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bus Ticket Booking System API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Bus Ticket Booking System',
      contact: {
        name: 'API Support',
        email: 'support@busticket.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://your-production-domain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Customers',
        description: 'Customer management endpoints',
      },
      {
        name: 'Bus Schedules',
        description: 'Bus schedule search and management',
      },
      {
        name: 'Bookings',
        description: 'Booking creation and management',
      },
      {
        name: 'Seats',
        description: 'Seat lock and availability management',
      },
      {
        name: 'Payments',
        description: 'Payment processing',
      },
      {
        name: 'Reviews',
        description: 'Customer reviews and ratings',
      },
      {
        name: 'Analytics',
        description: 'Admin analytics and reporting',
      },
      {
        name: 'Chatbot',
        description: 'AI chatbot interactions',
      },
      {
        name: 'Buses',
        description: 'Bus management (Admin)',
      },
      {
        name: 'Routes',
        description: 'Route management (Admin)',
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
