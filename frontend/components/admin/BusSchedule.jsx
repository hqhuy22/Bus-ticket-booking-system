// Grouped BusSchedule component
import { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { validatePrice, formatCurrency } from '../../utils/pricingCalculator';

export default function BusSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    routeId: '',
    routeNo: '',
    busId: '',
    departure_city: '',
    departure_date: '',
    departure_time: '',
    arrival_city: '',
    arrival_date: '',
    arrival_time: '',
    duration: '',
    busType: 'Normal',
    model: '',
    busScheduleID: '',
    depotName: '',
    bookingClosingDate: '',
    bookingClosingTime: '',
    price: '',
    availableSeats: '',
  });

  // Filters and pagination state
  const [filters, setFilters] = useState({
    routeName: '',
    dateFrom: '',
    status: 'all', // all, Scheduled, In Progress, Completed, Cancelled
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting state
  const [sortBy, setSortBy] = useState('departure_time'); // departure_time, bookingCount
  const [sortOrder, setSortOrder] = useState('asc'); // asc or desc

  const [scheduleBookingCounts, setScheduleBookingCounts] = useState({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [rs, rt, bookings] = await Promise.all([
        axios.get('/api/bus-schedules/admin'), // Admin endpoint - includes completed schedules
        axios.get('/api/routes'), // Fetch all routes (active and inactive)
        axios.get('/api/bookings?limit=1000'), // Fetch all bookings to count
      ]);
      setSchedules(rs.data.schedules || []);

      // Count bookings per schedule
      const bookingData = bookings.data.bookings || [];
      const counts = {};
      bookingData.forEach(booking => {
        const scheduleId = booking.busScheduleId;
        if (scheduleId) {
          counts[scheduleId] = (counts[scheduleId] || 0) + 1;
        }
      });
      setScheduleBookingCounts(counts);

      const data = rt.data || [];
      setRoutes(data);
      const citySet = new Set();
      data.forEach(r => {
        if (r.origin) citySet.add(r.origin);
        if (r.destination) citySet.add(r.destination);
        if (Array.isArray(r.stops))
          r.stops.forEach(s => citySet.add(s.stopName || s));
      });
      setCities(Array.from(citySet));
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch available buses (hides buses assigned to active schedules)
  const fetchAvailableBuses = async () => {
    try {
      const params = new URLSearchParams();

      // If editing, exclude current schedule from busy check
      // (so we can keep the same bus assigned to this schedule)
      if (editingSchedule && editingSchedule.id) {
        params.append('excludeScheduleId', editingSchedule.id);
        console.log('📝 Editing schedule, excluding ID:', editingSchedule.id);
      }

      console.log(
        '🔍 Fetching available buses (hiding buses assigned to active schedules)'
      );

      const response = await axios.get(
        `/api/buses/available?${params.toString()}`
      );
      const availableBuses = response.data.buses || response.data;
      console.log(
        '✅ Available buses:',
        availableBuses.length,
        'out of',
        response.data.allBusesCount || 'N/A'
      );
      if (response.data.busyBusIds && response.data.busyBusIds.length > 0) {
        console.log('🚫 Busy bus IDs:', response.data.busyBusIds);
      }
      setBuses(availableBuses);
    } catch (error) {
      console.error('❌ Error fetching available buses:', error);
      // Fallback to active buses only
      try {
        const response = await axios.get('/api/buses?status=active');
        setBuses(response.data);
      } catch (err) {
        console.error('❌ Error fetching all buses:', err);
        setBuses([]);
      }
    }
  };

  // Call when form is shown or when departure/arrival changes
  useEffect(() => {
    if (showForm || editingSchedule) {
      console.log(
        '🔄 Triggering fetchAvailableBuses (hiding buses assigned to active schedules)'
      );
      fetchAvailableBuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, editingSchedule]);

  const computeArrivalFromDeparture = (depDate, depTime, durationStr) => {
    if (!depDate || !depTime || !durationStr) return null;
    let hours = 0,
      minutes = 0;
    if (String(durationStr).includes(':')) {
      const [hh, mm] = String(durationStr).split(':');
      hours = parseInt(hh, 10) || 0;
      minutes = parseInt(mm, 10) || 0;
    } else {
      hours = parseInt(durationStr, 10) || 0;
    }
    const dt = new Date(`${depDate}T${depTime}:00`);
    if (isNaN(dt.getTime())) return null;
    dt.setHours(dt.getHours() + hours);
    dt.setMinutes(dt.getMinutes() + minutes);
    const y = dt.getFullYear(),
      m = String(dt.getMonth() + 1).padStart(2, '0'),
      d = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0'),
      mm = String(dt.getMinutes()).padStart(2, '0');
    return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}` };
  };

  const resetForm = () =>
    setFormData({
      routeId: '',
      routeNo: '',
      busId: '',
      departure_city: '',
      departure_date: '',
      departure_time: '',
      arrival_city: '',
      arrival_date: '',
      arrival_time: '',
      duration: '',
      busType: 'Normal',
      model: '',
      busScheduleID: '',
      depotName: '',
      bookingClosingDate: '',
      bookingClosingTime: '',
      price: '',
      availableSeats: '',
    });

  const handleSubmit = async e => {
    e.preventDefault();

    // Validate price
    const priceValue = parseFloat(formData.price);
    if (!formData.price || isNaN(priceValue) || priceValue <= 0) {
      alert('Please enter a valid price (must be greater than 0)');
      return;
    }

    if (priceValue < 50000) {
      if (
        !confirm(
          'Price is below recommended minimum (50,000 VND). Continue anyway?'
        )
      ) {
        return;
      }
    }

    if (priceValue > 2000000) {
      if (
        !confirm(
          'Price is above recommended maximum (2,000,000 VND). Continue anyway?'
        )
      ) {
        return;
      }
    }

    const payload = {
      ...formData,
      price: validatePrice(priceValue), // Validate and normalize price
      availableSeats:
        formData.availableSeats === '' ? 0 : Number(formData.availableSeats),
    };

    try {
      if (editingSchedule)
        await axios.put(`/api/bus-schedule/${editingSchedule.id}`, payload);
      else await axios.post('/api/bus-schedule', payload);
      resetForm();
      setShowForm(false);
      setEditingSchedule(null);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save schedule');
    }
  };

  const handleSelectRoute = routeId => {
    const sel = routes.find(r => String(r.id) === String(routeId));
    setFormData(prev => ({
      ...prev,
      routeId: routeId || '',
      routeNo: sel ? (sel.routeNo ?? prev.routeNo) : prev.routeNo,
      departure_city: sel
        ? (sel.origin ?? prev.departure_city)
        : prev.departure_city,
      arrival_city: sel
        ? (sel.destination ?? prev.arrival_city)
        : prev.arrival_city,
      duration: sel ? (sel.estimatedDuration ?? prev.duration) : prev.duration,
    }));
    // compute arrival if possible
    setTimeout(
      () =>
        setFormData(prev => {
          const arrival = computeArrivalFromDeparture(
            prev.departure_date,
            prev.departure_time,
            prev.duration
          );
          if (arrival)
            return {
              ...prev,
              arrival_date: arrival.date,
              arrival_time: arrival.time,
            };
          return prev;
        }),
      0
    );
  };

  const handleSelectBus = busId => {
    const sel = buses.find(b => String(b.id) === String(busId));
    setFormData(prev => ({
      ...prev,
      busId: busId || '',
      busType: sel ? sel.busType || prev.busType : prev.busType,
      model: sel ? sel.model || prev.model : prev.model,
      depotName: sel ? sel.depotName || prev.depotName : prev.depotName,
      availableSeats: sel
        ? (sel.totalSeats ?? prev.availableSeats)
        : prev.availableSeats,
    }));
  };

  const handleEdit = s => {
    setEditingSchedule(s);
    setFormData({
      routeId: s.routeId || '',
      routeNo: s.routeNo || '',
      busId: s.busId || '',
      departure_city: s.departure_city || '',
      departure_date: s.departure_date || '',
      departure_time: s.departure_time || '',
      arrival_city: s.arrival_city || '',
      arrival_date: s.arrival_date || '',
      arrival_time: s.arrival_time || '',
      duration: s.duration || '',
      busType: s.busType || 'Normal',
      model: s.model || '',
      busScheduleID: s.busScheduleID || '',
      depotName: s.depotName || '',
      bookingClosingDate: s.bookingClosingDate || '',
      bookingClosingTime: s.bookingClosingTime || '',
      price: s.price || '',
      availableSeats: s.availableSeats ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (!confirm('Delete schedule?')) return;
    try {
      await axios.delete(`/api/bus-schedule/${id}`);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  const handleComplete = async id => {
    if (
      !confirm(
        'Mark this schedule as completed? All confirmed bookings will be marked as completed.'
      )
    )
      return;
    try {
      await axios.post(`/api/bus-schedule/${id}/complete`);
      fetchAll();
      alert('Schedule marked as completed successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to complete schedule');
    }
  };

  const handleCancel = async id => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    if (
      !confirm(
        'Cancel this schedule? All bookings will be cancelled and customers will be notified.'
      )
    )
      return;

    try {
      await axios.post(`/api/bus-schedule/${id}/cancel`, { reason });
      fetchAll();
      alert('Schedule cancelled successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to cancel schedule');
    }
  };

  // Filter schedules based on filter criteria
  const filteredSchedules = schedules.filter(schedule => {
    // Route name filter - match by routeName from the routes table
    if (filters.routeName) {
      // Find the route by name and check if schedule's routeId matches
      const selectedRoute = routes.find(r => r.routeName === filters.routeName);
      if (selectedRoute && schedule.routeId !== selectedRoute.id) return false;
      // Also support matching by routeName directly on schedule (fallback)
      if (!selectedRoute && schedule.routeName !== filters.routeName)
        return false;
    }

    // Date filter - exact match only (not >= or <=)
    if (filters.dateFrom && schedule.departure_date !== filters.dateFrom)
      return false;

    // Status filter
    if (filters.status === 'Scheduled' && schedule.status !== 'Scheduled')
      return false;
    if (filters.status === 'In Progress' && schedule.status !== 'In Progress')
      return false;
    if (filters.status === 'Completed' && schedule.status !== 'Completed')
      return false;
    if (filters.status === 'Cancelled' && schedule.status !== 'Cancelled')
      return false;

    return true;
  });

  // Sort schedules
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    let compareValue = 0;

    if (sortBy === 'departure_time') {
      // Combine date and time for accurate sorting
      const dateTimeA = new Date(`${a.departure_date}T${a.departure_time}`);
      const dateTimeB = new Date(`${b.departure_date}T${b.departure_time}`);
      compareValue = dateTimeA - dateTimeB;
    } else if (sortBy === 'bookingCount') {
      const countA = scheduleBookingCounts[a.id] || 0;
      const countB = scheduleBookingCounts[b.id] || 0;
      compareValue = countA - countB;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedSchedules.length / itemsPerPage);
  const paginatedSchedules = sortedSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({ routeName: '', dateFrom: '', status: 'all' });
    setCurrentPage(1);
  };

  const getStatusBadge = schedule => {
    const status =
      schedule.status || (schedule.isCompleted ? 'Completed' : 'Scheduled');

    const statusConfig = {
      Scheduled: { bg: 'bg-blue-100', text: 'text-info-800', icon: '📅' },
      'In Progress': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: '🚌',
      },
      Completed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      Cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' },
    };

    const config = statusConfig[status] || statusConfig['Scheduled'];

    return (
      <span
        className={`inline-block ${config.bg} ${config.text} text-xs px-2 py-1 rounded`}
      >
        {config.icon} {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Bus Schedule Management</h2>
        <button
          className="bg-info-600 text-white px-3 py-1 rounded"
          onClick={() => {
            setShowForm(s => !s);
            setEditingSchedule(null);
            resetForm();
          }}
        >
          {showForm ? 'Close' : 'Add Schedule'}
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-3">Filters & Sorting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-1">Route Name</label>
            <select
              value={filters.routeName}
              onChange={e => handleFilterChange('routeName', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">All Routes</option>
              {routes
                .filter(r => r.routeName)
                .map(route => (
                  <option key={route.id} value={route.routeName}>
                    {route.routeName}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => handleFilterChange('dateFrom', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="all">All Status</option>
              <option value="Scheduled">📅 Scheduled</option>
              <option value="In Progress">🚌 In Progress</option>
              <option value="Completed">✓ Completed</option>
              <option value="Cancelled">✗ Cancelled</option>
            </select>
          </div>
          {/* Sort By */}
          <div>
            <label className="block text-sm mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="departure_time">⏰ Departure Time</option>
              <option value="bookingCount">📊 Number of Bookings</option>
            </select>
          </div>
          {/* Sort Order */}
          <div>
            <label className="block text-sm mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="asc">↑ Ascending</option>
              <option value="desc">↓ Descending</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={handleClearFilters}
            className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Clear Filters
          </button>
          <div className="text-sm text-gray-600">
            Showing {paginatedSchedules.length} of {sortedSchedules.length}{' '}
            schedules
          </div>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded shadow mb-6"
        >
          {/* Route group */}
          <div className="mb-4 p-3 rounded bg-gray-50">
            <h3 className="font-semibold mb-2">Route</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-sm">Route</label>
                <select
                  value={formData.routeId}
                  onChange={e => handleSelectRoute(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="">-- Select route --</option>
                  {routes
                    .filter(r => r.status === 'active')
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.routeName || `Route ${r.routeNo}`}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm">Route No</label>
                <input
                  value={formData.routeNo}
                  onChange={e =>
                    setFormData(p => ({ ...p, routeNo: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm">Duration (HH:MM)</label>
                <input
                  value={formData.duration}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => {
                      const next = { ...prev, duration: val };
                      const arrival = computeArrivalFromDeparture(
                        next.departure_date,
                        next.departure_time,
                        val
                      );
                      if (arrival)
                        ((next.arrival_date = arrival.date),
                          (next.arrival_time = arrival.time));
                      return next;
                    });
                  }}
                  placeholder="e.g. 10:30"
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4 mt-3">
              <div>
                <label className="block text-sm">Departure City</label>
                <select
                  value={formData.departure_city}
                  onChange={e =>
                    setFormData(p => ({ ...p, departure_city: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="">-- From --</option>
                  {cities.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm">Departure Date</label>
                <input
                  type="date"
                  value={formData.departure_date}
                  onChange={e => {
                    const d = e.target.value;
                    setFormData(prev => {
                      const next = { ...prev, departure_date: d };
                      const arrival = computeArrivalFromDeparture(
                        next.departure_date,
                        next.departure_time,
                        next.duration
                      );
                      if (arrival)
                        ((next.arrival_date = arrival.date),
                          (next.arrival_time = arrival.time));
                      return next;
                    });
                  }}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm">Departure Time</label>
                <input
                  type="time"
                  value={formData.departure_time}
                  onChange={e => {
                    const t = e.target.value;
                    setFormData(prev => {
                      const next = { ...prev, departure_time: t };
                      const arrival = computeArrivalFromDeparture(
                        next.departure_date,
                        next.departure_time,
                        next.duration
                      );
                      if (arrival)
                        ((next.arrival_date = arrival.date),
                          (next.arrival_time = arrival.time));
                      return next;
                    });
                  }}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm">Arrival City</label>
                <select
                  value={formData.arrival_city}
                  onChange={e =>
                    setFormData(p => ({ ...p, arrival_city: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="">-- To --</option>
                  {cities.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm">Arrival Date</label>
                <input
                  type="date"
                  value={formData.arrival_date}
                  onChange={e =>
                    setFormData(p => ({ ...p, arrival_date: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm">Arrival Time</label>
                <input
                  type="time"
                  value={formData.arrival_time}
                  onChange={e =>
                    setFormData(p => ({ ...p, arrival_time: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bus group */}
          <div className="mb-4 p-3 rounded bg-gray-50">
            <h3 className="font-semibold mb-2">Bus</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-sm">Bus</label>
                <select
                  value={formData.busId}
                  onChange={e => handleSelectBus(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="">-- Select bus --</option>
                  {buses.length === 0 &&
                    formData.departure_date &&
                    formData.departure_time && (
                      <option disabled>No buses available for this time</option>
                    )}
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>
                      #{b.busNumber || b.id}{' '}
                      {b.plateNumber ? `(${b.plateNumber})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.departure_date && formData.departure_time
                    ? `${buses.length} bus(es) available for this time`
                    : 'Select departure date/time to filter available buses'}
                </p>
              </div>

              <div>
                <label className="block text-sm">Bus Type</label>
                <select
                  value={formData.busType}
                  onChange={e =>
                    setFormData(p => ({ ...p, busType: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                >
                  <option value="Normal">Normal</option>
                  <option value="AC">AC</option>
                  <option value="Sleeper">Sleeper</option>
                </select>
              </div>

              <div>
                <label className="block text-sm">Model</label>
                <input
                  value={formData.model}
                  onChange={e =>
                    setFormData(p => ({ ...p, model: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm">Depot Name</label>
                <input
                  value={formData.depotName}
                  onChange={e =>
                    setFormData(p => ({ ...p, depotName: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm">Available Seats</label>
                <input
                  type="number"
                  value={formData.availableSeats}
                  onChange={e =>
                    setFormData(p => ({ ...p, availableSeats: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm">Schedule ID</label>
                <input
                  value={formData.busScheduleID}
                  onChange={e =>
                    setFormData(p => ({ ...p, busScheduleID: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
          </div>

          {/* Other group */}
          <div className="mb-4 p-3 rounded bg-gray-50">
            <h3 className="font-semibold mb-2">Other</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-sm">Booking Closing Date</label>
                <input
                  type="date"
                  value={formData.bookingClosingDate}
                  onChange={e =>
                    setFormData(p => ({
                      ...p,
                      bookingClosingDate: e.target.value,
                    }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm">Booking Closing Time</label>
                <input
                  type="time"
                  value={formData.bookingClosingTime}
                  onChange={e =>
                    setFormData(p => ({
                      ...p,
                      bookingClosingTime: e.target.value,
                    }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price (VND) <span className="text-error-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e =>
                    setFormData(p => ({ ...p, price: e.target.value }))
                  }
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="150000"
                  min="50000"
                  max="2000000"
                  step="1000"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 50,000 - 2,000,000 VND (multiples of 1,000)
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                className="bg-success-600 text-white px-3 py-1 rounded"
              >
                {editingSchedule ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                  setEditingSchedule(null);
                }}
                className="bg-gray-300 px-3 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Existing Schedules</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Route</th>
                <th className="p-2">From</th>
                <th className="p-2">To</th>
                <th className="p-2">Departure</th>
                <th className="p-2">Arrival</th>
                <th className="p-2">Seats</th>
                <th className="p-2">Price</th>
                <th className="p-2">Bookings</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSchedules.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-500">
                    No schedules found
                  </td>
                </tr>
              ) : (
                paginatedSchedules.map(s => (
                  <tr
                    key={s.id}
                    className={`border-t ${s.isCompleted ? 'bg-gray-100' : ''}`}
                  >
                    <td className="p-2">{s.routeNo || s.routeName || ''}</td>
                    <td className="p-2">{s.departure_city}</td>
                    <td className="p-2">{s.arrival_city}</td>
                    <td className="p-2">
                      {s.departure_date} {s.departure_time}
                    </td>
                    <td className="p-2">
                      {s.arrival_date} {s.arrival_time}
                    </td>
                    <td className="p-2">{s.availableSeats}</td>
                    <td className="p-2 font-semibold text-info-600">
                      {formatCurrency(s.price)}
                    </td>
                    <td className="p-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        📊 {scheduleBookingCounts[s.id] || 0}
                      </span>
                    </td>
                    <td className="p-2">{getStatusBadge(s)}</td>
                    <td className="p-2 space-x-2">
                      {s.status === 'Scheduled' && (
                        <>
                          <button
                            onClick={() => handleEdit(s)}
                            className="text-info-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleComplete(s.id)}
                            className="text-success-600 hover:underline"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="text-orange-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {s.status === 'In Progress' && (
                        <>
                          <button
                            onClick={() => handleComplete(s.id)}
                            className="text-success-600 hover:underline"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="text-orange-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-error-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded ${
                          currentPage === pageNum
                            ? 'bg-info-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="px-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
