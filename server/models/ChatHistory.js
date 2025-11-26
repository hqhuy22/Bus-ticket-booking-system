import { DataTypes } from 'sequelize';
import sequelize from '../config/postgres.js';

const ChatHistory = sequelize.define(
  'ChatHistory',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      index: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow guest users
      // Foreign key will be added through associations, not here
      // This prevents sync order issues
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant', 'system'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    intent: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Additional data like search params, booking context, etc.',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'chat_histories',
    timestamps: false,
    indexes: [
      {
        fields: ['sessionId', 'createdAt'],
      },
      {
        fields: ['userId'],
      },
    ],
  }
);

export default ChatHistory;
