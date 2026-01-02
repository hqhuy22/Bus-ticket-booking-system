import { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Shield, Calendar } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function AdminProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({
    type: '',
    text: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/customer/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
      setFormData({
        username: response.data.username || '',
        email: response.data.email || '',
        phoneNumber: response.data.phoneNumber || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async e => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/customer/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile(response.data.customer);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });

      // Update local storage if username/email changed
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.username = response.data.customer.username;
      user.email = response.data.customer.email;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.msg || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/customer/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordMessage({
        type: 'success',
        text: 'Password changed successfully!',
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage({
        type: 'error',
        text: error.response?.data?.msg || 'Failed to change password',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User size={28} />
          Admin Profile
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield size={20} className="text-purple-600" />
            Profile Information
          </h2>
        </div>
        <div className="p-6">
          {profile && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} className="text-purple-600" />
                <span className="font-semibold text-purple-900">
                  Administrator Account
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Account ID:</strong> {profile.id}
                </p>
                <p>
                  <strong>Position:</strong> {profile.position}
                </p>
                <p>
                  <strong>Provider:</strong> {profile.provider}
                </p>
                <p>
                  <strong>Verified:</strong> {profile.isVerified ? 'Yes' : 'No'}
                </p>
                {profile.createdAt && (
                  <p className="flex items-center gap-1">
                    <Calendar size={14} />
                    <strong>Member since:</strong>{' '}
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {message.text && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    Username
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    Email
                  </div>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number (Optional)
                  </div>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={e =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+84 123 456 789"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password */}
      {profile?.provider === 'local' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lock size={20} className="text-orange-600" />
              Change Password
            </h2>
          </div>
          <div className="p-6">
            {passwordMessage.text && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={e =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={e =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 6 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={e =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Lock size={18} />
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profile?.provider !== 'local' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-info-800">
            <strong>Note:</strong> You are signed in with {profile?.provider}.
            Password management is handled by your OAuth provider.
          </p>
        </div>
      )}
    </div>
  );
}
