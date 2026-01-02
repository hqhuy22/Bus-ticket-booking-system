import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini 2.0 Flash - Free tier with excellent performance
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

// Get model instance
const getGeminiModel = () => {
  try {
    return genAI.getGenerativeModel({ model: MODEL });
  } catch (error) {
    console.warn('⚠️ Gemini API not configured, using fallback mode');
    return null;
  }
};

// System prompts for different use cases
const SYSTEM_PROMPTS = {
  general: `You are a helpful bus ticket booking assistant. You help users:
- Search for bus trips
- Book tickets
- Answer questions about routes, schedules, and policies
- Provide information about the booking process

Be friendly, concise, and helpful. If you're not sure about something, ask clarifying questions.
Always format dates clearly and confirm important booking details.`,

  tripSearch: `You are a trip search assistant. Extract the following information from user queries:
- Origin city/location
- Destination city/location  
- Travel date (convert relative dates like "tomorrow", "next Monday" to actual dates)
- Number of passengers (default to 1 if not specified)
- Preferences (morning/evening, direct routes, etc.)

Current date: ${new Date().toISOString().split('T')[0]}

Return ONLY a JSON object with this structure:
{
  "origin": "city name or null",
  "destination": "city name or null", 
  "date": "YYYY-MM-DD or null",
  "passengers": number,
  "preferences": "any special preferences or null",
  "needsMore": boolean (true if critical info is missing)
}`,

  faq: `You are a bus booking FAQ assistant. Answer questions about:

**Booking Policies:**
- Tickets can be booked up to 90 days in advance
- Cancellations allowed up to 2 hours before departure
- 10% cancellation fee applies
- Full refund for cancellations 24+ hours before departure

**Payment:**
- Accepted: Credit cards, debit cards, digital wallets
- Secure payment processing
- Instant confirmation upon payment

**Routes & Schedules:**
- Multiple daily departures on popular routes
- Schedule varies by route and day
- Peak hours: 6-9 AM, 5-8 PM

**Seat Selection:**
- Free seat selection during booking
- Window, aisle, and middle seats available
- Seats locked for 10 minutes during selection

**Amenities:**
- Air-conditioned buses
- Reclining seats
- USB charging ports
- Luggage storage

**Safety:**
- Professional, licensed drivers
- Regular vehicle maintenance
- GPS tracking
- 24/7 customer support

Be concise and helpful. If asked about specific routes or prices, suggest using the search feature.`,
};

/**
 * Generate a chat response using Google Gemini AI
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} systemPrompt - System prompt type or custom prompt
 * @returns {Promise<string>} - AI response
 */
export const generateChatResponse = async (messages, systemPrompt = 'general') => {
  try {
    const model = getGeminiModel();

    // If no API key, use fallback immediately
    if (!model || !process.env.GEMINI_API_KEY) {
      console.warn('⚠️ Gemini API key not configured - using fallback response');
      return getFallbackResponse(messages, systemPrompt);
    }

    const system = SYSTEM_PROMPTS[systemPrompt] || systemPrompt;

    // Convert messages to Gemini format
    const chatHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    // Combine system prompt with user message
    const lastMessage = messages[messages.length - 1]?.content || '';
    const prompt = chatHistory.length === 0 ? `${system}\n\nUser: ${lastMessage}` : lastMessage;

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error.message);

    // Fallback response when quota exceeded or API error
    if (
      error.message.includes('quota') ||
      error.message.includes('429') ||
      error.message.includes('API key')
    ) {
      console.warn('⚠️ Gemini API issue - using fallback response');
      return getFallbackResponse(messages, systemPrompt);
    }

    throw new Error('Failed to generate AI response');
  }
};

/**
 * Fallback response when OpenAI API is unavailable
 * Used during development or when quota is exceeded
 */
