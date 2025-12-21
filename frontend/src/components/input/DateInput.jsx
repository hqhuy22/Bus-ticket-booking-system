import { FaCalendarAlt } from 'react-icons/fa';
export default function DateInput({ value, onChange, error }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        JOURNEY DATE
      </label>
      <div className="relative">
        <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="date"
          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg hover:outline-none focus:outline-none  focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${error && 'border-error-500'} ${value !== 'bg-blue-100'}`}
          value={value}
          onChange={onChange}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>
  );
}
