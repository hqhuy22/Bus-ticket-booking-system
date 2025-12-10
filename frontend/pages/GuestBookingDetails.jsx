import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";

export default function GuestBookingDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking } = location.state || {};

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No Booking Found
          </h1>
          <p className="text-gray-600 mb-6">
            Please search for your booking first.
          </p>
          <button
            onClick={() => navigate("/bus-booking/guest-lookup")}
            className="px-6 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700"
          >
            Search for Booking
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Loader,
        label: "Pending Payment",
      },
      confirmed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Confirmed",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircle,
        label: "Cancelled",
      },
      expired: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: XCircle,
        label: "Expired",
      },
      completed: {
        bg: "bg-blue-100",
        text: "text-info-800",
        icon: CheckCircle,
        label: "Completed",
      },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}
      >
        <Icon size={16} />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/bus-booking/guest-lookup")}
            className="flex items-center gap-2 text-info-600 hover:text-info-700 mb-4"
          >
            <ArrowLeft size={20} />
            Search Another Booking
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Booking Details
              </h1>
              <p className="text-gray-600 mt-1">
                Reference: {booking.bookingReference}
              </p>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Journey Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-start gap-3">
                <MapPin className="text-info-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Route</p>
                  <p className="font-semibold text-gray-800">
                    {booking.departure} → {booking.arrival}
                  </p>
                  {booking.schedule?.route?.routeName && (
                    <p className="text-sm text-gray-600">
                      {booking.schedule.route.routeName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3">
                <Calendar className="text-info-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Journey Date</p>
                  <p className="font-semibold text-gray-800">
                    {formatDate(booking.journeyDate)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3">
                <Clock className="text-info-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Departure Time</p>
                  <p className="font-semibold text-gray-800">
                    {booking.booking_startTime}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3">
                <Clock className="text-info-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Arrival Time</p>
                  <p className="font-semibold text-gray-800">
                    {booking.booking_endTime}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(booking.pickupPoint || booking.dropoffPoint) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.pickupPoint && (
                  <div>
                    <p className="text-sm text-gray-600">Pickup Point</p>
                    <p className="font-semibold text-gray-800">
                      {booking.pickupPoint}
                    </p>
                  </div>
                )}
                {booking.dropoffPoint && (
                  <div>
                    <p className="text-sm text-gray-600">Drop-off Point</p>
                    <p className="font-semibold text-gray-800">
                      {booking.dropoffPoint}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={24} />
            Passenger Details
          </h2>
          <div className="space-y-4">
            {booking.passengers &&
              booking.passengers.map((passenger, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 bg-blue-100 text-info-600 rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {passenger.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      • Seat {passenger.seatNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-10 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Age</p>
                      <p className="font-medium">{passenger.age}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Gender</p>
                      <p className="font-medium capitalize">
                        {passenger.gender}
                      </p>
                    </div>
                    {passenger.phone && (
                      <div>
                        <p className="text-xs text-gray-600">Phone</p>
                        <p className="font-medium">{passenger.phone}</p>
                      </div>
                    )}
                    {passenger.email && (
                      <div>
                        <p className="text-xs text-gray-600">Email</p>
                        <p className="font-medium">{passenger.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Payment Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="p-4 border rounded-lg">
              <p className="text-gray-500 text-xs">Base Fare</p>
              <p className="text-lg font-semibold">
                {booking.payment_busFare?.toLocaleString()} ₫
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-gray-500 text-xs">Convenience Fee</p>
              <p className="text-lg font-semibold">
                {booking.payment_convenienceFee?.toLocaleString()} ₫
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-gray-500 text-xs">Total Paid</p>
              <p className="text-lg font-semibold text-info-700">
                {booking.payment_totalPay?.toLocaleString()} ₫
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
