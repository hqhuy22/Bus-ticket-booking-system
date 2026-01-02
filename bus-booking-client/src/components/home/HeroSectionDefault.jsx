import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaBus, FaExchangeAlt, FaList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DateInput from '../input/DateInput';
import CityAutocomplete from '../input/CityAutocomplete';
import { backgroundSource1, backgroundSource2 } from '../../utils/index.js';
import VN_CITIES from '../../utils/vnCities.js';
import { BookingActions } from '../../redux/Booking-slice.jsx';

export default function HeroSectionDefault() {
  const current = new Date();
  const [departureStation, setDepartureStation] = useState('');
  const [arrivalStation, setArrivalStation] = useState('');
  const [journeyDate, setJourneyDate] = useState(
    current.toISOString().split('T')[0]
  );
  // stations list comes from VN_CITIES directly
  const navigation = useNavigate();
  const Theme = useSelector(state => state.theme.lightTheme);
  const [errors, setErrors] = useState({});
  const [backgroundImage, setBackgroundImage] = useState(backgroundSource1);
  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundImage(prevImage =>
        prevImage === backgroundSource1 ? backgroundSource2 : backgroundSource1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // no setup required; VN_CITIES used directly

  // selection is fixed from VN_CITIES; no live filtering needed

  const handleSubmit = event => {
    event.preventDefault();

    let formErrors = {};
    if (!journeyDate) {
      formErrors.journeyDate = true;
    }
    if (!arrivalStation) {
      formErrors.arrivalStation = true;
    }
    if (!departureStation) {
      formErrors.departureStation = true;
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    dispatch(
      BookingActions.findBus({ departureStation, arrivalStation, journeyDate })
    );
    console.log({ departureStation, arrivalStation, journeyDate });
    navigation(`/bus-booking/search-buses`, {
      state: {
        pickupPoint: departureStation,
        droppingPoint: arrivalStation,
        departureDate: journeyDate,
      },
    });
  };

  const swapStations = () => {
    setDepartureStation(arrivalStation);
    setArrivalStation(departureStation);
  };

  const handleSeeAllTrips = () => {
    // Navigate to search page with empty filters to show all available trips
    navigation('/bus-booking/search-buses', {
      state: {
        pickupPoint: '',
        droppingPoint: '',
        departureDate: '',
        showAllTrips: true,
      },
    });
  };

  return (
    <div className={`min-h-screen `}>
      <div
        className={`relative h-[60vh] flex items-center justify-center px-2 ${Theme ? 'text-white' : 'text-primary'} `}
      >
        <div
          className="absolute inset-0 bg-cover bg-center z-0 "
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundBlendMode: 'overlay',
          }}
        >
          <div
            className={`absolute inset-0 ${Theme ? 'bg-black/50 ' : 'bg-white/50 '}`}
          ></div>
        </div>

        <div className="z-10 text-center cursor-pointer">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            Explore Viet Nam
          </h1>
          <p className="text-xl md:text-2xl">
            Discover the beauty of Viet Nam with our bus services
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 -mt-24 relative z-20  ">
        <div
          className={` ${Theme ? 'bg-white' : 'bg-gray-800'} rounded-md shadow-lg p-6 md:p-8   cursor-pointer border-2 border-gray-200`}
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center text-info-600">
            Book Your Bus Tickets in Viet Nam
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 md:space-y-0 md:grid md:grid-cols-4 md:gap-4"
          >
            <CityAutocomplete
              cities={VN_CITIES}
              value={departureStation}
              onChange={setDepartureStation}
              placeholder="Select departure city"
              label="FROM"
              error={errors.departureStation}
              icon={FaMapMarkerAlt}
            />

            <CityAutocomplete
              cities={VN_CITIES}
              value={arrivalStation}
              onChange={setArrivalStation}
              placeholder="Select arrival city"
              label="TO"
              error={errors.arrivalStation}
              icon={FaMapMarkerAlt}
            />

            <DateInput
              value={journeyDate}
              onChange={e => setJourneyDate(e.target.value)}
              error={errors.journeyDate}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Action
              </label>
              <button
                type="submit"
                className="w-full bg-info-600 hover:bg-info-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <FaBus className="h-5 w-5" />
                Find Buses
              </button>
            </div>
          </form>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={swapStations}
              className="text-info-500 hover:text-info-600 flex items-center gap-1"
            >
              <FaExchangeAlt className="h-4 w-4" />
              Swap Stations
            </button>
            <button
              onClick={handleSeeAllTrips}
              className="text-info-500 hover:text-info-600 flex items-center gap-1 transition-colors"
            >
              <FaList className="h-4 w-4" />
              See all trips
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