const getFallbackResponse = (messages, systemPrompt) => {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

  // Simple rule-based responses for common queries
  if (systemPrompt === 'faq') {
    if (lastMessage.includes('cancel')) {
      return 'Our cancellation policy allows you to cancel up to 2 hours before departure with a 10% fee. Cancellations made 24+ hours before departure receive a full refund.';
    }
    if (lastMessage.includes('payment') || lastMessage.includes('pay')) {
      return 'We accept credit cards, debit cards, and digital wallets. All payments are processed securely through our encrypted payment system.';
    }
    if (lastMessage.includes('amenities') || lastMessage.includes('facilities')) {
      return 'Our buses feature air conditioning, reclining seats, USB charging ports, and luggage storage. Some routes also offer WiFi connectivity.';
    }
    if (lastMessage.includes('book') || lastMessage.includes('ticket')) {
      return "To book a ticket: 1) Search for your trip, 2) Select your preferred schedule, 3) Choose your seats, 4) Enter passenger details, 5) Complete payment. It's that simple!";
    }
    return "I'm currently running in limited mode. For detailed information, please contact our support team or try again later. Common topics I can help with: cancellation policy, payment methods, amenities, and booking process.";
  }

  if (systemPrompt === 'tripSearch') {
    return JSON.stringify({
      origin: null,
      destination: null,
      date: null,
      passengers: 1,
      preferences: null,
      needsMore: true,
    });
  }

  // General responses
  if (lastMessage.includes('hello') || lastMessage.includes('hi') || lastMessage.includes('hey')) {
    return "Hello! 👋 I'm your bus booking assistant. I'm currently running in limited mode, but I can still help you search for trips and answer basic questions. How can I assist you today?";
  }

  if (
    lastMessage.includes('search') ||
    lastMessage.includes('find') ||
    lastMessage.includes('bus')
  ) {
    return "I can help you search for bus trips! Please tell me:\n- Where are you traveling from?\n- Where do you want to go?\n- What date would you like to travel?\n\nFor example: 'Find buses from New York to Boston tomorrow'";
  }

  if (lastMessage.includes('thank')) {
    return "You're welcome! Feel free to ask if you need anything else. 😊";
  }

  return "I'm here to help! I'm currently running in limited mode due to API quota. I can assist with:\n- Searching for bus trips\n- Answering questions about policies\n- Booking assistance\n\nWhat would you like to know?";
};

/**
 * Extract trip search parameters from natural language query
 * @param {string} query - User's natural language query
 * @returns {Promise<Object>} - Extracted search parameters
 */
export const extractTripSearchParams = async (query) => {
  try {
    const messages = [{ role: 'user', content: query }];

    const response = await generateChatResponse(messages, 'tripSearch');

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const params = JSON.parse(jsonMatch[0]);
    return params;
  } catch (error) {
    console.error('Trip search extraction error:', error.message);

    // Fallback: Simple regex-based extraction
    if (error.message.includes('quota') || error.message.includes('429')) {
      console.warn('⚠️ Using fallback trip search extraction');
      return extractTripSearchParamsFallback(query);
    }

    return {
      origin: null,
      destination: null,
      date: null,
      passengers: 1,
      preferences: null,
      needsMore: true,
      error: 'Could not understand the query. Please try again.',
    };
  }
};

/**
 * Fallback trip search parameter extraction using regex
 */
const extractTripSearchParamsFallback = (query) => {
  const lowerQuery = query.toLowerCase();
  console.log('🔍 Fallback extraction for query:', query);

  // Extract origin and destination
  // Support both English and Vietnamese patterns
  let fromToMatch = lowerQuery.match(
    /\bfrom\s+([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s|$|tomorrow|today|on|next)/i
  );

  // Vietnamese patterns: "từ X đến Y", "từ X tới Y", "đi từ X đến Y"
  if (!fromToMatch) {
    fromToMatch = lowerQuery.match(
      /(?:đi\s+)?từ\s+([^\s]+(?:\s+[^\s]+)*?)\s+(?:đến|tới)\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+(?:ngày|vào|lúc)|$)/i
    );
  }

  // Pattern: "tìm xe X đến Y", "tìm chuyến X đi Y"
  if (!fromToMatch) {
    fromToMatch = lowerQuery.match(
      /tìm\s+(?:xe|chuyến)?\s*([^\s]+(?:\s+[^\s]+)*?)\s+(?:đến|đi|tới)\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+(?:ngày|vào|lúc)|$)/i
    );
  }

  let origin = null;
  let destination = null;

  if (fromToMatch) {
    origin = capitalizeWords(fromToMatch[1].trim());
    destination = capitalizeWords(fromToMatch[2].trim());
    console.log('✅ Extracted locations:', { origin, destination });
  } else {
    console.log('❌ Could not extract locations from:', query);
  }

  // Extract date
  let date = null;
  const today = new Date();

  // Vietnamese date patterns
  const vnDateMatch = lowerQuery.match(/(?:ngày|vào)\s*(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (vnDateMatch) {
    const [, day, month, year] = vnDateMatch;
    date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log('✅ Extracted date (DD/MM/YYYY):', date);
  } else if (lowerQuery.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)) {
    const isoMatch = lowerQuery.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    date = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    console.log('✅ Extracted date (YYYY-MM-DD):', date);
  } else if (lowerQuery.includes('tomorrow') || lowerQuery.includes('ngày mai')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    date = tomorrow.toISOString().split('T')[0];
    console.log('✅ Date: tomorrow ->', date);
  } else if (lowerQuery.includes('today') || lowerQuery.includes('hôm nay')) {
    date = today.toISOString().split('T')[0];
    console.log('✅ Date: today ->', date);
  } else if (
    lowerQuery.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)
  ) {
    const dayMatch = lowerQuery.match(
      /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/
    );
    date = getNextDayOfWeek(dayMatch[1]);
    console.log('✅ Date: next', dayMatch[1], '->', date);
  }

  // Extract passengers
  const passengerMatch = lowerQuery.match(/(\d+)\s+(seat|ticket|passenger|ghế|vé|người)/);
  const passengers = passengerMatch ? parseInt(passengerMatch[1]) : 1;

  const needsMore = !origin || !destination;

  const result = {
    origin,
    destination,
    date,
    passengers,
    preferences: null,
    needsMore,
  };

  console.log('📋 Fallback extraction result:', JSON.stringify(result, null, 2));

  return result;
};

