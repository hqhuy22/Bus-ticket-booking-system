import { Eye, EyeOff } from 'lucide-react';

export default function AuthInputIcon({
  id,
  label,
  placeholder,
  onChange,
  value,
  error,
  showPassword,
  setShowPassword,
}) {
  return (
    <div>
      <label
        className={`block text-sm font-medium text-gray-700 mb-1 capitalize`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={` ${error ? 'ring-red-500 ring-1' : 'border-gray-300 focus:ring-1 focus:ring-[#6d4aff] focus:border-transparent'} w-full px-3 py-2 border border-gray-300 rounded-lg hover:focus:outline-none focus:outline-none text-sm`}
          id={id}
          name={id}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          autoComplete="false"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
      {error && <p className="text-error-500 text-sm pt-1">{error}</p>}
    </div>
  );
}
