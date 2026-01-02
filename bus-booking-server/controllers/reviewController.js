/**
 * Review Controller
 * Handles review creation, retrieval, voting, and management
 */
import { Op } from 'sequelize';
import Review from '../models/Review.js';
import ReviewVote from '../models/ReviewVote.js';
import BusBooking from '../models/busBooking.js';
import BusSchedule from '../models/busSchedule.js';
import Customer from '../models/Customer.js';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import sequelize from '../config/postgres.js';

/**
 * Create a new review
 * POST /api/reviews
 *
 * Business Rules:
 * 1. User must have a completed booking for this schedule
 * 2. User can only review once per booking
 * 3. Schedule must be marked as completed
 */
export const createReview = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const customerId = req.user.id;
    const {
      busScheduleId,
      bookingId,
      rating,
      title,
      comment,
      cleanlinessRating,
      comfortRating,
      punctualityRating,
      staffRating,
    } = req.body;

    // Validate required fields
    if (!busScheduleId || !bookingId || !rating || !comment) {
      await t.rollback();
      return res.status(400).json({
        message: 'Missing required fields: busScheduleId, bookingId, rating, comment',
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      await t.rollback();
      return res.status(400).json({
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if booking exists and belongs to user
    const booking = await BusBooking.findOne({
      where: {
        id: bookingId,
        customerId,
        busScheduleId,
      },
      include: [
        {
          model: BusSchedule,
          as: 'schedule',
          include: [
            { model: Bus, as: 'bus' },
            { model: Route, as: 'route' },
          ],
        },
      ],
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({
        message: 'Booking not found or does not belong to you',
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      await t.rollback();
      return res.status(403).json({
        message: 'You can only review completed trips',
      });
    }

    // Check if schedule is completed
    const schedule = booking.schedule;
    if (!schedule.isCompleted) {
      await t.rollback();
      return res.status(403).json({
        message: 'This trip has not been marked as completed yet',
      });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({
      where: { bookingId },
    });

    if (existingReview) {
      await t.rollback();
      return res.status(409).json({
        message: 'You have already reviewed this trip',
      });
    }

    // Create review
    const review = await Review.create(
      {
        customerId,
        busScheduleId,
        bookingId,
        rating,
        title: title || null,
        comment,
        cleanlinessRating: cleanlinessRating || null,
        comfortRating: comfortRating || null,
        punctualityRating: punctualityRating || null,
        staffRating: staffRating || null,
        journeyDate: booking.journeyDate,
        routeInfo: {
          departure: booking.departure,
          arrival: booking.arrival,
          routeNo: booking.routeNo || schedule.route?.routeNo,
          routeName: schedule.route?.routeName || booking.routeName,
          depotName: booking.depotName,
        },
        isVerified: true,
        isVisible: true,
      },
      { transaction: t }
    );

    await t.commit();

    // Fetch complete review with associations (after commit)
    try {
      const completeReview = await Review.findByPk(review.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'username', 'guestName', 'isGuest'],
          },
          {
            model: BusSchedule,
            as: 'busSchedule',
            include: [
              { model: Bus, as: 'bus' },
              { model: Route, as: 'route' },
            ],
          },
        ],
      });

      res.status(201).json({
        message: 'Review created successfully',
        review: completeReview,
      });
    } catch (fetchError) {
      // Transaction already committed, just return basic review
      console.error('Failed to fetch complete review:', fetchError);
      res.status(201).json({
        message: 'Review created successfully',
        review: review,
      });
    }
  } catch (error) {
    // Only rollback if transaction is still active
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Create review error:', error);
    res.status(500).json({
      message: 'Failed to create review',
      error: error.message,
    });
  }
};

/**
 * Get reviews for a specific bus schedule
 * GET /api/reviews/schedule/:scheduleId
 *
 * Public endpoint - anyone can view reviews for completed schedules
 */
export const getScheduleReviews = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;

    // Check if schedule exists and is completed
    const schedule = await BusSchedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        message: 'Schedule not found',
      });
    }

    if (!schedule.isCompleted) {
      return res.status(200).json({
        message: 'No reviews available for this schedule yet',
        reviews: [],
        stats: null,
      });
    }

    // Get reviews with pagination
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: {
        busScheduleId: scheduleId,
        isVisible: true,
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'username', 'guestName', 'isGuest'],
        },
      ],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Calculate rating statistics
    const stats = await Review.findOne({
      where: {
        busScheduleId: scheduleId,
        isVisible: true,
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
        [sequelize.fn('AVG', sequelize.col('cleanlinessRating')), 'avgCleanliness'],
        [sequelize.fn('AVG', sequelize.col('comfortRating')), 'avgComfort'],
        [sequelize.fn('AVG', sequelize.col('punctualityRating')), 'avgPunctuality'],
        [sequelize.fn('AVG', sequelize.col('staffRating')), 'avgStaff'],
      ],
      raw: true,
    });

    // Get rating distribution
    const ratingDistribution = await Review.findAll({
      where: {
        busScheduleId: scheduleId,
        isVisible: true,
      },
      attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['rating'],
      raw: true,
    });

    res.status(200).json({
      reviews,
      stats: {
        ...stats,
        averageRating: parseFloat(stats?.averageRating || 0).toFixed(1),
        totalReviews: parseInt(stats?.totalReviews || 0),
        avgCleanliness: parseFloat(stats?.avgCleanliness || 0).toFixed(1),
        avgComfort: parseFloat(stats?.avgComfort || 0).toFixed(1),
        avgPunctuality: parseFloat(stats?.avgPunctuality || 0).toFixed(1),
        avgStaff: parseFloat(stats?.avgStaff || 0).toFixed(1),
        ratingDistribution,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get schedule reviews error:', error);
    res.status(500).json({
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

/**
 * Get user's own reviews
 * GET /api/reviews/my-reviews
 */
export const getMyReviews = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { customerId },
      include: [
        {
          model: BusSchedule,
          as: 'busSchedule',
          include: [
            { model: Bus, as: 'bus' },
            { model: Route, as: 'route' },
          ],
        },
        {
          model: BusBooking,
          as: 'booking',
          attributes: ['id', 'bookingReference', 'journeyDate'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      message: 'Failed to fetch your reviews',
      error: error.message,
    });
  }
};

/**
 * Get reviewable bookings (completed bookings without reviews)
 * GET /api/reviews/reviewable-bookings
 */
export const getReviewableBookings = async (req, res) => {
  try {
    const customerId = req.user.id;

    // Find completed bookings without reviews
    const bookings = await BusBooking.findAll({
      where: {
        customerId,
        status: 'completed',
      },
      include: [
        {
          model: BusSchedule,
          as: 'schedule',
          where: {
            isCompleted: true,
          },
          include: [
            { model: Bus, as: 'bus' },
            { model: Route, as: 'route' },
          ],
        },
        {
          model: Review,
          as: 'review',
          required: false,
        },
      ],
      order: [['journeyDate', 'DESC']],
    });

    // Filter out bookings that already have reviews
    const reviewableBookings = bookings.filter((booking) => !booking.review);

    res.status(200).json({
      bookings: reviewableBookings,
      count: reviewableBookings.length,
    });
  } catch (error) {
    console.error('Get reviewable bookings error:', error);
    res.status(500).json({
      message: 'Failed to fetch reviewable bookings',
      error: error.message,
    });
  }
};

/**
 * Update a review
 * PUT /api/reviews/:id
 */
export const updateReview = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;
    const {
      rating,
      title,
      comment,
      cleanlinessRating,
      comfortRating,
      punctualityRating,
      staffRating,
    } = req.body;

    // Find review
    const review = await Review.findOne({
      where: {
        id,
        customerId,
      },
    });

    if (!review) {
      return res.status(404).json({
        message: 'Review not found or does not belong to you',
      });
    }

    // Update review
    await review.update({
      rating: rating || review.rating,
      title: title !== undefined ? title : review.title,
      comment: comment || review.comment,
      cleanlinessRating:
        cleanlinessRating !== undefined ? cleanlinessRating : review.cleanlinessRating,
      comfortRating: comfortRating !== undefined ? comfortRating : review.comfortRating,
      punctualityRating:
        punctualityRating !== undefined ? punctualityRating : review.punctualityRating,
      staffRating: staffRating !== undefined ? staffRating : review.staffRating,
    });

    // Fetch updated review
    const updatedReview = await Review.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'username', 'guestName', 'isGuest'],
        },
      ],
    });

    res.status(200).json({
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;

    const review = await Review.findOne({
      where: {
        id,
        customerId,
      },
    });

    if (!review) {
      return res.status(404).json({
        message: 'Review not found or does not belong to you',
      });
    }

    await review.destroy();

    res.status(200).json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

/**
 * Vote on a review (helpful/not helpful)
 * POST /api/reviews/:id/vote
 */
export const voteReview = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const customerId = req.user.id;
    const { id: reviewId } = req.params;
    const { voteType } = req.body; // 'helpful' or 'not_helpful'

    if (!['helpful', 'not_helpful'].includes(voteType)) {
      await t.rollback();
      return res.status(400).json({
        message: 'Invalid vote type. Must be "helpful" or "not_helpful"',
      });
    }

    // Check if review exists
    const review = await Review.findByPk(reviewId);
    if (!review) {
      await t.rollback();
      return res.status(404).json({
        message: 'Review not found',
      });
    }

    // Check if user already voted
    const existingVote = await ReviewVote.findOne({
      where: {
        reviewId,
        customerId,
      },
    });

    if (existingVote) {
      // Update vote if different
      if (existingVote.voteType !== voteType) {
        // Decrement old vote count
        if (existingVote.voteType === 'helpful') {
          review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
          review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
        }

        // Increment new vote count
        if (voteType === 'helpful') {
          review.helpfulCount += 1;
        } else {
          review.notHelpfulCount += 1;
        }

        existingVote.voteType = voteType;
        await existingVote.save({ transaction: t });
        await review.save({ transaction: t });

        await t.commit();
        return res.status(200).json({
          message: 'Vote updated successfully',
          review,
        });
      } else {
        await t.rollback();
        return res.status(200).json({
          message: 'Vote already recorded',
          review,
        });
      }
    }

    // Create new vote
    await ReviewVote.create(
      {
        reviewId,
        customerId,
        voteType,
      },
      { transaction: t }
    );

    // Update review vote counts
    if (voteType === 'helpful') {
      review.helpfulCount += 1;
    } else {
      review.notHelpfulCount += 1;
    }
    await review.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      message: 'Vote recorded successfully',
      review,
    });
  } catch (error) {
    // Only rollback if transaction is still active
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Vote review error:', error);
    res.status(500).json({
      message: 'Failed to record vote',
      error: error.message,
    });
  }
};

