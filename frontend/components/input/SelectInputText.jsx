import { IoMdInformationCircleOutline } from 'react-icons/io';

const SelectInputText = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  planText,
}) => {
  const months = Array.from({ length: 12 }, (_, start) => start + 1);

  return (
    <div className="flex sm:flex-row flex-col justify-between sm:items-start items-start">
      <label
        htmlFor={id}
        className="block mb-2 text-sm font-medium text-black min-w-40 tracking-wide sm:pt-2"
      >
        {label}
      </label>
      <div className="flex-grow">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={`border ${error ? 'border-error-500' : 'border-gray-300'} text-xs bg-gray-50 text-gray-900 rounded-lg block p-2.5 sm:min-w-fit min-w-[85%] ${value && 'bg-blue-100 '}`}
        >
          <option value={`sm:max-h-[40%] `}>{planText}</option>
          {months.map(month => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        {error && (
          <p className="flex justify-start items-center gap-1 text-error-500 text-xs pt-1">
            <span className="scale-125">
              <IoMdInformationCircleOutline />
            </span>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default SelectInputText;
