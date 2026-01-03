import { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import SeatMapEditor from './SeatMapEditor';

export default function AdminBuses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [showSeatEditor, setShowSeatEditor] = useState(false);
  const [selectedBusForEditor, setSelectedBusForEditor] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [formData, setFormData] = useState({
    busNumber: '',
    plateNumber: '',
    busType: 'Normal',
    model: '',
    totalSeats: 40,
    depotName: '',
    amenities: [],
  });

  const AVAILABLE_AMENITIES = [
    'WiFi',
    'AC',
    'Water',
    'Toilet',
    'Charging',
    'Blanket',
  ];

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/buses');
      console.log('Fetched buses:', response.data); // Debug log
      // Force a new array to ensure React re-renders
      setBuses([...response.data]);
      return response.data; // Return the data for chaining
    } catch (error) {
      console.error('Error fetching buses:', error);
      alert('Failed to fetch buses');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    console.log('Submitting bus:', { editingBus, formData, selectedPhotos }); // Debug log
    
    try {
      // Ensure totalSeats is a number when sending to the server
      const payload = {
        ...formData,
        totalSeats: Number(formData.totalSeats) || 0,
        amenities: formData.amenities || [],
      };

      let busId = editingBus?.id;
      let isNewBus = !editingBus;

      if (editingBus) {
        const response = await axios.put(`/api/bus/${editingBus.id}`, payload);
        console.log('Update response:', response.data); // Debug log
        busId = editingBus.id; // Ensure we have the ID
      } else {
        const response = await axios.post('/api/bus', payload);
        console.log('Create response:', response.data); // Debug log
        busId = response.data.bus.id;
      }

      // Upload photos if any were selected
      let photosUploaded = false;
      if (selectedPhotos.length > 0 && busId) {
        const photoFormData = new FormData();
        selectedPhotos.forEach(file => {
          photoFormData.append('photos', file);
        });

        try {
          const photoResponse = await axios.post(
            `/api/bus/${busId}/photos`,
            photoFormData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );
          console.log('Photo upload response:', photoResponse.data); // Debug log
          photosUploaded = true;
        } catch (photoError) {
          console.error('Error uploading photos:', photoError);
          alert(
            'Bus saved but photo upload failed: ' +
              (photoError.response?.data?.error || photoError.message)
          );
        }
      }

      // Reset form and state BEFORE fetching
      setShowForm(false);
      setEditingBus(null);
      setSelectedPhotos([]);
      resetForm();
      
      // Fetch buses to get updated list and wait for it
      await fetchBuses();
      
      // Show success message after everything is done
      if (isNewBus) {
        if (photosUploaded) {
          alert('Bus created and photos uploaded successfully');
        } else {
          alert('Bus created successfully');
        }
      } else {
        if (photosUploaded) {
          alert('Bus updated and photos uploaded successfully');
        } else {
          alert('Bus updated successfully');
        }
      }
      
      console.log('Bus operation completed successfully'); // Debug log
    } catch (error) {
      console.error('Error saving bus:', error);
      alert(error.response?.data?.error || 'Failed to save bus');
    }
  };

  const handleEdit = bus => {
    console.log('Editing bus:', bus); // Debug log
    
    // Create a fresh copy to avoid reference issues
    const busCopy = {
      ...bus,
      photos: bus.photos ? [...bus.photos] : [],
      amenities: bus.amenities ? [...bus.amenities] : [],
    };
    
    setEditingBus(busCopy);
    setFormData({
      busNumber: busCopy.busNumber,
      plateNumber: busCopy.plateNumber || '',
      busType: busCopy.busType,
      model: busCopy.model,
      totalSeats: busCopy.totalSeats,
      depotName: busCopy.depotName,
      amenities: busCopy.amenities,
    });
    setSelectedPhotos([]); // Clear any previously selected photos
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        await axios.delete(`/api/bus/${id}`);
        alert('Bus deleted successfully');
        fetchBuses();
      } catch (error) {
        console.error('Error deleting bus:', error);
        alert('Failed to delete bus');
      }
    }
  };

  const handleToggleStatus = async bus => {
    const action = bus.status === 'active' ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this bus?`)) {
      try {
        await axios.patch(`/api/bus/${bus.id}/toggle-status`);
        alert(`Bus ${action}d successfully`);
        fetchBuses();
      } catch (error) {
        console.error(`Error ${action}ing bus:`, error);
        alert(`Failed to ${action} bus`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      busNumber: '',
      plateNumber: '',
      busType: 'Normal',
      model: '',
      totalSeats: 40,
      depotName: '',
      amenities: [],
    });
    setSelectedPhotos([]);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bus Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingBus(null);
            resetForm();
          }}
          className="bg-info-500 text-white px-6 py-2 rounded hover:bg-info-600"
        >
          {showForm ? 'Cancel' : 'Add New Bus'}
        </button>
      </div>

      {showSeatEditor && selectedBusForEditor && (
        <SeatMapEditor
          bus={selectedBusForEditor}
          onClose={() => {
            setShowSeatEditor(false);
            setSelectedBusForEditor(null);
          }}
          onSave={() => {
            setShowSeatEditor(false);
            setSelectedBusForEditor(null);
            fetchBuses();
          }}
        />
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingBus ? 'Edit Bus' : 'Add New Bus'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Bus Number"
              value={formData.busNumber}
              onChange={e =>
                setFormData({ ...formData, busNumber: e.target.value })
              }
              className="border px-4 py-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Plate Number (e.g., 51A-12345)"
              value={formData.plateNumber}
              onChange={e =>
                setFormData({ ...formData, plateNumber: e.target.value })
              }
              className="border px-4 py-2 rounded"
            />
            <select
              value={formData.busType}
              onChange={e =>
                setFormData({ ...formData, busType: e.target.value })
              }
              className="border px-4 py-2 rounded"
            >
              <option value="Normal">Normal</option>
              <option value="AC">AC</option>
              <option value="Sleeper">Sleeper</option>
              <option value="Semi-Sleeper">Semi-Sleeper</option>
            </select>
            <input
              type="text"
              placeholder="Model"
              value={formData.model}
              onChange={e =>
                setFormData({ ...formData, model: e.target.value })
              }
              className="border px-4 py-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Total Seats"
              value={formData.totalSeats}
              onChange={e => {
                const v = e.target.value;
                // Keep empty string to allow clearing the field without producing NaN
                setFormData({
                  ...formData,
                  totalSeats: v === '' ? '' : parseInt(v, 10),
                });
              }}
              className="border px-4 py-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Depot Name"
              value={formData.depotName}
              onChange={e =>
                setFormData({ ...formData, depotName: e.target.value })
              }
              className="border px-4 py-2 rounded"
              required
            />
            <div className="col-span-2">
              <label className="block mb-2 font-medium">Amenities</label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_AMENITIES.map(a => (
                  <label key={a} className="inline-flex items-center mr-3">
                    <input
                      type="checkbox"
                      checked={(formData.amenities || []).includes(a)}
                      onChange={e => {
                        setFormData(fd => {
                          const next = new Set(fd.amenities || []);
                          if (e.target.checked) next.add(a);
                          else next.delete(a);
                          return { ...fd, amenities: Array.from(next) };
                        });
                      }}
                    />
                    <span className="ml-2">{a}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block mb-2 font-medium">
                Bus Photos (Max 5)
              </label>
              {/* Show existing photos when editing */}
              {editingBus &&
                editingBus.photos &&
                editingBus.photos.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Existing Photos:
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editingBus.photos.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={`http://localhost:4000${url}`}
                            alt={`Bus ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('Delete this photo?')) return;
                              try {
                                await axios.delete(
                                  `/api/bus/${editingBus.id}/photos/${idx}`
                                );
                                
                                // Update editingBus immediately for UI
                                const updatedPhotos = editingBus.photos.filter(
                                  (_, i) => i !== idx
                                );
                                const updatedBus = {
                                  ...editingBus,
                                  photos: updatedPhotos,
                                };
                                setEditingBus(updatedBus);
                                
                                // Fetch updated buses list in background
                                await fetchBuses();
                                
                                alert('Photo deleted successfully');
                              } catch (err) {
                                console.error(err);
                                alert('Failed to delete photo');
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-error-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-error-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {/* Show preview of newly selected photos */}
              {selectedPhotos.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">
                    New Photos to Upload:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedPhotos.map((file, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${idx + 1}`}
                          className="w-24 h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPhotos(prev =>
                              prev.filter((_, i) => i !== idx)
                            );
                          }}
                          className="absolute -top-2 -right-2 bg-error-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-error-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;

                  // Limit to 5 photos total
                  const currentCount = editingBus?.photos?.length || 0;
                  const newPhotosCount = selectedPhotos.length;
                  const availableSlots = 5 - currentCount - newPhotosCount;

                  if (availableSlots <= 0) {
                    alert('Maximum 5 photos allowed per bus');
                    e.target.value = '';
                    return;
                  }

                  const filesToAdd = files.slice(0, availableSlots);
                  setSelectedPhotos(prev => [...prev, ...filesToAdd]);
                  e.target.value = '';
                }}
                className="border p-2 rounded w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload images (jpeg, jpg, png, webp). Max 5MB each, max 5 photos
                total.
              </p>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-success-500 text-white px-6 py-2 rounded hover:bg-success-600"
          >
            {editingBus ? 'Update Bus' : 'Create Bus'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Bus Number</th>
                <th className="px-6 py-3 text-left">Plate Number</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Model</th>
                <th className="px-6 py-3 text-left">Total Seats</th>
                <th className="px-6 py-3 text-left">Depot</th>
                <th className="px-6 py-3 text-left">Photos</th>
                <th className="px-6 py-3 text-left">Amenities</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.map(bus => (
                <tr key={bus.id} className="border-t">
                  <td className="px-6 py-4">{bus.busNumber}</td>
                  <td className="px-6 py-4">{bus.plateNumber || '—'}</td>
                  <td className="px-6 py-4">{bus.busType}</td>
                  <td className="px-6 py-4">{bus.model}</td>
                  <td className="px-6 py-4">{bus.totalSeats}</td>
                  <td className="px-6 py-4">{bus.depotName}</td>
                  <td className="px-6 py-4">
                    {bus.photos && bus.photos.length > 0 ? (
                      <div className="flex gap-1">
                        {bus.photos.slice(0, 3).map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt=""
                            className="w-8 h-8 object-cover rounded"
                          />
                        ))}
                        {bus.photos.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{bus.photos.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No photos</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(bus.amenities || []).length === 0 ? (
                        <span className="text-sm text-gray-500">—</span>
                      ) : (
                        (bus.amenities || []).map(a => (
                          <span
                            key={a}
                            className="text-xs bg-gray-100 px-2 py-1 rounded-full border"
                          >
                            {a}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{bus.status}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(bus)}
                      className="text-info-500 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBusForEditor(bus);
                        setShowSeatEditor(true);
                      }}
                      className="text-success-500 hover:underline mr-4"
                    >
                      Seat Map
                    </button>
                    <button
                      onClick={() => handleToggleStatus(bus)}
                      className={`${bus.status === 'active' ? 'text-orange-500' : 'text-success-600'} hover:underline mr-4`}
                    >
                      {bus.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(bus.id)}
                      className="text-error-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
