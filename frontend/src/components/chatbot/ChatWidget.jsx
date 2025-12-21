import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, Minimize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import TripDetailsModal from '../booking/TripDetailsModal';
import axios from 'axios';
import './ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async sessionId => {
    try {
      const response = await axios.get(
        `${API_URL}/api/chatbot/history/${sessionId}`
      );
      if (response.data.messages && response.data.messages.length > 0) {
        setMessages(
          response.data.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  useEffect(() => {
    // Load session from localStorage
    const savedSession = localStorage.getItem('chatSessionId');
    if (savedSession) {
      setSessionId(savedSession);
      loadChatHistory(savedSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.post(`${API_URL}/api/chatbot/message`, {
        message: messageText.trim(),
        sessionId,
        userId: userId ? parseInt(userId) : null,
      });

      const {
        reply,
        sessionId: newSessionId,
        suggestions: newSuggestions,
        searchResults,
      } = response.data;

      // Save session ID
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
        localStorage.setItem('chatSessionId', newSessionId);
      }

      const botMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        searchResults: searchResults || null, // ✅ Include search results
      };

      setMessages(prev => [...prev, botMessage]);
      setSuggestions(newSuggestions || []);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        role: 'assistant',
        content:
          "I'm sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = suggestion => {
    sendMessage(suggestion);
    setSuggestions([]);
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    if (!isOpen && messages.length === 0) {
      // Send welcome message with updated suggestions
      setMessages([
        {
          role: 'assistant',
          content:
            "Hello! 👋 I'm your bus booking assistant. I can help you search for trips, answer questions about our policies, routes, and booking process. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
      setSuggestions([
        'Search for trips',
        'How do I book a ticket?',
        'What is your cancellation policy?',
      ]);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const clearChat = () => {
    if (sessionId) {
      axios
        .delete(`${API_URL}/api/chatbot/history/${sessionId}`)
        .catch(console.error);
      localStorage.removeItem('chatSessionId');
    }
    setMessages([]);
    setSessionId(null);
    setSuggestions([]);
    setIsOpen(false);
  };

  // ✅ Handler for booking a trip from chatbot
  const handleBookTrip = schedule => {
    console.log(
      '[ChatWidget] Navigating to seat selection with schedule:',
      schedule
    );
    navigate('/bus-booking/seat-selection', {
      state: { schedule },
    });
    setIsOpen(false); // Close chatbot after navigating
  };

  // ✅ Handler for viewing schedule details
  const handleShowDetails = schedule => {
    console.log('[ChatWidget] Opening details modal for schedule:', schedule);
    setSelectedSchedule(schedule);
    setShowDetailsModal(true);
    // Don't close chatbot - let user see modal and return to chat
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedSchedule(null);
  };

  const handleSwitchSchedule = newSchedule => {
    // Switch to viewing the alternative schedule in the same modal
    setSelectedSchedule(newSchedule);
    // Scroll modal to top
    setTimeout(() => {
      const modalContent = document.querySelector('.max-h-\\[90vh\\]');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 100);
  };

  return (
    <div className="chat-widget-container">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="chat-toggle-button"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
          <span className="chat-badge">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chat-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <MessageCircle size={20} />
              <div>
                <h3>Bus Booking Assistant</h3>
                <span className="chat-status">
                  <span className="status-dot"></span>
                  Online
                </span>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                onClick={toggleMinimize}
                className="icon-button"
                aria-label="Minimize"
              >
                <Minimize2 size={18} />
              </button>
              <button
                onClick={toggleChat}
                className="icon-button"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          {!isMinimized && (
            <>
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    onBookTrip={handleBookTrip}
                    onShowDetails={handleShowDetails}
                  />
                ))}
                {isLoading && (
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="chat-suggestions">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-chip"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <div className="chat-input-container">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="chat-input"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="send-button"
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>

              {/* Footer */}
              <div className="chat-footer">
                <button onClick={clearChat} className="clear-chat-button">
                  Clear conversation
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Trip Details Modal */}
      <TripDetailsModal
        schedule={selectedSchedule}
        isOpen={showDetailsModal}
        onClose={handleCloseModal}
        onSwitchSchedule={handleSwitchSchedule}
      />
    </div>
  );
};

export default ChatWidget;
