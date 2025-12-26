import ChatHistory from '../models/ChatHistory.js';
import BusSchedule from '../models/busSchedule.js';
import Route from '../models/Route.js';
import Bus from '../models/Bus.js';
import {
  generateChatResponse,
  extractTripSearchParams,
  generateFaqResponse,
  generateBookingAssistance,
  generateTripSummary,
  detectIntent,
} from '../utils/openAiService.js';
import { findMatchingFAQ } from '../utils/faqKnowledge.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

// Maximum messages to keep in context
const MAX_HISTORY = parseInt(process.env.CHATBOT_MAX_HISTORY) || 20;

/**
 * Send a message to the chatbot
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;

    console.log('\n==========================================');
    console.log('💬 NEW CHATBOT MESSAGE RECEIVED');
    console.log('==========================================');
    console.log('Message:', message);
    console.log('SessionId:', sessionId);
    console.log('UserId:', userId);
    console.log('Timestamp:', new Date().toISOString());
    console.log('==========================================\n');

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate or use existing session ID
    const currentSessionId = sessionId || uuidv4();

    // Detect user intent
    const intent = await detectIntent(message);
    console.log('🎯 Detected intent:', intent);

    // Save user message to history
    await ChatHistory.create({
      sessionId: currentSessionId,
      userId: userId || null,
      role: 'user',
      content: message.trim(),
      intent,
    });

    // Get conversation history
    const history = await getConversationHistory(currentSessionId);

    // Generate response based on intent
    let response;
    let suggestions = [];
    let searchResults = null;

    switch (intent) {
      case 'search': {
        const searchResponse = await handleSearchIntent(message, currentSessionId, userId);
        response = searchResponse.message;
        suggestions = searchResponse.suggestions;
        searchResults = searchResponse.results;
        break;
      }

      case 'faq': {
        const faqMatch = findMatchingFAQ(message);
        if (faqMatch) {
          response = faqMatch.answer;
          suggestions = faqMatch.suggestions;
          console.log('✅ FAQ matched:', faqMatch.question);
        } else {
          // Fallback to AI if no direct match
          response = await generateFaqResponse(message, history);
          suggestions = [
            'How do I book a ticket?',
            'What is your cancellation policy?',
            'What payment methods do you accept?',
          ];
        }
        break;
      }

      case 'book': {
        const bookingResponse = await handleBookingIntent(
          message,
          currentSessionId,
          userId,
          history
        );
        response = bookingResponse.message;
        suggestions = bookingResponse.suggestions;
        break;
      }

      default:
        response = await generateChatResponse([...history, { role: 'user', content: message }]);
        suggestions = ['Search for trips', 'Ask a question', 'Help me book'];
    }

    // Save assistant response
    await ChatHistory.create({
      sessionId: currentSessionId,
      userId: userId || null,
      role: 'assistant',
      content: response,
      intent,
      metadata: searchResults ? { searchResults } : {},
    });

    res.json({
      reply: response,
      sessionId: currentSessionId,
      suggestions,
      intent,
      searchResults,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
};

/**
 * Handle search intent
 */
const handleSearchIntent = async (message, sessionId, userId) => {
  try {
    console.log('🔍 handleSearchIntent called with message:', message);

    // Extract search parameters
    const params = await extractTripSearchParams(message);
    console.log('📋 Extracted params:', JSON.stringify(params, null, 2));

    if (params.needsMore) {
      return {
        message:
          params.error ||
          "I'd be happy to help you search for a trip! Could you tell me where you'd like to travel from and to?",
        suggestions: ['Hanoi to Haiphong', 'HCMC to Vung Tau', 'What routes do you operate?'],
        results: null,
      };
    }

    // Search for schedules
    const schedules = await searchSchedules(params);
    console.log('📊 Search results count:', schedules?.length || 0);

    if (!schedules || schedules.length === 0) {
      return {
        message: `I couldn't find any trips from ${params.origin} to ${params.destination}${params.date ? ' on ' + params.date : ''}. Would you like to try a different date or route?`,
        suggestions: ['Try another date', 'Show popular routes', 'What routes do you operate?'],
        results: [],
      };
    }

    // Generate friendly summary
    const summary = `Great! I found ${schedules.length} trip${schedules.length > 1 ? 's' : ''} from ${params.origin} to ${params.destination}${params.date ? ' on ' + params.date : ''}. Here are your options:`;

    return {
      message: summary,
      suggestions: [
        'Search another route',
        'What amenities are available?',
        'What is your cancellation policy?',
      ],
      results: schedules.slice(0, 5), // Return top 5 results
    };
  } catch (error) {
    console.error('Search intent error:', error);
    return {
      message: "I'm having trouble searching right now. Please try again or use the search page.",
      suggestions: ['Try again', 'Go to search page'],
      results: null,
    };
  }
};

/**
 * Handle booking intent
 */
