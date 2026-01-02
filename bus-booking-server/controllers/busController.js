import Bus from '../models/Bus.js';
import BusSchedule from '../models/busSchedule.js';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Canonical list of allowed amenities. Keep in sync with frontend.
const ALLOWED_AMENITIES = ['WiFi', 'AC', 'Water', 'Toilet', 'Charging', 'Blanket'];

function normalizeAmenities(arr) {
  if (!Array.isArray(arr)) return [];
  return Array.from(
    new Set(
      arr.map((a) => String(a || '').trim()).filter((a) => a && ALLOWED_AMENITIES.includes(a))
    )
  );
}

export const createBus = async (req, res) => {
  try {
    const {
      busNumber,
      plateNumber,
      busType,
      model,
      totalSeats,
      seatMapConfig,
      amenities,
      depotName,
    } = req.body;
    const cleanAmenities = normalizeAmenities(amenities);
    const bus = await Bus.create({
      busNumber,
      plateNumber: plateNumber || null,
      busType,
      model,
      totalSeats,
      seatMapConfig: seatMapConfig || null,
      amenities: cleanAmenities,
      depotName,
      status: 'active',
    });

    res.status(201).json({ message: 'Bus created successfully', bus });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllBuses = async (req, res) => {
  try {
    const { status, busType } = req.query;
    const where = {};

    if (status) where.status = status;
    if (busType) where.busType = busType;

    const buses = await Bus.findAll({ where });
    res.status(200).json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    res.status(200).json(bus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    // If amenities provided, normalize; otherwise keep existing
    const updates = { ...req.body };
    if ('amenities' in req.body) updates.amenities = normalizeAmenities(req.body.amenities);

    await bus.update(updates);
    res.status(200).json({ message: 'Bus updated successfully', bus });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    await bus.destroy();
    res.status(200).json({ message: 'Bus deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if bus has scheduling conflicts
export const checkBusAvailability = async (req, res) => {
  try {
    const { busId, departureDate, departureTime, arrivalDate, arrivalTime } = req.query;

    if (!busId || !departureDate || !departureTime) {
      return res
        .status(400)
        .json({ error: 'busId, departureDate, and departureTime are required' });
    }

    // Check for overlapping schedules
    const conflicts = await BusSchedule.findAll({
      where: {
        busId: parseInt(busId),
        [Op.or]: [
          {
            // New trip starts during existing trip
            departure_date: departureDate,
            departure_time: { [Op.lte]: departureTime },
            arrival_date: arrivalDate || departureDate,
            arrival_time: { [Op.gte]: departureTime },
          },
          {
            // New trip ends during existing trip
            departure_date: { [Op.lte]: arrivalDate || departureDate },
            arrival_date: { [Op.gte]: departureDate },
          },
        ],
      },
    });

    res.status(200).json({
      available: conflicts.length === 0,
      conflicts: conflicts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get buses available (hide buses assigned to active schedules)
export const getAvailableBuses = async (req, res) => {
  try {
    const { excludeScheduleId } = req.query;

    console.log('🔍 getAvailableBuses called with:', { excludeScheduleId });

    // Get all active buses
    const allBuses = await Bus.findAll({
      where: { status: 'active' },
      order: [['busNumber', 'ASC']],
    });

    console.log(`📊 Total active buses: ${allBuses.length}`);

    // Build where clause for active schedules
    const whereClause = {
      busId: { [Op.ne]: null }, // Has a bus assigned
      isCompleted: false, // Only check active (not completed) schedules
    };

    // Exclude current schedule when editing (so we can keep the same bus)
    if (excludeScheduleId) {
      whereClause.id = { [Op.ne]: parseInt(excludeScheduleId) };
      console.log(`📝 Excluding schedule ID ${excludeScheduleId} from busy check`);
    }

    // Find all active (not completed) schedules
    const activeSchedules = await BusSchedule.findAll({
      where: whereClause,
      attributes: ['id', 'busId'],
    });

    console.log(`📅 Active schedules found: ${activeSchedules.length}`);

    // Get set of bus IDs that are currently assigned to active schedules
    const busyBusIds = new Set(activeSchedules.map((schedule) => schedule.busId));
    const busyBusIdsArray = Array.from(busyBusIds);

    console.log(`🚫 Busy bus IDs: [${busyBusIdsArray.join(', ')}]`);

    // Filter out busy buses
    const availableBuses = allBuses.filter((bus) => !busyBusIds.has(bus.id));

    console.log(`✅ Available buses: ${availableBuses.length}/${allBuses.length}`);

    res.status(200).json({
      buses: availableBuses,
      total: availableBuses.length,
      busyBusIds: busyBusIdsArray,
      allBusesCount: allBuses.length,
    });
  } catch (error) {
    console.error('❌ Error getting available buses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Multer configuration for bus photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/buses/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'bus-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
  },
});

// Upload bus photos
export const uploadBusPhotos = [
  upload.array('photos', 5), // Max 5 images at once
  async (req, res) => {
    try {
      const bus = await Bus.findByPk(req.params.id);
      if (!bus) {
        // Delete uploaded files if bus not found
        if (req.files) {
          req.files.forEach((file) => {
            fs.unlinkSync(file.path);
          });
        }
        return res.status(404).json({ error: 'Bus not found' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No photos uploaded' });
      }

      const uploadedUrls = req.files.map((file) => `/uploads/buses/${file.filename}`);
      const currentPhotos = bus.photos || [];
      const updatedPhotos = [...currentPhotos, ...uploadedUrls];

      await bus.update({ photos: updatedPhotos });

      res.status(200).json({
        message: 'Photos uploaded successfully',
        photos: updatedPhotos,
        uploaded: uploadedUrls,
      });
    } catch (error) {
      console.error('Error uploading bus photos:', error);
      // Delete uploaded files on error
      if (req.files) {
        req.files.forEach((file) => {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        });
      }
      res.status(500).json({ error: error.message });
    }
  },
];

// Delete a bus photo
export const deleteBusPhoto = async (req, res) => {
  try {
    const { id, photoIndex } = req.params;
    const bus = await Bus.findByPk(id);

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    const currentPhotos = bus.photos || [];
    const index = parseInt(photoIndex);

    if (index < 0 || index >= currentPhotos.length) {
      return res.status(400).json({ error: 'Invalid photo index' });
    }

    const photoUrl = currentPhotos[index];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== index);

    await bus.update({ photos: updatedPhotos });

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), photoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting file from filesystem:', err);
      // Continue even if file deletion fails
    }

    res.status(200).json({
      message: 'Photo deleted successfully',
      photos: updatedPhotos,
    });
  } catch (error) {
    console.error('Error deleting bus photo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle bus status (activate/deactivate)
export const toggleBusStatus = async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id);
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    // Toggle between active and inactive
    const newStatus = bus.status === 'active' ? 'inactive' : 'active';
    await bus.update({ status: newStatus });

    console.log(`✅ Bus #${bus.busNumber} status changed: ${bus.status} → ${newStatus}`);
    res.status(200).json({
      message: `Bus ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      bus,
    });
  } catch (error) {
    console.error('Error toggling bus status:', error);
    res.status(500).json({ error: error.message });
  }
};
