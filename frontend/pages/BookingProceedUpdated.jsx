import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import PassengerForm from "../components/booking/PassengerForm";
import GuestInfoForm from "../components/booking/GuestInfoForm";
import BookingSummary from "../components/booking/BookingSummary";
import axiosInstance from "../utils/axiosConfig";
import { calculateBookingPrice } from "../utils/pricingCalculator";

export default function BookingProceedUpdated() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule, selectedSeats = [], sessionId } = location.state || {};

  const normalizedSchedule = useMemo(() => {
    if (!schedule) return null;
    return {
      departure:
        schedule.departure || schedule.departure_city || schedule.from || null,
      arrival: schedule.arrival || schedule.arrival_city || schedule.to || null,
      departureTime:
        schedule.departureTime ||
        schedule.departure_time ||
        schedule.booking_startTime ||
        null,
      arrivalTime:
        schedule.arrivalTime ||
        schedule.arrival_time ||
        schedule.booking_endTime ||
        null,
      journeyDate:
        schedule.journeyDate ||
        schedule.departureDate ||
        schedule.departure_date ||
        null,
      routeNo: schedule.routeNo || schedule.route_no || schedule.routeNo,
      depotName:
        schedule.depotName || schedule.depot_name || schedule.depotName || null,
      price: schedule.price || schedule.fare || 0,
      id: schedule.id,
    };
  }, [schedule]);

  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(null);
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");
  const [routeStops, setRouteStops] = useState([]);
  const [routeName, setRouteName] = useState(
    () => normalizedSchedule?.routeName || ""
  );

  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || document.cookie.includes("token=");
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);
    if (!loggedIn) setIsGuestCheckout(true);
  }, []);

  useEffect(() => {
    if (!schedule || !selectedSeats || selectedSeats.length === 0) {
      alert("No booking data found. Please select seats first.");
      navigate("/bus-booking/search-buses");
    }
  }, [schedule, selectedSeats, navigate]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.__skipSeatRelease) {
        window.__skipSeatRelease(false);
      }
    };
  }, []);

  const fetchStops = async () => {
    try {
      const routeId =
        schedule?.routeId ||
        schedule?.route ||
        normalizedSchedule?.routeId ||
        null;
      if (!routeId) return;
      const res = await axiosInstance.get(`/api/route/${routeId}`);
      const route = res.data || {};
      const stops = route.stops || [];
      setRouteStops(stops);
      if (route.routeName) setRouteName(route.routeName);

      const pickupStops = stops.filter(
        (s) => !s.stopType || s.stopType === "pickup" || s.stopType === "both"
      );
      const dropoffStops = stops.filter(
        (s) => !s.stopType || s.stopType === "dropoff" || s.stopType === "both"
      );
      if (!pickupPoint && pickupStops.length > 0)
        setPickupPoint(pickupStops[0].stopName || "");
      else if (!pickupPoint && stops.length > 0)
        setPickupPoint(stops[0].stopName || "");
      if (!dropoffPoint && dropoffStops.length > 0)
        setDropoffPoint(dropoffStops[dropoffStops.length - 1].stopName || "");
      else if (!dropoffPoint && stops.length > 0)
        setDropoffPoint(stops[stops.length - 1].stopName || "");
    } catch (err) {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchStops();
  }, [schedule, normalizedSchedule]);

  useEffect(() => {
    if (!sessionId) return;
    const checkLockStatus = async () => {
      try {
        const response = await axiosInstance.get(`/api/seats/my-locks`, {
          params: { sessionId },
        });
        const locks = response.data.locks || [];
        if (locks.length > 0) {
          const firstLock = locks[0];
          const expiresAt = new Date(firstLock.expiresAt);
          const now = new Date();
          const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setLockTimeRemaining(timeLeft);
        }
      } catch (error) {
        /* ignore */
      }
    };
    checkLockStatus();
    const interval = setInterval(checkLockStatus, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handlePassengersChange = (updatedPassengers) =>
    setPassengers(updatedPassengers);
  const handleGuestInfoChange = (updatedGuestInfo) =>
    setGuestInfo(updatedGuestInfo);

  const validateAndProceed = () => {
    const allValid = passengers.every(
      (p) => p.name && p.age && p.gender && p.phone
    );
    if (!allValid) {
      alert("Please fill in all required passenger details");
      return;
    }
    if (isGuestCheckout) {
      if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
        alert("Please fill in your contact information");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
        alert("Please enter a valid email address");
        return;
      }
      if (!/^\+?[\d\s-()]+$/.test(guestInfo.phone)) {
        alert("Please enter a valid phone number");
        return;
      }
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateBooking = async () => {
    try {
      setLoading(true);
      const pricing = calculateBookingPrice(
        schedule?.price || 0,
        selectedSeats?.length || 0
      );
      const bookingData = {
        busScheduleId: normalizedSchedule?.id || schedule.id,
        routeNo: normalizedSchedule?.routeNo || schedule.routeNo,
        departure: normalizedSchedule?.departure,
        arrival: normalizedSchedule?.arrival,
        depotName: normalizedSchedule?.depotName || "Main Depot",
        seatNumbers: selectedSeats,
        booking_startTime: normalizedSchedule?.departureTime,
        booking_endTime: normalizedSchedule?.arrivalTime,
        journeyDate:
          normalizedSchedule?.journeyDate ||
          schedule?.departureDate ||
          new Date().toISOString().split("T")[0],
        passengers,
        payment_busFare: pricing.busFare,
        payment_convenienceFee: pricing.convenienceFee,
        payment_bankCharge: pricing.bankCharge,
        payment_totalPay: pricing.totalPay,
        sessionId,
      };
      if (pickupPoint) bookingData.pickupPoint = pickupPoint;
      if (dropoffPoint) bookingData.dropoffPoint = dropoffPoint;

      let response;
      if (isGuestCheckout) {
        bookingData.guestInfo = guestInfo;
        response = await axiosInstance.post("/api/bookings/guest", bookingData);
      } else {
        response = await axiosInstance.post("/api/bookings", bookingData);
      }

      const booking = response.data.booking;
      navigate("/bus-booking/payment", {
        state: {
          booking,
          schedule: normalizedSchedule || schedule,
          passengers,
          totalAmount: pricing.totalPay,
          isGuest: isGuestCheckout,
          guestInfo: isGuestCheckout ? guestInfo : null,
        },
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to create booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const previewPricing = calculateBookingPrice(
    schedule?.price || 0,
    selectedSeats?.length || 0
  );
  const bookingData = {
    schedule: {
      ...normalizedSchedule,
      routeName: routeName || normalizedSchedule?.routeName || null,
      journeyDate:
        normalizedSchedule?.journeyDate ||
        schedule?.departureDate ||
        new Date().toISOString().split("T")[0],
    },
    seatNumbers: selectedSeats,
    passengers,
    pricing: {
      busFare: previewPricing.busFare,
      convenienceFee: previewPricing.convenienceFee,
      bankCharge: previewPricing.bankCharge,
      totalPay: previewPricing.totalPay,
    },
    pickupPoint,
    dropoffPoint,
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Complete Your Booking
            </h1>
            {lockTimeRemaining !== null && (
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded">
                <Clock size={16} /> Seat lock expires in{" "}
                {formatTime(lockTimeRemaining)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              className="flex items-center gap-1 text-info-600"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Back to Seat Selection
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <>
                <PassengerForm
                  seatNumbers={selectedSeats}
                  onPassengersChange={handlePassengersChange}
                />
                {isGuestCheckout && (
                  <GuestInfoForm onGuestInfoChange={handleGuestInfoChange} />
                )}
              </>
            )}

            {step === 2 && (
              <BookingSummary
                bookingData={bookingData}
                onProceedToPayment={handleCreateBooking}
                onGoBack={() => setStep(1)}
                isLoading={loading}
                pickupPoint={pickupPoint}
                dropoffPoint={dropoffPoint}
              />
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Stops
              </h3>
              {routeStops.length === 0 ? (
                <p className="text-sm text-gray-600">No stops available</p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-700">
                  {routeStops.map((stop, idx) => (
                    <li
                      key={`${stop.stopName}-${idx}`}
                      className="flex items-center gap-2"
                    >
                      <span className="w-6 h-6 rounded-full bg-info-100 text-info-700 flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </span>
                      <span>{stop.stopName}</span>
                      {stop.stopType && (
                        <span className="text-xs text-gray-500">
                          ({stop.stopType})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {step === 1 && (
              <div className="bg-white rounded-lg shadow p-4 space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Pickup & Drop-off
                </h3>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Pickup
                  </label>
                  <select
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">Select pickup</option>
                    {(routeStops.length > 0
                      ? routeStops
                      : [{ stopName: normalizedSchedule?.departure }]
                    ).map((stop, idx) => (
                      <option
                        key={`${stop.stopName}-${idx}`}
                        value={stop.stopName}
                      >
                        {stop.stopName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Drop-off
                  </label>
                  <select
                    value={dropoffPoint}
                    onChange={(e) => setDropoffPoint(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">Select drop-off</option>
                    {(routeStops.length > 0
                      ? routeStops
                      : [{ stopName: normalizedSchedule?.arrival }]
                    ).map((stop, idx) => (
                      <option
                        key={`${stop.stopName}-${idx}`}
                        value={stop.stopName}
                      >
                        {stop.stopName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Checkout</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Seats</span>
                <span className="font-semibold">{selectedSeats.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estimated Total</span>
                <span className="font-semibold">
                  {previewPricing.totalPay.toLocaleString()} ₫
                </span>
              </div>
              {step === 1 && (
                <button
                  type="button"
                  onClick={validateAndProceed}
                  className="w-full py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors font-semibold"
                >
                  Continue
                  <ArrowRight className="inline ml-2" size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
