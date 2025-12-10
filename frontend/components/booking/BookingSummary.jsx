import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "../../utils/pricingCalculator";
import PropTypes from "prop-types";

export default function BookingSummary({
  bookingData,
  onProceedToPayment,
  onGoBack,
  isLoading = false,
  pickupPoint,
  dropoffPoint,
  showActions = true,
}) {
  const [agreed, setAgreed] = useState(false);

  if (!bookingData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No booking data available</p>
      </div>
    );
  }

  const {
    schedule,
    seatNumbers = [],
    passengers = [],
    pricing = {},
    lockExpiresAt,
  } = bookingData;
  const {
    busFare = 0,
    convenienceFee = 0,
    bankCharge = 0,
    totalPay = 0,
  } = pricing;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="text-info-500" size={24} />
          Trip Details
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">From</p>
            <p className="text-lg font-semibold text-gray-800">
              {schedule?.departure || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">To</p>
            <p className="text-lg font-semibold text-gray-800">
              {schedule?.arrival || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar size={16} /> Journey Date
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {schedule?.journeyDate || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Clock size={16} /> Departure Time
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {schedule?.departureTime || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Bus Route</p>
            <p className="text-lg font-semibold text-gray-800">
              {schedule?.routeName ||
                (schedule?.routeNo ? `Route #${schedule.routeNo}` : "N/A")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Depot</p>
            <p className="text-lg font-semibold text-gray-800">
              {schedule?.depotName || "N/A"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Pickup</p>
            <p className="text-lg font-semibold text-gray-800">
              {bookingData.pickupPoint || pickupPoint || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Drop-off</p>
            <p className="text-lg font-semibold text-gray-800">
              {bookingData.dropoffPoint || dropoffPoint || "N/A"}
            </p>
          </div>
        </div>

        {typeof lockExpiresAt === "number" && (
          <div className="mt-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
            Seat lock active. Time remaining: {lockExpiresAt} seconds.
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="text-info-500" size={24} />
          Passenger Information
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Selected Seats</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {seatNumbers.map((seat, index) => (
              <span
                key={index}
                className="bg-blue-100 text-info-800 px-3 py-1 rounded-full font-semibold"
              >
                Seat {seat}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {passengers.map((passenger, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-info-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {passenger.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Seat {passenger.seatNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Age:</span>
                  <span className="ml-2 font-medium">{passenger.age}</span>
                </div>
                <div>
                  <span className="text-gray-600">Gender:</span>
                  <span className="ml-2 font-medium capitalize">
                    {passenger.gender}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2 font-medium">{passenger.phone}</span>
                </div>
                {passenger.email && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{passenger.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard className="text-info-500" size={24} />
          Price Breakdown
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Bus Fare ({seatNumbers.length} seat
              {seatNumbers.length > 1 ? "s" : ""})
            </span>
            <span className="font-semibold">{formatCurrency(busFare)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Convenience Fee</span>
            <span className="font-semibold">
              {formatCurrency(convenienceFee)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Bank Charges</span>
            <span className="font-semibold">{formatCurrency(bankCharge)}</span>
          </div>
          <div className="border-t border-gray-300 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">
                Total Amount
              </span>
              <span className="text-2xl font-bold text-info-600">
                {formatCurrency(totalPay)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showActions && (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Important Information
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>
                    Please arrive at the bus stop 15 minutes before departure
                  </li>
                  <li>
                    Carry a valid ID proof for verification during the journey
                  </li>
                  <li>
                    Cancellations must be made at least 2 hours before departure
                  </li>
                  <li>Refunds will be processed within 5-7 business days</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-info-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I agree to the{" "}
                <a href="#" className="text-info-600 hover:underline">
                  Terms and Conditions
                </a>{" "}
                and confirm that all passenger information provided is accurate.
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onGoBack}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={onProceedToPayment}
              disabled={!agreed || isLoading}
              className="flex-1 px-6 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

BookingSummary.propTypes = {
  bookingData: PropTypes.object,
  onProceedToPayment: PropTypes.func,
  onGoBack: PropTypes.func,
  isLoading: PropTypes.bool,
  pickupPoint: PropTypes.string,
  dropoffPoint: PropTypes.string,
  showActions: PropTypes.bool,
};
