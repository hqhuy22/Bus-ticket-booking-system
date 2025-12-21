import { useState } from 'react';
import Button from '../button/Button';
import TextInput from '../input/TextInput';
import { useNavigate } from 'react-router-dom';

export default function BookingForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user_name: '',
    mobile_number: '',
    // nic_number removed per UX request
    email: '',
    age: '',
  });

  const [errors, setErrors] = useState({});

  const inputDataChange = event => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();

    let formErrors = {};
    if (!formData.user_name.trim()) {
      formErrors.user_name = 'Name is required';
    }

    if (!formData.age) {
      formErrors.age = 'Age is required';
    } else if (isNaN(formData.age) || formData.age < 1 || formData.age > 120) {
      formErrors.age = 'Age must be between 1 and 120';
    }

    if (!formData.mobile_number.trim()) {
      formErrors.mobile_number = 'Mobile number is required';
    } else if (!/^(0?\d{9})$/.test(formData.mobile_number)) {
      formErrors.mobile_number = 'Invalid mobile number format';
    }

    // nic_number validation removed per UX request

    if (!formData.email.trim()) {
      formErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      formErrors.email = 'Invalid email format';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    navigate('/bus-booking/BookingPayment');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sm:mt-8 mt-4 sm:border-2  sm:p-8 p-0 space-y-2 sm:pt-5 pt-8 "
    >
      <h2 className="sm:text-2xl text-xl tracking-wider align-text-top cursor-pointer font-semibold sm:text-left text-center sm:pb-0 pb-2">
        Your Details
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-start items-start gap-6">
        <TextInput
          id="user_name"
          name="user_name"
          label="Name"
          placeholder="Enter your name"
          value={formData.user_name}
          onChange={inputDataChange}
          error={errors.user_name}
        />
        <TextInput
          id="age"
          name="age"
          label="Age"
          placeholder="Enter your age"
          value={formData.age}
          onChange={inputDataChange}
          error={errors.age}
          type="number"
          maxLength={3}
        />

        <TextInput
          id="mobile_number"
          name="mobile_number"
          label="Mobile Number"
          placeholder="701234567"
          value={formData.mobile_number}
          onChange={inputDataChange}
          error={errors.mobile_number}
          type="number"
          maxLength={10}
        />
        {/* NIC/Passport field removed per UX request */}
        <TextInput
          id="email"
          name="email"
          label="Email"
          placeholder="name@example.lk"
          value={formData.email}
          onChange={inputDataChange}
          error={errors.email}
          type="email"
        />
      </div>

      <div className="flex justify-end items-center py-4">
        <Button label="Proceed to Pay" className="bg-tertiary" type="submit" />
      </div>
    </form>
  );
}
