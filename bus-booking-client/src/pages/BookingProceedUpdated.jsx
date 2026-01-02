import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import PassengerForm from '../components/booking/PassengerForm';
import GuestInfoForm from '../components/booking/GuestInfoForm';
import BookingSummary from '../components/booking/BookingSummary';
import axiosInstance from '../utils/axiosConfig';
import { calculateBookingPrice } from '../utils/pricingCalculator';

/**
 * Updated Booking Proceed Page
 * Handles passenger information collection and booking creation
 */
export default function BookingProceedUpdated() {
  const location = useLocation();
  const navigate = useNavigate();

  const { schedule, selectedSeats, sessionId } = location.state || {};

  // Normalize schedule keys because different components use different naming conventions
  const normalizedSchedule = useMemo(() => {
    if (!schedule) return null;
    return {
      // departure/arrival names
      departure:
        schedule.departure || schedule.departure_city || schedule.from || null,
      arrival: schedule.arrival || schedule.arrival_city || schedule.to || null,
      // times and dates
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
      // other useful fields
      routeNo: schedule.routeNo || schedule.route_no || schedule.routeNo,
      depotName:
        schedule.depotName || schedule.depot_name || schedule.depotName || null,
      price: schedule.price || schedule.fare || 0,
      id: schedule.id,
    };
  }, [schedule]);

  const [step, setStep] = useState(1); // 1: Passenger Info, 2: Review & Confirm
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(null);
  // Start with empty so route-stop defaults apply (don't force depot as pickup)
  const [pickupPoint, setPickupPoint] = useState('');
  const [dropoffPoint, setDropoffPoint] = useState('');
  const [routeStops, setRouteStops] = useState([]);
  const [routeName, setRouteName] = useState(
    () => normalizedSchedule?.routeName || ''
  );

  // Guest checkout state
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for auth token
    const token =
      localStorage.getItem('token') || document.cookie.includes('token=');
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    // If not logged in, automatically set to guest checkout
    if (!loggedIn) {
      setIsGuestCheckout(true);
    }
  }, []);

  // Redirect if no data
  useEffect(() => {
    if (!schedule || !selectedSeats || selectedSeats.length === 0) {
      alert('No booking data found. Please select seats first.');
      navigate('/bus-booking/search-buses');
    }
    // Clear the skip flag when entering booking proceed to ensure selection page won't mistakenly skip release later
    if (typeof window !== 'undefined' && window.__skipSeatRelease) {
      // leave it true while on booking proceed; ensure cleanup will clear when booking page unmounts
    }
  }, [schedule, selectedSeats, navigate]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.__skipSeatRelease) {
        window.__skipSeatRelease(false);
      }
    };
  }, []);

  // Fetch route stops for this schedule (if route id present)
  // Fetch route stops for this schedule (if route id present)
  const fetchStops = async () => {
    try {
      const routeId =
        schedule?.routeId ||
        schedule?.route ||
        normalizedSchedule?.routeId ||
        null;
      if (!routeId) return;
      // Fetch full route details (includes routeName and stops)
      const res = await axiosInstance.get(`/api/route/${routeId}`);
      const route = res.data || {};
      const stops = route.stops || [];
      setRouteStops(stops);
      if (route.routeName) setRouteName(route.routeName);

      // Filter by stopType to populate pickup and dropoff select lists correctly
      const pickupStops = stops.filter(
        s => !s.stopType || s.stopType === 'pickup' || s.stopType === 'both'
      );
      const dropoffStops = stops.filter(
        s => !s.stopType || s.stopType === 'dropoff' || s.stopType === 'both'
      );

      // set sensible defaults if not set — prefer type-specific lists, fallback to full stops list
      if (!pickupPoint && pickupStops.length > 0)
        setPickupPoint(pickupStops[0].stopName || '');
      else if (!pickupPoint && stops.length > 0)
        setPickupPoint(stops[0].stopName || '');

      if (!dropoffPoint && dropoffStops.length > 0)
        setDropoffPoint(dropoffStops[dropoffStops.length - 1].stopName || '');
      else if (!dropoffPoint && stops.length > 0)
        setDropoffPoint(stops[stops.length - 1].stopName || '');
    } catch (err) {
      console.error('Failed to fetch route stops', err);
    }
  };

  useEffect(() => {
    fetchStops();
    // run when schedule or normalizedSchedule change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, normalizedSchedule]);

  // Track lock expiration
  useEffect(() => {
    if (!sessionId) return;

    const checkLockStatus = async () => {
      try {
        // Include sessionId so server can look up locks for this session
        const response = await axiosInstance.get(
          `/seats/my-locks?sessionId=${encodeURIComponent(sessionId)}`
        );
        const locks = response.data.locks || [];

        if (locks.length > 0) {
          const firstLock = locks[0];
          const expiresAt = new Date(firstLock.expiresAt);
          const now = new Date();
          const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setLockTimeRemaining(timeLeft);
        }
      } catch (error) {
        console.error('Error checking lock status:', error);
      }
    };

    checkLockStatus();
    const interval = setInterval(checkLockStatus, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handlePassengersChange = updatedPassengers => {
    setPassengers(updatedPassengers);
  };

  const handleGuestInfoChange = updatedGuestInfo => {
    setGuestInfo(updatedGuestInfo);
  };

  const validateAndProceed = () => {
    // Validate all passengers (ID field removed)
    const allValid = passengers.every(
      p => p.name && p.age && p.gender && p.phone
    );

    if (!allValid) {
      alert('Please fill in all required passenger details');
      return;
    }

    // Validate guest info if guest checkout
    if (isGuestCheckout) {
      if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
        alert('Please fill in your contact information');
        return;
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
        alert('Please enter a valid email address');
        return;
      }

      // Validate phone format
      if (!/^\+?[\d\s-()]+$/.test(guestInfo.phone)) {
        alert('Please enter a valid phone number');
        return;
      }
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateBooking = async () => {
    try {
      setLoading(true);

      // Calculate pricing using utility (server will recalculate for security)
      const pricing = calculateBookingPrice(
        schedule.price,
        selectedSeats.length
      );
      console.log('[BookingProceed] Pricing calculated:', pricing);

      const bookingData = {
        busScheduleId: normalizedSchedule?.id || schedule.id,
        routeNo: normalizedSchedule?.routeNo || schedule.routeNo,
        departure: normalizedSchedule?.departure,
        arrival: normalizedSchedule?.arrival,
        depotName: normalizedSchedule?.depotName || 'Main Depot',
        seatNumbers: selectedSeats,
        booking_startTime: normalizedSchedule?.departureTime,
        booking_endTime: normalizedSchedule?.arrivalTime,
        journeyDate:
          normalizedSchedule?.journeyDate ||
          new Date().toISOString().split('T')[0],
        passengers: passengers,
        // Note: Server will recalculate these for security, but we send for validation
        payment_busFare: pricing.busFare,
        payment_convenienceFee: pricing.convenienceFee,
        payment_bankCharge: pricing.bankCharge,
        payment_totalPay: pricing.totalPay,
        sessionId: sessionId,
      };

      // include pickup/dropoff in payload
      if (pickupPoint) bookingData.pickupPoint = pickupPoint;
      if (dropoffPoint) bookingData.dropoffPoint = dropoffPoint;

      let response;

      // Choose endpoint based on guest vs authenticated
      if (isGuestCheckout) {
        bookingData.guestInfo = guestInfo;
        response = await axiosInstance.post('/api/bookings/guest', bookingData);
      } else {
        response = await axiosInstance.post('/api/bookings', bookingData);
      }

      const booking = response.data.booking;

      // Navigate to payment page with booking details
      navigate('/bus-booking/payment', {
        state: {
          booking: booking,
          schedule: normalizedSchedule || schedule,
          passengers: passengers,
          totalAmount: pricing.totalPay,
          isGuest: isGuestCheckout,
          guestInfo: isGuestCheckout ? guestInfo : null,
        },
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(
        error.response?.data?.message ||
          'Failed to create booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate pricing for preview
  const previewPricing = calculateBookingPrice(
    schedule.price,
    selectedSeats.length
  );

  const bookingData = {
    schedule: {
      ...normalizedSchedule,
      routeName: routeName || normalizedSchedule?.routeName || null,
      journeyDate:
        normalizedSchedule?.journeyDate ||
        schedule?.departureDate ||
        new Date().toISOString().split('T')[0],
    },
    seatNumbers: selectedSeats,
    passengers: passengers,
    pricing: {
      busFare: previewPricing.busFare,
      convenienceFee: previewPricing.convenienceFee,
      bankCharge: previewPricing.bankCharge,
      totalPay: previewPricing.totalPay,
    },
  };

  // include pickup/dropoff in bookingData preview
  bookingData.pickupPoint = pickupPoint;
  bookingData.dropoffPoint = dropoffPoint;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Timer */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Complete Your Booking
            </h1>
            {lockTimeRemaining !== null && lockTimeRemaining > 0 && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  lockTimeRemaining < 180
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-info-800'
                }`}
              >
                <Clock size={20} />
                <span className="font-semibold">
                  Time Remaining: {formatTime(lockTimeRemaining)}
                </span>
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${step >= 1 ? 'text-info-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step >= 1 ? 'bg-info-600 text-white' : 'bg-gray-300'
                }`}
              >
                1
              </div>
              <span className="font-medium">Passenger Details</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300">
              <div
                className={`h-full ${step >= 2 ? 'bg-info-600' : 'bg-gray-300'}`}
              ></div>
            </div>
            <div
              className={`flex items-center gap-2 ${step >= 2 ? 'text-info-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step >= 2 ? 'bg-info-600 text-white' : 'bg-gray-300'
                }`}
              >
                2
              </div>
              <span className="font-medium">Review & Confirm</span>
            </div>
          </div>

          {/* Route stops preview (ordered) */}
          {/* moved below passenger details so passengers appear above the stops */}
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div>
            {/* Guest Information Form - Show automatically if not logged in */}
            {!isLoggedIn && (
              <GuestInfoForm
                onGuestInfoChange={handleGuestInfoChange}
                initialData={guestInfo}
              />
            )}

            <PassengerForm
              seatNumbers={selectedSeats}
              onPassengersChange={handlePassengersChange}
              initialData={passengers}
            />

            {/* Route stops preview (ordered) - moved here so passenger details are above stops */}
            {routeStops && routeStops.length > 0 && (
              <div className="mt-4 bg-white rounded-md p-4">
                <h4 className="font-medium mb-2">Route stops (in order)</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  {routeStops.map(s => (
                    <li key={s.id} className="flex">
                      <span>{`${s.stopOrder ? `${s.stopOrder}. ` : ''}${s.stopName}`}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Pickup / Dropoff selection (Booking Details) */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-3">Pickup & Drop-off</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Pickup Point</label>
                  {routeStops && routeStops.length > 0 ? (
                    (() => {
                      const pickupStops = routeStops.filter(
                        s =>
                          !s.stopType ||
                          s.stopType === 'pickup' ||
                          s.stopType === 'both'
                      );
                      const options =
                        pickupStops.length > 0 ? pickupStops : routeStops;
                      return (
                        <select
                          className="mt-1 block w-full border rounded p-2"
                          value={pickupPoint}
                          onChange={e => setPickupPoint(e.target.value)}
                        >
                          {options.map(s => (
                            <option key={s.id} value={s.stopName}>
                              {`${s.stopOrder ? `${s.stopOrder} - ` : ''}${s.stopName}`}
                            </option>
                          ))}
                        </select>
                      );
                    })()
                  ) : (
                    <input
                      className="mt-1 block w-full border rounded p-2"
                      value={pickupPoint}
                      onChange={e => setPickupPoint(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Drop-off Point
                  </label>
                  {routeStops && routeStops.length > 0 ? (
                    (() => {
                      const dropoffStops = routeStops.filter(
                        s =>
                          !s.stopType ||
                          s.stopType === 'dropoff' ||
                          s.stopType === 'both'
                      );
                      const options =
                        dropoffStops.length > 0 ? dropoffStops : routeStops;
                      return (
                        <select
                          className="mt-1 block w-full border rounded p-2"
                          value={dropoffPoint}
                          onChange={e => setDropoffPoint(e.target.value)}
                        >
                          {options.map(s => (
                            <option key={s.id} value={s.stopName}>
                              {`${s.stopOrder ? `${s.stopOrder} - ` : ''}${s.stopName}`}
                            </option>
                          ))}
                        </select>
                      );
                    })()
                  ) : (
                    <input
                      className="mt-1 block w-full border rounded p-2"
                      value={dropoffPoint}
                      onChange={e => setDropoffPoint(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                Back to Seat Selection
              </button>
              <button
                onClick={validateAndProceed}
                disabled={passengers.length !== selectedSeats.length}
                className="flex-1 px-6 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Review Booking
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <BookingSummary
              bookingData={bookingData}
              onProceedToPayment={handleCreateBooking}
              onGoBack={() => setStep(1)}
              isLoading={loading}
              pickupPoint={pickupPoint}
              dropoffPoint={dropoffPoint}
              onPickupChange={setPickupPoint}
              onDropoffChange={setDropoffPoint}
            />
          </div>
        )}
      </div>
    </div>
  );
}
