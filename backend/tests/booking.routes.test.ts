import request from 'supertest';
// Mock token blacklist early to avoid real Redis calls inside auth middleware
jest.mock('../src/utils/tokenBlacklist', () => ({ isTokenBlacklisted: jest.fn().mockResolvedValue(false) }));

import app from '../src/server';
import jwt from 'jsonwebtoken';

import BookingService from '../src/services/booking.service';
import BookingRepository from '../src/repositories/booking.repository';
import TicketService from '../src/services/ticket.service';

describe('Booking routes', () => {
  const secret = process.env.JWT_SECRET || 'devsecret';

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('POST /api/v1/bookings/initiate', () => {
    test('Creates booking for authenticated user', async () => {
      const userId = 'user-1';
      const token = jwt.sign({ sub: userId, email: 'u@example.com', role: 'user' }, secret);

  const booking = { id: 'b1', trip_id: '00000000-0000-0000-0000-000000000001', total_amount: 100 } as any;
      jest.spyOn(BookingService, 'createBooking').mockResolvedValue(booking);

      const res = await request(app)
        .post('/api/v1/bookings/initiate')
        .set('Authorization', `Bearer ${token}`)
        .send({ tripId: '00000000-0000-0000-0000-000000000001', seatIds: ['00000000-0000-0000-0000-000000000011'], contactEmail: 'u@example.com' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('booking');
      expect(res.body.booking).toHaveProperty('id', 'b1');
  expect(BookingService.createBooking).toHaveBeenCalled();
    });


    test('Fails without valid trip', async () => {
  const userId = 'user-404';
  const token = jwt.sign({ sub: userId, email: 'u404@example.com', role: 'user' }, secret);
  jest.spyOn(BookingService, 'createBooking').mockRejectedValue(new Error('Trip not found'));

      const res = await request(app)
        .post('/api/v1/bookings/initiate')
        .set('Authorization', `Bearer ${token}`)
        .send({ tripId: '00000000-0000-0000-0000-000000000099', seatIds: ['00000000-0000-0000-0000-000000000099'], contactEmail: 'x@example.com' });

  expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/bookings/:id/passengers', () => {
    test('Adds passengers successfully', async () => {
      const userId = 'owner-1';
      const token = jwt.sign({ sub: userId, email: 'owner@example.com', role: 'user' }, secret);
      const bookingId = 'bk-1';

      // requireBookingOwner middleware calls BookingService.getBookingDetails; mock to be owned by user

      jest.spyOn(BookingService, 'getBookingDetails').mockResolvedValue({ id: bookingId, user_id: userId } as any);
      jest.spyOn(BookingService, 'addPassengerDetails').mockResolvedValue([
        { id: 'p1', fullName: 'P1', seatCode: 'A1' },
      ] as any);

      // controller will fetch updated booking via BookingRepository.getBookingById
  const updated = { id: bookingId, passengers: [{ id: 'p1', fullName: 'P1', seatCode: 'A1' }] } as any;
      jest.spyOn(BookingRepository, 'getBookingById').mockResolvedValue(updated);

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/passengers`)
        .set('Authorization', `Bearer ${token}`)
        .send({ passengers: [{ fullName: 'P1', seatCode: 'A1' }] });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('booking');
      expect(res.body.booking).toHaveProperty('id', bookingId);
      expect(BookingService.addPassengerDetails).toHaveBeenCalledWith(bookingId, expect.any(Array));
    });

    test('Validates passenger count', async () => {
      const userId = 'owner-2';
      const token = jwt.sign({ sub: userId, email: 'owner2@example.com', role: 'user' }, secret);
      const bookingId = 'bk-2';

      jest.spyOn(BookingService, 'getBookingDetails').mockResolvedValue({ id: bookingId, user_id: userId } as any);

      jest.spyOn(BookingService, 'addPassengerDetails').mockRejectedValue(new Error('Passenger count must match selected seats'));

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/passengers`)
        .set('Authorization', `Bearer ${token}`)
        .send({ passengers: [{ fullName: 'OnlyOne', seatCode: 'A1' }] });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/bookings/:id/confirm and resend-ticket', () => {
    test('Confirms booking', async () => {
      const userId = 'u-confirm';
      const token = jwt.sign({ sub: userId, email: 'c@example.com', role: 'user' }, secret);
      const bookingId = 'conf-1';

  const details = { id: bookingId, status: 'confirmed' } as any;
  jest.spyOn(BookingService, 'getBookingDetails').mockResolvedValue({ id: bookingId, user_id: userId } as any);
  jest.spyOn(BookingService, 'confirmBooking').mockResolvedValue(details);


      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .send({ paymentProvider: 'cash', transactionRef: 'TX-123', amount: 100 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', bookingId);
      expect(BookingService.confirmBooking).toHaveBeenCalledWith(bookingId, expect.any(Object));
    });

    test('Sends email ticket (resend-ticket route)', async () => {
      const userId = 'u-resend';
      const token = jwt.sign({ sub: userId, email: 'r@example.com', role: 'user' }, secret);
      const bookingId = 'b-resend';

      // owner check
      jest.spyOn(BookingService, 'getBookingDetails').mockResolvedValue({ id: bookingId, user_id: userId } as any);
  const spy = jest.spyOn(TicketService, 'sendTicketEmail').mockResolvedValue(undefined as any);

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/resend-ticket`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'ticket resent');
      expect(spy).toHaveBeenCalledWith(bookingId);
    });
  });

  describe('GET /api/v1/bookings/me', () => {
    test('Returns user bookings', async () => {
      const userId = 'u-me';
      const token = jwt.sign({ sub: userId, email: 'me@example.com', role: 'user' }, secret);

  const result = { items: [{ id: 'b1' }], total: 1 } as any;
      jest.spyOn(BookingService, 'getUserBookingHistory').mockResolvedValue(result);

      const res = await request(app).get('/api/v1/bookings/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total', 1);
      expect(BookingService.getUserBookingHistory).toHaveBeenCalledWith(userId, expect.any(Object));
    });
  });

  // Guest flows removed: guest lookup/initiate tests removed
});
