import { useEffect, useState, useRef, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';

/**
 * Real-time Trip Status Hook
 * Provides real-time updates for trip status using polling
 *
 * @param {number} bookingId - The booking ID to monitor
 * @param {number} pollingInterval - Polling interval in ms (default: 30000 = 30 seconds)
 * @param {boolean} enabled - Whether to enable real-time updates
 */
export default function useTripStatus(
  bookingId,
  pollingInterval = 5000,
  enabled = true
) {
  const [tripStatus, setTripStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Fetch trip status
  const fetchTripStatus = useCallback(async () => {
    if (!bookingId) return;

    try {
      const response = await axiosInstance.get(
        `/api/bookings/${bookingId}/trip-status`
      );

      if (mountedRef.current) {
        setTripStatus(response.data);
        setError(null);
        setIsConnected(true);
        setLastUpdate(new Date());
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error('Error fetching trip status:', err);
        setError(err.response?.data?.message || 'Failed to fetch trip status');
        setIsConnected(false);
        setLoading(false);
      }
    }
  }, [bookingId]);

  // Start polling
  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !bookingId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchTripStatus();

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchTripStatus();
    }, pollingInterval);

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bookingId, pollingInterval, enabled, fetchTripStatus]);

  // Manual refresh
  const refresh = () => {
    fetchTripStatus();
  };

  return {
    tripStatus,
    loading,
    error,
    isConnected,
    lastUpdate,
    refresh,
  };
}
