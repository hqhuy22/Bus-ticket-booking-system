import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BusBookingCard from '../components/booking/BusBookingCard';
import FilterPanel from '../components/booking/FilterPanel';
import TripDetailsModal from '../components/booking/TripDetailsModal';
import TopHeader from '../components/header/TopHeader';
import TopHeaderSort from '../components/header/TopHeaderSort';
import axios from '../utils/axiosConfig';

export default function SearchBuses() {
  const location = useLocation();
  const mobileOpen = useSelector(state => state.theme.isMobileOpen);

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Check if showing all trips mode
  const showAllTrips = location.state?.showAllTrips || false;

  // Filter and sort state
  const [filters, setFilters] = useState({
    from: showAllTrips ? '' : location.state?.pickupPoint || '',
    to: showAllTrips ? '' : location.state?.droppingPoint || '',
    date: showAllTrips ? '' : location.state?.departureDate || '',
    busType: '',
    timeFrom: '',
    timeTo: '',
    amenities: [],
    sort: 'price',
    order: 'ASC',
  });

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('[SearchBuses] fetchSchedules start', {
      page: pagination.page,
      filters,
    });

    try {
      let params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };
      // If a preset priceRange is present, map it to minPrice/maxPrice and remove priceRange
      if (params.priceRange) {
        const priceParams = mapPriceRangeToParams(params.priceRange);
        delete params.priceRange;
        params = { ...params, ...priceParams };
      }

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await axios.get('/api/bus-schedules', { params });

      setSchedules(response.data.schedules || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch bus schedules');
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Helper to map preset priceRange values to numeric min/max for API
  const mapPriceRangeToParams = range => {
    switch (range) {
      case 'lt100':
        return { maxPrice: 100000 };
      case '100-300':
        return { minPrice: 100000, maxPrice: 300000 };
      case '300-500':
        return { minPrice: 300000, maxPrice: 500000 };
      case 'gt500':
        return { minPrice: 500000 };
      default:
        return {};
    }
  };

  // Debounce schedule fetching so typing (e.g., price inputs) doesn't trigger
  // a request on every keystroke. Wait 500ms after the last change.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchedules();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchSchedules]);

  // Apply filters from FilterPanel's local state
  const handleApplyFilters = useCallback(
    appliedFilters => {
      console.log('[SearchBuses] handleApplyFilters', appliedFilters);
      // Update local filters and fetch immediately to ensure first-click applies
      setFilters(prev => ({ ...prev, ...appliedFilters }));
      setPagination(prev => ({ ...prev, page: 1 }));

      (async () => {
        setLoading(true);
        setError(null);
        try {
          let params = {
            ...filters,
            ...appliedFilters,
            page: 1,
            limit: pagination.limit,
          };
          // Map priceRange to numeric params when present
          if (params.priceRange) {
            const priceParams = mapPriceRangeToParams(params.priceRange);
            delete params.priceRange;
            params = { ...params, ...priceParams };
          }
          // Remove empty params
          Object.keys(params).forEach(key => {
            if (!params[key]) delete params[key];
          });
          const response = await axios.get('/api/bus-schedules', { params });
          setSchedules(response.data.schedules || []);
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination?.total || 0,
            totalPages: response.data.pagination?.totalPages || 0,
          }));
        } catch (err) {
          setError(
            err.response?.data?.error || 'Failed to fetch bus schedules'
          );
          console.error('Error fetching schedules (immediate apply):', err);
        } finally {
          setLoading(false);
        }
      })();
    },
    [filters, pagination.limit]
  );

  const handleSortChange = useCallback(sortField => {
    setFilters(prev => ({
      ...prev,
      sort: sortField,
      order: prev.sort === sortField && prev.order === 'ASC' ? 'DESC' : 'ASC',
    }));
  }, []);

  const handlePageChange = useCallback(newPage => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      from: location.state?.pickupPoint || '',
      to: location.state?.droppingPoint || '',
      date: location.state?.departureDate || '',
      busType: '',
      timeFrom: '',
      timeTo: '',
      amenities: [],
      sort: 'price',
      order: 'ASC',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [location.state]);

  const handleViewDetails = schedule => {
    setSelectedSchedule(schedule);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedSchedule(null);
  };

  const handleSwitchSchedule = newSchedule => {
    // Switch to viewing the alternative schedule in the same modal
    setSelectedSchedule(newSchedule);
    // Scroll modal to top
    setTimeout(() => {
      const modalContent = document.querySelector('.max-h-\\[90vh\\]');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 100);
  };

  return (
    <div className={`flex justify-start items-start flex-col min-w-full pt-16`}>
      <TopHeader
        departureStation={
          showAllTrips ? 'All Cities' : filters.from || 'Any City'
        }
        arrivalStation={
          showAllTrips ? 'All Destinations' : filters.to || 'Any City'
        }
        journeyDate={filters.date || 'Select Date'}
      />
      <TopHeaderSort
        onSortChange={handleSortChange}
        currentSort={filters.sort}
        sortOrder={filters.order}
      />

      <div
        className={`max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${mobileOpen && 'hidden'}`}
      >
        <div className="flex gap-6">
          {/* Filter Panel - Sidebar */}
          <FilterPanel
            filters={filters}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            className="w-80 flex-shrink-0"
          />

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Results Count */}
            {!loading && schedules.length > 0 && (
              <div className="bg-blue-50 px-6 py-3 rounded-lg">
                <p className="text-gray-700">
                  {showAllTrips ? (
                    <>
                      Found{' '}
                      <span className="font-bold text-info-700">
                        {pagination.total}
                      </span>{' '}
                      available trips
                    </>
                  ) : (
                    <>
                      Found{' '}
                      <span className="font-bold text-info-700">
                        {pagination.total}
                      </span>{' '}
                      buses for your search
                    </>
                  )}
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Searching for buses...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 px-6 py-4 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {!loading && !error && schedules.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-lg">
                  No buses found for your search criteria.
                </p>
                <p className="text-gray-400 mt-2">Try adjusting your filters</p>
              </div>
            )}

            {!loading &&
              schedules.map(schedule => (
                <BusBookingCard
                  key={schedule.id}
                  schedule={schedule}
                  onViewDetails={() => handleViewDetails(schedule)}
                />
              ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-6 py-2 bg-info-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-info-700 transition-colors font-semibold"
                >
                  Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-6 py-2 bg-info-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-info-700 transition-colors font-semibold"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trip Details Modal */}
      <TripDetailsModal
        schedule={selectedSchedule}
        isOpen={showDetailsModal}
        onClose={handleCloseDetails}
        onSwitchSchedule={handleSwitchSchedule}
      />
    </div>
  );
}
