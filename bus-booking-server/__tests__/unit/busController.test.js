/**
 * Unit Tests for Bus Controller
 */

import { jest } from '@jest/globals';

// Mock the Bus model before importing controller
const mockBus = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  destroy: jest.fn(),
  update: jest.fn(),
};

// Mock dependencies
jest.unstable_mockModule('../../models/Bus.js', () => ({
  default: mockBus,
}));

jest.unstable_mockModule('../../models/busSchedule.js', () => ({
  default: {
    findAll: jest.fn(),
  },
}));

// Import controller after mocking
const { createBus, getAllBuses, getBusById, updateBus, deleteBus, checkBusAvailability } =
  await import('../../controllers/busController.js');

describe('Bus Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('createBus', () => {
    it('should create a new bus successfully', async () => {
      const busData = {
        busNumber: 'BUS-001',
        busType: 'AC',
        model: 'Volvo',
        totalSeats: 40,
        amenities: ['WiFi', 'AC'],
        depotName: 'Central Depot',
      };

      req.body = busData;

      const mockCreatedBus = { id: 1, ...busData, status: 'active' };
      mockBus.create.mockResolvedValue(mockCreatedBus);

      await createBus(req, res);

      expect(mockBus.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bus created successfully',
        bus: mockCreatedBus,
      });
    });

    it('should handle duplicate bus number', async () => {
      req.body = {
        busNumber: 'BUS-001',
        busType: 'AC',
        model: 'Volvo',
        totalSeats: 40,
        depotName: 'Central Depot',
      };

      mockBus.create.mockRejectedValue(new Error('Duplicate bus number'));

      await createBus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });

    it('should normalize amenities', async () => {
      req.body = {
        busNumber: 'BUS-002',
        busType: 'AC',
        model: 'Volvo',
        totalSeats: 40,
        amenities: ['WiFi', 'WiFi', 'AC', 'InvalidAmenity'],
        depotName: 'Central Depot',
      };

      mockBus.create.mockResolvedValue({ id: 1, ...req.body });

      await createBus(req, res);

      const createCall = mockBus.create.mock.calls[0][0];
      expect(createCall.amenities).not.toContain('InvalidAmenity');
      expect(createCall.amenities.filter((a) => a === 'WiFi').length).toBe(1);
    });
  });

  describe('getAllBuses', () => {
    it('should return all buses', async () => {
      const mockBuses = [
        { id: 1, busNumber: 'BUS-001', status: 'active' },
        { id: 2, busNumber: 'BUS-002', status: 'active' },
      ];

      mockBus.findAll.mockResolvedValue(mockBuses);

      await getAllBuses(req, res);

      expect(mockBus.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBuses);
    });

    it('should filter buses by status', async () => {
      req.query = { status: 'active' };
      mockBus.findAll.mockResolvedValue([]);

      await getAllBuses(req, res);

      expect(mockBus.findAll).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });

    it('should filter buses by busType', async () => {
      req.query = { busType: 'AC' };
      mockBus.findAll.mockResolvedValue([]);

      await getAllBuses(req, res);

      expect(mockBus.findAll).toHaveBeenCalledWith({
        where: { busType: 'AC' },
      });
    });

    it('should handle errors', async () => {
      mockBus.findAll.mockRejectedValue(new Error('Database error'));

      await getAllBuses(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
  });

  describe('getBusById', () => {
    it('should return a bus by ID', async () => {
      const mockBusData = { id: 1, busNumber: 'BUS-001' };
      req.params.id = '1';

      mockBus.findByPk.mockResolvedValue(mockBusData);

      await getBusById(req, res);

      expect(mockBus.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBusData);
    });

    it('should return 404 if bus not found', async () => {
      req.params.id = '999';
      mockBus.findByPk.mockResolvedValue(null);

      await getBusById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bus not found' });
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      mockBus.findByPk.mockRejectedValue(new Error('Database error'));

      await getBusById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateBus', () => {
    it('should update a bus successfully', async () => {
      req.params.id = '1';
      req.body = { busNumber: 'BUS-001-UPDATED' };

      const mockBusInstance = {
        id: 1,
        busNumber: 'BUS-001',
        update: jest.fn().mockResolvedValue({ id: 1, busNumber: 'BUS-001-UPDATED' }),
      };

      mockBus.findByPk.mockResolvedValue(mockBusInstance);

      await updateBus(req, res);

      expect(mockBusInstance.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bus updated successfully',
        bus: expect.any(Object),
      });
    });

    it('should return 404 if bus not found', async () => {
      req.params.id = '999';
      mockBus.findByPk.mockResolvedValue(null);

      await updateBus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bus not found' });
    });

    it('should normalize amenities on update', async () => {
      req.params.id = '1';
      req.body = { amenities: ['WiFi', 'AC', 'InvalidAmenity'] };

      const mockBusInstance = {
        id: 1,
        update: jest.fn(),
      };

      mockBus.findByPk.mockResolvedValue(mockBusInstance);

      await updateBus(req, res);

      const updateCall = mockBusInstance.update.mock.calls[0][0];
      expect(updateCall.amenities).not.toContain('InvalidAmenity');
    });
  });

  describe('deleteBus', () => {
    it('should delete a bus successfully', async () => {
      req.params.id = '1';

      const mockBusInstance = {
        id: 1,
        destroy: jest.fn(),
      };

      mockBus.findByPk.mockResolvedValue(mockBusInstance);

      await deleteBus(req, res);

      expect(mockBusInstance.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bus deleted successfully',
      });
    });

    it('should return 404 if bus not found', async () => {
      req.params.id = '999';
      mockBus.findByPk.mockResolvedValue(null);

      await deleteBus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bus not found' });
    });

    it('should handle errors during deletion', async () => {
      req.params.id = '1';
      const mockBusInstance = {
        destroy: jest.fn().mockRejectedValue(new Error('Delete failed')),
      };

      mockBus.findByPk.mockResolvedValue(mockBusInstance);

      await deleteBus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
