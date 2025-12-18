/**
 * ReviewVote Model
 * Tracks helpful/not helpful votes on reviews
 */
import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

const ReviewVote = sequelize.define(
  'ReviewVote',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'reviews',
        key: 'id',
      },
    },

    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },

    voteType: {
      type: DataTypes.ENUM('helpful', 'not_helpful'),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: 'review_votes',
    indexes: [
      { fields: ['reviewId'] },
      { fields: ['customerId'] },
      {
        fields: ['reviewId', 'customerId'],
        unique: true, // One vote per user per review
      },
    ],
  }
);

export default ReviewVote;
