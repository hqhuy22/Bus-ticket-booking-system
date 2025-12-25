import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Upload,
  X,
  Calendar,
  Shield,
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function CustomerProfile() {
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
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

      // Step 1: Upload avatar if selected
      if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile);

        const avatarResponse = await axios.post(
          `${API_BASE_URL}/api/customer/avatar`,
          avatarFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        // Update profile with new avatar
        setProfile(prev => ({ ...prev, avatar: avatarResponse.data.avatar }));
        setAvatarFile(null);
        setAvatarPreview(null);
      }

      // Step 2: Update profile information
      const response = await axios.put(
        `${API_BASE_URL}/api/customer/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile(response.data.customer);
      setMessage({
        type: 'success',
        text: avatarFile
          ? 'Profile and photo updated successfully!'
          : 'Profile updated successfully!',
      });

      // Update local storage
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

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
      if (!allowedTypes.includes(file.type)) {
        setMessage({
          type: 'error',
          text: 'Only JPEG, PNG, WEBP, and GIF images are allowed',
        });
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?'))
      return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/customer/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage({ type: 'success', text: 'Avatar deleted successfully!' });
      setProfile({ ...profile, avatar: null });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.msg || 'Failed to delete avatar',
      });
    }
  };

  const cancelAvatarPreview = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User size={28} />
          My Profile
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield size={20} className="text-info-600" />
            Profile Information
          </h2>
        </div>
        <div className="p-6">
          {profile && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Account ID:</span>
                  <span className="ml-2 font-medium">#{profile.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Account Type:</span>
                  <span className="ml-2 font-medium capitalize">
                    {profile.position}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Provider:</span>
                  <span className="ml-2 font-medium capitalize">
                    {profile.provider}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Email Verified:</span>
                  <span className="ml-2 font-medium">
                    {profile.isVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">Member Since:</span>
                  <span className="ml-2 font-medium inline-flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Avatar Upload Section */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-md font-semibold text-gray-800 mb-4">
              Profile Photo
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Current Avatar */}
              <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : profile?.avatar ? (
                  <img
                    src={`${API_BASE_URL}/${profile.avatar}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-gray-400" />
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                {!avatarFile ? (
                  <div className="space-y-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 cursor-pointer transition-colors">
                      <Upload size={18} />
                      Choose Photo
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    {profile?.avatar && (
                      <button
                        onClick={handleDeleteAvatar}
                        className="ml-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Delete Photo
                      </button>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Max file size: 5MB. Supported formats: JPEG, PNG, WEBP,
                      GIF
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelAvatarPreview}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                    </div>
                    <p className="text-sm text-success-700 font-medium">
                      ✓ Selected: {avatarFile.name}
                    </p>
                    <p className="text-sm text-info-600">
                      Click &quot;Save Changes&quot; below to update your
                      profile with the new photo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
              <Lock size={20} className="text-gray-600" />
              Change Password
            </h2>
          </div>
          <div className="p-6">
            {passwordMessage.text && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="space-y-4 mb-6">
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
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum 6 characters
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

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                <Lock size={18} />
                Change Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OAuth Account Notice */}
      {profile?.provider !== 'local' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Shield size={24} className="text-info-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Google Account
              </h3>
              <p className="text-info-800">
                You are signed in with Google. Password management is handled by
                your Google account.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
