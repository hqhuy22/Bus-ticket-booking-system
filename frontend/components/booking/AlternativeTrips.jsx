import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FaCalendarAlt,
  FaClock,
  FaDollarSign,
  FaUsers,
  FaArrowRight,
} from 'react-icons/fa';
import axios from '../../utils/axiosConfig';
import { formatCurrency } from '../../utils/pricingCalculator';

/**
 * Alternative Trips Component
 * Shows suggested trips on same route or similar dates
 */
export default function AlternativeTrips({ scheduleId, onSelectTrip }) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originalSchedule, setOriginalSchedule] = useState(null);

  const fetchAlternativeTrips = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/bus-schedule/${scheduleId}/alternatives`,
        {
          params: { limit: 5 },
        }
      );

      setOriginalSchedule(response.data.originalSchedule);
      setAlternatives(response.data.alternatives || []);
    } catch (err) {
      console.error('Error fetching alternative trips:', err);
      setError(err.response?.data?.error || 'Failed to load alternative trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scheduleId) {
      fetchAlternativeTrips();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  if (loading) {
    return (
      <div className="bg-blue-50 rounded-lg p-6">
        <p className="text-gray-600 text-center">
          Loading alternative trips...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6">
        <p className="text-error-600 text-center text-sm">{error}</p>
      </div>
    );
  }

  if (!alternatives || alternatives.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <p className="text-gray-600 text-center text-sm">
          No alternative trips available for this route
        </p>
      </div>
    );
  }

  const getDateBadge = trip => {
    if (trip.sameDate) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Same Day
        </span>
      );
    }

    const diff = trip.dateDifference;
    if (diff > 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-info-800">
          +{diff} day{diff > 1 ? 's' : ''}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          {diff} day{Math.abs(diff) > 1 ? 's' : ''}
        </span>
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-bold text-gray-800">Alternative Trips</h4>
        <span className="text-xs text-gray-500">
          {alternatives.length} option{alternatives.length > 1 ? 's' : ''}{' '}
          available
        </span>
      </div>

      {originalSchedule && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p>Showing alternatives for:</p>
          <p className="font-semibold text-gray-800 mt-1">
            {originalSchedule.departure_city} → {originalSchedule.arrival_city}
          </p>
          <p className="text-xs mt-1">
            Original: {originalSchedule.departure_date} at{' '}
            {originalSchedule.departure_time}
          </p>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alternatives.map(trip => (
          <div
            key={trip.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onSelectTrip && onSelectTrip(trip)}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Route & Time Info */}
              <div className="flex-1 space-y-2">
                {/* Route */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-800">
                    {trip.departure_city}
                  </span>
                  <FaArrowRight className="text-gray-400" size={12} />
                  <span className="font-semibold text-gray-800">
                    {trip.arrival_city}
                  </span>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt size={12} />
                    <span>{trip.departure_date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaClock size={12} />
                    <span>{trip.departure_time}</span>
                  </div>
                </div>

                {/* Bus Type & Date Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {trip.busType}
                  </span>
                  {getDateBadge(trip)}
                </div>
              </div>

              {/* Right: Price & Availability */}
              <div className="text-right space-y-2">
                <div className="flex items-center gap-1 text-info-700 font-bold">
                  <FaDollarSign size={14} />
                  <span>{formatCurrency(trip.price)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <FaUsers size={12} />
                  <span>{trip.availableSeats} seats</span>
                </div>
              </div>
            </div>

            {/* Duration */}
            {trip.duration && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Duration:{' '}
                  <span className="font-semibold">{trip.duration} hours</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 text-center pt-2">
        Click on any trip to view details
      </div>
    </div>
  );
}

AlternativeTrips.propTypes = {
  scheduleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onSelectTrip: PropTypes.func,
};
