import PropTypes from 'prop-types';
import {
  FaTimes,
  FaBus,
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaUsers,
  FaInfoCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Button from '../button/Button';
import ScheduleReviews from '../reviews/ScheduleReviews';
import AlternativeTrips from './AlternativeTrips';
import { formatCurrency } from '../../utils/pricingCalculator';

// Helper to get full image URL
const getImageUrl = imagePath => {
  if (!imagePath) return null;
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Otherwise, prepend the API base URL
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  return `${baseURL}${imagePath}`;
};

/**
 * Trip Details Modal Component
 * Shows detailed information about a bus trip
 */
export default function TripDetailsModal({
  schedule,
  isOpen,
  onClose,
  onSwitchSchedule,
}) {
  const navigate = useNavigate();

  if (!isOpen || !schedule) return null;

  // Debug: Log schedule data to see bus information
  console.log('TripDetailsModal - schedule data:', {
    busPhotos: schedule.bus?.photos,
    photos: schedule.photos,
    bus: schedule.bus,
    scheduleKeys: Object.keys(schedule),
  });

  const handleBookNow = () => {
    // Navigate to seat selection so modal Book Now matches card Book Now
    navigate('/bus-booking/seat-selection', { state: { schedule } });
  };

  // Get first bus photo from the photos array
  const busPhotos = schedule.bus?.photos || schedule.photos || [];
  const busPhotoUrls = busPhotos
    .map(photo => getImageUrl(photo))
    .filter(Boolean);

  // amenities will be taken from schedule.amenities or schedule.bus.amenities

  const policies = [
    'Passengers must arrive 15 minutes before departure',
    'Valid ID required for boarding',
    'Cancellation allowed up to 24 hours before departure',
    'Refund policy: 80% refund if cancelled 24+ hours before, 50% if 12-24 hours',
    'Children below 5 years travel free without seat',
    'Maximum 2 bags per passenger allowed',
    'No smoking or alcohol consumption allowed',
    'Please maintain silence after 10 PM',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-info-500 px-6 py-4 flex items-center justify-between rounded-t-xl z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <FaBus size={24} className="text-info-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Trip Details</h2>
              <p className="text-sm text-gray-600">
                Route No: {schedule.routeNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Route Information */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-info-600" />
              Route Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Departure */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-success-700 font-semibold">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <span className="uppercase text-sm">Departure</span>
                </div>
                <div className="ml-5 space-y-1">
                  <p className="text-2xl font-bold text-gray-800">
                    {schedule.departure_city}
                  </p>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <FaClock size={14} />
                      {schedule.departure_time}
                    </span>
                    <span>{schedule.departure_date}</span>
                  </div>
                </div>
              </div>

              {/* Arrival */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-semibold">
                  <div className="w-3 h-3 bg-error-500 rounded-full"></div>
                  <span className="uppercase text-sm">Arrival</span>
                </div>
                <div className="ml-5 space-y-1">
                  <p className="text-2xl font-bold text-gray-800">
                    {schedule.arrival_city}
                  </p>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <FaClock size={14} />
                      {schedule.arrival_time}
                    </span>
                    <span>{schedule.arrival_date}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-gray-700">
                <span className="font-semibold">Journey Duration:</span>{' '}
                {schedule.duration} hours
              </p>
            </div>
          </div>

          {/* Bus Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaBus className="text-gray-600" />
              Bus Details
            </h3>

            {/* Bus Images Gallery */}
            {busPhotoUrls.length > 0 && (
              <div className="mb-4">
                <div
                  className={`grid gap-2 ${busPhotoUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}
                >
                  {busPhotoUrls.map((photoUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photoUrl}
                        alt={`${schedule.busType} - ${schedule.model} (${index + 1})`}
                        className="w-full h-32 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        onError={e => {
                          console.error('Failed to load bus image:', photoUrl);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {busPhotoUrls.length} photo
                  {busPhotoUrls.length > 1 ? 's' : ''} available
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Bus Type</p>
                <p className="text-lg font-semibold text-gray-800">
                  {schedule.busType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Model</p>
                <p className="text-lg font-semibold text-gray-800">
                  {schedule.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Depot</p>
                <p className="text-lg font-semibold text-gray-800">
                  {schedule.depotName || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing & Availability */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <FaDollarSign className="text-success-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">Pricing</h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-success-700">
                  {formatCurrency(schedule.price)}
                </p>
                <p className="text-sm text-gray-600">Per passenger</p>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <FaUsers className="text-orange-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">
                  Availability
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-orange-700">
                  {schedule.availableSeats}
                </p>
                <p className="text-sm text-gray-600">Seats available</p>
              </div>
            </div>
          </div>

          {/* Booking Closing Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FaInfoCircle className="text-yellow-600 mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Booking Closes</p>
                <p className="text-sm text-gray-700">
                  {schedule.bookingClosingDate} at {schedule.bookingClosingTime}
                </p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800">Amenities</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {(schedule.amenities || schedule.bus?.amenities || []).map(
                (amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                    <span className="text-sm">{amenity}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800">
              Policies & Terms
            </h3>
            <div className="space-y-2">
              {policies.map((policy, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-gray-700"
                >
                  <span className="text-info-600 font-bold mt-1">•</span>
                  <span className="text-sm">{policy}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews Section */}
          {schedule.id && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-800">
                Customer Reviews
              </h3>
              <ScheduleReviews scheduleId={schedule.id} />
            </div>
          )}

          {/* Alternative Trips Section */}
          {schedule.id && (
            <div className="space-y-3">
              <AlternativeTrips
                scheduleId={schedule.id}
                onSelectTrip={trip => {
                  // Switch to the alternative trip in the same modal
                  if (onSwitchSchedule) {
                    onSwitchSchedule(trip);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-between border-t rounded-b-xl">
          <div className="text-gray-700">
            <p className="text-sm">Total Fare</p>
            <p className="text-2xl font-bold text-info-700">
              {formatCurrency(schedule.price)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Close
            </button>
            <Button
              label="Book Now"
              onClick={handleBookNow}
              Icon={true}
              className="bg-info-600 hover:bg-info-700 text-white px-8 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

TripDetailsModal.propTypes = {
  schedule: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSwitchSchedule: PropTypes.func,
};
