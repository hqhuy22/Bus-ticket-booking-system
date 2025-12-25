import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaMapMarkerAlt, FaTimes } from 'react-icons/fa';

/**
 * City Autocomplete Component
 * Provides autocomplete functionality for city selection
 */
export default function CityAutocomplete({
  cities = [],
  value = '',
  onChange,
  placeholder = 'Search city...',
  label = 'City',
  error = false,
  icon: Icon = FaMapMarkerAlt,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef(null);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter cities based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredCities(cities);
    } else {
      const filtered = cities.filter(city =>
        city.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [inputValue, cities]);

  const handleInputChange = e => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    onChange(newValue);
  };

  const handleSelectCity = city => {
    setInputValue(city);
    onChange(city);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 uppercase">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
        )}

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 hover:outline-none focus:outline-none transition-all ${
            error ? 'border-error-500 ring-2 ring-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          autoComplete="off"
        />

        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <FaTimes />
          </button>
        )}

        {/* Dropdown */}
        {isOpen && filteredCities.length > 0 && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCities.map((city, index) => (
              <div
                key={index}
                onClick={() => handleSelectCity(city)}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-2"
              >
                <FaMapMarkerAlt className="text-gray-400 text-sm" />
                <span className="text-gray-700">{city}</span>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {isOpen && filteredCities.length === 0 && inputValue && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="px-4 py-3 text-gray-500 text-sm text-center">
              No cities found
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

CityAutocomplete.propTypes = {
  cities: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.bool,
  icon: PropTypes.elementType,
  disabled: PropTypes.bool,
};
