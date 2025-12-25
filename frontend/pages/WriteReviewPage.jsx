/**
 * Write Review Page
 * Form for submitting a review for a completed trip
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  MapPin,
  Calendar,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function WriteReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, busScheduleId, bookingId } = location.state || {};

  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    cleanlinessRating: 0,
    comfortRating: 0,
    punctualityRating: 0,
    staffRating: 0,
  });

  const [hoveredRating, setHoveredRating] = useState(0);
  const [categoryHovered, setCategoryHovered] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If no booking data, redirect back
    if (!booking || !busScheduleId || !bookingId) {
      navigate('/bus-booking/my-reviews');
    }
  }, [booking, busScheduleId, bookingId, navigate]);

  const handleRatingClick = rating => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleCategoryRating = (category, rating) => {
    setFormData(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!formData.comment.trim()) {
      setError('Please write a review');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const reviewData = {
        busScheduleId,
        bookingId,
        rating: formData.rating,
        title: formData.title.trim() || null,
        comment: formData.comment.trim(),
        cleanlinessRating: formData.cleanlinessRating || null,
        comfortRating: formData.comfortRating || null,
        punctualityRating: formData.punctualityRating || null,
        staffRating: formData.staffRating || null,
      };

      await axios.post(`${API_URL}/api/reviews`, reviewData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/bus-booking/my-reviews');
      }, 2000);
    } catch (err) {
      console.error('Submit review error:', err);
      setError(err.response?.data?.message || 'Failed to submit review');
      setLoading(false);
    }
  };

  const renderStarRating = (
    currentRating,
    onClickHandler,
    hoveredValue,
    onHoverHandler
  ) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onClickHandler(star)}
            onMouseEnter={() => onHoverHandler(star)}
            onMouseLeave={() => onHoverHandler(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={32}
              className={
                star <= (hoveredValue || currentRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!booking) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="mx-auto text-success-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Review Submitted!
          </h2>
          <p className="text-gray-600 mb-4">
            Thank you for sharing your feedback.
          </p>
          <p className="text-sm text-gray-500">Redirecting to My Reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/bus-booking/my-reviews')}
          className="flex items-center gap-2 text-info-600 hover:text-info-700 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to My Reviews
        </button>

        {/* Trip Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Trip Details</h2>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-gray-800 font-semibold mb-2">
                <MapPin size={20} className="text-info-600" />
                <span>
                  {booking.departure} → {booking.arrival}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatDate(booking.journeyDate)}</span>
                </div>
                <div>
                  <span className="font-medium">Route:</span>{' '}
                  {booking.schedule?.route?.routeName ||
                    `Route ${booking.routeNo}`}
                </div>
                <div>
                  <span className="font-medium">Booking:</span>{' '}
                  {booking.bookingReference}
                </div>
                {booking.schedule?.bus && (
                  <div>
                    <span className="font-medium">Bus:</span>{' '}
                    {booking.schedule.bus.busNumber ||
                      booking.schedule.bus.registrationNumber}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Write Your Review
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="text-error-500 mt-0.5" size={20} />
              <div>
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-error-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Overall Rating */}
          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-3">
              Overall Rating <span className="text-error-500">*</span>
            </label>
            {renderStarRating(
              formData.rating,
              handleRatingClick,
              hoveredRating,
              setHoveredRating
            )}
            {formData.rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {formData.rating === 5 && 'Excellent!'}
                {formData.rating === 4 && 'Very Good'}
                {formData.rating === 3 && 'Good'}
                {formData.rating === 2 && 'Fair'}
                {formData.rating === 1 && 'Poor'}
              </p>
            )}
          </div>

          {/* Review Title */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500"
              placeholder="Summarize your experience"
              maxLength={200}
            />
          </div>

          {/* Review Comment */}
          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-2">
              Your Review <span className="text-error-500">*</span>
            </label>
            <textarea
              value={formData.comment}
              onChange={e =>
                setFormData(prev => ({ ...prev, comment: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 min-h-32"
              placeholder="Share your experience with this trip..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.comment.length} characters
            </p>
          </div>

          {/* Category Ratings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Detailed Ratings (Optional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cleanliness */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Cleanliness
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        handleCategoryRating('cleanlinessRating', star)
                      }
                      onMouseEnter={() =>
                        setCategoryHovered(prev => ({
                          ...prev,
                          cleanliness: star,
                        }))
                      }
                      onMouseLeave={() =>
                        setCategoryHovered(prev => ({
                          ...prev,
                          cleanliness: 0,
                        }))
                      }
                    >
                      <Star
                        size={24}
                        className={
                          star <=
                          (categoryHovered.cleanliness ||
                            formData.cleanlinessRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comfort */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Comfort
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        handleCategoryRating('comfortRating', star)
                      }
                      onMouseEnter={() =>
                        setCategoryHovered(prev => ({ ...prev, comfort: star }))
                      }
                      onMouseLeave={() =>
                        setCategoryHovered(prev => ({ ...prev, comfort: 0 }))
                      }
                    >
                      <Star
                        size={24}
                        className={
                          star <=
                          (categoryHovered.comfort || formData.comfortRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Punctuality */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Punctuality
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        handleCategoryRating('punctualityRating', star)
                      }
                      onMouseEnter={() =>
                        setCategoryHovered(prev => ({
                          ...prev,
                          punctuality: star,
                        }))
                      }
                      onMouseLeave={() =>
                        setCategoryHovered(prev => ({
                          ...prev,
                          punctuality: 0,
                        }))
                      }
                    >
                      <Star
                        size={24}
                        className={
                          star <=
                          (categoryHovered.punctuality ||
                            formData.punctualityRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Staff Service
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleCategoryRating('staffRating', star)}
                      onMouseEnter={() =>
                        setCategoryHovered(prev => ({ ...prev, staff: star }))
                      }
                      onMouseLeave={() =>
                        setCategoryHovered(prev => ({ ...prev, staff: 0 }))
                      }
                    >
                      <Star
                        size={24}
                        className={
                          star <=
                          (categoryHovered.staff || formData.staffRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/bus-booking/my-reviews')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
