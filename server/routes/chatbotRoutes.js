import express from 'express';
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
  naturalLanguageSearch,
} from '../controllers/chatbotController.js';

const router = express.Router();

/**
 * @swagger
 * /api/chatbot/message:
 *   post:
 *     summary: Send message to AI chatbot
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: Tôi muốn đi từ Sài Gòn đến Đà Nẵng ngày mai
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chatbot response with suggestions
 */
router.post('/message', sendMessage);

/**
 * @swagger
 * /api/chatbot/history/{sessionId}:
 *   get:
 *     summary: Get chat history for a session
 *     tags: [Chatbot]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history
 */
router.get('/history/:sessionId', getChatHistory);

router.delete('/history/:sessionId', clearChatHistory);

/**
 * @swagger
 * /api/chatbot/search:
 *   post:
 *     summary: Natural language search for bus schedules
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 example: xe giường nằm đi Đà Lạt tuần sau
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/search', naturalLanguageSearch);

export default router;
