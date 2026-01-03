/**
 * Schedule Reviews Component
 * Displays reviews for a specific bus schedule
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  User,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import PropTypes from 'prop-types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function ScheduleReviews({ scheduleId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 3;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_URL}/api/reviews/schedule/${scheduleId}?sortBy=${sortBy}&order=DESC`
      );

      setReviews(response.data.reviews || []);
      setStats(response.data.stats || null);
    } catch (err) {
      console.error('Fetch reviews error:', err);
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [scheduleId, sortBy]);

  useEffect(() => {
    if (scheduleId) {
      setCurrentPage(1); // Reset to first page when schedule changes
      fetchReviews();
    }
  }, [scheduleId, fetchReviews]);

  const handleVote = async (reviewId, voteType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to vote on reviews');
        return;
      }

      await axios.post(
        `${API_URL}/api/reviews/${reviewId}/vote`,
        { voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh reviews to show updated vote counts
      fetchReviews();
    } catch (err) {
      console.error('Vote error:', err);
      alert(err.response?.data?.message || 'Failed to record vote');
    }
  };

  const renderStars = rating => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={16}
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600 text-center">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-error-600 text-center">{error}</p>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Reviews</h3>
        <p className="text-gray-600">No reviews available for this trip yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Customer Reviews
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl font-bold text-gray-800">
                {stats.averageRating}
              </div>
              <div>
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={20}
                      className={
                        star <= Math.round(parseFloat(stats.averageRating))
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-800 font-medium">
                  Based on {stats.totalReviews} review
                  {stats.totalReviews > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            {stats.ratingDistribution &&
              stats.ratingDistribution.length > 0 && (
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const ratingData = stats.ratingDistribution.find(
                      d => d.rating === rating
                    );
                    const count = ratingData ? parseInt(ratingData.count) : 0;
                    const percentage = (count / stats.totalReviews) * 100;

                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm text-gray-800 font-medium w-12">
                          {rating} star
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-800 font-medium w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>

          {/* Category Ratings */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 mb-3">
              Detailed Ratings
            </h4>

            {parseFloat(stats.avgCleanliness) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-900 font-medium">
                  Cleanliness
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= Math.round(parseFloat(stats.avgCleanliness))
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.avgCleanliness}
                  </span>
                </div>
              </div>
            )}

            {parseFloat(stats.avgComfort) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-900 font-medium">
                  Comfort
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= Math.round(parseFloat(stats.avgComfort))
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.avgComfort}
                  </span>
                </div>
              </div>
            )}

            {parseFloat(stats.avgPunctuality) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-900 font-medium">
                  Punctuality
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= Math.round(parseFloat(stats.avgPunctuality))
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.avgPunctuality}
                  </span>
                </div>
              </div>
            )}

            {parseFloat(stats.avgStaff) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-900 font-medium">
                  Staff Service
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= Math.round(parseFloat(stats.avgStaff))
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.avgStaff}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-800">All Reviews</h4>
        <select
          value={sortBy}
          onChange={e => {
            setSortBy(e.target.value);
            setCurrentPage(1); // Reset to first page when sorting changes
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="createdAt">Most Recent</option>
          <option value="rating">Highest Rated</option>
          <option value="helpfulCount">Most Helpful</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews
          .slice(
            (currentPage - 1) * reviewsPerPage,
            currentPage * reviewsPerPage
          )
          .map(review => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="text-info-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {review.customer?.isGuest
                        ? review.customer?.guestName || 'Guest User'
                        : review.customer?.username || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>{formatDate(review.createdAt)}</span>
                      {review.isVerified && (
                        <>
                          <span>•</span>
                          <CheckCircle size={14} className="text-success-600" />
                          <span className="text-success-600">
                            Verified Trip
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              {/* Review Content */}
              {review.title && (
                <h5 className="font-semibold text-gray-800 mb-2">
                  {review.title}
                </h5>
              )}
              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Category Ratings */}
              {(review.cleanlinessRating ||
                review.comfortRating ||
                review.punctualityRating ||
                review.staffRating) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b">
                  {review.cleanlinessRating && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Cleanliness</p>
                      {renderStars(review.cleanlinessRating)}
                    </div>
                  )}
                  {review.comfortRating && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Comfort</p>
                      {renderStars(review.comfortRating)}
                    </div>
                  )}
                  {review.punctualityRating && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Punctuality</p>
                      {renderStars(review.punctualityRating)}
                    </div>
                  )}
                  {review.staffRating && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Staff</p>
                      {renderStars(review.staffRating)}
                    </div>
                  )}
                </div>
              )}

              {/* Helpfulness Voting */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Was this review helpful?
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote(review.id, 'helpful')}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <ThumbsUp size={14} />
                    <span>Yes ({review.helpfulCount})</span>
                  </button>
                  <button
                    onClick={() => handleVote(review.id, 'not_helpful')}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <ThumbsDown size={14} />
                    <span>No ({review.notHelpfulCount})</span>
                  </button>
                </div>
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
                  {review.adminResponseAt && (
                    <p className="text-xs text-info-600 mt-2">
                      {formatDate(review.adminResponseAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Pagination Controls */}
      {reviews.length > reviewsPerPage && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * reviewsPerPage + 1} -{' '}
            {Math.min(currentPage * reviewsPerPage, reviews.length)} of{' '}
            {reviews.length} reviews
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg border ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.ceil(reviews.length / reviewsPerPage) },
                (_, i) => i + 1
              ).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === page
                      ? 'bg-info-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentPage(prev =>
                  Math.min(Math.ceil(reviews.length / reviewsPerPage), prev + 1)
                )
              }
              disabled={
                currentPage === Math.ceil(reviews.length / reviewsPerPage)
              }
              className={`flex items-center gap-1 px-4 py-2 rounded-lg border ${
                currentPage === Math.ceil(reviews.length / reviewsPerPage)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ScheduleReviews.propTypes = {
  scheduleId: PropTypes.number.isRequired,
};
