import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBus } from 'react-icons/fa';
import CityAutocomplete from '../input/CityAutocomplete';
import VN_CITIES from '../../utils/vnCities';

export default function SearchForm() {
  const [pickupPoint, setPickupPoint] = useState('');
  const [droppingPoint, setDroppingPoint] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleSearch = e => {
    e.preventDefault();

    // Validation
    let formErrors = {};
    if (!pickupPoint) formErrors.pickupPoint = true;
    if (!droppingPoint) formErrors.droppingPoint = true;
    if (!departureDate) formErrors.departureDate = true;

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    navigate('/bus-booking/search-buses', {
      state: { pickupPoint, droppingPoint, departureDate },
    });
  };

  // Get tomorrow's date as minimum
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Choose Your Ticket
      </h3>
      <form onSubmit={handleSearch} className="space-y-4">
        <CityAutocomplete
          cities={VN_CITIES}
          value={pickupPoint}
          onChange={setPickupPoint}
          placeholder="Select pickup city"
          label="From"
          error={errors.pickupPoint}
        />

        <CityAutocomplete
          cities={VN_CITIES}
          value={droppingPoint}
          onChange={setDroppingPoint}
          placeholder="Select dropping city"
          label="To"
          error={errors.droppingPoint}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 uppercase">
            Journey Date
          </label>
          <input
            type="date"
            value={departureDate}
            onChange={e => {
              setDepartureDate(e.target.value);
              setErrors(prev => ({ ...prev, departureDate: false }));
            }}
            min={getTomorrowDate()}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none ${
              errors.departureDate
                ? 'border-error-500 ring-2 ring-error-500'
                : 'border-gray-300'
            }`}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-info-600 text-white py-3 rounded-lg font-semibold hover:bg-info-700 transition-colors flex items-center justify-center gap-2"
        >
          <FaBus />
          Find Tickets
        </button>
      </form>
    </div>
  );
}