/**
 * Check if user can review a specific booking
 * GET /api/reviews/can-review/:bookingId
 */
export const canReviewBooking = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { bookingId } = req.params;

    const booking = await BusBooking.findOne({
      where: {
        id: bookingId,
        customerId,
      },
      include: [
        {
          model: BusSchedule,
          as: 'schedule',
        },
        {
          model: Review,
          as: 'review',
          required: false,
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        canReview: false,
        reason: 'Booking not found',
      });
    }

    if (booking.status !== 'completed') {
      return res.status(200).json({
        canReview: false,
        reason: 'Booking is not completed yet',
      });
    }

    if (!booking.schedule.isCompleted) {
      return res.status(200).json({
        canReview: false,
        reason: 'Trip has not been marked as completed',
      });
    }

    if (booking.review) {
      return res.status(200).json({
        canReview: false,
        reason: 'You have already reviewed this trip',
        existingReview: booking.review,
      });
    }

    res.status(200).json({
      canReview: true,
      booking,
    });
  } catch (error) {
    console.error('Can review booking error:', error);
    res.status(500).json({
      message: 'Failed to check review eligibility',
      error: error.message,
    });
  }
};

/**
 * Get reviews for a specific bus operator (depot)
 * GET /api/reviews/operator/:depotName
 *
 * Public endpoint - View all reviews for trips from a specific bus operator
 * Useful for customers to see operator's overall service quality
 */
