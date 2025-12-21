import { useEffect, useRef, useState } from 'react';
import axios from '../utils/axiosConfig';

/**
 * Real-time Seat Availability Hook
 * Provides real-time updates for seat status using polling or WebSocket
 *
 * @param {number} scheduleId - The schedule ID to monitor
 * @param {number} pollingInterval - Polling interval in ms (default: 5000)
 * @param {boolean} enabled - Whether to enable real-time updates
 */
export function useSeatAvailability(
  scheduleId,
  pollingInterval = 5000,
  enabled = true
) {
  const [seatData, setSeatData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const pollTimerRef = useRef(null);

  const fetchAvailability = async () => {
    if (!scheduleId || !enabled) return;

    try {
      const response = await axios.get(`/api/seats/availability/${scheduleId}`);
      setSeatData(response.data);
      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching seat availability:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (!enabled || !scheduleId) return;

    // Initial fetch
    fetchAvailability();

    // Set up polling
    pollTimerRef.current = setInterval(fetchAvailability, pollingInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, pollingInterval, enabled]);

  const refresh = () => {
    fetchAvailability();
  };

  return {
    seatData,
    lastUpdate,
    isConnected,
    refresh,
  };
}

/**
 * Real-time Connection Indicator Component
 */
export function RealTimeIndicator({ isConnected, lastUpdate }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <div
        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500 animate-pulse' : 'bg-error-500'}`}
      />
      <span>
        {isConnected ? 'Live' : 'Disconnected'}
        {lastUpdate &&
          ` • Updated ${new Date(lastUpdate).toLocaleTimeString()}`}
      </span>
    </div>
  );
}

/**
 * Seat Update Notification Component
 * Shows when seats become available or unavailable
 */
export function SeatUpdateNotification({ updates = [] }) {
  const [visible, setVisible] = useState(false);
  const [currentUpdates, setCurrentUpdates] = useState([]);

  useEffect(() => {
    if (updates.length > 0) {
      setCurrentUpdates(updates);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [updates]);

  if (!visible || currentUpdates.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-50 max-w-sm">
      <div className="bg-white shadow-lg rounded-lg p-4 border-l-4 border-info-500 animate-slide-in">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-info-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">
              Seat Availability Updated
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {currentUpdates.map((update, index) => (
                <li key={index}>{update.message}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
