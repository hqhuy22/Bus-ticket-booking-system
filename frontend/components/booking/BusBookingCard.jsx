import PropTypes from "prop-types";
import TextCard from "./TextCard.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../button/Button.jsx";
import { formatCurrency } from "../../utils/pricingCalculator";

export default function BusBookingCard({ schedule, onViewDetails }) {
  const location = useLocation();
  const isSearchPage = location.pathname === "/bus-booking/search-buses";
  const navigation = useNavigate();

  const handleBookNow = () => {
    if (isSearchPage && schedule) {
      navigation("/bus-booking/seat-selection", { state: { schedule } });
      return;
    }
    navigation("/bus-booking/search-buses");
  };

  const handleViewDetails = () => {
    if (!schedule?.id) return;
    if (typeof onViewDetails === "function") {
      onViewDetails(schedule);
      return;
    }
    navigation(`/bus-booking/trips/${schedule.id}`, { state: { schedule } });
  };

  const departureInfo = schedule
    ? [
        { title: "Departure", description: schedule.departure_city },
        { title: "Date", description: schedule.departure_date },
        { title: "Time", description: schedule.departure_time },
      ]
    : [];

  const arrivalInfo = schedule
    ? [
        { title: "Arrival", description: schedule.arrival_city },
        { title: "Date", description: schedule.arrival_date },
        { title: "Time", description: schedule.arrival_time },
      ]
    : [];

  const rawPrice = schedule?.price ?? 0;
  const parsedPrice =
    typeof rawPrice === "string"
      ? parseFloat(rawPrice.replace(/,/g, ""))
      : Number(rawPrice);
  const price = Number.isFinite(parsedPrice) ? parsedPrice : 0;

  const availableSeats = schedule?.availableSeats || 0;
  const duration = schedule?.duration || "";
  const routeNo = schedule?.routeNo || "";

  return (
    <div className="flex flex-col w-full max-w-full justify-items-start rounded-xl">
      <div className="flex flex-col shadow-md rounded-xl shadow-gray-300">
        <div className="flex justify-between bg-info-500 rounded-t-xl py-2 px-6 border-b-[6px] border-tertiary text-white w-full">
          <h2 className="capitalize cursor-pointer text-sm tracking-wider">
            From{" "}
            <span className="font-semibold">{schedule?.departure_city}</span>
          </h2>
          <h2 className="capitalize cursor-pointer text-sm tracking-wider">
            Route No <span className="font-semibold">{routeNo}</span>
          </h2>
        </div>

        <main className="flex sm:flex-row flex-col py-4 sm:px-6 px-4 justify-start items-start xl:gap-8 gap-4 min-h-16 shadow-lg w-full">
          <div className="flex-grow flex flex-col justify-center w-full">
            <div className="flex sm:min-w-fit w-full sm:flex-row flex-col 2xl:space-x-16 lg:space-x-6 md:space-x-14">
              <div className="flex flex-row justify-items-start relative lg:space-x-16 space-x-10">
                <TextCard arr={departureInfo} />
                <div className="lg:min-w-20 lg:h-6 min-w-16 h-4 bg-tertiary clip-path-triangle rotate-90 absolute lg:translate-y-12 lg:translate-x-8 translate-y-16 translate-x-3" />
                <TextCard arr={arrivalInfo} />
              </div>

              <div className="flex flex-col justify-start items-start space-y-2">
                <h1 className="sm:text-xl text-sm font-bold tracking-wider leading-8 text-info-800 sm:text-right text-center min-w-full">
                  {formatCurrency(price)}
                </h1>
                <ul className="flex sm:text-xl sm:justify-end justify-center items-center min-w-full">
                  <li className="sm:max-w-[50%] max-w-[30%] sm:text-base text-sm leading-4 font-normal">
                    Available Seats
                  </li>
                  <li className="sm:text-3xl text-xl text-tertiary border-l-2 border-tertiary pl-4 font-semibold tracking-wider">
                    {availableSeats}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between w-full items-center sm:flex-row flex-col gap-4 sm:pl-4 sm:pt-0 pt-2">
              <h1 className="sm:text-sm text-xs tracking-wider font-normal">
                Duration:{" "}
                <span className="font-semibold sm:text-base text-sm">
                  {duration} Hours
                </span>
              </h1>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleViewDetails}
                  className="px-4 py-2 bg-info-600 text-white rounded hover:bg-info-700 transition-colors text-sm font-semibold"
                >
                  View Details
                </button>
                <Button
                  Icon={true}
                  label={isSearchPage ? "Book Now" : "Back"}
                  onClick={handleBookNow}
                  className="bg-tertiary bg-opacity-75 text-opacity-100 hover:bg-opacity-90 active:bg-opacity-100"
                />
              </div>
            </div>
          </div>
        </main>

        <div className="flex justify-end items-end w-full py-2 px-6 bg-gray-800 text-white rounded-b-xl">
          <button type="button" className="text-sm tracking-wider">
            Boarding/Dropping Points
          </button>
        </div>
      </div>
    </div>
  );
}

BusBookingCard.propTypes = {
  schedule: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    routeNo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    departure_city: PropTypes.string,
    departure_date: PropTypes.string,
    departure_time: PropTypes.string,
    arrival_city: PropTypes.string,
    arrival_date: PropTypes.string,
    arrival_time: PropTypes.string,
    duration: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    availableSeats: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onViewDetails: PropTypes.func,
};
