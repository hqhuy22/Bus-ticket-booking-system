// minimal summary card - no local expand state
import PropTypes from 'prop-types';
import { QTechyBusDemo } from '../../utils/index.js';
import TextCard from './TextCard.jsx';
// ...existing imports...
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../button/Button.jsx';
import { formatCurrency } from '../../utils/pricingCalculator';

export default function BusBookingCard({ schedule, onViewDetails }) {
  const location = useLocation();
  const BookButton = location.pathname === '/bus-booking/search-buses';
  const navigation = useNavigate();
  // no local expanded view; full details live in the modal

  const handleClick = () => {
    // Navigate to seat selection for booking
    if (BookButton && schedule) {
      navigation('/bus-booking/seat-selection', { state: { schedule } });
    } else {
      navigation('/bus-booking/search-buses');
    }
  };

  // Use schedule data if provided, otherwise fall back to demo data
  const departureInfo = schedule
    ? [
        { title: 'Departure', description: schedule.departure_city },
        { title: 'Date', description: schedule.departure_date },
        { title: 'Time', description: schedule.departure_time },
      ]
    : [
        { title: 'Departure  ', description: 'COLOMBO' },
        { title: 'Date  ', description: '2025-01-12' },
        { title: 'Time  ', description: '16:00' },
      ];

  const arrivalInfo = schedule
    ? [
        { title: 'Arrival', description: schedule.arrival_city },
        { title: 'Date', description: schedule.arrival_date },
        { title: 'Time', description: schedule.arrival_time },
      ]
    : [
        { title: 'Arrival  ', description: 'JAFFNA' },
        { title: 'Date', description: '2025-01-13' },
        { title: 'Time', description: '02:00' },
      ];

  // removed expanded busInfo and scheduleDetails from summary card

  // Ensure price is a number (backend may send string). Use safe default when parsing fails.
  const _rawPrice = schedule?.price ?? 1378.0;
  const _parsedPrice =
    typeof _rawPrice === 'string'
      ? parseFloat(_rawPrice.replace(/,/g, ''))
      : Number(_rawPrice);
  const price = Number.isFinite(_parsedPrice) ? _parsedPrice : 1378.0;
  const availableSeats = schedule?.availableSeats || 40;
  const duration = schedule?.duration || '10:00';
  const routeNo = schedule?.routeNo || 87;

  return (
    <div
      className={`flex flex-col w-full max-w-full justify-items-start rounded-xl`}
    >
      <div className={`flex flex-col shadow-md rounded-xl shadow-gray-300`}>
        <div
          className={`flex justify-between bg-info-500 rounded-t-xl py-2 px-6 border-b-[6px] border-tertiary text-white w-full`}
        >
          <h2 className={`capitalize cursor-pointer text-sm tracking-wider`}>
            stops@
            <span className="font-semibold">
              {schedule?.departure_city || 'Colombo'}
            </span>
          </h2>
          <h2 className={`capitalize  cursor-pointer text-sm tracking-wider`}>
            Route No <span className="font-semibold">{routeNo}</span>
          </h2>
        </div>
        <main
          className={`flex sm:flex-row flex-col py-4 sm:px-6 px-4 justify-start items-start xl:gap-8 gap-4 min-h-16 shadow-lg w-full`}
        >
          <div className={`sm:flex hidden justify-start items-center`}>
            <img
              src={QTechyBusDemo}
              className={`sm:flex hidden object-cover object-center cursor-pointer transition-all duration-500 ease-linear delay-75 rounded-lg md:h-[150px] h-24  md:w-[150px] w-24 lg:mr-0 mr-4`}
            />
            <div className={`flex-grow flex flex-col justify-center w-full`}>
              <div className="flex sm:min-w-fit w-full sm:flex-row flex-col 2xl:space-x-16 lg:space-x-6 md:space-x-14">
                <div
                  className={`flex flex-row justify-items-start relative lg:space-x-16 space-x-10`}
                >
                  <TextCard arr={departureInfo} />
                  <div
                    className={`lg:min-w-20 lg:h-6 min-w-16 h-4 bg-tertiary clip-path-triangle rotate-90 absolute lg:translate-y-12 lg:translate-x-8 translate-y-16 translate-x-3 cursor-pointer`}
                  ></div>
                  <TextCard arr={arrivalInfo} />
                </div>
                {/* condensed: full bus/model/depot details are available in View Details modal */}
                <div
                  className={`flex flex-col justify-start items-start  space-y-2`}
                >
                  <h1
                    className={`sm:text-xl text-sm font-bold tracking-wider cursor-pointer leading-8 text-info-800 sm:text-right text-center min-w-full`}
                  >
                    {formatCurrency(price)}
                  </h1>
                  <ul
                    className={`flex  sm:text-xl cursor-pointer  sm:justify-end justify-center items-center min-w-full`}
                  >
                    <li
                      className={`sm:max-w-[50%] max-w-[30%] sm:text-base text-sm leading-4 font-normal`}
                    >
                      {' '}
                      Available Seats
                    </li>
                    <li
                      className={`sm:text-3xl text-xl  text-tertiary border-l-2 border-tertiary pl-4 font-semibold tracking-wider`}
                    >
                      {availableSeats}
                    </li>
                  </ul>
                </div>
              </div>

              <div
                className={`flex justify-between w-full items-center sm:flex-row flex-col gap-4 sm:pl-4 sm:pt-0 pt-2`}
              >
                <h1
                  className={`sm:text-sm text-xs tracking-wider font-normal cursor-pointer`}
                >
                  Duration:{' '}
                  <span className={`font-semibold sm:text-base text-sm`}>
                    {duration} Hours
                  </span>
                </h1>
                <div className="flex gap-2">
                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(schedule)}
                      className="px-4 py-2 bg-info-600 text-white rounded hover:bg-info-700 transition-colors text-sm font-semibold"
                    >
                      View Details
                    </button>
                  )}
                  <Button
                    Icon={true}
                    label={BookButton ? `Book Now` : `Hide`}
                    onClick={handleClick}
                    className="bg-tertiary  bg-opacity-75 text-opacity-100 hover:bg-opacity-90 active:bg-opacity-100"
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            className={`sm:hidden flex justify-start items-start w-full gap-2`}
          >
            <div className={`flex flex-col justify-end space-y-1 `}>
              <div
                className={`flex flex-row justify-items-start relative space-x-10 `}
              >
                <TextCard arr={departureInfo} />
                <div
                  className={`min-w-24 h-3 bg-tertiary clip-path-triangle rotate-90 absolute translate-y-14  translate-x-2  cursor-pointer`}
                ></div>
                <TextCard arr={arrivalInfo} />
              </div>
              <h1
                className={`text-sm tracking-wider font-normal cursor-pointer p-2 text-center`}
              >
                Duration:{' '}
                <span className={`font-semibold`}>{duration} Hours</span>
              </h1>
            </div>
            <div className={`flex flex-row justify-end flex-grow w-full`}>
              <div className="space-y-1 border-l-2 pl-4 border-black">
                <ul className={`flex flex-col  text-black space-y-2`}>
                  <li className={`flex justify-start items-start flex-col   `}>
                    <h2
                      className={`text-sm  font-bold uppercase cursor-pointer leading-6 tracking-widest`}
                    >
                      {formatCurrency(price)}
                    </h2>
                  </li>
                  <li className={`flex justify-start items-start flex-col  `}>
                    <p
                      className={`text-xs  tracking-wide cursor-pointer capitalize`}
                    >
                      Available Seats
                    </p>
                    <h2
                      className={`text-sm  font-bold uppercase cursor-pointer leading-6 tracking-widest`}
                    >
                      {availableSeats}
                    </h2>
                  </li>
                </ul>
                <div
                  className={`flex justify-between w-full items-center sm:flex-row flex-col gap-4`}
                >
                  <Button
                    Icon={true}
                    label={BookButton ? `Book Now` : `Hide`}
                    onClick={handleClick}
                    className="bg-tertiary  bg-opacity-75 text-opacity-100 hover:bg-opacity-90 active:bg-opacity-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
        <div
          className={`flex justify-end items-end w-full py-2 px-6 bg-gray-800 text-white rounded-b-xl`}
        >
          <button className={`text-sm tracking-wider cursor-pointer`}>
            Boarding/Dropping Points
          </button>
        </div>
      </div>
    </div>
  );
}

BusBookingCard.propTypes = {
  schedule: PropTypes.shape({
    id: PropTypes.number,
    routeNo: PropTypes.number,
    departure_city: PropTypes.string,
    departure_date: PropTypes.string,
    departure_time: PropTypes.string,
    arrival_city: PropTypes.string,
    arrival_date: PropTypes.string,
    arrival_time: PropTypes.string,
    duration: PropTypes.string,
    busType: PropTypes.string,
    model: PropTypes.string,
    busScheduleID: PropTypes.string,
    depotName: PropTypes.string,
    bookingClosingDate: PropTypes.string,
    bookingClosingTime: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    availableSeats: PropTypes.number,
  }),
  onViewDetails: PropTypes.func,
};
