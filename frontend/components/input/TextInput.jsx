import { IoMdInformationCircleOutline } from "react-icons/io";
import PropTypes from "prop-types";

export default function TextInput({
  id,
  label,
  placeholder,
  onChange,
  type = "text",
  value,
  error,
  maxLength = "",
  icon = null,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block mb-2 text-sm font-medium text-gray-900"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className={`border ${
            error ? "ring-red-500 ring-2" : "border-gray-300"
          } text-sm bg-gray-50 text-gray-900 rounded-lg hover:outline-none focus:outline-none block w-full p-2.5 hover:ring-2 shadow ${
            icon ? "pl-10" : ""
          }`}
          maxLength={type === "number" ? undefined : maxLength}
        />
      </div>
      {error && (
        <p className="flex justify-start items-center gap-1 text-error-500 text-sm pt-1">
          <IoMdInformationCircleOutline className="scale-125" />
          {error}
        </p>
      )}
    </div>
  );
}

TextInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  error: PropTypes.string,
  maxLength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.node,
};
