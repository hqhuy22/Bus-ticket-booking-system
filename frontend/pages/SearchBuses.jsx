import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import BusBookingCard from "../components/booking/BusBookingCard";
import FilterPanel from "../components/booking/FilterPanel";
import TopHeader from "../components/header/TopHeader";
import TopHeaderSort from "../components/header/TopHeaderSort";

export default function SearchBuses() {
  const location = useLocation();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    from: location.state?.pickupPoint || "",
    to: location.state?.droppingPoint || "",
    date: location.state?.departureDate || "",
    busType: "",
    timeFrom: "",
    timeTo: "",
    amenities: [],
    priceRange: "",
    sort: "price",
    order: "ASC",
  });

  const headerInfo = useMemo(
    () => ({
      from: filters.from || "Any City",
      to: filters.to || "Any City",
      date: filters.date || "Any Date",
    }),
    [filters.from, filters.to, filters.date]
  );

  const mapPriceRangeToParams = (range) => {
    switch (range) {
      case "lt100":
        return { maxPrice: 100000 };
      case "100-300":
        return { minPrice: 100000, maxPrice: 300000 };
      case "300-500":
        return { minPrice: 300000, maxPrice: 500000 };
      case "gt500":
        return { minPrice: 500000 };
      default:
        return {};
    }
  };

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };

      if (params.priceRange) {
        const priceParams = mapPriceRangeToParams(params.priceRange);
        delete params.priceRange;
        params = { ...params, ...priceParams };
      }

      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] == null) delete params[key];
      });

      const response = await axios.get("/api/bus-schedules", { params });
      setSchedules(response.data.schedules || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch bus schedules");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchedules();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchSchedules]);

  const handleApplyFilters = (appliedFilters) => {
    setFilters((prev) => ({ ...prev, ...appliedFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      busType: "",
      timeFrom: "",
      timeTo: "",
      amenities: [],
      priceRange: "",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (sortField) => {
    const newOrder =
      filters.sort === sortField
        ? filters.order === "ASC"
          ? "DESC"
          : "ASC"
        : "ASC";
    setFilters((prev) => ({ ...prev, sort: sortField, order: newOrder }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleGoToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: nextPage }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader
        departureStation={headerInfo.from}
        arrivalStation={headerInfo.to}
        journeyDate={headerInfo.date}
      />
      <TopHeaderSort
        onSortChange={handleSortChange}
        currentSort={filters.sort}
        sortOrder={filters.order}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filters}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Search Results</h1>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-info-700 hover:text-info-800 font-semibold"
            >
              New search
            </button>
          </div>

          {loading && (
            <div className="bg-white rounded-lg shadow p-6">Loading trips…</div>
          )}

          {error && !loading && (
            <div className="bg-white rounded-lg shadow p-6 text-error-700">
              {error}
            </div>
          )}

          {!loading && !error && schedules.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              No trips found.
            </div>
          )}

          <div className="space-y-4">
            {schedules.map((schedule) => (
              <BusBookingCard key={schedule.id} schedule={schedule} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleGoToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 rounded border disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-sm text-gray-600">
                Page {pagination.page} / {pagination.totalPages}
              </div>
              <button
                type="button"
                onClick={() => handleGoToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 rounded border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
