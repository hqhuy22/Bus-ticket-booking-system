import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Gift, Newspaper, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Notification Preferences Management Component
 * Allows users to manage their email notification settings
 */
export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSend, setTestingSend] = useState(false);

  // Fetch current preferences
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/api/notification-preferences');
      if (response.data.success) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async key => {
    const newValue = !preferences[key];

    // Optimistic update
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    try {
      const response = await axios.put('/api/notification-preferences', {
        [key]: newValue,
      });

      if (response.data.success) {
        toast.success('Preference updated');
      }
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleReminderTimingChange = async value => {
    const newValue = parseInt(value);

    // Optimistic update
    setPreferences(prev => ({ ...prev, reminderTiming: newValue }));

    try {
      const response = await axios.put('/api/notification-preferences', {
        reminderTiming: newValue,
      });

      if (response.data.success) {
        toast.success('Reminder timing updated');
      }
    } catch (error) {
      console.error('Error updating reminder timing:', error);
      toast.error('Failed to update reminder timing');
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Reset all notification preferences to defaults?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('/api/notification-preferences/reset');
      if (response.data.success) {
        setPreferences(response.data.preferences);
        toast.success('Preferences reset to defaults');
      }
    } catch (error) {
      console.error('Error resetting preferences:', error);
      toast.error('Failed to reset preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (notificationType = 'general') => {
    setTestingSend(true);
    try {
      const response = await axios.post(
        '/api/notification-preferences/test-email',
        {
          notificationType,
        }
      );

      if (response.data.success) {
        toast.success(`Test email sent! Check your inbox.`, {
          duration: 5000,
          icon: '📧',
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setTestingSend(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">
            Failed to load notification preferences
          </p>
        </div>
      </div>
    );
  }

  const notificationTypes = [
    {
      key: 'emailBookingConfirmation',
      icon: <Mail className="text-info-600" size={24} />,
      title: 'Booking Confirmations',
      description: 'Get emails when your booking is confirmed',
    },
    {
      key: 'emailTripReminders',
      icon: <Bell className="text-orange-600" size={24} />,
      title: 'Trip Reminders',
      description: 'Receive reminders before your journey starts',
    },
    {
      key: 'emailCancellations',
      icon: <MessageSquare className="text-error-600" size={24} />,
      title: 'Cancellation Notices',
      description: 'Get notified when a booking is cancelled',
    },
    {
      key: 'emailPromotions',
      icon: <Gift className="text-success-600" size={24} />,
      title: 'Promotions & Offers',
      description: 'Special deals and discounts on bus tickets',
    },
    {
      key: 'emailNewsletter',
      icon: <Newspaper className="text-purple-600" size={24} />,
      title: 'Newsletter',
      description: 'Travel tips, updates and company news',
    },
  ];

  const reminderOptions = [
    { value: 1, label: '1 hour before' },
    { value: 3, label: '3 hours before' },
    { value: 6, label: '6 hours before' },
    { value: 12, label: '12 hours before' },
    { value: 24, label: '24 hours before (1 day)' },
    { value: 48, label: '48 hours before (2 days)' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bell size={28} className="text-info-600" />
              Notification Preferences
            </h1>
            <p className="text-gray-600 mt-1">
              Manage how you receive updates about your bookings
            </p>
          </div>
          <button
            onClick={handleResetToDefaults}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Test Email Button */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Send size={20} className="text-info-600" />
            <div>
              <p className="font-medium text-blue-900">
                Test Email Notifications
              </p>
              <p className="text-sm text-info-700">
                Send a test email to your account to verify settings
              </p>
            </div>
          </div>
          <button
            onClick={() => handleTestEmail('test')}
            disabled={testingSend}
            className="px-6 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {testingSend ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Test Email
              </>
            )}
          </button>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Mail size={24} className="text-info-600" />
          Email Notifications
        </h2>

        <div className="space-y-4">
          {notificationTypes.map(type => (
            <div
              key={type.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                {type.icon}
                <div>
                  <p className="font-semibold text-gray-800">{type.title}</p>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(type.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  preferences[type.key] ? 'bg-info-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Reminder Timing */}
      {preferences.emailTripReminders && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={24} className="text-orange-600" />
            Trip Reminder Timing
          </h2>

          <p className="text-gray-600 mb-4">
            Choose when to receive trip reminder emails before your journey
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {reminderOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleReminderTimingChange(option.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences.reminderTiming === option.value
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Notice */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> All test emails will be sent to your account
          email address. This is useful for verifying your email settings
          without affecting other users.
        </p>
      </div>
    </div>
  );
}
