export default function AuthInput({
  id,
  label,
  placeholder,
  onChange,
  type = 'text',
  value,
  error,
}) {
  return (
    <div className="space-y-0.5">
      <label
        htmlFor={id}
        className={`block text-sm font-medium text-gray-700 mb-1 capitalize`}
      >
        {label}
      </label>
      <input
        type={type}
        className={` ${error ? 'ring-red-500 ring-1' : 'border-gray-300 focus:ring-1 focus:ring-[#6d4aff] focus:border-transparent'} w-full px-3 py-2 border border-gray-300 rounded-lg hover:focus:outline-none focus:outline-none text-sm`}
        id={id}
        name={id}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
      {error && <p className="text-error-500 text-sm pt-1">{error}</p>}
    </div>
  );
}