export const getBusOperatorReviews = async (req, res) => {
  try {
    const { depotName } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
      minRating = 1,
      maxRating = 5,
    } = req.query;

    const offset = (page - 1) * limit;
    const decodedDepotName = decodeURIComponent(depotName);

    // Build where clause for reviews
    const whereClause = {
      isVisible: true,
      rating: {
        [Op.gte]: parseInt(minRating),
        [Op.lte]: parseInt(maxRating),
      },
    };

    // Get reviews for schedules from this depot
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'username', 'guestName', 'isGuest'],
        },
        {
          model: BusSchedule,
          as: 'busSchedule',
          where: {
            depotName: decodedDepotName,
          },
          required: true,
          include: [
            {
              model: Bus,
              as: 'bus',
              attributes: ['id', 'busNumber', 'busType', 'model'],
            },
            {
              model: Route,
              as: 'route',
              attributes: ['id', 'routeNo', 'routeName', 'origin', 'destination'],
            },
          ],
        },
      ],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      subQuery: false,
    });

    // Calculate rating statistics for this operator - use simpler approach
    const statsQuery = await Review.findAll({
      where: whereClause,
      include: [
        {
          model: BusSchedule,
          as: 'busSchedule',
          where: {
            depotName: decodedDepotName,
          },
          required: true,
          attributes: [],
        },
      ],
      attributes: [
        [sequelize.fn('AVG', sequelize.col('Review.rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('Review.id')), 'totalReviews'],
        [sequelize.fn('AVG', sequelize.col('Review.cleanlinessRating')), 'avgCleanliness'],
        [sequelize.fn('AVG', sequelize.col('Review.comfortRating')), 'avgComfort'],
        [sequelize.fn('AVG', sequelize.col('Review.punctualityRating')), 'avgPunctuality'],
        [sequelize.fn('AVG', sequelize.col('Review.staffRating')), 'avgStaff'],
      ],
      raw: true,
      group: [],
    });

    const stats = statsQuery && statsQuery.length > 0 ? statsQuery[0] : {};

    // Get rating distribution
    const ratingDistribution = await Review.findAll({
      where: whereClause,
      include: [
        {
          model: BusSchedule,
          as: 'busSchedule',
          where: {
            depotName: decodedDepotName,
          },
          required: true,
          attributes: [],
        },
      ],
      attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('Review.id')), 'count']],
      group: ['Review.rating'],
      raw: true,
    });

    // Format rating distribution
    const formattedDistribution = [1, 2, 3, 4, 5].map((rating) => {
      const found = ratingDistribution.find((r) => r.rating === rating);
      return {
        rating,
        count: found ? parseInt(found.count) : 0,
      };
    });

    res.status(200).json({
      depotName: decodedDepotName,
      reviews,
      stats: {
        averageRating: parseFloat(stats?.averageRating || 0).toFixed(1),
        totalReviews: parseInt(stats?.totalReviews || 0),
        avgCleanliness: parseFloat(stats?.avgCleanliness || 0).toFixed(1),
        avgComfort: parseFloat(stats?.avgComfort || 0).toFixed(1),
        avgPunctuality: parseFloat(stats?.avgPunctuality || 0).toFixed(1),
        avgStaff: parseFloat(stats?.avgStaff || 0).toFixed(1),
        ratingDistribution: formattedDistribution,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get bus operator reviews error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Failed to fetch operator reviews',
      error: error.message,
    });
  }
};

