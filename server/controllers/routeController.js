import Route from '../models/Route.js';
import RouteStop from '../models/RouteStop.js';
import { Op } from 'sequelize';

export const createRoute = async (req, res) => {
  try {
    const { routeName, routeNo, origin, destination, distance, estimatedDuration, stops } =
      req.body;

    const route = await Route.create({
      routeName,
      routeNo,
      origin,
      destination,
      distance,
      estimatedDuration,
      status: 'active',
    });

    // Create route stops if provided
    if (stops && Array.isArray(stops)) {
      const routeStops = stops.map((stop) => ({
        routeId: route.id,
        stopOrder: stop.stopOrder,
        stopName: stop.stopName,
        stopType: stop.stopType || 'both',
        arrivalTime: stop.arrivalTime,
        departureTime: stop.departureTime,
      }));

      await RouteStop.bulkCreate(routeStops);
    }

    res.status(201).json({ message: 'Route created successfully', route });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllRoutes = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const routes = await Route.findAll({ where });
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Get route stops
    const stops = await RouteStop.findAll({
      where: { routeId: route.id },
      order: [['stopOrder', 'ASC']],
    });

    res.status(200).json({ ...route.toJSON(), stops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRoute = async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    const { routeName, routeNo, origin, destination, distance, estimatedDuration, status, stops } =
      req.body;

    await route.update({
      routeName,
      routeNo,
      origin,
      destination,
      distance,
      estimatedDuration,
      status,
    });

    // Update stops if provided
    if (stops && Array.isArray(stops)) {
      // Delete existing stops
      await RouteStop.destroy({ where: { routeId: route.id } });

      // Create new stops
      const routeStops = stops.map((stop) => ({
        routeId: route.id,
        stopOrder: stop.stopOrder,
        stopName: stop.stopName,
        stopType: stop.stopType || 'both',
        arrivalTime: stop.arrivalTime,
        departureTime: stop.departureTime,
      }));

      await RouteStop.bulkCreate(routeStops);
    }

    res.status(200).json({ message: 'Route updated successfully', route });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Delete route stops
    await RouteStop.destroy({ where: { routeId: route.id } });

    // Delete route
    await route.destroy();
    res.status(200).json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRouteStops = async (req, res) => {
  try {
    const stops = await RouteStop.findAll({
      where: { routeId: req.params.id },
      order: [['stopOrder', 'ASC']],
    });
    res.status(200).json(stops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle route status (activate/deactivate)
export const toggleRouteStatus = async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Toggle between active and inactive
    const newStatus = route.status === 'active' ? 'inactive' : 'active';
    await route.update({ status: newStatus });

    console.log(`✅ Route #${route.routeNo} status changed: ${route.status} → ${newStatus}`);
    res.status(200).json({
      message: `Route ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      route,
    });
  } catch (error) {
    console.error('Error toggling route status:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Search routes by route name only
 * Returns routes with their stops
 */
export const searchRoutes = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
      });
    }

    const searchTerm = q.trim();

    // Build search query - only search in routeName
    const where = {
      status: 'active', // Only search active routes
      routeName: { [Op.iLike]: `%${searchTerm}%` },
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Route.findAndCountAll({
      where,
      order: [['routeNo', 'ASC']],
      limit: limitNum,
      offset: offset,
    });

    // Get stops for each route
    const routesWithStops = await Promise.all(
      rows.map(async (route) => {
        const stops = await RouteStop.findAll({
          where: { routeId: route.id },
          order: [['stopOrder', 'ASC']],
        });

        return {
          ...route.toJSON(),
          stops: stops.map((s) => s.toJSON()),
        };
      })
    );

    res.status(200).json({
      searchQuery: searchTerm,
      routes: routesWithStops,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error('Route search error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get route name suggestions for autocomplete
 * Returns matching route names only
 */
export const getRouteNameSuggestions = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(200).json({ suggestions: [] });
    }

    const searchTerm = q.trim();

    const routes = await Route.findAll({
      where: {
        status: 'active',
        routeName: { [Op.iLike]: `%${searchTerm}%` },
      },
      attributes: ['routeName'], // Only get route names
      order: [['routeName', 'ASC']],
      limit: parseInt(limit),
    });

    // Extract unique route names
    const suggestions = [...new Set(routes.map((r) => r.routeName))];

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Route name suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
};
