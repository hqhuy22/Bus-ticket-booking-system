import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { formatCurrency } from "../utils/pricingCalculator";

export default function TripDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(location.state?.schedule || null);
  const [loading, setLoading] = useState(!location.state?.schedule);
  const [error, setError] = useState("");

  useEffect(() => {
    const hasSchedule = !!schedule;
    if (hasSchedule) return;
    if (!id) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`/api/bus-schedule/${id}`);
        setSchedule(res.data?.schedule || res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load trip details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, schedule]);

  const policies = useMemo(
    () => [
      "Passengers should arrive 15 minutes before departure",
      "Valid ID required for boarding",
      "Cancellation allowed up to 24 hours before departure",
      "Baggage allowance may be limited by operator",
    ],
    []
  );

  const amenities =
    schedule?.amenities ||
    schedule?.bus?.amenities ||
    schedule?.busAmenities ||
    [];

  const handleBook = () => {
    if (!schedule) return;
    navigate("/bus-booking/seat-selection", { state: { schedule } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow p-6">Loading trip…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow p-6 text-error-700">
          {error}
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow p-6">Trip not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trip Details</h1>
            <p className="text-sm text-gray-600">
              Route #{schedule.routeNo} • {schedule.departure_city} →{" "}
              {schedule.arrival_city}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded border bg-white"
          >
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Departure
            </h2>
            <div className="text-gray-700">{schedule.departure_city}</div>
            <div className="text-gray-600 text-sm">
              {schedule.departure_date} • {schedule.departure_time}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Arrival
            </h2>
            <div className="text-gray-700">{schedule.arrival_city}</div>
            <div className="text-gray-600 text-sm">
              {schedule.arrival_date} • {schedule.arrival_time}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">Price</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(schedule.price)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Bus Type</div>
            <div className="text-gray-900 font-semibold">
              {schedule.busType || schedule.bus?.busType || "—"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Available Seats</div>
            <div className="text-gray-900 font-semibold">
              {schedule.availableSeats ?? "—"}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Amenities
          </h2>
          {Array.isArray(amenities) && amenities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {amenities.map((a, idx) => (
                <span
                  key={`${a}-${idx}`}
                  className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm"
                >
                  {a}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 text-sm">No amenities listed.</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Policies & Terms
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            {policies.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleBook}
            className="px-6 py-3 rounded-lg bg-info-600 text-white font-semibold hover:bg-info-700"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}
