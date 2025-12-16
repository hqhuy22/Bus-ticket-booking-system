import BookingService from '../src/services/booking.service';
import BookingRepository from '../src/repositories/booking.repository';
import TripRepository from '../src/repositories/trip.repository';
import SeatLockService from '../src/services/seatLock.service';

// import DB helpers to mock queries and client
const db = require('../src/config/db');

describe('BookingService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('createBooking - successful booking creation', async () => {
    const tripId = 'trip-1';
    const seatIds = ['s1', 's2'];

    jest.spyOn(TripRepository, 'getTripWithDetails').mockResolvedValue({
      id: tripId,
      base_price: 100,
      seats: [
        { seat_id: 's1', seat_code: 'A1' },
        { seat_id: 's2', seat_code: 'A2' },
      ],
    } as any);

    jest.spyOn(SeatLockService, 'checkSeatAvailability').mockResolvedValue(
      seatIds.map((s) => ({ seatId: s, available: true })),
    );
    jest.spyOn(SeatLockService, 'lockSeats').mockResolvedValue(true);

    const created = { id: 'b1', trip_id: tripId, total_amount: 200 } as any;
    jest.spyOn(BookingRepository, 'createBooking').mockResolvedValue(created);
    jest.spyOn(TripRepository, 'updateSeatStatuses').mockResolvedValue(undefined as any);

    const res = await BookingService.createBooking('user-1', tripId, seatIds);

    expect(res).toBeDefined();
    expect(res).toHaveProperty('id', 'b1');
    expect(BookingRepository.createBooking).toHaveBeenCalled();
  expect(TripRepository.updateSeatStatuses).toHaveBeenCalledWith(tripId, seatIds, 'locked', 'b1', expect.any(Object));
  });

  test('createBooking - fails khi seats không available', async () => {
    const tripId = 'trip-2';
    const seatIds = ['s1', 's2'];

    jest.spyOn(TripRepository, 'getTripWithDetails').mockResolvedValue({
      id: tripId,
      base_price: 100,
      seats: [{ seat_id: 's1' }, { seat_id: 's2' }],
    } as any);

    jest.spyOn(SeatLockService, 'checkSeatAvailability').mockResolvedValue([
      { seatId: 's1', available: true },
      { seatId: 's2', available: false },
    ] as any);

    await expect(BookingService.createBooking('user-1', tripId, seatIds)).rejects.toThrow(
      /Some seats are not available/,
    );
  });

  test('createBooking - guest booking với contact info', async () => {
  // Guest flows removed - test not applicable
  });

  test('addPassengerDetails - successful', async () => {
    const bookingId = 'bk-1';

    jest.spyOn(BookingRepository, 'getBookingById').mockResolvedValue({ id: bookingId, status: 'pending' } as any);

    // mock DB query that selects seat statuses joined with seats
    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [{ seat_id: 's1', seat_code: 'A1' }, { seat_id: 's2', seat_code: 'A2' }] } as any);

    const passengers = [
      { full_name: 'P1', seat_code: 'A1' },
      { full_name: 'P2', seat_code: 'A2' },
    ];

    jest.spyOn(BookingRepository, 'addPassengers').mockResolvedValue([
      { id: 'p1', ...passengers[0] },
      { id: 'p2', ...passengers[1] },
    ] as any);

    const res = await BookingService.addPassengerDetails(bookingId, passengers as any);

    expect(res).toHaveLength(2);
    expect(BookingRepository.addPassengers).toHaveBeenCalledWith(bookingId, passengers as any);
  });

  test('addPassengerDetails - fails nếu số passengers != seats', async () => {
    const bookingId = 'bk-2';

    jest.spyOn(BookingRepository, 'getBookingById').mockResolvedValue({ id: bookingId, status: 'pending' } as any);

    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [{ seat_id: 's1', seat_code: 'A1' }, { seat_id: 's2', seat_code: 'A2' }] } as any);

    const passengers = [{ full_name: 'OnlyOne', seat_code: 'A1' }];

    await expect(BookingService.addPassengerDetails(bookingId, passengers as any)).rejects.toThrow(
      /Passenger count must match selected seats/,
    );
  });

  test('confirmBooking - successful', async () => {
    const bookingId = 'conf-1';
    const tripId = 't-1';

    // fake DB client to simulate transaction queries
    const fakeClient: any = {
      query: jest.fn(async (q: string, params?: any[]) => {
        if (q.startsWith('BEGIN') || q.startsWith('COMMIT') || q.startsWith('ROLLBACK')) return {};
        if (q.includes('FROM bookings WHERE id = $1 FOR UPDATE')) {
          return { rows: [{ id: bookingId, trip_id: tripId, status: 'pending', expires_at: new Date(Date.now() + 10000) }] };
        }
        if (q.includes('FROM seat_statuses ss JOIN seats s')) {
          return { rows: [{ seat_id: 's1', seat_code: 'A1' }, { seat_id: 's2', seat_code: 'A2' }] };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };

    jest.spyOn(db, 'getClient').mockResolvedValue(fakeClient);
    jest.spyOn(TripRepository, 'updateSeatStatuses').mockResolvedValue(undefined as any);
    jest.spyOn(SeatLockService, 'unlockSeats').mockResolvedValue(undefined as any);

    const finalDetails = { id: bookingId, status: 'confirmed' } as any;
    jest.spyOn(BookingRepository, 'getBookingById').mockResolvedValue(finalDetails);

    const res = await BookingService.confirmBooking(bookingId, { provider: 'test', amount: 100 } as any);

    expect(res).toEqual(finalDetails);
  expect(TripRepository.updateSeatStatuses).toHaveBeenCalledWith(tripId, expect.any(Array), 'booked', bookingId, expect.any(Object));
    expect(SeatLockService.unlockSeats).toHaveBeenCalled();
  });

  test('confirmBooking - fails nếu expired', async () => {
    const bookingId = 'conf-2';
    const tripId = 't-2';

    const fakeClient: any = {
      query: jest.fn(async (q: string, params?: any[]) => {
        if (q.startsWith('BEGIN') || q.startsWith('COMMIT') || q.startsWith('ROLLBACK')) return {};
        if (q.includes('FROM bookings WHERE id = $1 FOR UPDATE')) {
          return { rows: [{ id: bookingId, trip_id: tripId, status: 'pending', expires_at: new Date(Date.now() - 10000) }] };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };

    jest.spyOn(db, 'getClient').mockResolvedValue(fakeClient);

    await expect(BookingService.confirmBooking(bookingId)).rejects.toThrow(/Booking has expired/);
  });

  test('cancelBooking - releases seats correctly', async () => {
    const bookingId = 'can-1';
    const booking = { id: bookingId, user_id: 'u1', trip_id: 't1' } as any;

    jest.spyOn(BookingRepository, 'getBookingById').mockResolvedValue(booking);
    jest.spyOn(TripRepository, 'releaseSeatsByBooking').mockResolvedValue(undefined as any);
    jest.spyOn(SeatLockService, 'unlockSeats').mockResolvedValue(undefined as any);
    jest.spyOn(BookingRepository, 'updateBookingStatus').mockResolvedValue({ ...booking, status: 'cancelled' } as any);

    await BookingService.cancelBooking(bookingId, 'u1');

    expect(TripRepository.releaseSeatsByBooking).toHaveBeenCalledWith(bookingId);
    expect(BookingRepository.updateBookingStatus).toHaveBeenCalledWith(bookingId, 'cancelled');
  });

  test('autoExpireBookings - expires old bookings', async () => {
    const rowsToExpire = [{ id: 'e1', trip_id: 't1' }, { id: 'e2', trip_id: 't2' }];

    // fake client to return rows for SELECT ... FOR UPDATE
    const fakeClient: any = {
      query: jest.fn(async (q: string, params?: any[]) => {
        if (q.startsWith('BEGIN') || q.startsWith('COMMIT') || q.startsWith('ROLLBACK')) return {};
        if (q.includes("SELECT id, trip_id FROM bookings WHERE status = 'pending'")) {
          return { rows: rowsToExpire };
        }
        // updates return empty
        return { rows: [] };
      }),
      release: jest.fn(),
    };

    jest.spyOn(db, 'getClient').mockResolvedValue(fakeClient);
    jest.spyOn(TripRepository, 'releaseSeatsByBooking').mockResolvedValue(undefined as any);
    jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ id: 's1' }] } as any);
    jest.spyOn(SeatLockService, 'unlockSeats').mockResolvedValue(undefined as any);

    await BookingService.autoExpireBookings();

    expect(TripRepository.releaseSeatsByBooking).toHaveBeenCalledTimes(rowsToExpire.length);
    expect(SeatLockService.unlockSeats).toHaveBeenCalled();
  });
});
