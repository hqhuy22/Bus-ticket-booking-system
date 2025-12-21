import { useState } from 'react';
import { User, Mail, Phone } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Guest Information Form Component
 * Collects minimal required info for guest checkout
 */
export default function GuestInfoForm({ onGuestInfoChange, initialData = {} }) {
  const [guestInfo, setGuestInfo] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    const updatedInfo = {
      ...guestInfo,
      [field]: value,
    };
    setGuestInfo(updatedInfo);
    onGuestInfoChange(updatedInfo);

    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!guestInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!guestInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!guestInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(guestInfo.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Expose validation to parent
  if (typeof window !== 'undefined') {
    window.validateGuestInfo = validate;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
      <div className="mb-4 pb-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Contact Information
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          We&apos;ll use this information to send you booking confirmation and
          updates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={guestInfo.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 ${
                errors.name ? 'border-error-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="text-error-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input
              type="email"
              value={guestInfo.email}
              onChange={e => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 ${
                errors.email ? 'border-error-500' : 'border-gray-300'
              }`}
              placeholder="your.email@example.com"
            />
          </div>
          {errors.email && (
            <p className="text-error-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone size={18} className="text-gray-400" />
            </div>
            <input
              type="tel"
              value={guestInfo.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 ${
                errors.phone ? 'border-error-500' : 'border-gray-300'
              }`}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          {errors.phone && (
            <p className="text-error-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-info-800">
          <strong>Note:</strong> You&apos;re booking as a guest. You can
          retrieve your booking later using the booking reference and your email
          or phone number.
        </p>
      </div>
    </div>
  );
}

GuestInfoForm.propTypes = {
  onGuestInfoChange: PropTypes.func.isRequired,
  initialData: PropTypes.object,
};
