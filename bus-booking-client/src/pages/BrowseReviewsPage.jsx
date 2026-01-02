/**
 * Browse Reviews Page
 * Public page to browse and view reviews of all completed bus schedules
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MapPin,
  Calendar,
  TrendingUp,
  Filter,
  Search,
} from 'lucide-react';
import axios from 'axios';
import ScheduleReviews from '../components/reviews/ScheduleReviews';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function BrowseReviewsPage() {
  const [completedSchedules, setCompletedSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const fetchCompletedSchedules = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_URL}/api/schedules/completed-with-reviews`
      );
      setCompletedSchedules(response.data.schedules || []);

      // Auto-select first schedule if available
      if (response.data.schedules?.length > 0 && !selectedSchedule) {
        setSelectedSchedule(response.data.schedules[0]);
      }
    } catch (err) {
      console.error('Fetch completed schedules error:', err);
      setError(
        err.response?.data?.message || 'Failed to load completed schedules'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedSchedule]);

  useEffect(() => {
    fetchCompletedSchedules();
  }, [fetchCompletedSchedules]);

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  // Filter and sort schedules
  const filteredSchedules = completedSchedules
    .filter(schedule => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        schedule.route?.origin?.toLowerCase().includes(searchLower) ||
        schedule.route?.destination?.toLowerCase().includes(searchLower) ||
        schedule.route?.routeName?.toLowerCase().includes(searchLower);

      // Rating filter
      const matchesRating =
        filterRating === 'all' ||
        (filterRating === '4+' && schedule.averageRating >= 4) ||
        (filterRating === '3+' && schedule.averageRating >= 3);

      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.departure_date) - new Date(a.departure_date);
      } else if (sortBy === 'rating') {
        return (b.averageRating || 0) - (a.averageRating || 0);
      } else if (sortBy === 'reviews') {
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Browse Reviews
          </h1>
          <p className="text-gray-600">
            Read reviews from travelers for completed bus trips
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by city or route..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500"
              />
            </div>

            {/* Rating Filter */}
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <select
                value={filterRating}
                onChange={e => setFilterRating(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 appearance-none cursor-pointer"
              >
                <option value="all">All Ratings</option>
                <option value="4+">4+ Stars</option>
                <option value="3+">3+ Stars</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="relative">
              <TrendingUp
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 appearance-none cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading reviews...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Schedule List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="bg-info-600 text-white px-4 py-3 sticky top-0 z-10">
                  <h3 className="font-semibold">
                    Completed Trips ({filteredSchedules.length})
                  </h3>
                </div>

                {filteredSchedules.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No completed trips found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredSchedules.map(schedule => (
                      <button
                        key={schedule.id}
                        onClick={() => setSelectedSchedule(schedule)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedSchedule?.id === schedule.id
                            ? 'bg-blue-50 border-l-4 border-blue-600'
                            : ''
                        }`}
                      >
                        {/* Route Info */}
                        <div className="flex items-center gap-2 text-gray-800 font-semibold mb-2">
                          <MapPin size={16} className="text-info-600" />
                          <span className="text-sm">
                            {schedule.route?.origin} →{' '}
                            {schedule.route?.destination}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-xs text-gray-700 font-medium mb-2">
                          <Calendar size={14} className="text-info-500" />
                          <span>{formatDate(schedule.departure_date)}</span>
                        </div>

                        {/* Rating */}
                        {schedule.averageRating ? (
                          <div className="flex items-center gap-2">
                            {renderStars(Math.round(schedule.averageRating))}
                            <span className="text-sm text-gray-600">
                              {schedule.averageRating.toFixed(1)} (
                              {schedule.reviewCount} reviews)
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">
                            No reviews yet
                          </p>
                        )}

                        {/* Route Name */}
                        {schedule.route?.routeName && (
                          <p className="text-xs text-gray-700 font-medium mt-1 truncate">
                            {schedule.route.routeName}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Reviews Display */}
            <div className="lg:col-span-2">
              {selectedSchedule ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Schedule Header */}
                  <div className="bg-white px-6 py-4 border-b-4 border-blue-600">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin size={24} className="text-info-600" />
                      <h2 className="text-2xl font-bold text-info-600">
                        {selectedSchedule.route?.origin} →{' '}
                        {selectedSchedule.route?.destination}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 text-base text-info-600 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={18} />
                        {formatDate(selectedSchedule.departure_date)}
                      </span>
                      {selectedSchedule.route?.routeName && (
                        <span className="font-bold">
                          • {selectedSchedule.route.routeName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div className="p-6">
                    <ScheduleReviews scheduleId={selectedSchedule.id} />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Star className="mx-auto text-gray-300 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Select a Trip
                  </h3>
                  <p className="text-gray-600">
                    Choose a completed trip from the list to view reviews
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
