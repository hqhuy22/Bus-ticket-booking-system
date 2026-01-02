/**
 * Unit Tests for Route Controller
 */

import { jest } from '@jest/globals';

// Mock models
const mockRoute = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const mockRouteStop = {
  bulkCreate: jest.fn(),
  findAll: jest.fn(),
  destroy: jest.fn(),
};

jest.unstable_mockModule('../../models/Route.js', () => ({
  default: mockRoute,
}));

jest.unstable_mockModule('../../models/RouteStop.js', () => ({
  default: mockRouteStop,
}));

// Import controller after mocking
const { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute } =
  await import('../../controllers/routeController.js');

describe('Route Controller', () => {
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

  describe('createRoute', () => {
    it('should create a route successfully', async () => {
      const routeData = {
        routeName: 'Hanoi - Ho Chi Minh',
        routeNo: 1,
        origin: 'Hanoi',
        destination: 'Ho Chi Minh',
        distance: 1700,
        estimatedDuration: '24h',
      };

      req.body = routeData;

      const mockCreatedRoute = { id: 1, ...routeData, status: 'active' };
      mockRoute.create.mockResolvedValue(mockCreatedRoute);

      await createRoute(req, res);

      expect(mockRoute.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Route created successfully',
        route: mockCreatedRoute,
      });
    });

    it('should create route with stops', async () => {
      req.body = {
        routeName: 'Hanoi - Ho Chi Minh',
        routeNo: 1,
        origin: 'Hanoi',
        destination: 'Ho Chi Minh',
        distance: 1700,
        estimatedDuration: '24h',
        stops: [
          {
            stopOrder: 1,
            stopName: 'Ninh Binh',
            stopType: 'both',
            arrivalTime: '10:00',
            departureTime: '10:15',
          },
          {
            stopOrder: 2,
            stopName: 'Vinh',
            stopType: 'both',
            arrivalTime: '14:00',
            departureTime: '14:15',
          },
        ],
      };

      const mockCreatedRoute = { id: 1, routeNo: 1, status: 'active' };
      mockRoute.create.mockResolvedValue(mockCreatedRoute);
      mockRouteStop.bulkCreate.mockResolvedValue([]);

      await createRoute(req, res);

      expect(mockRoute.create).toHaveBeenCalled();
      expect(mockRouteStop.bulkCreate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle errors during creation', async () => {
      req.body = { routeName: 'Test Route' };
      mockRoute.create.mockRejectedValue(new Error('Creation failed'));

      await createRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
  });

  describe('getAllRoutes', () => {
    it('should return all routes', async () => {
      const mockRoutes = [
        { id: 1, routeName: 'Route 1', status: 'active' },
        { id: 2, routeName: 'Route 2', status: 'active' },
      ];

      mockRoute.findAll.mockResolvedValue(mockRoutes);

      await getAllRoutes(req, res);

      expect(mockRoute.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRoutes);
    });

    it('should filter routes by status', async () => {
      req.query = { status: 'active' };
      mockRoute.findAll.mockResolvedValue([]);

      await getAllRoutes(req, res);

      expect(mockRoute.findAll).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });

    it('should handle errors', async () => {
      mockRoute.findAll.mockRejectedValue(new Error('Database error'));

      await getAllRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
  });

  describe('getRouteById', () => {
    it('should return a route with stops', async () => {
      const mockRouteData = {
        id: 1,
        routeName: 'Hanoi - Ho Chi Minh',
        toJSON: jest.fn().mockReturnValue({ id: 1, routeName: 'Hanoi - Ho Chi Minh' }),
      };

      const mockStops = [
        { id: 1, stopOrder: 1, stopName: 'Ninh Binh' },
        { id: 2, stopOrder: 2, stopName: 'Vinh' },
      ];

      req.params.id = '1';
      mockRoute.findByPk.mockResolvedValue(mockRouteData);
      mockRouteStop.findAll.mockResolvedValue(mockStops);

      await getRouteById(req, res);

      expect(mockRoute.findByPk).toHaveBeenCalledWith('1');
      expect(mockRouteStop.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        routeName: 'Hanoi - Ho Chi Minh',
        stops: mockStops,
      });
    });

    it('should return 404 if route not found', async () => {
      req.params.id = '999';
      mockRoute.findByPk.mockResolvedValue(null);

      await getRouteById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Route not found' });
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      mockRoute.findByPk.mockRejectedValue(new Error('Database error'));

      await getRouteById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateRoute', () => {
    it('should update a route successfully', async () => {
      req.params.id = '1';
      req.body = { routeName: 'Updated Route Name' };

      const mockRouteInstance = {
        id: 1,
        routeName: 'Old Route Name',
        update: jest.fn().mockResolvedValue({ id: 1, routeName: 'Updated Route Name' }),
      };

      mockRoute.findByPk.mockResolvedValue(mockRouteInstance);

      await updateRoute(req, res);

      expect(mockRouteInstance.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if route not found', async () => {
      req.params.id = '999';
      mockRoute.findByPk.mockResolvedValue(null);

      await updateRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Route not found' });
    });
  });

  describe('deleteRoute', () => {
    it('should delete a route successfully', async () => {
      req.params.id = '1';

      const mockRouteInstance = {
        id: 1,
        destroy: jest.fn(),
      };

      mockRoute.findByPk.mockResolvedValue(mockRouteInstance);

      await deleteRoute(req, res);

      expect(mockRouteInstance.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if route not found', async () => {
      req.params.id = '999';
      mockRoute.findByPk.mockResolvedValue(null);

      await deleteRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
