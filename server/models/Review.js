/**
 * Review Model
 * Stores user reviews and ratings for completed bus schedules
 */
import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

const Review = sequelize.define(
  'Review',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Foreign Keys
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
      comment: 'User who wrote the review',
    },

    busScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bus_schedules',
        key: 'id',
      },
      comment: 'Bus schedule being reviewed',
    },

    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bus_bookings',
        key: 'id',
      },
      comment: 'Booking that allows this review',
    },

    // Rating (1-5 stars)
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
      comment: 'Rating from 1 to 5 stars',
    },

    // Review content
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Review title/summary',
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Review content/feedback',
    },

    // Category ratings (optional detailed ratings)
    cleanlinessRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },

    comfortRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },

    punctualityRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },

    staffRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },

    // Helpfulness tracking
    helpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of helpful votes',
    },

    notHelpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of not helpful votes',
    },

    // Moderation
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Review from verified booking',
    },

    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether review is visible (admin can hide)',
    },

    // Response from company
    adminResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Response from admin/company',
    },

    adminResponseAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When admin responded',
    },

    // Journey details (denormalized for display)
    journeyDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Date of the journey reviewed',
    },

    routeInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Route details: departure, arrival, routeNo',
    },
  },
  {
    timestamps: true,
    tableName: 'reviews',
    indexes: [
      { fields: ['customerId'] },
      { fields: ['busScheduleId'] },
      { fields: ['bookingId'], unique: true }, // One review per booking
      { fields: ['rating'] },
      { fields: ['isVisible'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default Review;
