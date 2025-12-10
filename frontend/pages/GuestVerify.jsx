import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import { Loader, CheckCircle, XCircle } from "lucide-react";

export default function GuestVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    loading: true,
    error: null,
    booking: null,
  });

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const token = qs.get("token");
    const reference = qs.get("reference");

    if (!token || !reference) {
      setStatus({
        loading: false,
        error: "Missing token or reference in the link.",
      });
      return;
    }

    const verify = async () => {
      try {
        const res = await axiosInstance.get("/api/bookings/guest/verify", {
          params: { token, reference },
        });
        if (res.data && res.data.booking) {
          navigate("/bus-booking/guest-booking-details", {
            state: { booking: res.data.booking },
          });
        } else {
          setStatus({
            loading: false,
            error: res.data?.message || "Unable to verify booking",
          });
        }
      } catch (err) {
        setStatus({
          loading: false,
          error: err.response?.data?.message || "Verification failed",
        });
      }
    };

    verify();
  }, [location.search, navigate]);

  if (status.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto text-info-600" size={48} />
          <p className="mt-4">Verifying your booking — please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl text-center bg-white p-8 rounded-lg shadow">
        {status.error ? (
          <>
            <XCircle size={48} className="mx-auto text-error-600" />
            <h2 className="text-xl font-semibold mt-4">Verification Failed</h2>
            <p className="mt-2 text-gray-600">{status.error}</p>
            <button
              onClick={() => navigate("/bus-booking/guest-lookup")}
              className="mt-4 px-4 py-2 bg-info-600 text-white rounded"
            >
              Back to Lookup
            </button>
          </>
        ) : (
          <>
            <CheckCircle size={48} className="mx-auto text-success-600" />
            <h2 className="text-xl font-semibold mt-4">Verified</h2>
            <p className="mt-2 text-gray-600">
              Redirecting to your booking details...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
