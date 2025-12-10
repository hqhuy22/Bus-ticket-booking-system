import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import SeatMap from "../components/booking/SeatMap";

export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const schedule = location.state?.schedule;

  const [sessionId] = useState(() => {
    let sid = localStorage.getItem("seat_session_id");
    if (!sid) {
      sid =
        "sess_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("seat_session_id", sid);
    }
    return sid;
  });

  const [seatAvailability, setSeatAvailability] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lockTimer, setLockTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const POLLING_INTERVAL = 5000;
  const LOCK_DURATION = 15 * 60;

  useEffect(() => {
    if (!schedule) {
      navigate("/bus-booking/search-buses");
      return;
    }

    fetchSeatAvailability();
    const pollInterval = setInterval(fetchSeatAvailability, POLLING_INTERVAL);

    const handleBeforeUnload = () => {
      if (selectedSeatsRef.current && selectedSeatsRef.current.length > 0) {
        try {
          const payload = JSON.stringify({
            scheduleId: schedule.id,
            sessionId,
          });
          if (navigator.sendBeacon) {
            navigator.sendBeacon("/api/seats/release", payload);
          }
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    const skipReleaseRef = { current: false };
    const setSkipRelease = (val) => {
      skipReleaseRef.current = val;
    };
    window.__skipSeatRelease = setSkipRelease;

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      try {
        delete window.__skipSeatRelease;
      } catch {
        /* ignore */
      }
      if (!skipReleaseRef.current) {
        if (selectedSeatsRef.current && selectedSeatsRef.current.length > 0) {
          releaseSeats();
        }
      }
    };
  }, [schedule, navigate, sessionId]);

  const selectedSeatsRef = useRef(selectedSeats);
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  useEffect(() => {
    if (!lockTimer) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(lockTimer).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        setSelectedSeats([]);
        setLockTimer(null);
        fetchSeatAvailability();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockTimer]);

  const fetchSeatAvailability = async () => {
    try {
      const response = await axios.get(
        `/api/seats/availability/${schedule.id}`
      );
      setSeatAvailability(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load seat availability");
      setLoading(false);
    }
  };

  const handleSeatSelect = async (seatNo) => {
    const seatNoStr = String(seatNo);
    const isSelected = selectedSeats.includes(seatNoStr);
    let newSelectedSeats;
    if (isSelected) {
      newSelectedSeats = selectedSeats.filter((s) => s !== seatNoStr);
    } else {
      newSelectedSeats = [...selectedSeats, seatNoStr];
    }

    if (newSelectedSeats.length > 0) {
      try {
        const response = await axios.post("/api/seats/lock", {
          scheduleId: schedule.id,
          seatNumbers: newSelectedSeats,
          sessionId,
        });
        setSelectedSeats(newSelectedSeats);
        setLockTimer(response.data.locks[0]?.expiresAt);
        setTimeRemaining(LOCK_DURATION);
        fetchSeatAvailability();
      } catch (err) {
        if (err.response?.status === 409) {
          alert(
            err.response.data.error || "Some seats are no longer available"
          );
          fetchSeatAvailability();
        } else {
          alert("Failed to lock seats. Please try again.");
        }
      }
    } else {
      await releaseSeats();
      setSelectedSeats([]);
      setLockTimer(null);
      setTimeRemaining(0);
    }
  };

  const releaseSeats = async () => {
    try {
      await axios.post("/api/seats/release", {
        scheduleId: schedule.id,
        sessionId,
      });
      fetchSeatAvailability();
    } catch (err) {
      /* ignore */
    }
  };

  const handleExtendLock = async () => {
    try {
      const response = await axios.post("/api/seats/extend", {
        scheduleId: schedule.id,
        sessionId,
        additionalMinutes: 5,
      });
      setLockTimer(response.data.expiresAt);
      setTimeRemaining((prev) => prev + 300);
      alert("Lock extended by 5 minutes");
    } catch (err) {
      alert("Failed to extend lock");
    }
  };

  const handleProceedToBooking = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat");
      return;
    }
    if (typeof window !== "undefined" && window.__skipSeatRelease) {
      window.__skipSeatRelease(true);
    }
    navigate("/bus-booking/booking-proceed", {
      state: { schedule, selectedSeats, sessionId, lockExpiresAt: lockTimer },
    });
  };

  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!schedule) return null;
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
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  const totalSeats =
    seatAvailability?.totalSeats ||
    schedule.totalSeats ||
    schedule.availableSeats ||
    40;
  const seatMapConfig = seatAvailability?.seatMap || null;
  const bookedSeats = seatAvailability?.bookedSeats || [];
  const lockedSeats = seatAvailability?.lockedSeats || [];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Select Your Seats
            </h1>
            <p className="text-gray-600">
              Route #{schedule.routeNo} • {schedule.departure_city} →{" "}
              {schedule.arrival_city}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded border bg-white"
          >
            Back
          </button>
        </div>

        {lockTimer && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Seats locked for {Math.ceil(LOCK_DURATION / 60)} minutes.
              </p>
              <p className="text-lg font-semibold text-gray-900">
                Time remaining: {formatTimeRemaining(timeRemaining)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExtendLock}
                className="px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700"
              >
                Extend 5 mins
              </button>
              <button
                onClick={releaseSeats}
                className="px-4 py-2 bg-white border rounded-lg"
              >
                Release
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <SeatMap
            seatMapConfig={seatMapConfig}
            totalSeats={totalSeats}
            bookedSeats={bookedSeats}
            lockedSeats={lockedSeats}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            sessionId={sessionId}
            maxSeatsAllowed={5}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={releaseSeats}
            className="px-4 py-2 rounded border bg-white"
          >
            Release Seats
          </button>
          <button
            onClick={handleProceedToBooking}
            className="px-6 py-3 rounded-lg bg-info-600 text-white font-semibold hover:bg-info-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
