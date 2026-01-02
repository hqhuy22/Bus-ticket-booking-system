/**
 * Integration Tests for Bus Routes
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock models
const mockBus = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
};

const mockBusSchedule = {
  findAll: jest.fn(),
};

jest.unstable_mockModule('../../models/Bus.js', () => ({
  default: mockBus,
}));

jest.unstable_mockModule('../../models/busSchedule.js', () => ({
  default: mockBusSchedule,
}));

// Import routes after mocking
const busRoutes = (await import('../../routes/busRoutes.js')).default;

// TODO: Fix these integration tests - routes setup issue
describe.skip('Bus Routes Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/buses', busRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/buses', () => {
    it('should return all buses', async () => {
      const mockBuses = [
        { id: 1, busNumber: 'BUS-001', busType: 'AC', status: 'active' },
        { id: 2, busNumber: 'BUS-002', busType: 'Sleeper', status: 'active' },
      ];

      mockBus.findAll.mockResolvedValue(mockBuses);

      const response = await request(app).get('/api/buses').expect(200);

      expect(response.body).toEqual(mockBuses);
      expect(mockBus.findAll).toHaveBeenCalled();
    });

    it('should filter buses by status', async () => {
      mockBus.findAll.mockResolvedValue([]);

      await request(app).get('/api/buses?status=active').expect(200);

      expect(mockBus.findAll).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });

    it('should filter buses by busType', async () => {
      mockBus.findAll.mockResolvedValue([]);

      await request(app).get('/api/buses?busType=AC').expect(200);

      expect(mockBus.findAll).toHaveBeenCalledWith({
        where: { busType: 'AC' },
      });
    });
  });

  describe('GET /api/buses/:id', () => {
    it('should return a bus by ID', async () => {
      const mockBusData = {
        id: 1,
        busNumber: 'BUS-001',
        busType: 'AC',
        totalSeats: 40,
      };

      mockBus.findByPk.mockResolvedValue(mockBusData);

      const response = await request(app).get('/api/buses/1').expect(200);

      expect(response.body).toEqual(mockBusData);
      expect(mockBus.findByPk).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent bus', async () => {
      mockBus.findByPk.mockResolvedValue(null);

      const response = await request(app).get('/api/buses/999').expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/buses', () => {
    it('should create a new bus', async () => {
      const newBus = {
        busNumber: 'BUS-003',
        busType: 'AC',
        model: 'Volvo',
        totalSeats: 40,
        amenities: ['WiFi', 'AC'],
        depotName: 'Central Depot',
      };

      const createdBus = { id: 3, ...newBus, status: 'active' };
      mockBus.create.mockResolvedValue(createdBus);

      const response = await request(app).post('/api/buses').send(newBus).expect(201);

      expect(response.body).toHaveProperty('message', 'Bus created successfully');
      expect(response.body.bus).toMatchObject(createdBus);
      expect(mockBus.create).toHaveBeenCalled();
    });

    it('should return 400 for invalid data', async () => {
      mockBus.create.mockRejectedValue(new Error('Validation error'));

      const response = await request(app)
        .post('/api/buses')
        .send({ busNumber: 'BUS-003' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/buses/:id', () => {
    it('should update a bus', async () => {
      const mockBusInstance = {
        id: 1,
        busNumber: 'BUS-001',
        update: jest.fn().mockResolvedValue({ id: 1, busNumber: 'BUS-001-UPDATED' }),
      };

      mockBus.findByPk.mockResolvedValue(mockBusInstance);

      const response = await request(app)
        .put('/api/buses/1')
        .send({ busNumber: 'BUS-001-UPDATED' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Bus updated successfully');
      expect(mockBusInstance.update).toHaveBeenCalled();
    });

    it('should return 404 for non-existent bus', async () => {
      mockBus.findByPk.mockResolvedValue(null);

      await request(app).put('/api/buses/999').send({ busNumber: 'BUS-999' }).expect(404);
    });
  });

  describe('DELETE /api/buses/:id', () => {
    it('should delete a bus', async () => {
      const mockBusInstance = {
        id: 1,
        destroy: jest.fn(),
      };

      mockBus.findByPk.mockResolvedValue(mockBusInstance);

      const response = await request(app).delete('/api/buses/1').expect(200);

      expect(response.body).toHaveProperty('message', 'Bus deleted successfully');
      expect(mockBusInstance.destroy).toHaveBeenCalled();
    });

    it('should return 404 for non-existent bus', async () => {
      mockBus.findByPk.mockResolvedValue(null);

      await request(app).delete('/api/buses/999').expect(404);
    });
  });

  describe('GET /api/buses/availability', () => {
    it('should check bus availability', async () => {
      mockBusSchedule.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/buses/availability?busId=1&departureDate=2026-02-01&departureTime=08:00')
        .expect(200);

      expect(response.body).toHaveProperty('available');
    });

    it('should return 400 for missing parameters', async () => {
      await request(app).get('/api/buses/availability').expect(400);
    });
  });
});
