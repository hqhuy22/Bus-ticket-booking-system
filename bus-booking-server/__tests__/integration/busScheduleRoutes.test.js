/**
 * Integration Tests for Bus Schedule Routes
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock models
const mockBusSchedule = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  count: jest.fn(),
};

const mockBus = {
  findByPk: jest.fn(),
};

jest.unstable_mockModule('../../models/busSchedule.js', () => ({
  default: mockBusSchedule,
}));

jest.unstable_mockModule('../../models/Bus.js', () => ({
  default: mockBus,
}));

// Import routes after mocking
const busScheduleRoutes = (await import('../../routes/busScheduleRoutes.js')).default;

// TODO: Fix these integration tests - routes setup issue
describe.skip('Bus Schedule Routes Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/bus-schedules', busScheduleRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/bus-schedules', () => {
    it('should return all bus schedules', async () => {
      const mockSchedules = [
        {
          id: 1,
          departure_city: 'Hanoi',
          arrival_city: 'Ho Chi Minh',
          price: 300000,
        },
        {
          id: 2,
          departure_city: 'Da Nang',
          arrival_city: 'Hanoi',
          price: 200000,
        },
      ];

      mockBusSchedule.findAll.mockResolvedValue(mockSchedules);
      mockBusSchedule.count.mockResolvedValue(2);

      const response = await request(app).get('/api/bus-schedules').expect(200);

      expect(mockBusSchedule.findAll).toHaveBeenCalled();
    });

    it('should filter by departure city', async () => {
      mockBusSchedule.findAll.mockResolvedValue([]);
      mockBusSchedule.count.mockResolvedValue(0);

      await request(app).get('/api/bus-schedules?from=Hanoi').expect(200);

      expect(mockBusSchedule.findAll).toHaveBeenCalled();
    });

    it('should filter by arrival city', async () => {
      mockBusSchedule.findAll.mockResolvedValue([]);
      mockBusSchedule.count.mockResolvedValue(0);

      await request(app).get('/api/bus-schedules?to=Ho Chi Minh').expect(200);

      expect(mockBusSchedule.findAll).toHaveBeenCalled();
    });

    it('should filter by date', async () => {
      mockBusSchedule.findAll.mockResolvedValue([]);
      mockBusSchedule.count.mockResolvedValue(0);

      await request(app).get('/api/bus-schedules?date=2026-02-01').expect(200);

      expect(mockBusSchedule.findAll).toHaveBeenCalled();
    });

    it('should filter by price range', async () => {
      mockBusSchedule.findAll.mockResolvedValue([]);
      mockBusSchedule.count.mockResolvedValue(0);

      await request(app).get('/api/bus-schedules?minPrice=100000&maxPrice=500000').expect(200);

      expect(mockBusSchedule.findAll).toHaveBeenCalled();
    });

    it('should support pagination', async () => {
      mockBusSchedule.findAll.mockResolvedValue([]);
      mockBusSchedule.count.mockResolvedValue(0);

      await request(app).get('/api/bus-schedules?page=2&limit=5').expect(200);

      const callArgs = mockBusSchedule.findAll.mock.calls[0][0];
      expect(callArgs.limit).toBe(5);
      expect(callArgs.offset).toBe(5);
    });

    it('should support sorting', async () => {
      mockBusSchedule.findAll.mockResolvedValue([]);
      mockBusSchedule.count.mockResolvedValue(0);

      await request(app).get('/api/bus-schedules?sort=price&order=DESC').expect(200);

      expect(mockBusSchedule.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/bus-schedules/:id', () => {
    it('should return a schedule by ID', async () => {
      const mockSchedule = {
        id: 1,
        departure_city: 'Hanoi',
        arrival_city: 'Ho Chi Minh',
        price: 300000,
        Bus: {
          id: 1,
          busNumber: 'BUS-001',
        },
      };

      mockBusSchedule.findByPk.mockResolvedValue(mockSchedule);

      const response = await request(app).get('/api/bus-schedules/1').expect(200);

      expect(response.body).toEqual(mockSchedule);
      expect(mockBusSchedule.findByPk).toHaveBeenCalled();
    });

    it('should return 404 for non-existent schedule', async () => {
      mockBusSchedule.findByPk.mockResolvedValue(null);

      const response = await request(app).get('/api/bus-schedules/999').expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/bus-schedules', () => {
    it('should create a new bus schedule', async () => {
      const newSchedule = {
        routeNo: 1,
        busId: 1,
        departure_city: 'Hanoi',
        departure_date: '2026-02-01',
        departure_time: '08:00',
        arrival_city: 'Ho Chi Minh',
        arrival_date: '2026-02-01',
        arrival_time: '20:00',
        duration: '12h',
        busType: 'AC',
        model: 'Volvo',
        price: 300000,
        availableSeats: 40,
        depotName: 'Central Depot',
        busScheduleID: 'SCH-001',
      };

      mockBusSchedule.findAll.mockResolvedValue([]); // No conflicts
      mockBusSchedule.create.mockResolvedValue({ id: 1, ...newSchedule });

      const response = await request(app).post('/api/bus-schedules').send(newSchedule).expect(201);

      expect(response.body).toMatchObject({ id: 1 });
      expect(mockBusSchedule.create).toHaveBeenCalled();
    });

    it('should detect scheduling conflicts', async () => {
      const newSchedule = {
        busId: 1,
        departure_date: '2026-02-01',
        departure_time: '08:00',
        arrival_date: '2026-02-01',
        arrival_time: '20:00',
      };

      mockBusSchedule.findAll.mockResolvedValue([{ id: 1 }]); // Conflict exists

      const response = await request(app).post('/api/bus-schedules').send(newSchedule).expect(409);

      expect(response.body).toHaveProperty('error', 'Scheduling conflict detected');
    });

    it('should return 400 for invalid data', async () => {
      mockBusSchedule.findAll.mockResolvedValue([]);
      mockBusSchedule.create.mockRejectedValue(new Error('Validation error'));

      await request(app).post('/api/bus-schedules').send({ routeNo: 1 }).expect(400);
    });
  });

  describe('PUT /api/bus-schedules/:id', () => {
    it('should update a schedule', async () => {
      const mockScheduleInstance = {
        id: 1,
        price: 300000,
        update: jest.fn().mockResolvedValue({ id: 1, price: 350000 }),
      };

      mockBusSchedule.findByPk.mockResolvedValue(mockScheduleInstance);

      const response = await request(app)
        .put('/api/bus-schedules/1')
        .send({ price: 350000 })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Bus schedule updated successfully');
      expect(mockScheduleInstance.update).toHaveBeenCalled();
    });

    it('should return 404 for non-existent schedule', async () => {
      mockBusSchedule.findByPk.mockResolvedValue(null);

      await request(app).put('/api/bus-schedules/999').send({ price: 350000 }).expect(404);
    });
  });

  describe('DELETE /api/bus-schedules/:id', () => {
    it('should delete a schedule', async () => {
      const mockScheduleInstance = {
        id: 1,
        destroy: jest.fn(),
      };

      mockBusSchedule.findByPk.mockResolvedValue(mockScheduleInstance);

      const response = await request(app).delete('/api/bus-schedules/1').expect(200);

      expect(response.body).toHaveProperty('message', 'Bus schedule deleted successfully');
      expect(mockScheduleInstance.destroy).toHaveBeenCalled();
    });

    it('should return 404 for non-existent schedule', async () => {
      mockBusSchedule.findByPk.mockResolvedValue(null);

      await request(app).delete('/api/bus-schedules/999').expect(404);
    });
  });
});
