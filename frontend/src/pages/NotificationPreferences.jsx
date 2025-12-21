import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Bell, Mail, Clock, Save, RotateCcw } from 'lucide-react';
import axiosInstance from '../utils/axiosConfig';

/**
 * Notification Preferences Page
 * Allows users to manage their email notification preferences
 */
export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/notification-preferences');
      setPreferences(response.data.preferences);
      setError('');
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError(
        err.response?.data?.message || 'Failed to load notification preferences'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = field => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await axiosInstance.put('/api/notification-preferences', preferences);

      setSuccess('Notification preferences saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset all notification preferences to defaults?'
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await axiosInstance.post(
        '/api/notification-preferences/reset'
      );
      setPreferences(response.data.preferences);

      setSuccess('Notification preferences reset to defaults!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error resetting preferences:', err);
      setError(err.response?.data?.message || 'Failed to reset preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (notificationType = 'general') => {
    try {
      setTestingSend(true);
      setError('');
      setSuccess('');

      await axiosInstance.post('/api/notification-preferences/test-email', {
        notificationType,
      });

      setSuccess(`✅ Test email sent! Check your inbox.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error sending test email:', err);
      setError(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setTestingSend(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="text-info-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-800">
              Notification Preferences
            </h1>
          </div>
          <p className="text-gray-600">
            Manage how you receive updates about your bookings and trips
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-error-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-success-500 p-4 rounded">
            <p className="text-success-700">{success}</p>
          </div>
        )}

        {/* Test Email Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                📧 Test Email Notifications
              </h3>
              <p className="text-sm text-info-700">
                Send a test email to your account to verify your notification
                settings are working correctly.
              </p>
            </div>
            <button
              onClick={() => handleTestEmail('test')}
              disabled={testingSend}
              className="px-6 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {testingSend ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Send Test Email
                </>
              )}
            </button>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="text-info-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              Email Notifications
            </h2>
          </div>

          <div className="space-y-4">
            <NotificationToggle
              label="Booking Confirmations"
              description="Receive confirmation emails when you book a ticket"
              checked={preferences?.emailBookingConfirmation}
              onChange={() => handleToggle('emailBookingConfirmation')}
            />

            <NotificationToggle
              label="Trip Reminders"
              description="Get reminded about upcoming trips"
              checked={preferences?.emailTripReminders}
              onChange={() => handleToggle('emailTripReminders')}
            />

            <NotificationToggle
              label="Booking Cancellations"
              description="Receive emails when bookings are cancelled"
              checked={preferences?.emailCancellations}
              onChange={() => handleToggle('emailCancellations')}
            />
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-orange-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              Reminder Settings
            </h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send trip reminders
            </label>
            <select
              value={preferences?.reminderTiming || 24}
              onChange={e =>
                handleInputChange('reminderTiming', parseInt(e.target.value))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500"
            >
              <option value={1}>1 hour before</option>
              <option value={3}>3 hours before</option>
              <option value={6}>6 hours before</option>
              <option value={12}>12 hours before</option>
              <option value={24}>24 hours before</option>
              <option value={48}>48 hours before</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-info-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-info-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>

          <button
            onClick={handleReset}
            disabled={saving}
            className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable toggle component for notification settings
 */
function NotificationToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <h3
          className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-800'}`}
        >
          {label}
        </h3>
        <p
          className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-600'}`}
        >
          {description}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked || false}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-info-600 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        ></div>
      </label>
    </div>
  );
}

NotificationToggle.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