/**
 * Get all reviews with filters (for admin or public browsing)
 * GET /api/reviews
 *
 * Public endpoint - Browse all reviews across all operators with filtering
 */
export const getAllReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
      minRating,
      maxRating,
      depotName,
      routeId,
      verified,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = { isVisible: true };

    if (minRating || maxRating) {
      whereClause.rating = {};
      if (minRating) whereClause.rating[Op.gte] = parseInt(minRating);
      if (maxRating) whereClause.rating[Op.lte] = parseInt(maxRating);
    }

    if (verified !== undefined) {
      whereClause.isVerified = verified === 'true';
    }

    // Build include clause
    const includeClause = [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'username', 'guestName', 'isGuest'],
      },
      {
        model: BusSchedule,
        as: 'busSchedule',
        required: true,
        where: {},
        include: [
          { model: Bus, as: 'bus' },
          { model: Route, as: 'route' },
        ],
      },
    ];

    // Add filters to busSchedule
    if (depotName) {
      includeClause[1].where.depotName = { [Op.iLike]: `%${depotName}%` };
    }
    if (routeId) {
      includeClause[1].where.routeId = parseInt(routeId);
    }

    // Get reviews with pagination
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    // Get overall statistics
    const stats = await Review.findOne({
      where: whereClause,
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
      ],
      raw: true,
    });

    res.status(200).json({
      reviews,
      stats: {
        averageRating: parseFloat(stats?.averageRating || 0).toFixed(1),
        totalReviews: parseInt(stats?.totalReviews || 0),
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

export default {
  createReview,
  getScheduleReviews,
  getMyReviews,
  getReviewableBookings,
  updateReview,
  deleteReview,
  voteReview,
  canReviewBooking,
  getBusOperatorReviews,
  getAllReviews,
};
