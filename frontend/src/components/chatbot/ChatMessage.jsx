import { Bot, User, MapPin, Clock } from 'lucide-react';
import PropTypes from 'prop-types';
import './ChatMessage.css';

const ChatMessage = ({ message, onBookTrip, onShowDetails }) => {
  const isBot = message.role === 'assistant';
  const isUser = message.role === 'user';

  const formatTime = timestamp => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleBookTrip = schedule => {
    console.log('[ChatMessage] handleBookTrip called with schedule:', schedule);
    console.log('[ChatMessage] Schedule keys:', Object.keys(schedule));
    console.log('[ChatMessage] Schedule data:', {
      id: schedule.id,
      departure_city: schedule.departure_city,
      arrival_city: schedule.arrival_city,
      departure_date: schedule.departure_date,
      departure_time: schedule.departure_time,
      price: schedule.price,
      availableSeats: schedule.availableSeats,
      bus: schedule.bus,
      route: schedule.route,
    });

    if (onBookTrip) {
      onBookTrip(schedule);
    } else {
      // Fallback: Open booking page in new tab
      const bookingUrl = `/booking?scheduleId=${schedule.id}`;
      window.open(bookingUrl, '_blank');
    }
  };

  const handleShowDetails = schedule => {
    if (onShowDetails) {
      onShowDetails(schedule);
    } else {
      // Fallback: Open schedule details in new tab
      window.open(`/schedule/${schedule.id}`, '_blank');
    }
  };

  return (
    <div
      className={`message-wrapper ${isUser ? 'user-message' : 'bot-message'}`}
    >
      <div className="message-content">
        <div className="message-avatar">
          {isBot ? (
            <div className="bot-avatar">
              <Bot size={18} />
            </div>
          ) : (
            <div className="user-avatar">
              <User size={18} />
            </div>
          )}
        </div>
        <div className="message-bubble">
          <div className="message-text">{message.content}</div>

          {/* ✅ Display search results if available */}
          {message.searchResults && message.searchResults.length > 0 && (
            <div className="search-results">
              {message.searchResults.map((schedule, index) => (
                <div key={schedule.id} className="trip-card">
                  <div className="trip-header">
                    <h4>Option {index + 1}</h4>
                    <span className="trip-price">${schedule.price}</span>
                  </div>

                  <div className="trip-details">
                    <div className="trip-route">
                      <MapPin size={16} />
                      <span>
                        {schedule.departure_city} → {schedule.arrival_city}
                      </span>
                    </div>

                    <div className="trip-info">
                      <Clock size={16} />
                      <span>
                        {schedule.departure_date} at {schedule.departure_time}
                      </span>
                    </div>

                    {schedule.bus && (
                      <div className="trip-bus">
                        <span className="bus-type">{schedule.bus.busType}</span>
                        <span className="seats-available">
                          {schedule.availableSeats} seats left
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="trip-actions">
                    <button
                      className="btn-book"
                      onClick={() => handleBookTrip(schedule)}
                    >
                      Book now
                    </button>
                    <button
                      className="btn-details"
                      onClick={() => handleShowDetails(schedule)}
                    >
                      Show more details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="message-time">{formatTime(message.timestamp)}</div>
        </div>
      </div>
    </div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    searchResults: PropTypes.array,
  }).isRequired,
  onBookTrip: PropTypes.func,
  onShowDetails: PropTypes.func,
};

export default ChatMessage;
