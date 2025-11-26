/**
 * Database Mock Data Seeder
 * Creates comprehensive sample data including:
 * - Sample users with various roles
 * - Email templates and configurations
 * - Kanban/workflow configurations
 * - Test bookings, schedules, buses, routes
 * - Reviews, chat history, notifications
 *
 * Usage: node scripts/seed_mock_data.js
 */

import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/postgres.js';
import Customer from '../models/Customer.js';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import RouteStop from '../models/RouteStop.js';
import BusSchedule from '../models/busSchedule.js';
import BusBooking from '../models/busBooking.js';
import Review from '../models/Review.js';
import ReviewVote from '../models/ReviewVote.js';
import ChatHistory from '../models/ChatHistory.js';
import NotificationPreferences from '../models/NotificationPreferences.js';
import SeatLock from '../models/SeatLock.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { VIETNAM_CITIES, isValidCity } from '../config/cities.js';

// ============================================
// MOCK DATA CONFIGURATIONS
// ============================================

// Email Templates for Various Actions
const EMAIL_TEMPLATES = {
  bookingConfirmation: {
    subject: 'Booking Confirmation - {bookingReference}',
    template: `
      <h2>Booking Confirmed!</h2>
      <p>Dear {customerName},</p>
      <p>Your bus ticket has been successfully booked.</p>
      <h3>Booking Details:</h3>
      <ul>
        <li>Reference: <strong>{bookingReference}</strong></li>
        <li>Route: {departure} → {arrival}</li>
        <li>Date: {journeyDate}</li>
        <li>Time: {departureTime}</li>
        <li>Seats: {seatNumbers}</li>
        <li>Total: {totalAmount} VND</li>
      </ul>
      <p>Please arrive at the depot 15 minutes before departure.</p>
    `,
    category: 'booking',
  },
  tripReminder: {
    subject: 'Trip Reminder - Tomorrow at {departureTime}',
    template: `
      <h2>Trip Reminder</h2>
      <p>Hi {customerName},</p>
      <p>This is a friendly reminder about your upcoming trip tomorrow.</p>
      <h3>Trip Details:</h3>
      <ul>
        <li>Booking: {bookingReference}</li>
        <li>Route: {departure} → {arrival}</li>
        <li>Departure: {journeyDate} at {departureTime}</li>
        <li>Depot: {depotName}</li>
        <li>Seats: {seatNumbers}</li>
      </ul>
      <p>Have a safe journey!</p>
    `,
    category: 'reminder',
  },
  cancellation: {
    subject: 'Booking Cancelled - {bookingReference}',
    template: `
      <h2>Booking Cancelled</h2>
      <p>Dear {customerName},</p>
      <p>Your booking has been cancelled as requested.</p>
      <h3>Cancellation Details:</h3>
      <ul>
        <li>Reference: {bookingReference}</li>
        <li>Route: {departure} → {arrival}</li>
        <li>Refund Amount: {refundAmount} VND</li>
        <li>Reason: {cancellationReason}</li>
      </ul>
      <p>Refund will be processed within 5-7 business days.</p>
    `,
    category: 'cancellation',
  },
  promotion: {
    subject: '🎉 Special Offer - {discountPercent}% Off Your Next Trip!',
    template: `
      <h2>Exclusive Promotion Just For You!</h2>
      <p>Hi {customerName},</p>
      <p>We're offering you a special <strong>{discountPercent}% discount</strong> on your next booking!</p>
      <h3>Promotion Details:</h3>
      <ul>
        <li>Code: <strong>{promoCode}</strong></li>
        <li>Discount: {discountPercent}%</li>
        <li>Valid Until: {expiryDate}</li>
        <li>Min Booking: {minAmount} VND</li>
      </ul>
      <p>Book now and save!</p>
    `,
    category: 'marketing',
  },
  welcomeEmail: {
    subject: 'Welcome to Bus Booking System!',
    template: `
      <h2>Welcome Aboard! 🚌</h2>
      <p>Hi {customerName},</p>
      <p>Thank you for registering with our Bus Booking System.</p>
      <p>To verify your email, please click the link below:</p>
      <a href="{verificationLink}">Verify Email Address</a>
      <p>Once verified, you can start booking your bus tickets easily!</p>
      <h3>Why Choose Us:</h3>
      <ul>
        <li>✅ Easy online booking</li>
        <li>✅ Safe and secure payments</li>
        <li>✅ Real-time seat availability</li>
        <li>✅ 24/7 customer support</li>
      </ul>
    `,
    category: 'onboarding',
  },
  passwordReset: {
    subject: 'Password Reset Request',
    template: `
      <h2>Password Reset</h2>
      <p>Hi {customerName},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="{resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    category: 'security',
  },
};

// Kanban Board Configurations for Schedule Management
const KANBAN_CONFIGURATIONS = {
  scheduleWorkflow: {
    name: 'Bus Schedule Management',
    description: 'Track bus schedule lifecycle from planning to completion',
    columns: [
      {
        id: 'draft',
        name: 'Draft',
        color: '#94a3b8',
        order: 1,
        status: 'draft',
        description: 'Schedules being planned',
        rules: ['Can edit all details', 'Not visible to customers'],
      },
      {
        id: 'scheduled',
        name: 'Scheduled',
        color: '#3b82f6',
        order: 2,
        status: 'Scheduled',
        description: 'Published schedules ready for booking',
        rules: ['Visible to customers', 'Limited editing allowed', 'Can cancel'],
      },
      {
        id: 'in-progress',
        name: 'In Progress',
        color: '#f59e0b',
        order: 3,
        status: 'In Progress',
        description: 'Trip has departed',
        rules: ['No booking allowed', 'Cannot cancel', 'Track in real-time'],
      },
      {
        id: 'completed',
        name: 'Completed',
        color: '#10b981',
        order: 4,
        status: 'Completed',
        description: 'Trip finished successfully',
        rules: ['Read-only', 'Reviews enabled', 'Generate reports'],
      },
      {
        id: 'cancelled',
        name: 'Cancelled',
        color: '#ef4444',
        order: 5,
        status: 'Cancelled',
        description: 'Trip was cancelled',
        rules: ['Read-only', 'Refund processing', 'Show cancellation reason'],
      },
    ],
    transitions: {
      'draft -> scheduled': 'Publish schedule',
      'scheduled -> in-progress': 'Mark as departed',
      'scheduled -> cancelled': 'Cancel schedule',
      'in-progress -> completed': 'Mark as completed',
      'in-progress -> cancelled': 'Emergency cancellation',
    },
  },
  bookingWorkflow: {
    name: 'Booking Management',
    description: 'Track customer bookings from creation to completion',
    columns: [
      {
        id: 'pending',
        name: 'Pending Payment',
        color: '#fbbf24',
        order: 1,
        status: 'pending',
        description: 'Awaiting payment confirmation',
        rules: ['15 min expiry timer', 'Seat locked', 'Can cancel'],
      },
      {
        id: 'confirmed',
        name: 'Confirmed',
        color: '#22c55e',
        order: 2,
        status: 'confirmed',
        description: 'Payment confirmed, ticket issued',
        rules: ['Send confirmation email', 'Seat permanently booked', 'Can cancel with fee'],
      },
      {
        id: 'completed',
        name: 'Completed',
        color: '#3b82f6',
        order: 3,
        status: 'completed',
        description: 'Trip completed',
        rules: ['Request review', 'Archive booking', 'Generate receipt'],
      },
      {
        id: 'cancelled',
        name: 'Cancelled',
        color: '#ef4444',
        order: 4,
        status: 'cancelled',
        description: 'Booking cancelled',
        rules: ['Process refund', 'Release seat', 'Send notification'],
      },
      {
        id: 'expired',
        name: 'Expired',
        color: '#6b7280',
        order: 5,
        status: 'expired',
        description: 'Payment not completed in time',
        rules: ['Auto-release seat', 'Delete after 24h', 'No refund'],
      },
    ],
    transitions: {
      'pending -> confirmed': 'Payment successful',
      'pending -> expired': 'Timer expired',
      'pending -> cancelled': 'User cancelled',
      'confirmed -> completed': 'Trip completed',
      'confirmed -> cancelled': 'Cancellation request',
    },
  },
  busMaintenanceWorkflow: {
    name: 'Bus Maintenance Tracking',
    description: 'Manage bus maintenance and availability',
    columns: [
      {
        id: 'active',
        name: 'Active',
        color: '#10b981',
        order: 1,
        status: 'active',
        description: 'Bus is operational and available',
        rules: ['Can be scheduled', 'All systems operational'],
      },
      {
        id: 'scheduled-maintenance',
        name: 'Scheduled Maintenance',
        color: '#f59e0b',
        order: 2,
        status: 'scheduled-maintenance',
        description: 'Maintenance scheduled',
        rules: ['No new schedules', 'Notify affected bookings'],
      },
      {
        id: 'maintenance',
        name: 'Under Maintenance',
        color: '#ef4444',
        order: 3,
        status: 'maintenance',
        description: 'Bus is being serviced',
        rules: ['Cannot schedule', 'Track repair progress'],
      },
      {
        id: 'inspection',
        name: 'Inspection',
        color: '#8b5cf6',
        order: 4,
        status: 'inspection',
        description: 'Safety inspection in progress',
        rules: ['Cannot schedule', 'Certification required'],
      },
      {
        id: 'retired',
        name: 'Retired',
        color: '#6b7280',
        order: 5,
        status: 'retired',
        description: 'Bus decommissioned',
        rules: ['Read-only', 'Historical data only'],
      },
    ],
    transitions: {
      'active -> scheduled-maintenance': 'Schedule maintenance',
      'scheduled-maintenance -> maintenance': 'Begin maintenance',
      'maintenance -> inspection': 'Post-maintenance check',
      'inspection -> active': 'Pass inspection',
      'active -> retired': 'Decommission bus',
    },
  },
};

// Sample Users Data
const SAMPLE_USERS = [
  {
    email: 'admin@busbook.com',
    username: 'admin',
    password: 'Admin@123',
    fullName: 'System Administrator',
    position: 'admin',
    isVerified: true,
    provider: 'local',
    phoneNumber: '+84901234567',
    avatar: '/avatars/admin.jpg',
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      language: 'en',
      currency: 'VND',
      theme: 'light',
    },
  },
  {
    email: 'john.doe@gmail.com',
    username: 'johndoe',
    password: 'User@123',
    fullName: 'John Doe',
    position: 'customer',
    isVerified: true,
    provider: 'local',
    phoneNumber: '+84912345678',
    avatar: '/avatars/john.jpg',
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      language: 'en',
      currency: 'VND',
    },
  },
  {
    email: 'jane.smith@gmail.com',
    username: 'janesmith',
    password: 'User@123',
    fullName: 'Jane Smith',
    position: 'customer',
    isVerified: true,
    provider: 'local',
    phoneNumber: '+84923456789',
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      language: 'vi',
      currency: 'VND',
    },
  },
  {
    email: 'nguyen.van.a@gmail.com',
    username: 'nguyenvana',
    password: 'User@123',
    fullName: 'Nguyễn Văn A',
    position: 'customer',
    isVerified: true,
    provider: 'local',
    phoneNumber: '+84934567890',
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      language: 'vi',
      currency: 'VND',
    },
  },
  {
    email: 'tran.thi.b@gmail.com',
    username: 'tranthib',
    password: 'User@123',
    fullName: 'Trần Thị B',
    position: 'customer',
    isVerified: true,
    provider: 'local',
    phoneNumber: '+84945678901',
    preferences: {
      emailNotifications: false,
      smsNotifications: true,
      language: 'vi',
      currency: 'VND',
    },
  },
  {
    email: 'googleuser@gmail.com',
    username: 'user_google123',
    fullName: 'Google OAuth User',
    position: 'customer',
    isVerified: true,
    provider: 'google',
    googleId: '1234567890',
    preferences: {
      emailNotifications: true,
      language: 'en',
    },
  },
];

// Sample Buses
const SAMPLE_BUSES = [
  {
    busNumber: 'VN-001',
    plateNumber: '29A-12345',
    busType: 'AC Sleeper',
    model: 'Mercedes-Benz OC500RF',
    totalSeats: 40,
    seatMapConfig: {
      layout: 'sleeper',
      rows: 10,
      columns: 4,
      aisleAfter: 2,
      excludedSeats: [],
      seatTypes: {
        vip: [1, 2, 3, 4],
        standard: [
          5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
          29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        ],
      },
    },
    amenities: ['WiFi', 'AC', 'USB Charging', 'Entertainment', 'Blanket', 'Water'],
    status: 'active',
    depotName: 'Hanoi Central Depot',
    photos: ['/buses/vn001-1.jpg', '/buses/vn001-2.jpg'],
  },
  {
    busNumber: 'VN-002',
    plateNumber: '30A-67890',
    busType: 'AC Semi-Sleeper',
    model: 'Volvo 9700',
    totalSeats: 45,
    seatMapConfig: {
      layout: 'semi-sleeper',
      rows: 12,
      columns: 4,
      aisleAfter: 2,
      excludedSeats: [],
      seatTypes: {
        standard: Array.from({ length: 45 }, (_, i) => i + 1),
      },
    },
    amenities: ['WiFi', 'AC', 'USB Charging', 'Water'],
    status: 'active',
    depotName: 'Ho Chi Minh Central Depot',
    photos: ['/buses/vn002-1.jpg'],
  },
  {
    busNumber: 'VN-003',
    plateNumber: '51A-11111',
    busType: 'Normal Seater',
    model: 'Hyundai Universe',
    totalSeats: 50,
    seatMapConfig: {
      layout: 'seater',
      rows: 13,
      columns: 4,
      aisleAfter: 2,
      excludedSeats: [13, 14],
      seatTypes: {
        standard: Array.from({ length: 48 }, (_, i) => i + 1).filter((s) => ![13, 14].includes(s)),
      },
    },
    amenities: ['AC', 'Water'],
    status: 'active',
    depotName: 'Da Nang Depot',
    photos: [],
  },
  {
    busNumber: 'VN-004',
    plateNumber: '29B-22222',
    busType: 'VIP Sleeper',
    model: 'Scania K410IB',
    totalSeats: 30,
    seatMapConfig: {
      layout: 'sleeper',
      rows: 8,
      columns: 4,
      aisleAfter: 2,
      excludedSeats: [],
      seatTypes: {
        vip: Array.from({ length: 30 }, (_, i) => i + 1),
      },
    },
    amenities: [
      'WiFi',
      'AC',
      'USB Charging',
      'Entertainment',
      'Massage Seats',
      'Blanket',
      'Meals',
      'Water',
    ],
    status: 'active',
    depotName: 'Hanoi Central Depot',
    photos: ['/buses/vn004-1.jpg', '/buses/vn004-2.jpg', '/buses/vn004-3.jpg'],
  },
  {
    busNumber: 'VN-005',
    plateNumber: '92A-33333',
    busType: 'AC Sleeper',
    model: 'Mercedes-Benz Travego',
    totalSeats: 42,
    amenities: ['WiFi', 'AC', 'Entertainment'],
    status: 'maintenance',
    depotName: 'Can Tho Depot',
    photos: [],
  },
];

// Sample Routes
const SAMPLE_ROUTES = [
  {
    routeName: 'Hà Nội - Hồ Chí Minh Express',
    routeNo: 101,
    origin: 'Hà Nội',
    destination: 'Hồ Chí Minh',
    distance: 1720,
    estimatedDuration: '24:00',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'Hanoi Central Station',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '06:00',
      },
      {
        stopOrder: 2,
        stopName: 'Ninh Binh',
        stopType: 'both',
        arrivalTime: '08:30',
        departureTime: '08:45',
      },
      {
        stopOrder: 3,
        stopName: 'Vinh City',
        stopType: 'both',
        arrivalTime: '12:00',
        departureTime: '13:00',
      },
      {
        stopOrder: 4,
        stopName: 'Hue',
        stopType: 'both',
        arrivalTime: '18:00',
        departureTime: '18:30',
      },
      {
        stopOrder: 5,
        stopName: 'Da Nang',
        stopType: 'both',
        arrivalTime: '21:00',
        departureTime: '21:30',
      },
      {
        stopOrder: 6,
        stopName: 'Nha Trang',
        stopType: 'both',
        arrivalTime: '03:00',
        departureTime: '03:30',
      },
      {
        stopOrder: 7,
        stopName: 'Ho Chi Minh Ben Xe Mien Dong',
        stopType: 'dropoff',
        arrivalTime: '06:00',
        departureTime: '06:00',
      },
    ],
  },
  {
    routeName: 'Hà Nội - Đà Nẵng Coastal',
    routeNo: 102,
    origin: 'Hà Nội',
    destination: 'Đà Nẵng',
    distance: 764,
    estimatedDuration: '14:00',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'Hanoi My Dinh',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '05:00',
      },
      {
        stopOrder: 2,
        stopName: 'Ninh Binh',
        stopType: 'both',
        arrivalTime: '07:30',
        departureTime: '07:45',
      },
      {
        stopOrder: 3,
        stopName: 'Dong Hoi',
        stopType: 'both',
        arrivalTime: '12:00',
        departureTime: '12:30',
      },
      {
        stopOrder: 4,
        stopName: 'Hue',
        stopType: 'both',
        arrivalTime: '15:30',
        departureTime: '16:00',
      },
      {
        stopOrder: 5,
        stopName: 'Da Nang Airport',
        stopType: 'dropoff',
        arrivalTime: '19:00',
        departureTime: '19:00',
      },
    ],
  },
  {
    routeName: 'Hồ Chí Minh - Nha Trang Beach',
    routeNo: 201,
    origin: 'Hồ Chí Minh',
    destination: 'Nha Trang',
    distance: 448,
    estimatedDuration: '08:00',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'HCM Ben Xe Mien Dong',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '22:00',
      },
      {
        stopOrder: 2,
        stopName: 'Phan Thiet',
        stopType: 'both',
        arrivalTime: '01:30',
        departureTime: '01:45',
      },
      {
        stopOrder: 3,
        stopName: 'Cam Ranh',
        stopType: 'both',
        arrivalTime: '04:30',
        departureTime: '04:45',
      },
      {
        stopOrder: 4,
        stopName: 'Nha Trang Center',
        stopType: 'dropoff',
        arrivalTime: '06:00',
        departureTime: '06:00',
      },
    ],
  },
  {
    routeName: 'Hà Nội - Hải Phòng Quick',
    routeNo: 103,
    origin: 'Hà Nội',
    destination: 'Hải Phòng',
    distance: 120,
    estimatedDuration: '02:00',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'Hanoi Gia Lam',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '06:00',
      },
      {
        stopOrder: 2,
        stopName: 'Hai Duong',
        stopType: 'both',
        arrivalTime: '06:45',
        departureTime: '07:00',
      },
      {
        stopOrder: 3,
        stopName: 'Hai Phong Center',
        stopType: 'dropoff',
        arrivalTime: '08:00',
        departureTime: '08:00',
      },
    ],
  },
  {
    routeName: 'Hồ Chí Minh - Đà Lạt Mountain',
    routeNo: 202,
    origin: 'Hồ Chí Minh',
    destination: 'Đà Lạt',
    distance: 308,
    estimatedDuration: '07:00',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'HCM Ben Xe Mien Dong',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '07:00',
      },
      {
        stopOrder: 2,
        stopName: 'Bien Hoa',
        stopType: 'both',
        arrivalTime: '08:00',
        departureTime: '08:15',
      },
      {
        stopOrder: 3,
        stopName: 'Bao Loc',
        stopType: 'both',
        arrivalTime: '11:00',
        departureTime: '11:30',
      },
      {
        stopOrder: 4,
        stopName: 'Da Lat Central Market',
        stopType: 'dropoff',
        arrivalTime: '14:00',
        departureTime: '14:00',
      },
    ],
  },
  {
    routeName: 'Hồ Chí Minh - Vũng Tàu Beach Express',
    routeNo: 203,
    origin: 'Hồ Chí Minh',
    destination: 'Vũng Tàu',
    distance: 125,
    estimatedDuration: '02:30',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'HCM District 1',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '06:00',
      },
      {
        stopOrder: 2,
        stopName: 'Bien Hoa Toll Gate',
        stopType: 'both',
        arrivalTime: '07:00',
        departureTime: '07:10',
      },
      {
        stopOrder: 3,
        stopName: 'Vung Tau Beach',
        stopType: 'dropoff',
        arrivalTime: '08:30',
        departureTime: '08:30',
      },
    ],
  },
  {
    routeName: 'Hà Nội - Sapa Mountain',
    routeNo: 104,
    origin: 'Hà Nội',
    destination: 'Sapa',
    distance: 350,
    estimatedDuration: '06:00',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'Hanoi My Dinh Bus Station',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '21:00',
      },
      {
        stopOrder: 2,
        stopName: 'Yen Bai',
        stopType: 'both',
        arrivalTime: '00:30',
        departureTime: '00:45',
      },
      {
        stopOrder: 3,
        stopName: 'Lao Cai',
        stopType: 'both',
        arrivalTime: '02:00',
        departureTime: '02:15',
      },
      {
        stopOrder: 4,
        stopName: 'Sapa Town Center',
        stopType: 'dropoff',
        arrivalTime: '03:00',
        departureTime: '03:00',
      },
    ],
  },
  {
    routeName: 'Đà Nẵng - Huế Heritage',
    routeNo: 301,
    origin: 'Đà Nẵng',
    destination: 'Huế',
    distance: 108,
    estimatedDuration: '03:00',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'Da Nang Airport',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '08:00',
      },
      {
        stopOrder: 2,
        stopName: 'Hai Van Pass',
        stopType: 'both',
        arrivalTime: '09:30',
        departureTime: '09:45',
      },
      {
        stopOrder: 3,
        stopName: 'Lang Co Beach',
        stopType: 'both',
        arrivalTime: '10:00',
        departureTime: '10:15',
      },
      {
        stopOrder: 4,
        stopName: 'Hue Imperial City',
        stopType: 'dropoff',
        arrivalTime: '11:00',
        departureTime: '11:00',
      },
    ],
  },
  {
    routeName: 'Hồ Chí Minh - Cần Thơ Delta',
    routeNo: 204,
    origin: 'Hồ Chí Minh',
    destination: 'Cần Thơ',
    distance: 169,
    estimatedDuration: '04:00',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'HCM Ben Xe Mien Tay',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '06:00',
      },
      {
        stopOrder: 2,
        stopName: 'My Tho',
        stopType: 'both',
        arrivalTime: '07:30',
        departureTime: '07:45',
      },
      {
        stopOrder: 3,
        stopName: 'Vinh Long',
        stopType: 'both',
        arrivalTime: '08:30',
        departureTime: '08:45',
      },
      {
        stopOrder: 4,
        stopName: 'Can Tho Ninh Kieu Pier',
        stopType: 'dropoff',
        arrivalTime: '10:00',
        departureTime: '10:00',
      },
    ],
  },
  {
    routeName: 'Hà Nội - Hạ Long Bay',
    routeNo: 105,
    origin: 'Hà Nội',
    destination: 'Hạ Long',
    distance: 165,
    estimatedDuration: '03:30',
    status: 'active',
    stops: [
      {
        stopOrder: 1,
        stopName: 'Hanoi Luong Yen',
        stopType: 'pickup',
        arrivalTime: '00:00',
        departureTime: '07:00',
      },
      {
        stopOrder: 2,
        stopName: 'Bac Ninh',
        stopType: 'both',
        arrivalTime: '07:45',
        departureTime: '08:00',
      },
      {
        stopOrder: 3,
        stopName: 'Hai Duong',
        stopType: 'both',
        arrivalTime: '08:30',
        departureTime: '08:45',
      },
      {
        stopOrder: 4,
        stopName: 'Quang Ninh',
        stopType: 'both',
        arrivalTime: '09:45',
        departureTime: '10:00',
      },
      {
        stopOrder: 5,
        stopName: 'Ha Long Bai Chay',
        stopType: 'dropoff',
        arrivalTime: '10:30',
        departureTime: '10:30',
      },
    ],
  },
];

// Helper function to generate future dates
function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to validate route cities
function validateRouteCities() {
  console.log('🔍 Validating route cities...\n');
  let isValid = true;
  const invalidRoutes = [];

  SAMPLE_ROUTES.forEach((route) => {
    const originValid = isValidCity(route.origin);
    const destinationValid = isValidCity(route.destination);

    if (!originValid || !destinationValid) {
      isValid = false;
      invalidRoutes.push({
        routeNo: route.routeNo,
        routeName: route.routeName,
        origin: route.origin,
        originValid,
        destination: route.destination,
        destinationValid,
      });
    }
  });

  if (!isValid) {
    console.log('❌ INVALID CITIES FOUND IN ROUTES:');
    console.log('━'.repeat(60));
    invalidRoutes.forEach((r) => {
      console.log(`\nRoute ${r.routeNo}: ${r.routeName}`);
      if (!r.originValid) {
        console.log(`  ❌ Invalid origin: "${r.origin}"`);
      }
      if (!r.destinationValid) {
        console.log(`  ❌ Invalid destination: "${r.destination}"`);
      }
    });
    console.log('\n━'.repeat(60));
    console.log('✅ Valid cities from VIETNAM_CITIES:');
    console.log(VIETNAM_CITIES.join(', '));
    console.log('\n⚠️  Please update routes to use standard city names!\n');
    return false;
  }

  console.log('✅ All route cities are valid!\n');
  return true;
}

// ============================================
// SEEDING FUNCTIONS
// ============================================

async function seedUsers() {
  console.log('📧 Seeding users...');
  const users = [];

  for (const userData of SAMPLE_USERS) {
    try {
      const existingUser = await Customer.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        const user = await Customer.create(userData);
        users.push(user);
        console.log(`  ✅ Created user: ${user.email}`);
      } else {
        users.push(existingUser);
        console.log(`  ⏭️  User already exists: ${userData.email}`);
      }
    } catch (err) {
      console.error(`  ❌ Error creating user ${userData.email}:`, err.message);
    }
  }

  return users;
}

async function seedNotificationPreferences(users) {
  console.log('🔔 Seeding notification preferences...');

  for (const user of users) {
    try {
      const existing = await NotificationPreferences.findOne({ where: { customerId: user.id } });
      if (!existing) {
        await NotificationPreferences.create({
          customerId: user.id,
          emailBookingConfirmation: true,
          emailTripReminders: true,
          emailCancellations: true,
          emailPromotions: user.preferences?.emailNotifications || false,
          emailNewsletter: false,
          smsBookingConfirmation: user.preferences?.smsNotifications || false,
          smsTripReminders: user.preferences?.smsNotifications || false,
          smsCancellations: user.preferences?.smsNotifications || false,
          smsPromotions: false,
        });
        console.log(`  ✅ Created preferences for: ${user.email}`);
      } else {
        console.log(`  ⏭️  Preferences exist for: ${user.email}`);
      }
    } catch (err) {
      console.error(`  ❌ Error creating preferences for ${user.email}:`, err.message);
    }
  }
}

async function seedBuses() {
  console.log('🚌 Seeding buses...');
  const buses = [];

  for (const busData of SAMPLE_BUSES) {
    try {
      const existingBus = await Bus.findOne({ where: { busNumber: busData.busNumber } });
      if (!existingBus) {
        const bus = await Bus.create(busData);
        buses.push(bus);
        console.log(`  ✅ Created bus: ${bus.busNumber} (${bus.plateNumber})`);
      } else {
        buses.push(existingBus);
        console.log(`  ⏭️  Bus already exists: ${busData.busNumber}`);
      }
    } catch (err) {
      console.error(`  ❌ Error creating bus ${busData.busNumber}:`, err.message);
    }
  }

  return buses;
}

async function seedRoutes() {
  console.log('🛣️  Seeding routes...');
  const routes = [];

  for (const routeData of SAMPLE_ROUTES) {
    try {
      const { stops, ...routeInfo } = routeData;
      const existingRoute = await Route.findOne({ where: { routeNo: routeInfo.routeNo } });

      if (!existingRoute) {
        const route = await Route.create(routeInfo);

        // Create route stops
        for (const stop of stops) {
          await RouteStop.create({
            routeId: route.id,
            ...stop,
          });
        }

        routes.push(route);
        console.log(`  ✅ Created route: ${route.routeName} (${stops.length} stops)`);
      } else {
        routes.push(existingRoute);
        console.log(`  ⏭️  Route already exists: ${routeData.routeName}`);
      }
    } catch (err) {
      console.error(`  ❌ Error creating route ${routeData.routeName}:`, err.message);
    }
  }

  return routes;
}

async function seedBusSchedules(buses, routes) {
  console.log('📅 Seeding bus schedules...');
  const schedules = [];

  // Create schedules for next 14 days
  for (let day = 0; day < 14; day++) {
    const departureDate = formatDate(getFutureDate(day));

    // Route 101: Hanoi - HCM (morning departure)
    if (buses[0] && routes[0]) {
      const schedule1 = await BusSchedule.create({
        routeNo: routes[0].routeNo,
        busId: buses[0].id,
        routeId: routes[0].id,
        departure_city: routes[0].origin,
        departure_date: departureDate,
        departure_time: '06:00',
        arrival_city: routes[0].destination,
        arrival_date: formatDate(getFutureDate(day + 1)),
        arrival_time: '06:00',
        duration: routes[0].estimatedDuration,
        busType: buses[0].busType,
        model: buses[0].model,
        busScheduleID: `SCH-${routes[0].routeNo}-${departureDate}-0600`,
        depotName: buses[0].depotName,
        bookingClosingDate: departureDate,
        bookingClosingTime: '05:45',
        price: 850000,
        availableSeats: buses[0].totalSeats,
        status: day === 0 ? 'In Progress' : 'Scheduled',
        departedAt: day === 0 ? new Date() : null,
      });
      schedules.push(schedule1);
    }

    // Route 102: Hanoi - Da Nang (evening departure, every 2 days)
    if (day % 2 === 0 && buses[1] && routes[1]) {
      const schedule2 = await BusSchedule.create({
        routeNo: routes[1].routeNo,
        busId: buses[1].id,
        routeId: routes[1].id,
        departure_city: routes[1].origin,
        departure_date: departureDate,
        departure_time: '17:00',
        arrival_city: routes[1].destination,
        arrival_date: formatDate(getFutureDate(day + 1)),
        arrival_time: '07:00',
        duration: routes[1].estimatedDuration,
        busType: buses[1].busType,
        model: buses[1].model,
        busScheduleID: `SCH-${routes[1].routeNo}-${departureDate}-1700`,
        depotName: buses[1].depotName,
        bookingClosingDate: departureDate,
        bookingClosingTime: '16:45',
        price: 450000,
        availableSeats: buses[1].totalSeats,
        status: 'Scheduled',
      });
      schedules.push(schedule2);
    }

    // Route 201: HCM - Nha Trang (night bus)
    if (buses[2] && routes[2]) {
      const schedule3 = await BusSchedule.create({
        routeNo: routes[2].routeNo,
        busId: buses[2].id,
        routeId: routes[2].id,
        departure_city: routes[2].origin,
        departure_date: departureDate,
        departure_time: '22:00',
        arrival_city: routes[2].destination,
        arrival_date: formatDate(getFutureDate(day + 1)),
        arrival_time: '06:00',
        duration: routes[2].estimatedDuration,
        busType: buses[2].busType,
        model: buses[2].model,
        busScheduleID: `SCH-${routes[2].routeNo}-${departureDate}-2200`,
        depotName: buses[2].depotName,
        bookingClosingDate: departureDate,
        bookingClosingTime: '21:45',
        price: 280000,
        availableSeats: buses[2].totalSeats,
        status: 'Scheduled',
      });
      schedules.push(schedule3);
    }

    // Route 103: Hanoi - Hai Phong (multiple times daily, day 0-7 only)
    if (day < 7 && buses[3] && routes[3]) {
      for (const time of ['06:00', '09:00', '12:00', '15:00', '18:00']) {
        const arrivalHour = parseInt(time.split(':')[0]) + 2;
        const schedule4 = await BusSchedule.create({
          routeNo: routes[3].routeNo,
          busId: buses[3].id,
          routeId: routes[3].id,
          departure_city: routes[3].origin,
          departure_date: departureDate,
          departure_time: time,
          arrival_city: routes[3].destination,
          arrival_date: departureDate,
          arrival_time: `${arrivalHour.toString().padStart(2, '0')}:00`,
          duration: routes[3].estimatedDuration,
          busType: buses[3].busType,
          model: buses[3].model,
          busScheduleID: `SCH-${routes[3].routeNo}-${departureDate}-${time.replace(':', '')}`,
          depotName: buses[3].depotName,
          bookingClosingDate: departureDate,
          bookingClosingTime: time,
          price: 120000,
          availableSeats: buses[3].totalSeats,
          status: 'Scheduled',
        });
        schedules.push(schedule4);
      }
    }

    // Route 202: HCM - Da Lat (daily morning departure)
    if (buses[4] && routes[4]) {
      const schedule5 = await BusSchedule.create({
        routeNo: routes[4].routeNo,
        busId: buses[4].id,
        routeId: routes[4].id,
        departure_city: routes[4].origin,
        departure_date: departureDate,
        departure_time: '07:00',
        arrival_city: routes[4].destination,
        arrival_date: departureDate,
        arrival_time: '14:00',
        duration: routes[4].estimatedDuration,
        busType: buses[4].busType,
        model: buses[4].model,
        busScheduleID: `SCH-${routes[4].routeNo}-${departureDate}-0700`,
        depotName: buses[4].depotName,
        bookingClosingDate: departureDate,
        bookingClosingTime: '06:45',
        price: 200000,
        availableSeats: buses[4].totalSeats,
        status: 'Scheduled',
      });
      schedules.push(schedule5);
    }

    // Route 203: HCM - Vung Tau (multiple times daily)
    if (buses[0] && routes[5]) {
      for (const time of ['06:00', '10:00', '14:00']) {
        const schedule6 = await BusSchedule.create({
          routeNo: routes[5].routeNo,
          busId: buses[0].id,
          routeId: routes[5].id,
          departure_city: routes[5].origin,
          departure_date: departureDate,
          departure_time: time,
          arrival_city: routes[5].destination,
          arrival_date: departureDate,
          arrival_time: `${(parseInt(time.split(':')[0]) + 2).toString().padStart(2, '0')}:30`,
          duration: routes[5].estimatedDuration,
          busType: buses[0].busType,
          model: buses[0].model,
          busScheduleID: `SCH-${routes[5].routeNo}-${departureDate}-${time.replace(':', '')}`,
          depotName: buses[0].depotName,
          bookingClosingDate: departureDate,
          bookingClosingTime: time,
          price: 100000,
          availableSeats: buses[0].totalSeats,
          status: 'Scheduled',
        });
        schedules.push(schedule6);
      }
    }

    // Route 104: Hanoi - Sapa (night bus, every 3 days)
    if (day % 3 === 0 && buses[1] && routes[6]) {
      const schedule7 = await BusSchedule.create({
        routeNo: routes[6].routeNo,
        busId: buses[1].id,
        routeId: routes[6].id,
        departure_city: routes[6].origin,
        departure_date: departureDate,
        departure_time: '21:00',
        arrival_city: routes[6].destination,
        arrival_date: formatDate(getFutureDate(day + 1)),
        arrival_time: '03:00',
        duration: routes[6].estimatedDuration,
        busType: buses[1].busType,
        model: buses[1].model,
        busScheduleID: `SCH-${routes[6].routeNo}-${departureDate}-2100`,
        depotName: buses[1].depotName,
        bookingClosingDate: departureDate,
        bookingClosingTime: '20:45',
        price: 300000,
        availableSeats: buses[1].totalSeats,
        status: 'Scheduled',
      });
      schedules.push(schedule7);
    }

    // Route 301: Da Nang - Hue (multiple times daily)
    if (buses[2] && routes[7]) {
      for (const time of ['08:00', '13:00', '17:00']) {
        const schedule8 = await BusSchedule.create({
          routeNo: routes[7].routeNo,
          busId: buses[2].id,
          routeId: routes[7].id,
          departure_city: routes[7].origin,
          departure_date: departureDate,
          departure_time: time,
          arrival_city: routes[7].destination,
          arrival_date: departureDate,
          arrival_time: `${(parseInt(time.split(':')[0]) + 3).toString().padStart(2, '0')}:00`,
          duration: routes[7].estimatedDuration,
          busType: buses[2].busType,
          model: buses[2].model,
          busScheduleID: `SCH-${routes[7].routeNo}-${departureDate}-${time.replace(':', '')}`,
          depotName: buses[2].depotName,
          bookingClosingDate: departureDate,
          bookingClosingTime: time,
          price: 150000,
          availableSeats: buses[2].totalSeats,
          status: 'Scheduled',
        });
        schedules.push(schedule8);
      }
    }

    // Route 204: HCM - Can Tho (daily morning)
    if (buses[3] && routes[8]) {
      const schedule9 = await BusSchedule.create({
        routeNo: routes[8].routeNo,
        busId: buses[3].id,
        routeId: routes[8].id,
        departure_city: routes[8].origin,
        departure_date: departureDate,
        departure_time: '06:00',
        arrival_city: routes[8].destination,
        arrival_date: departureDate,
        arrival_time: '10:00',
        duration: routes[8].estimatedDuration,
        busType: buses[3].busType,
        model: buses[3].model,
        busScheduleID: `SCH-${routes[8].routeNo}-${departureDate}-0600`,
        depotName: buses[3].depotName,
        bookingClosingDate: departureDate,
        bookingClosingTime: '05:45',
        price: 160000,
        availableSeats: buses[3].totalSeats,
        status: 'Scheduled',
      });
      schedules.push(schedule9);
    }

    // Route 105: Hanoi - Ha Long (multiple times daily, first 10 days)
    if (day < 10 && buses[4] && routes[9]) {
      for (const time of ['07:00', '11:00', '15:00']) {
        const schedule10 = await BusSchedule.create({
          routeNo: routes[9].routeNo,
          busId: buses[4].id,
          routeId: routes[9].id,
          departure_city: routes[9].origin,
          departure_date: departureDate,
          departure_time: time,
          arrival_city: routes[9].destination,
          arrival_date: departureDate,
          arrival_time: `${(parseInt(time.split(':')[0]) + 3).toString().padStart(2, '0')}:30`,
          duration: routes[9].estimatedDuration,
          busType: buses[4].busType,
          model: buses[4].model,
          busScheduleID: `SCH-${routes[9].routeNo}-${departureDate}-${time.replace(':', '')}`,
          depotName: buses[4].depotName,
          bookingClosingDate: departureDate,
          bookingClosingTime: time,
          price: 180000,
          availableSeats: buses[4].totalSeats,
          status: 'Scheduled',
        });
        schedules.push(schedule10);
      }
    }
  }

  console.log(`  ✅ Created ${schedules.length} bus schedules`);
  return schedules;
}

async function seedBookings(users, schedules) {
  console.log('🎫 Seeding bookings...');
  const bookings = [];

  // Create various booking scenarios

  // 1. Confirmed booking (user 1)
  if (schedules[0] && users[1]) {
    const booking1 = await BusBooking.create({
      customerId: users[1].id,
      busScheduleId: schedules[0].id,
      routeNo: schedules[0].routeNo,
      departure: schedules[0].departure_city,
      arrival: schedules[0].arrival_city,
      depotName: schedules[0].depotName,
      seatNumbers: [1, 2],
      booking_startTime: schedules[0].departure_time,
      booking_endTime: schedules[0].arrival_time,
      journeyDate: schedules[0].departure_date,
      status: 'confirmed',
      payment_busFare: 1700000,
      payment_convenienceFee: 20000,
      payment_bankCharge: 5000,
      payment_totalPay: 1725000,
      passengers: [
        { name: 'John Doe', age: 30, gender: 'Male', seatNumber: 1 },
        { name: 'Jane Doe', age: 28, gender: 'Female', seatNumber: 2 },
      ],
      pickupPoint: 'Hà Nội Central Station',
      dropoffPoint: 'HCM Ben Xe Mien Dong',
    });
    bookings.push(booking1);

    // Update available seats
    await schedules[0].update({ availableSeats: schedules[0].availableSeats - 2 });
  }

  // 2. Pending booking (user 2) - will expire soon
  if (schedules[1] && users[2]) {
    const booking2 = await BusBooking.create({
      customerId: users[2].id,
      busScheduleId: schedules[1].id,
      routeNo: schedules[1].routeNo,
      departure: schedules[1].departure_city,
      arrival: schedules[1].arrival_city,
      depotName: schedules[1].depotName,
      seatNumbers: [5],
      booking_startTime: schedules[1].departure_time,
      booking_endTime: schedules[1].arrival_time,
      journeyDate: schedules[1].departure_date,
      status: 'pending',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Expires in 5 minutes
      payment_busFare: 450000,
      payment_convenienceFee: 10000,
      payment_bankCharge: 3000,
      payment_totalPay: 463000,
      passengers: [{ name: 'Jane Smith', age: 25, gender: 'Female', seatNumber: 5 }],
      pickupPoint: 'Hà Nội My Dinh',
      dropoffPoint: 'Đà Nẵng Airport',
    });
    bookings.push(booking2);
  }

  // 3. Cancelled booking (user 3)
  if (schedules[2] && users[3]) {
    const booking3 = await BusBooking.create({
      customerId: users[3].id,
      busScheduleId: schedules[2].id,
      routeNo: schedules[2].routeNo,
      departure: schedules[2].departure_city,
      arrival: schedules[2].arrival_city,
      depotName: schedules[2].depotName,
      seatNumbers: [10, 11, 12],
      booking_startTime: schedules[2].departure_time,
      booking_endTime: schedules[2].arrival_time,
      journeyDate: schedules[2].departure_date,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: 'Change of travel plans',
      payment_busFare: 840000,
      payment_convenienceFee: 15000,
      payment_bankCharge: 5000,
      payment_totalPay: 860000,
      passengers: [
        { name: 'Nguyễn Văn A', age: 35, gender: 'Male', seatNumber: 10 },
        { name: 'Nguyễn Thị C', age: 32, gender: 'Female', seatNumber: 11 },
        { name: 'Nguyễn Bé D', age: 8, gender: 'Male', seatNumber: 12 },
      ],
      pickupPoint: 'HCM Ben Xe Mien Dong',
      dropoffPoint: 'Nha Trang Center',
    });
    bookings.push(booking3);
  }

  // 4. Completed booking (user 4) - from past schedule
  // We'll mark an old schedule as completed
  const pastDate = formatDate(getFutureDate(-2));
  const pastSchedule = await BusSchedule.create({
    routeNo: 103,
    busId: schedules[0].busId,
    routeId: schedules[0].routeId,
    departure_city: 'Hà Nội',
    departure_date: pastDate,
    departure_time: '06:00',
    arrival_city: 'Hải Phòng',
    arrival_date: pastDate,
    arrival_time: '08:00',
    duration: '02:00',
    busType: 'VIP Sleeper',
    model: 'Scania K410IB',
    busScheduleID: `SCH-103-${pastDate}-0600`,
    depotName: 'Hanoi Central Depot',
    bookingClosingDate: pastDate,
    bookingClosingTime: '05:45',
    price: 120000,
    availableSeats: 28,
    status: 'Completed',
    isCompleted: true,
    departedAt: getFutureDate(-2),
    completedAt: new Date(),
  });

  // Add pastSchedule to schedules array so reviews can find it
  schedules.push(pastSchedule);

  if (users[4]) {
    const booking4 = await BusBooking.create({
      customerId: users[4].id,
      busScheduleId: pastSchedule.id,
      routeNo: pastSchedule.routeNo,
      departure: pastSchedule.departure_city,
      arrival: pastSchedule.arrival_city,
      depotName: pastSchedule.depotName,
      seatNumbers: [1, 2],
      booking_startTime: pastSchedule.departure_time,
      booking_endTime: pastSchedule.arrival_time,
      journeyDate: pastSchedule.departure_date,
      status: 'completed',
      payment_busFare: 240000,
      payment_convenienceFee: 5000,
      payment_bankCharge: 2000,
      payment_totalPay: 247000,
      passengers: [
        { name: 'Trần Thị B', age: 28, gender: 'Female', seatNumber: 1 },
        { name: 'Lê Văn E', age: 30, gender: 'Male', seatNumber: 2 },
      ],
      pickupPoint: 'Hà Nội Gia Lam',
      dropoffPoint: 'Hải Phòng Center',
    });
    bookings.push(booking4);
  }

  // 5. Create ONE completed schedule with MULTIPLE bookings/reviews
  // This makes it easier to test reviews for a single trip
  const pastSchedDate = formatDate(getFutureDate(-3));
  const refSchedule = schedules[2]; // Use HCM - Nha Trang route

  if (refSchedule && refSchedule.busId && refSchedule.routeId) {
    const completedSchedule = await BusSchedule.create({
      routeNo: 201,
      busId: refSchedule.busId,
      routeId: refSchedule.routeId,
      departure_city: 'Hồ Chí Minh',
      departure_date: pastSchedDate,
      departure_time: '22:00',
      arrival_city: 'Nha Trang',
      arrival_date: pastSchedDate,
      arrival_time: '06:00',
      duration: '08:00',
      busType: refSchedule.busType,
      model: refSchedule.model,
      busScheduleID: `SCH-201-${pastSchedDate}-2200`,
      depotName: refSchedule.depotName,
      bookingClosingDate: pastSchedDate,
      bookingClosingTime: '21:45',
      price: 280000,
      availableSeats: 35, // 40 seats - 5 bookings
      status: 'Completed',
      isCompleted: true,
      departedAt: getFutureDate(-3),
      completedAt: new Date(),
    });

    schedules.push(completedSchedule);

    // Create 5 completed bookings for this same schedule
    // This will generate 5 reviews for the same trip
    for (let idx = 0; idx < 5; idx++) {
      const userIdx = (idx + 1) % users.length;
      if (users[userIdx]) {
        const completedBooking = await BusBooking.create({
          customerId: users[userIdx].id,
          busScheduleId: completedSchedule.id,
          routeNo: completedSchedule.routeNo,
          departure: completedSchedule.departure_city,
          arrival: completedSchedule.arrival_city,
          depotName: completedSchedule.depotName,
          seatNumbers: [5 + idx],
          booking_startTime: completedSchedule.departure_time,
          booking_endTime: completedSchedule.arrival_time,
          journeyDate: completedSchedule.departure_date,
          status: 'completed',
          payment_busFare: 280000,
          payment_convenienceFee: 10000,
          payment_bankCharge: 3000,
          payment_totalPay: 293000,
          passengers: [
            {
              name: users[userIdx].fullName,
              age: 25 + idx,
              gender: idx % 2 === 0 ? 'Male' : 'Female',
              seatNumber: 5 + idx,
            },
          ],
          pickupPoint: 'Hồ Chí Minh',
          dropoffPoint: 'Nha Trang',
        });
        bookings.push(completedBooking);
      }
    }
  }

  // 6. Multiple confirmed bookings for analytics
  for (let i = 0; i < Math.min(5, schedules.length); i++) {
    const schedule = schedules[i];
    const user = users[(i + 1) % users.length];

    if (schedule && user && schedule.availableSeats > 3) {
      const booking = await BusBooking.create({
        customerId: user.id,
        busScheduleId: schedule.id,
        routeNo: schedule.routeNo,
        departure: schedule.departure_city,
        arrival: schedule.arrival_city,
        depotName: schedule.depotName,
        seatNumbers: [20 + i],
        booking_startTime: schedule.departure_time,
        booking_endTime: schedule.arrival_time,
        journeyDate: schedule.departure_date,
        status: 'confirmed',
        payment_busFare: parseFloat(schedule.price),
        payment_convenienceFee: 10000,
        payment_bankCharge: 3000,
        payment_totalPay: parseFloat(schedule.price) + 13000,
        passengers: [
          {
            name: user.fullName,
            age: 25 + i,
            gender: i % 2 === 0 ? 'Male' : 'Female',
            seatNumber: 20 + i,
          },
        ],
        pickupPoint: schedule.departure_city,
        dropoffPoint: schedule.arrival_city,
      });
      bookings.push(booking);

      await schedule.update({ availableSeats: schedule.availableSeats - 1 });
    }
  }

  console.log(`  ✅ Created ${bookings.length} bookings`);
  return bookings;
}

async function seedReviews(bookings, users, schedules) {
  console.log('⭐ Seeding reviews...');
  const reviews = [];

  const reviewComments = [
    {
      title: 'Excellent service!',
      comment:
        'The bus was very clean and comfortable. The driver was professional and courteous. Will definitely book again!',
    },
    {
      title: 'Great experience',
      comment:
        'Smooth journey, on-time departure and arrival. The seats were spacious and the AC worked perfectly.',
    },
    {
      title: 'Highly recommend',
      comment:
        'Best bus service I have used in Vietnam. Staff were friendly and helpful. Great value for money!',
    },
    {
      title: 'Very satisfied',
      comment:
        'Clean bus, comfortable seats, and professional driver. The journey was smooth and enjoyable.',
    },
    {
      title: 'Good value',
      comment:
        'For the price, this is excellent service. The bus was well-maintained and the journey was comfortable.',
    },
    {
      title: 'Professional service',
      comment: 'Everything was as expected. On-time departure, clean bus, and friendly staff.',
    },
    {
      title: 'Comfortable journey',
      comment:
        'The seats were very comfortable for the long journey. WiFi worked well and staff were attentive.',
    },
    {
      title: 'Pleasant trip',
      comment:
        'Nice clean bus with good amenities. Driver was experienced and drove safely. Would use again!',
    },
  ];

  // Create reviews for completed bookings
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  for (const booking of completedBookings) {
    try {
      // Get random review comment
      const reviewData = reviewComments[Math.floor(Math.random() * reviewComments.length)];

      // Find corresponding schedule
      const schedule = schedules.find((s) => s.id === booking.busScheduleId);
      if (!schedule) {
        console.log(`  ⏭️  Skipping review - booking ${booking.id} has no schedule`);
        continue;
      }

      const review = await Review.create({
        customerId: booking.customerId,
        busScheduleId: booking.busScheduleId,
        bookingId: booking.id,
        rating: 4 + Math.floor(Math.random() * 2), // 4 or 5 stars
        title: reviewData.title,
        comment: reviewData.comment,
        cleanlinessRating: 4 + Math.floor(Math.random() * 2),
        comfortRating: 4 + Math.floor(Math.random() * 2),
        punctualityRating: 4 + Math.floor(Math.random() * 2),
        staffRating: 4 + Math.floor(Math.random() * 2),
        journeyDate: booking.journeyDate,
        routeInfo: {
          departure: booking.departure,
          arrival: booking.arrival,
          routeNo: schedule.routeNo || 'N/A',
          routeName: booking.routeName || 'N/A',
          depotName: booking.depotName,
        },
        isVerified: true,
        isVisible: true,
      });
      reviews.push(review);

      // Add some helpful votes
      for (let i = 0; i < users.length && i < 3; i++) {
        if (users[i].id !== booking.customerId) {
          await ReviewVote.create({
            reviewId: review.id,
            customerId: users[i].id,
            voteType: Math.random() > 0.2 ? 'helpful' : 'not_helpful',
          });
        }
      }

      console.log(`  ✅ Created review for booking ${booking.bookingReference}`);
    } catch (err) {
      console.error(`  ❌ Error creating review:`, err.message);
    }
  }

  return reviews;
}

async function seedChatHistory(users) {
  console.log('💬 Seeding chat history...');

  // Create chat sessions for different users
  const chatScenarios = [
    {
      userId: users[1]?.id,
      messages: [
        {
          role: 'user',
          content: 'Hello, I want to book a bus from Hanoi to Ho Chi Minh',
          intent: 'search_schedule',
        },
        {
          role: 'assistant',
          content:
            'I can help you find buses from Hanoi to Ho Chi Minh City. When would you like to travel?',
          intent: 'search_schedule',
        },
        { role: 'user', content: 'Tomorrow morning', intent: 'search_schedule' },
        {
          role: 'assistant',
          content:
            'I found several options for tomorrow. The earliest departure is at 06:00 AM with a VIP Sleeper bus for 850,000 VND.',
          intent: 'search_schedule',
        },
      ],
    },
    {
      userId: users[2]?.id,
      messages: [
        { role: 'user', content: 'How do I cancel my booking?', intent: 'cancellation' },
        {
          role: 'assistant',
          content:
            'You can cancel your booking from your profile page. Go to "My Bookings" and click the cancel button. Refunds depend on the cancellation time.',
          intent: 'cancellation',
        },
        { role: 'user', content: 'What is the refund policy?', intent: 'policy' },
        {
          role: 'assistant',
          content:
            'Full refund if cancelled 24 hours before departure, 50% refund if cancelled 12-24 hours before, and no refund for cancellations within 12 hours.',
          intent: 'policy',
        },
      ],
    },
    {
      userId: null, // Guest user
      messages: [
        {
          role: 'user',
          content: 'What amenities are available on your buses?',
          intent: 'general_inquiry',
        },
        {
          role: 'assistant',
          content:
            'Our buses offer various amenities depending on the type: WiFi, AC, USB charging ports, entertainment systems, blankets, and complimentary water. VIP buses also include massage seats and meals.',
          intent: 'general_inquiry',
        },
      ],
    },
  ];

  for (const scenario of chatScenarios) {
    const sessionId = randomUUID();

    for (const msg of scenario.messages) {
      await ChatHistory.create({
        sessionId,
        userId: scenario.userId,
        role: msg.role,
        content: msg.content,
        intent: msg.intent,
        metadata: {},
      });
    }
  }

  console.log(`  ✅ Created chat history for ${chatScenarios.length} sessions`);
}

async function seedSeatLocks(schedules, users) {
  console.log('🔒 Seeding seat locks...');

  // Create some active seat locks (users in checkout process)
  if (schedules[3] && users[1]) {
    await SeatLock.create({
      scheduleId: schedules[3].id,
      seatNumber: '15',
      customerId: users[1].id,
      sessionId: 'session-' + Date.now(),
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      status: 'locked',
    });

    console.log(`  ✅ Created seat lock for schedule ${schedules[3].id}`);
  }
}

// ============================================
// MAIN SEEDER FUNCTION
// ============================================

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Validate route cities before seeding
    const citiesValid = validateRouteCities();
    if (!citiesValid) {
      console.log('❌ Seeding aborted due to invalid city names in routes.\n');
      process.exit(1);
    }

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Sync models (don't alter in production!)
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema synced\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Seed data in order (respecting foreign key constraints)
    const users = await seedUsers();
    console.log('');

    await seedNotificationPreferences(users);
    console.log('');

    const buses = await seedBuses();
    console.log('');

    const routes = await seedRoutes();
    console.log('');

    const schedules = await seedBusSchedules(buses, routes);
    console.log('');

    const bookings = await seedBookings(users, schedules);
    console.log('');

    await seedReviews(bookings, users, schedules);
    console.log('');

    await seedChatHistory(users);
    console.log('');

    await seedSeatLocks(schedules, users);
    console.log('');

    // Display summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SEEDING SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👥 Users: ${users.length}`);
    console.log(`🚌 Buses: ${buses.length}`);
    console.log(`🛣️  Routes: ${routes.length}`);
    console.log(`📅 Schedules: ${schedules.length}`);
    console.log(`🎫 Bookings: ${bookings.length}`);
    console.log('');

    // Display email templates info
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL TEMPLATES AVAILABLE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.keys(EMAIL_TEMPLATES).forEach((key) => {
      console.log(`  • ${key}: ${EMAIL_TEMPLATES[key].subject}`);
    });
    console.log('');

    // Display Kanban configurations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 KANBAN WORKFLOW CONFIGURATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.keys(KANBAN_CONFIGURATIONS).forEach((key) => {
      const config = KANBAN_CONFIGURATIONS[key];
      console.log(`\n${config.name}:`);
      config.columns.forEach((col) => {
        console.log(`  ${col.order}. ${col.name} (${col.status})`);
      });
    });
    console.log('');

    // Display test credentials
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 TEST USER CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@busbook.com');
    console.log('  Password: Admin@123');
    console.log('');
    console.log('Regular Users:');
    console.log('  Email: john.doe@gmail.com');
    console.log('  Password: User@123');
    console.log('');
    console.log('  Email: jane.smith@gmail.com');
    console.log('  Password: User@123');
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Export configurations for use in application
export { EMAIL_TEMPLATES, KANBAN_CONFIGURATIONS };

// Run seeder if executed directly
seedDatabase();