/**
 * Helper: Capitalize first letter of each word
 */
const capitalizeWords = (str) => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Helper: Get next occurrence of a day of week
 */
const getNextDayOfWeek = (dayName) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  const today = new Date();
  const currentDay = today.getDay();

  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);
  return targetDate.toISOString().split('T')[0];
};

/**
 * Generate FAQ response
 * @param {string} question - User's question
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - FAQ answer
 */
export const generateFaqResponse = async (question, conversationHistory = []) => {
  try {
    const messages = [...conversationHistory, { role: 'user', content: question }];

    return await generateChatResponse(messages, 'faq');
  } catch (error) {
    console.error('FAQ generation error:', error.message);
    return "I'm having trouble answering that right now. Please contact our support team for assistance.";
  }
};

/**
 * Generate booking assistance response
 * @param {string} userMessage - User's message
 * @param {Object} bookingContext - Current booking context
 * @param {Array} conversationHistory - Previous messages
 * @returns {Promise<Object>} - Response with message and suggestions
 */
export const generateBookingAssistance = async (
  userMessage,
  bookingContext,
  conversationHistory = []
) => {
  try {
    const contextPrompt = `You are helping a user book a bus ticket. Current booking context:
${JSON.stringify(bookingContext, null, 2)}

Guide them through the next step. If all information is collected, confirm and proceed to payment.
Be conversational and friendly. Ask one question at a time.`;

    const messages = [...conversationHistory, { role: 'user', content: userMessage }];

    const response = await generateChatResponse(messages, contextPrompt);

    // Generate suggestions based on context
    const suggestions = generateSuggestions(bookingContext);

    return {
      message: response,
      suggestions,
      isComplete: isBookingComplete(bookingContext),
    };
  } catch (error) {
    console.error('Booking assistance error:', error.message);
    return {
      message: "I'm having trouble processing your request. Please try again.",
      suggestions: [],
      isComplete: false,
    };
  }
};

/**
 * Generate contextual suggestions
 * @param {Object} bookingContext - Current booking state
 * @returns {Array<string>} - Suggested actions/responses
 */
const generateSuggestions = (bookingContext) => {
  const suggestions = [];

  if (!bookingContext.origin) {
    suggestions.push('Search from New York', 'Search from Boston', 'Search from Philadelphia');
  } else if (!bookingContext.destination) {
    suggestions.push('To Washington DC', 'To Miami', 'To Chicago');
  } else if (!bookingContext.date) {
    suggestions.push('Tomorrow', 'This weekend', 'Next Monday');
  } else if (!bookingContext.seatsSelected) {
    suggestions.push('Select 1 seat', 'Select 2 seats', 'Show available seats');
  } else {
    suggestions.push('Confirm booking', 'Change selection', 'Cancel');
  }

  return suggestions.slice(0, 3);
};

/**
 * Check if booking has all required information
 * @param {Object} bookingContext - Booking context
 * @returns {boolean} - True if ready to book
 */
const isBookingComplete = (bookingContext) => {
  return !!(
    bookingContext.scheduleId &&
    bookingContext.seatsSelected &&
    bookingContext.passengerDetails
  );
};

/**
 * Generate conversational trip summary
 * @param {Object} tripDetails - Trip information
 * @returns {Promise<string>} - Formatted trip summary
 */
