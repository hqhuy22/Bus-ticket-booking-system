import { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import VN_CITIES from '../../utils/vnCities.js';

export default function AdminRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    routeName: '',
    routeNo: '',
    origin: '',
    destination: '',
    distance: '',
    estimatedDuration: '',
    stops: [],
  });

  // Filters and pagination state
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    status: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // use shared VN_CITIES from utils

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/routes');
      setRoutes(response.data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await axios.put(`/api/route/${editingRoute.id}`, formData);
        alert('Route updated successfully');
      } else {
        await axios.post('/api/route', formData);
        alert('Route created successfully');
      }
      setShowForm(false);
      setEditingRoute(null);
      resetForm();
      fetchRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
      alert(error.response?.data?.error || 'Failed to save route');
    }
  };

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await axios.delete(`/api/route/${id}`);
        alert('Route deleted successfully');
        fetchRoutes();
      } catch (error) {
        console.error('Error deleting route:', error);
        alert('Failed to delete route');
      }
    }
  };

  const handleToggleStatus = async route => {
    const action = route.status === 'active' ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this route?`)) {
      try {
        await axios.patch(`/api/route/${route.id}/toggle-status`);
        alert(`Route ${action}d successfully`);
        fetchRoutes();
      } catch (error) {
        console.error(`Error ${action}ing route:`, error);
        alert(`Failed to ${action} route`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      routeName: '',
      routeNo: '',
      origin: '',
      destination: '',
      distance: '',
      estimatedDuration: '',
      stops: [],
    });
  };

  const addStop = () => {
    setFormData({
      ...formData,
      stops: [
        ...formData.stops,
        {
          stopOrder: formData.stops.length + 1,
          stopName: '',
          stopType: 'both',
          arrivalTime: '',
          departureTime: '',
        },
      ],
    });
  };

  const removeStop = index => {
    setFormData({
      ...formData,
      stops: formData.stops.filter((_, i) => i !== index),
    });
  };

  const updateStop = (index, field, value) => {
    const updatedStops = [...formData.stops];
    updatedStops[index][field] = value;
    setFormData({ ...formData, stops: updatedStops });
  };

  // Filter routes based on filter criteria
  const filteredRoutes = routes.filter(route => {
    if (
      filters.origin &&
      !route.origin?.toLowerCase().includes(filters.origin.toLowerCase())
    )
      return false;
    if (
      filters.destination &&
      !route.destination
        ?.toLowerCase()
        .includes(filters.destination.toLowerCase())
    )
      return false;
    if (filters.status && route.status !== filters.status) return false;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const paginatedRoutes = filteredRoutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({ origin: '', destination: '', status: '' });
    setCurrentPage(1);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Route Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingRoute(null);
            resetForm();
          }}
          className="bg-info-500 text-white px-6 py-2 rounded hover:bg-info-600"
        >
          {showForm ? 'Cancel' : 'Add New Route'}
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-1">Origin City</label>
            <select
              value={filters.origin}
              onChange={e => handleFilterChange('origin', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">All Origins</option>
              {VN_CITIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Destination City</label>
            <select
              value={filters.destination}
              onChange={e => handleFilterChange('destination', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">All Destinations</option>
              {VN_CITIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredRoutes.length} of {routes.length} routes
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingRoute ? 'Edit Route' : 'Add New Route'}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Route Name"
              value={formData.routeName}
              onChange={e =>
                setFormData({ ...formData, routeName: e.target.value })
              }
              className="border px-4 py-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Route No"
              value={formData.routeNo}
              onChange={e =>
                setFormData({ ...formData, routeNo: e.target.value })
              }
              className="border px-4 py-2 rounded"
              required
            />
            <select
              value={formData.origin}
              onChange={e =>
                setFormData({ ...formData, origin: e.target.value })
              }
              className="border px-4 py-2 rounded"
              required
            >
              <option value="">-- Select origin --</option>
              {VN_CITIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={formData.destination}
              onChange={e =>
                setFormData({ ...formData, destination: e.target.value })
              }
              className="border px-4 py-2 rounded"
              required
            >
              <option value="">-- Select destination --</option>
              {VN_CITIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Distance (km)"
              value={formData.distance}
              onChange={e =>
                setFormData({ ...formData, distance: e.target.value })
              }
              className="border px-4 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Estimated Duration (e.g., 10:00)"
              value={formData.estimatedDuration}
              onChange={e =>
                setFormData({ ...formData, estimatedDuration: e.target.value })
              }
              className="border px-4 py-2 rounded"
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Route Stops</h3>
              <button
                type="button"
                onClick={addStop}
                className="bg-gray-500 text-white px-4 py-1 rounded text-sm"
              >
                Add Stop
              </button>
            </div>
            {formData.stops.map((stop, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Stop Name"
                  value={stop.stopName}
                  onChange={e => updateStop(index, 'stopName', e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                  required
                />
                <select
                  value={stop.stopType}
                  onChange={e => updateStop(index, 'stopType', e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                >
                  <option value="both">Pickup & Dropoff</option>
                  <option value="pickup">Pickup Only</option>
                  <option value="dropoff">Dropoff Only</option>
                </select>
                <input
                  type="text"
                  placeholder="Arrival (+HH:MM)"
                  value={stop.arrivalTime}
                  onChange={e =>
                    updateStop(index, 'arrivalTime', e.target.value)
                  }
                  className="border px-2 py-1 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Departure (+HH:MM)"
                  value={stop.departureTime}
                  onChange={e =>
                    updateStop(index, 'departureTime', e.target.value)
                  }
                  className="border px-2 py-1 rounded text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="bg-error-500 text-white px-2 py-1 rounded text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="bg-success-500 text-white px-6 py-2 rounded hover:bg-success-600"
          >
            {editingRoute ? 'Update Route' : 'Create Route'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Route No</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Origin</th>
                  <th className="px-6 py-3 text-left">Destination</th>
                  <th className="px-6 py-3 text-left">Distance</th>
                  <th className="px-6 py-3 text-left">Duration</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoutes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No routes found
                    </td>
                  </tr>
                ) : (
                  paginatedRoutes.map(route => (
                    <tr key={route.id} className="border-t">
                      <td className="px-6 py-4">{route.routeNo}</td>
                      <td className="px-6 py-4">{route.routeName}</td>
                      <td className="px-6 py-4">{route.origin}</td>
                      <td className="px-6 py-4">{route.destination}</td>
                      <td className="px-6 py-4">{route.distance} km</td>
                      <td className="px-6 py-4">{route.estimatedDuration}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {route.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(route)}
                          className={`${route.status === 'active' ? 'text-orange-500' : 'text-success-600'} hover:underline mr-4`}
                        >
                          {route.status === 'active'
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="text-error-500 hover:underline"
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
        </>
      )}
    </div>
  );
}
