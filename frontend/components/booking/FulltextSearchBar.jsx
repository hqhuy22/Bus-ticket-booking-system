import { useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';

/**
 * Fulltext Search Bar Component
 * Allows users to search across routes, cities, stations
 */
export default function FulltextSearchBar({
  onSearch,
  onClear,
  className = '',
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = e => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      onSearch(searchQuery.trim());
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    onClear();
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <FaSearch className="text-info-600" size={18} />
          <h3 className="font-semibold text-gray-800">Quick Search</h3>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search routes, cities, stations..."
            className="w-full pl-4 pr-24 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 outline-none"
            minLength={2}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <FaTimes size={14} />
              </button>
            )}
            <button
              type="submit"
              disabled={searchQuery.trim().length < 2}
              className="px-3 py-1 bg-info-600 text-white rounded-md hover:bg-info-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              Search
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-2">
          Search by city name, route number, station, or bus type
        </p>
      </div>
    </div>
  );
}

FulltextSearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  className: PropTypes.string,
};
