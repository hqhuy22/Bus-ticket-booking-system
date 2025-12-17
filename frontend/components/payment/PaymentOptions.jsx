import PropTypes from "prop-types";

export default function PaymentOptions({ options = [] }) {
  if (!options.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
      {options.map((option) => (
        <div key={option.name} className="flex flex-col items-center">
          <div className="text-4xl mb-4">
            {option.icon ? (
              <img
                src={option.icon}
                alt={option.name}
                className="cursor-pointer"
              />
            ) : (
              <span className="text-gray-500">{option.name[0]}</span>
            )}
          </div>
          <h3 className="text-gray-700 text-center">{option.name}</h3>
        </div>
      ))}
    </div>
  );
}

PaymentOptions.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.string,
    })
  ),
};
