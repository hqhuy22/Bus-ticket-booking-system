import { useState } from 'react';
import {
  FaSearch,
  FaTimes,
  FaMapMarkerAlt,
  FaClock,
  FaRoad,
  FaRoute,
} from 'react-icons/fa';
import PropTypes from 'prop-types';
import axios from '../../utils/axiosConfig';

/**
 * Route Search Bar Component
 * Allows users to search for bus routes by route name
 * Includes autocomplete suggestions
 */
export default function RouteSearchBar({ className = '' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Fetch autocomplete suggestions
  const fetchSuggestions = async query => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await axios.get('/api/routes/suggestions', {
        params: { q: query.trim(), limit: 10 },
      });
      setSuggestions(response.data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setSuggestions([]);
    }
  };

  const handleInputChange = e => {
    const value = e.target.value;
    setSearchQuery(value);

    // Fetch suggestions as user types
    if (value.trim().length >= 1) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = suggestion => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Auto search when suggestion selected
    handleSearchWithQuery(suggestion);
  };

  const handleSearchWithQuery = async query => {
    if (query.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const response = await axios.get('/api/routes/search', {
        params: { q: query.trim(), limit: 20 },
      });

      setSearchResults(response.data.routes || []);
      setShowResults(true);
    } catch (err) {
      console.error('Route search error:', err);
      setError(err.response?.data?.error || 'Failed to search routes');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async e => {
    e.preventDefault();
    handleSearchWithQuery(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleSearch(e);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    // Delay to allow suggestion click to register
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <FaRoute className="text-info-600" size={24} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Explore Bus Routes
            </h2>
            <p className="text-sm text-gray-600">Search by route name</p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative mb-4">
          <div className="relative">
            <FaSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={handleBlur}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search routes by name... (e.g., Hanoi Express)"
              className="w-full pl-12 pr-28 py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-lg"
              minLength={2}
            />

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-primary-500 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b last:border-b-0 border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <FaRoute className="text-info-600" size={14} />
                      <span className="text-gray-800">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <FaTimes size={16} />
                </button>
              )}
              <button
                type="submit"
                disabled={searchQuery.trim().length < 2 || loading}
                className="px-4 py-2 bg-info-600 text-white rounded-md hover:bg-info-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-error-600 text-sm">{error}</p>
          </div>
        )}

        {/* Search Results */}
        {showResults && (
          <div className="border-t-2 border-gray-200 pt-4">
            {searchResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  No routes found matching &quot;{searchQuery}&quot;
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Try searching with different keywords
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    Found {searchResults.length} route
                    {searchResults.length > 1 ? 's' : ''}
                  </h3>
                  <button
                    onClick={handleClear}
                    className="text-sm text-info-600 hover:text-info-800 underline"
                  >
                    Clear results
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {searchResults.map(route => (
                    <RouteCard key={route.id} route={route} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Route Card Component
 * Displays individual route information with stops
 */
function RouteCard({ route }) {
  const [showStops, setShowStops] = useState(false);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:shadow-md transition-all">
      {/* Route Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Route Name & Number */}
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-info-600 text-white">
              Route {route.routeNo}
            </span>
            <h4 className="text-lg font-bold text-gray-800">
              {route.routeName}
            </h4>
          </div>

          {/* Origin → Destination */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <span className="font-semibold text-gray-800">
                {route.origin}
              </span>
            </div>
            <FaMapMarkerAlt className="text-gray-400" size={14} />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-error-500 rounded-full"></div>
              <span className="font-semibold text-gray-800">
                {route.destination}
              </span>
            </div>
          </div>

          {/* Route Details */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            {route.distance && (
              <div className="flex items-center gap-1">
                <FaRoad size={14} />
                <span>{route.distance} km</span>
              </div>
            )}
            {route.estimatedDuration && (
              <div className="flex items-center gap-1">
                <FaClock size={14} />
                <span>{route.estimatedDuration} hours</span>
              </div>
            )}
            <div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  route.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {route.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Stops Button */}
        {route.stops && route.stops.length > 0 && (
          <button
            onClick={() => setShowStops(!showStops)}
            className="px-3 py-2 text-sm text-info-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
          >
            {showStops ? 'Hide Stops' : `Show ${route.stops.length} Stops`}
          </button>
        )}
      </div>

      {/* Route Stops */}
      {showStops && route.stops && route.stops.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <h5 className="font-semibold text-gray-700 mb-3 text-sm">
            Route Stops:
          </h5>
          <div className="space-y-2">
            {route.stops.map((stop, index) => (
              <div
                key={stop.id}
                className="flex items-start gap-3 text-sm bg-white p-2 rounded border border-gray-200"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-info-700 rounded-full font-bold text-xs">
                  {stop.stopOrder || index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{stop.stopName}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        stop.stopType === 'pickup'
                          ? 'bg-green-100 text-success-700'
                          : stop.stopType === 'dropoff'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-info-700'
                      }`}
                    >
                      {stop.stopType}
                    </span>
                    {stop.arrivalTime && (
                      <span>Arrival: {stop.arrivalTime}</span>
                    )}
                    {stop.departureTime && (
                      <span>Departure: {stop.departureTime}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

RouteSearchBar.propTypes = {
  className: PropTypes.string,
};

RouteCard.propTypes = {
  route: PropTypes.shape({
    id: PropTypes.number.isRequired,
    routeNo: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    routeName: PropTypes.string.isRequired,
    origin: PropTypes.string.isRequired,
    destination: PropTypes.string.isRequired,
    distance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    estimatedDuration: PropTypes.string,
    status: PropTypes.string,
    stops: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        stopOrder: PropTypes.number,
        stopName: PropTypes.string,
        stopType: PropTypes.string,
        arrivalTime: PropTypes.string,
        departureTime: PropTypes.string,
      })
    ),
  }).isRequired,
};