export const generateTripSummary = async (tripDetails) => {
  const prompt = `Create a friendly, conversational summary of this bus trip:
${JSON.stringify(tripDetails, null, 2)}

Keep it brief (2-3 sentences) and highlight key details like departure time, duration, and price.`;

  try {
    const messages = [{ role: 'user', content: prompt }];
    return await generateChatResponse(messages, 'general');
  } catch (error) {
    console.error('Trip summary error:', error.message);
    return `Trip from ${tripDetails.origin} to ${tripDetails.destination} on ${tripDetails.date}`;
  }
};

/**
 * Detect user intent from message
 * @param {string} message - User message
 * @returns {Promise<string>} - Intent (search, book, faq, general)
 */
export const detectIntent = async (message) => {
  const intentPrompt = `Classify this user message into ONE of these intents:
- "search": User wants to search for trips
- "book": User wants to book or continue booking
- "faq": User is asking a question about policies, routes, etc.
- "general": General conversation or greeting

Message: "${message}"

Return ONLY the intent keyword (search, book, faq, or general).`;

  try {
    const messages = [{ role: 'user', content: intentPrompt }];
    const response = await generateChatResponse(messages, intentPrompt);
    const intent = response.toLowerCase().trim();

    if (['search', 'book', 'faq', 'general'].includes(intent)) {
      return intent;
    }
    return 'general';
  } catch (error) {
    console.error('Intent detection error:', error.message);
    // Fallback: Simple rule-based intent detection
    return detectIntentFallback(message);
  }
};

/**
 * Fallback intent detection using simple rules
 */
const detectIntentFallback = (message) => {
  const lowerMsg = message.toLowerCase();

  console.log('🎯 Detecting intent for:', message);

  // Search intent keywords (English + Vietnamese)
  if (
    // English patterns
    lowerMsg.match(/\b(find|search|looking|show|need|want)\b.*\b(bus|trip|route|schedule)\b/) ||
    lowerMsg.match(/\bfrom\b.*\bto\b/) ||
    lowerMsg.match(
      /\b(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
    ) ||
    // Vietnamese patterns
    lowerMsg.match(/\b(tìm|tìm kiếm|xem|cần|muốn)\b.*\b(xe|chuyến|tuyến|lịch)\b/) ||
    lowerMsg.match(/\btừ\b.*\b(đến|tới)\b/) ||
    lowerMsg.includes('tìm chuyến') ||
    lowerMsg.includes('tìm xe') ||
    lowerMsg.includes('đi từ') ||
    lowerMsg.match(/\b(ngày mai|hôm nay|thứ hai|thứ ba|thứ tư|thứ năm|thứ sáu|thứ bảy|chủ nhật)\b/)
  ) {
    console.log('✅ Intent: search');
    return 'search';
  }

  // FAQ intent keywords (English + Vietnamese)
  if (
    // English patterns
    lowerMsg.match(/\b(what|how|when|where|why|can|do|is|are)\b/) ||
    lowerMsg.includes('policy') ||
    lowerMsg.includes('cancel') ||
    lowerMsg.includes('payment') ||
    lowerMsg.includes('refund') ||
    lowerMsg.includes('amenities') ||
    lowerMsg.includes('facilities') ||
    // Vietnamese patterns
    lowerMsg.match(/\b(gì|như thế nào|khi nào|ở đâu|tại sao|có thể|được không|là)\b/) ||
    lowerMsg.includes('chính sách') ||
    lowerMsg.includes('hủy') ||
    lowerMsg.includes('thanh toán') ||
    lowerMsg.includes('hoàn tiền') ||
    lowerMsg.includes('tiện ích') ||
    lowerMsg.includes('dịch vụ')
  ) {
    console.log('✅ Intent: faq');
    return 'faq';
  }

  // Book intent keywords (English + Vietnamese)
  if (
    // English patterns
    lowerMsg.includes('book') ||
    lowerMsg.includes('reserve') ||
    lowerMsg.includes('ticket') ||
    lowerMsg.includes('seat') ||
    // Vietnamese patterns
    lowerMsg.includes('đặt') ||
    lowerMsg.includes('đặt vé') ||
    lowerMsg.includes('vé') ||
    lowerMsg.includes('ghế') ||
    lowerMsg.includes('mua vé')
  ) {
    console.log('✅ Intent: book');
    return 'book';
  }

  // Default to general
  console.log('✅ Intent: general (default)');
  return 'general';
};

export default {
  generateChatResponse,
  extractTripSearchParams,
  generateFaqResponse,
  generateBookingAssistance,
  generateTripSummary,
  detectIntent,
};