const handleBookingIntent = async (message, sessionId, _userId, history) => {
  try {
    // Get booking context from session
    const bookingContext = await getBookingContext(sessionId);

    // Generate booking assistance
    const response = await generateBookingAssistance(message, bookingContext, history);

    return response;
  } catch (error) {
    console.error('Booking intent error:', error);
    return {
      message: "I'm having trouble with the booking. Please try the regular booking flow.",
      suggestions: ['Go to booking page', 'Search for trips'],
    };
  }
};

/**
 * Search for bus schedules based on parameters
 */
const searchSchedules = async (params) => {
  try {
    console.log('🔍 Search params received:', JSON.stringify(params, null, 2));

    const whereClause = {
      isCompleted: false, // ✅ Only search active schedules
    };

    // ✅ FIX: Search in BusSchedule columns, not Route
    if (params.origin) {
      whereClause.departure_city = { [Op.iLike]: `%${params.origin}%` };
    }

    if (params.destination) {
      whereClause.arrival_city = { [Op.iLike]: `%${params.destination}%` };
    }

    // ✅ FIX: Use departure_date field, not departure_time
    if (params.date) {
      whereClause.departure_date = params.date;
      console.log('📅 Date filter:', params.date);
    }

    console.log('🔎 Query whereClause:', JSON.stringify(whereClause, null, 2));

    const schedules = await BusSchedule.findAll({
      where: whereClause,
      include: [
        {
          model: Route,
          as: 'route',
          attributes: [
            'id',
            'routeNo',
            'routeName',
            'origin',
            'destination',
            'distance',
            'estimatedDuration',
          ],
        },
        {
          model: Bus,
          as: 'bus',
          attributes: [
            'id',
            'busNumber',
            'busType',
            'model',
            'totalSeats',
            'amenities',
            'depotName',
          ],
        },
      ],
      order: [['departure_time', 'ASC']],
      limit: 10,
    });

    console.log('✅ Found schedules:', schedules.length);
    if (schedules.length > 0) {
      console.log('First result:', {
        id: schedules[0].id,
        route: schedules[0].route?.origin + ' → ' + schedules[0].route?.destination,
        departure: schedules[0].departure_time,
      });
    }

    return schedules;
  } catch (error) {
    console.error('Schedule search error:', error);
    return [];
  }
};

/**
 * Get conversation history for a session
 */
const getConversationHistory = async (sessionId) => {
  try {
    const messages = await ChatHistory.findAll({
      where: { sessionId },
      order: [['createdAt', 'DESC']],
      limit: MAX_HISTORY,
      attributes: ['role', 'content'],
    });

    return messages.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  } catch (error) {
    console.error('Get history error:', error);
    return [];
  }
};

/**
 * Get booking context from session
 */
const getBookingContext = async (sessionId) => {
  try {
    const recentMessages = await ChatHistory.findAll({
      where: { sessionId },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Extract booking-related metadata
    const context = {
      scheduleId: null,
      seatsSelected: null,
      passengerDetails: null,
      origin: null,
      destination: null,
      date: null,
    };

    for (const msg of recentMessages) {
      if (msg.metadata && msg.metadata.searchResults) {
        const result = msg.metadata.searchResults[0];
        if (result) {
          context.scheduleId = result.schedule_id;
          context.origin = result.route?.origin;
          context.destination = result.route?.destination;
        }
      }
    }

    return context;
  } catch (error) {
    console.error('Get booking context error:', error);
    return {};
  }
};

/**
 * Get chat history for a session
 */
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const messages = await ChatHistory.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'role', 'content', 'intent', 'metadata', 'createdAt'],
    });

    res.json({ messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
};

/**
 * Clear chat history for a session
 */
export const clearChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    await ChatHistory.destroy({
      where: { sessionId },
    });

    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
};

/**
 * Natural language trip search endpoint
 */
export const naturalLanguageSearch = async (req, res) => {
  try {
    const { query, sessionId } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Extract search parameters
    const params = await extractTripSearchParams(query);

    if (params.needsMore) {
      return res.json({
        searchParams: params,
        schedules: [],
        message: params.error || 'Please provide more details about your trip.',
        needsMore: true,
      });
    }

    // Search for schedules
    const schedules = await searchSchedules(params);

    // Generate summary
    const message =
      schedules.length > 0
        ? `Found ${schedules.length} trip${schedules.length > 1 ? 's' : ''} matching your search.`
        : 'No trips found matching your criteria. Try adjusting your search.';

    res.json({
      searchParams: params,
      schedules,
      message,
      needsMore: false,
    });
  } catch (error) {
    console.error('Natural language search error:', error);
    res.status(500).json({ error: 'Failed to process search query' });
  }
};

export default {
  sendMessage,
  getChatHistory,
  clearChatHistory,
  naturalLanguageSearch,
};
