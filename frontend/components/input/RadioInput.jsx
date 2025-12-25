import { VisaCard, Mastercard } from '../../utils/index.js';
import { IoMdInformationCircleOutline } from 'react-icons/io';
export default function RadioInput({
  id,
  label,
  options = [],
  name,
  onChange,
  value,
  error,
}) {
  return (
    <div
      className={`flex sm:flex-row flex-col justify-between sm:items-start items-start`}
    >
      <label
        htmlFor={id}
        className={`block mb-2 text-sm font-medium text-black sm:min-w-40 tracking-wide sm:pt-2`}
      >
        {label}
      </label>
      <div
        className={`flex flex-col justify-start items-start flex-grow sm:px-0 px-4`}
      >
        <div className="flex justify-start items-center gap-4 space-x-4">
          {options.map(option => (
            <label key={option.value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={option.value}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
                className={`text-xs rounded-full border ${error ? 'border-error-500' : 'border-gray-300'} bg-gray-50`}
              />
              {option.value === 'visa' ? (
                <img src={VisaCard} alt="Visa" className="sm:h-10 h-8" />
              ) : (
                <img src={Mastercard} alt="Visa" className="sm:h-10 h-8" />
              )}
              <span className="text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
        {error && (
          <p className="flex justify-start items-center gap-1 text-error-500 text-xs">
            <IoMdInformationCircleOutline className={'scale-125'} />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
