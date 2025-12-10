import { useState, useEffect, useCallback } from "react";
import { User, Phone, Mail } from "lucide-react";
import PropTypes from "prop-types";
import TextInput from "../input/TextInput";

export default function PassengerForm({
  seatNumbers,
  onPassengersChange,
  initialData = [],
}) {
  const [passengers, setPassengers] = useState(() => {
    return seatNumbers.map(
      (seatNo, index) =>
        initialData[index] || {
          seatNumber: seatNo,
          name: "",
          age: "",
          gender: "",
          phone: "",
          email: "",
        }
    );
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    onPassengersChange(passengers);
  }, [passengers, onPassengersChange]);

  const handleInputChange = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value,
    };
    setPassengers(updatedPassengers);

    const errorKey = `${index}-${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const validatePassenger = (passenger, index) => {
    const passengerErrors = {};

    if (!passenger.name.trim())
      passengerErrors[`${index}-name`] = "Name is required";
    if (!passenger.age || passenger.age < 1 || passenger.age > 120)
      passengerErrors[`${index}-age`] = "Valid age is required (1-120)";
    if (!passenger.gender)
      passengerErrors[`${index}-gender`] = "Gender is required";

    if (!passenger.phone.trim()) {
      passengerErrors[`${index}-phone`] = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(passenger.phone)) {
      passengerErrors[`${index}-phone`] = "Invalid phone number";
    }

    if (
      passenger.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)
    ) {
      passengerErrors[`${index}-email`] = "Invalid email address";
    }

    return passengerErrors;
  };

  const validateAllPassengers = useCallback(() => {
    let allErrors = {};
    passengers.forEach((passenger, index) => {
      const passengerErrors = validatePassenger(passenger, index);
      allErrors = { ...allErrors, ...passengerErrors };
    });
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  }, [passengers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.validatePassengers = validateAllPassengers;
    }
  }, [passengers, validateAllPassengers]);

  const copyToAll = (index) => {
    const sourcePassenger = passengers[index];
    const confirmed = window.confirm(
      "Copy contact details to all passengers? (Name and age will not be copied)"
    );

    if (confirmed) {
      const updatedPassengers = passengers.map((p, i) => ({
        ...p,
        phone: sourcePassenger.phone,
        email: sourcePassenger.email,
        gender: i === index ? p.gender : p.gender || sourcePassenger.gender,
      }));
      setPassengers(updatedPassengers);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Passenger Details</h2>
        <span className="text-sm text-gray-600">
          {passengers.length}{" "}
          {passengers.length === 1 ? "Passenger" : "Passengers"}
        </span>
      </div>

      {passengers.map((passenger, index) => (
        <div
          key={`passenger-${index}`}
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-info-500 text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Passenger {index + 1}
                </h3>
                <p className="text-sm text-gray-600">
                  Seat Number:{" "}
                  <span className="font-semibold text-info-600">
                    {passenger.seatNumber}
                  </span>
                </p>
              </div>
            </div>
            {index === 0 && passengers.length > 1 && (
              <button
                type="button"
                onClick={() => copyToAll(index)}
                className="text-sm text-info-600 hover:text-info-700 font-medium"
              >
                Copy Contact to All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <TextInput
                id={`name-${index}`}
                name={`name-${index}`}
                label="Full Name *"
                placeholder="Enter full name"
                value={passenger.name}
                onChange={(e) =>
                  handleInputChange(index, "name", e.target.value)
                }
                error={errors[`${index}-name`]}
                icon={<User size={18} className="text-gray-400" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age *
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={passenger.age}
                onChange={(e) =>
                  handleInputChange(index, "age", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 ${
                  errors[`${index}-age`]
                    ? "border-error-500"
                    : "border-gray-300"
                }`}
                placeholder="Age"
              />
              {errors[`${index}-age`] && (
                <p className="text-error-500 text-xs mt-1">
                  {errors[`${index}-age`]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                value={passenger.gender}
                onChange={(e) =>
                  handleInputChange(index, "gender", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-info-500 ${
                  errors[`${index}-gender`]
                    ? "border-error-500"
                    : "border-gray-300"
                }`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors[`${index}-gender`] && (
                <p className="text-error-500 text-xs mt-1">
                  {errors[`${index}-gender`]}
                </p>
              )}
            </div>

            <div>
              <TextInput
                id={`phone-${index}`}
                name={`phone-${index}`}
                label="Phone Number *"
                placeholder="+84 912 345 678"
                value={passenger.phone}
                onChange={(e) =>
                  handleInputChange(index, "phone", e.target.value)
                }
                error={errors[`${index}-phone`]}
                icon={<Phone size={18} className="text-gray-400" />}
              />
            </div>

            <div>
              <TextInput
                id={`email-${index}`}
                name={`email-${index}`}
                label="Email (Optional)"
                placeholder="email@example.com"
                type="email"
                value={passenger.email}
                onChange={(e) =>
                  handleInputChange(index, "email", e.target.value)
                }
                error={errors[`${index}-email`]}
                icon={<Mail size={18} className="text-gray-400" />}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-info-800">
          <strong>Note:</strong> Please ensure all passenger details are
          accurate. You may need to present ID proof during the journey.
        </p>
      </div>
    </div>
  );
}

PassengerForm.propTypes = {
  seatNumbers: PropTypes.array.isRequired,
  onPassengersChange: PropTypes.func.isRequired,
  initialData: PropTypes.array,
};
