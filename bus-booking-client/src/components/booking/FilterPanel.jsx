import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaBus, FaClock, FaFilter, FaTimes } from 'react-icons/fa';

/**
 * Advanced Filter Panel Component
 * Provides filtering options for trip search results
 */
export default function FilterPanel({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  className = '',
}) {
  // price range removed
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Local copy of filters — only apply when user presses Apply Filters
  const [localFilters, setLocalFilters] = useState({ ...filters });

  // Sync localFilters when parent resets/changes filters.
  // Use a ref to remember the last parent filters serialization so we don't
  // overwrite local edits while the user is typing.
  const prevFiltersRef = useRef(JSON.stringify(filters || {}));

  useEffect(() => {
    try {
      const current = JSON.stringify(filters || {});
      if (current !== prevFiltersRef.current) {
        setLocalFilters({ ...filters });
        prevFiltersRef.current = current;
      }
    } catch {
      setLocalFilters({ ...filters });
      prevFiltersRef.current = JSON.stringify(filters || {});
    }
  }, [filters]);

  const handleChange = (name, value) => {
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  // Price range removed — other filters remain controlled.

  const handleClear = () => {
    onClearFilters();
    // localFilters will be synced from props via effect, but reset immediately too
    setLocalFilters({ ...filters });
  };

  const handleApply = e => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    // price removed — use localFilters directly
    const normalized = { ...localFilters };

    // Simple apply: pass normalized localFilters up
    const applyFn = () => {
      if (typeof onApplyFilters === 'function') {
        onApplyFilters({ ...normalized });
        return;
      }

      if (typeof onFilterChange === 'function')
        onFilterChange({ ...normalized });
    };

    applyFn();
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range - preset options */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <h3 className="text-sm uppercase">Price Range</h3>
        </div>
        <select
          value={localFilters.priceRange || ''}
          onChange={e => handleChange('priceRange', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
        >
          <option value="">All Prices</option>
          <option value="lt100">Under 100,000</option>
          <option value="100-300">100,000 - 300,000</option>
          <option value="300-500">300,000 - 500,000</option>
          <option value="gt500">Above 500,000</option>
        </select>
        <p className="text-xs text-gray-500">
          Choose a price band instead of entering exact amounts.
        </p>
      </div>

      {/* Bus Type Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <FaBus className="text-info-600" />
          <h3 className="text-sm uppercase">Bus Type</h3>
        </div>
        <select
          value={localFilters.busType || ''}
          onChange={e => handleChange('busType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
        >
          <option value="">All Bus Types</option>
          <option value="Normal">Normal</option>
          <option value="AC">AC</option>
          <option value="Sleeper">Sleeper</option>
          <option value="Semi-Sleeper">Semi-Sleeper</option>
          <option value="Luxury">Luxury</option>
          <option value="Deluxe">Deluxe</option>
        </select>
      </div>

      {/* Departure Time Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <FaClock className="text-purple-600" />
          <h3 className="text-sm uppercase">Departure Time</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-16">From:</label>
            <input
              type="time"
              value={localFilters.timeFrom || ''}
              onChange={e => handleChange('timeFrom', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-16">To:</label>
            <input
              type="time"
              value={localFilters.timeTo || ''}
              onChange={e => handleChange('timeTo', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Quick Time Filters */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-600 uppercase">
          Quick Select
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              handleChange('timeFrom', '00:00');
              handleChange('timeTo', '06:00');
            }}
            className="px-3 py-2 text-xs bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Early Morning (12AM-6AM)
          </button>
          <button
            onClick={() => {
              handleChange('timeFrom', '06:00');
              handleChange('timeTo', '12:00');
            }}
            className="px-3 py-2 text-xs bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Morning (6AM-12PM)
          </button>
          <button
            onClick={() => {
              handleChange('timeFrom', '12:00');
              handleChange('timeTo', '18:00');
            }}
            className="px-3 py-2 text-xs bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Afternoon (12PM-6PM)
          </button>
          <button
            onClick={() => {
              handleChange('timeFrom', '18:00');
              handleChange('timeTo', '23:59');
            }}
            className="px-3 py-2 text-xs bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Evening (6PM-12AM)
          </button>
        </div>
      </div>

      {/* Amenities Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase">
          Amenities
        </h3>
        <div className="space-y-2">
          {[
            'WiFi',
            'AC',
            'Charging Points',
            'Water Bottle',
            'Blanket',
            'Reading Light',
          ].map(amenity => (
            <label
              key={amenity}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={localFilters.amenities?.includes(amenity) || false}
                onChange={e => {
                  const current = localFilters.amenities || [];
                  const updated = e.target.checked
                    ? [...current, amenity]
                    : current.filter(a => a !== amenity);
                  handleChange('amenities', updated);
                }}
                className="w-4 h-4 text-info-600 rounded focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-sm text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleApply}
          className="w-full px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
        >
          Apply Filters
        </button>

        <button
          onClick={handleClear}
          className="w-full px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <FaTimes />
          Clear All Filters
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Filter Panel */}
      <div
        className={`hidden lg:block bg-white rounded-lg shadow-md p-6 ${className}`}
      >
        <div className="flex items-center gap-2 mb-6 pb-4 border-b">
          <FaFilter className="text-info-600" />
          <h2 className="text-lg font-bold text-gray-800">Filters</h2>
        </div>
        <FilterContent />
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="bg-info-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-info-700 transition-colors flex items-center gap-2 font-semibold"
        >
          <FaFilter />
          Filters
        </button>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-h-[80vh] rounded-t-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaFilter className="text-info-600" />
                <h2 className="text-lg font-bold text-gray-800">Filters</h2>
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <div className="p-6">
              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

FilterPanel.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func,
  onApplyFilters: PropTypes.func,
  onClearFilters: PropTypes.func.isRequired,
  className: PropTypes.string,
};
