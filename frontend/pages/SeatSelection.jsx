import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import SeatMap from '../components/booking/SeatMap';

/**
 * Seat Selection Page
 * Allows users to select seats with real-time availability and seat locking
 */
export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const schedule = location.state?.schedule;

  const [sessionId] = useState(() => {
    // Get or create session ID
    let sid = localStorage.getItem('seat_session_id');
    if (!sid) {
      // Generate a simple unique ID
      sid =
        'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('seat_session_id', sid);
    }
    return sid;
  });

  const [seatAvailability, setSeatAvailability] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lockTimer, setLockTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Polling interval for real-time updates (in milliseconds)
  const POLLING_INTERVAL = 5000; // 5 seconds
  const LOCK_DURATION = 15 * 60; // 15 minutes in seconds

  useEffect(() => {
    if (!schedule) {
      navigate('/search-buses');
      return;
    }

    fetchSeatAvailability();

    // Set up polling for real-time updates
    const pollInterval = setInterval(fetchSeatAvailability, POLLING_INTERVAL);

    // release locks when browser tab/window closes
    const handleBeforeUnload = () => {
      if (selectedSeatsRef.current && selectedSeatsRef.current.length > 0) {
        // synchronous XHR is deprecated; attempt navigator.sendBeacon if available
        try {
          const payload = JSON.stringify({
            scheduleId: schedule.id,
            sessionId,
          });
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/seats/release', payload);
          }
        } catch {
          // ignore; we still clear interval and let server cleanup expired locks
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // track whether we should skip releasing locks on unmount (e.g., when navigating to booking)
    const skipReleaseRef = { current: false };

    // store ref on window so cleanup closure can access it (avoid React state in effect cleanup)
    // but better store locally and update via function below
    const setSkipRelease = val => {
      skipReleaseRef.current = val;
    };

    // expose a small API: attach to window for the handleProceedToBooking call path
    // (we will set this flag in handleProceedToBooking before navigating)
    window.__skipSeatRelease = setSkipRelease;

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Remove temporary global flag
      try {
        delete window.__skipSeatRelease;
      } catch {
        /* ignore */
      }

      // Release locked seats when leaving the page only if we are NOT proceeding to booking
      if (!skipReleaseRef.current) {
        if (selectedSeatsRef.current && selectedSeatsRef.current.length > 0) {
          // fire-and-forget release; do not block unmount
          releaseSeats();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule]);

  // Keep a ref to the latest selectedSeats so cleanup can access current value
  const selectedSeatsRef = useRef(selectedSeats);
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  // Update time remaining counter
  useEffect(() => {
    if (!lockTimer) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(lockTimer).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        // Lock expired
        setSelectedSeats([]);
        setLockTimer(null);
        fetchSeatAvailability();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockTimer]);

  const fetchSeatAvailability = async () => {
    try {
      const response = await axios.get(
        `/api/seats/availability/${schedule.id}`
      );
      setSeatAvailability(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching seat availability:', err);
      setError('Failed to load seat availability');
      setLoading(false);
    }
  };

  const handleSeatSelect = async seatNo => {
    const seatNoStr = String(seatNo);
    const isSelected = selectedSeats.includes(seatNoStr);

    let newSelectedSeats;
    if (isSelected) {
      // Deselect seat
      newSelectedSeats = selectedSeats.filter(s => s !== seatNoStr);
    } else {
      // Select seat
      newSelectedSeats = [...selectedSeats, seatNoStr];
    }

    // Lock the seats
    if (newSelectedSeats.length > 0) {
      try {
        const response = await axios.post('/api/seats/lock', {
          scheduleId: schedule.id,
          seatNumbers: newSelectedSeats,
          sessionId,
        });

        setSelectedSeats(newSelectedSeats);
        setLockTimer(response.data.locks[0]?.expiresAt);
        setTimeRemaining(LOCK_DURATION);

        // Refresh availability to show locks
        fetchSeatAvailability();
      } catch (err) {
        console.error('Error locking seats:', err);
        if (err.response?.status === 409) {
          alert(
            err.response.data.error || 'Some seats are no longer available'
          );
          fetchSeatAvailability();
        } else {
          alert('Failed to lock seats. Please try again.');
        }
      }
    } else {
      // Release all locks if no seats selected
      await releaseSeats();
      setSelectedSeats([]);
      setLockTimer(null);
      setTimeRemaining(0);
    }
  };

  const releaseSeats = async () => {
    try {
      await axios.post('/api/seats/release', {
        scheduleId: schedule.id,
        sessionId,
      });
      fetchSeatAvailability();
    } catch (err) {
      console.error('Error releasing seats:', err);
    }
  };

  const handleExtendLock = async () => {
    try {
      const response = await axios.post('/api/seats/extend', {
        scheduleId: schedule.id,
        sessionId,
        additionalMinutes: 5,
      });

      setLockTimer(response.data.expiresAt);
      setTimeRemaining(prev => prev + 300); // Add 5 minutes
      alert('Lock extended by 5 minutes');
    } catch (err) {
      console.error('Error extending lock:', err);
      alert('Failed to extend lock');
    }
  };

  const handleProceedToBooking = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    // Indicate we are proceeding to booking so unmount cleanup won't release locks
    if (typeof window !== 'undefined' && window.__skipSeatRelease) {
      window.__skipSeatRelease(true);
    }

    // Navigate to booking with selected seats and schedule info
    navigate('/bus-booking/booking-proceed', {
      state: {
        schedule,
        selectedSeats,
        sessionId,
        lockExpiresAt: lockTimer,
      },
    });
  };

  const formatTimeRemaining = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!schedule) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seat availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-500 text-lg">{error}</p>
          <button
            onClick={fetchSeatAvailability}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Trip Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Select Your Seats
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">
                <span className="font-semibold">Route:</span>{' '}
                {schedule.departure_city} → {schedule.arrival_city}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Date:</span>{' '}
                {schedule.departure_date}
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                <span className="font-semibold">Departure:</span>{' '}
                {schedule.departure_time}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Bus Type:</span>{' '}
                {schedule.busType}
              </p>
            </div>
          </div>
        </div>

        {/* Lock Timer */}
        {lockTimer && timeRemaining > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-yellow-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">
                    Seats locked for: {formatTimeRemaining(timeRemaining)}
                  </span>
                  <span className="ml-2 text-xs">
                    Please complete your booking before the timer expires
                  </span>
                </p>
              </div>
              <button
                onClick={handleExtendLock}
                className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Extend +5 min
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <SeatMap
                seatMapConfig={seatAvailability?.seatMap}
                totalSeats={
                  seatAvailability?.totalSeats || schedule.availableSeats
                }
                bookedSeats={seatAvailability?.bookedSeats || []}
                lockedSeats={seatAvailability?.lockedSeats || []}
                selectedSeats={selectedSeats}
                onSeatSelect={handleSeatSelect}
                maxSeatsAllowed={5}
                sessionId={sessionId}
              />
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Booking Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available Seats:</span>
                  <span className="font-semibold">
                    {seatAvailability?.availableSeatsCount || 0}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Selected Seats:</span>
                  <span className="font-semibold text-primary">
                    {selectedSeats.length}
                  </span>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Seat Numbers:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map(seat => (
                        <span
                          key={seat}
                          className="px-3 py-1 bg-primary text-white rounded-full text-sm"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      $
                      {((schedule.price || 0) * selectedSeats.length).toFixed(
                        2
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ${schedule.price} per seat
                  </p>
                </div>
              </div>

              <button
                onClick={handleProceedToBooking}
                disabled={selectedSeats.length === 0}
                className={`w-full mt-6 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  selectedSeats.length > 0
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Proceed to Booking
              </button>

              <button
                onClick={async () => {
                  if (selectedSeats.length > 0) {
                    // wait for release to complete before navigating away
                    await releaseSeats();
                  }
                  navigate(-1);
                }}
                className="w-full mt-3 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back to Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
