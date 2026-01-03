/**
 * My Reviews Page
 * Displays user's submitted reviews and reviewable bookings
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  Calendar,
  MapPin,
  ChevronRight,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function MyReviewsPage() {
  const [activeTab, setActiveTab] = useState('my-reviews'); // 'my-reviews' or 'to-review'
  const [myReviews, setMyReviews] = useState([]);
  const [reviewableBookings, setReviewableBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (activeTab === 'my-reviews') {
        const response = await axios.get(
          `${API_URL}/api/reviews/my-reviews`,
          config
        );
        setMyReviews(response.data.reviews || []);
      } else {
        const response = await axios.get(
          `${API_URL}/api/reviews/reviewable-bookings`,
          config
        );
        setReviewableBookings(response.data.bookings || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWriteReview = booking => {
    // Navigate to review form with booking data
    navigate('/bus-booking/write-review', {
      state: {
        booking,
        busScheduleId: booking.busScheduleId,
        bookingId: booking.id,
      },
    });
  };

  const handleDeleteReview = async reviewId => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh reviews
      fetchData();
      alert('Review deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const renderStars = rating => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={18}
            className={
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }
          />
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

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Reviews</h1>
          <p className="text-gray-600">Manage your trip reviews and feedback</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('my-reviews')}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                activeTab === 'my-reviews'
                  ? 'text-info-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <MessageSquare className="inline mr-2" size={18} />
              My Reviews ({myReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('to-review')}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                activeTab === 'to-review'
                  ? 'text-info-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Edit className="inline mr-2" size={18} />
              Pending Reviews ({reviewableBookings.length})
            </button>
          </div>
        </div>

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

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        )}

        {/* My Reviews Tab */}
        {!loading && activeTab === 'my-reviews' && (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <MessageSquare
                  className="mx-auto text-gray-300 mb-4"
                  size={64}
                />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Reviews Yet
                </h3>
                <p className="text-gray-600">
                  You haven&apos;t written any reviews yet.
                </p>
              </div>
            ) : (
              myReviews.map(review => (
                <div
                  key={review.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  {/* Route Info */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-gray-800 font-semibold mb-1">
                        <MapPin size={18} className="text-info-600" />
                        <span>
                          {review.routeInfo?.departure} →{' '}
                          {review.routeInfo?.arrival}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>{formatDate(review.journeyDate)}</span>
                        <span className="text-gray-400">•</span>
                        <span>
                          {review.routeInfo?.routeName ||
                            `Route ${review.routeInfo?.routeNo}`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-error-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete review"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Rating */}
                  <div className="mb-3">
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-600">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Review Content */}
                  {review.title && (
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {review.title}
                    </h4>
                  )}
                  <p className="text-gray-700 mb-4">{review.comment}</p>

                  {/* Category Ratings */}
                  {(review.cleanlinessRating ||
                    review.comfortRating ||
                    review.punctualityRating ||
                    review.staffRating) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {review.cleanlinessRating && (
                        <div className="text-sm">
                          <p className="text-gray-600 mb-1">Cleanliness</p>
                          {renderStars(review.cleanlinessRating)}
                        </div>
                      )}
                      {review.comfortRating && (
                        <div className="text-sm">
                          <p className="text-gray-600 mb-1">Comfort</p>
                          {renderStars(review.comfortRating)}
                        </div>
                      )}
                      {review.punctualityRating && (
                        <div className="text-sm">
                          <p className="text-gray-600 mb-1">Punctuality</p>
                          {renderStars(review.punctualityRating)}
                        </div>
                      )}
                      {review.staffRating && (
                        <div className="text-sm">
                          <p className="text-gray-600 mb-1">Staff</p>
                          {renderStars(review.staffRating)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Helpfulness */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-3">
                    <span>{review.helpfulCount} found this helpful</span>
                    {review.isVerified && (
                      <span className="text-success-600">✓ Verified Trip</span>
                    )}
                  </div>

                  {/* Admin Response */}
                  {review.adminResponse && (
                    <div className="mt-4 bg-blue-50 border-l-4 border-info-500 p-4 rounded">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Response from Bus Company
                      </p>
                      <p className="text-sm text-info-800">
                        {review.adminResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Pending Reviews Tab */}
        {!loading && activeTab === 'to-review' && (
          <div className="space-y-4">
            {reviewableBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Edit className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Trips to Review
                </h3>
                <p className="text-gray-600">
                  All your completed trips have been reviewed.
                </p>
              </div>
            ) : (
              reviewableBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Route Info */}
                      <div className="flex items-center gap-2 text-gray-800 font-semibold mb-2">
                        <MapPin size={18} className="text-info-600" />
                        <span>
                          {booking.departure} → {booking.arrival}
                        </span>
                      </div>

                      {/* Trip Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
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
                      </div>

                      {/* Bus Info */}
                      {booking.schedule && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Bus:</span>{' '}
                          {booking.schedule.bus?.busNumber ||
                            booking.schedule.bus?.registrationNumber}
                          {' • '}
                          <span>{booking.schedule.bus?.busType}</span>
                        </div>
                      )}
                    </div>

                    {/* Write Review Button */}
                    <button
                      onClick={() => handleWriteReview(booking)}
                      className="ml-4 px-6 py-2.5 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Edit size={18} />
                      Write Review
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
