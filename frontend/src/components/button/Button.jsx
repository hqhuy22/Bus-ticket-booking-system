import { CiCreditCard2 } from 'react-icons/ci';
import PropTypes from 'prop-types';

/**
 * Button Component - Enhanced with Theme System
 * @deprecated Consider using the new Button component from components/layout
 * This component is maintained for backward compatibility
 */
export default function Button({
  label = 'Button',
  onClick,
  className = '',
  type = 'button',
  variant = 'primary',
  Icon,
}) {
  // Theme-based variants
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700',
    secondary:
      'bg-secondary-500 hover:bg-secondary-600 active:bg-secondary-700',
    info: 'bg-info-500 hover:bg-info-600 active:bg-info-700',
    success: 'bg-success-500 hover:bg-success-600 active:bg-success-700',
    warning: 'bg-warning-500 hover:bg-warning-600 active:bg-warning-700',
    danger: 'bg-error-500 hover:bg-error-600 active:bg-error-700',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 text-white font-medium rounded transition duration-300 ${className ? className : variants[variant]} sm:text-sm text-xs`}
    >
      {label}
      {!Icon && (
        <CiCreditCard2
          className={`inline-block ml-2 h-5 w-5 sm:scale-125 sm:-translate-y-0.5`}
        />
      )}
    </button>
  );
}

Button.propTypes = {
  label: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'info',
    'success',
    'warning',
    'danger',
  ]),
  Icon: PropTypes.bool,
};
