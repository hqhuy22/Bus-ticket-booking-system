import PropTypes from 'prop-types';
import {
  colors,
  borderRadius,
  spacing,
  typography,
  transitions,
} from '../../theme/tokens';

/**
 * Button Component
 * Reusable button with multiple variants and sizes
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button style variant
 * @param {string} props.size - Button size
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {React.ReactNode} props.leftIcon - Icon to display on left
 * @param {React.ReactNode} props.rightIcon - Icon to display on right
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  className = '',
  ...rest
}) {
  const variants = {
    primary: {
      backgroundColor: colors.primary[500],
      color: colors.text.inverse,
      border: 'none',
      hover: {
        backgroundColor: colors.primary[600],
      },
      active: {
        backgroundColor: colors.primary[700],
      },
    },
    secondary: {
      backgroundColor: colors.secondary[500],
      color: colors.text.primary,
      border: 'none',
      hover: {
        backgroundColor: colors.secondary[600],
      },
      active: {
        backgroundColor: colors.secondary[700],
      },
    },
    outlined: {
      backgroundColor: 'transparent',
      color: colors.primary[500],
      border: `2px solid ${colors.primary[500]}`,
      hover: {
        backgroundColor: colors.primary[50],
      },
      active: {
        backgroundColor: colors.primary[100],
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.primary[500],
      border: 'none',
      hover: {
        backgroundColor: colors.primary[50],
      },
      active: {
        backgroundColor: colors.primary[100],
      },
    },
    danger: {
      backgroundColor: colors.error[500],
      color: colors.text.inverse,
      border: 'none',
      hover: {
        backgroundColor: colors.error[600],
      },
      active: {
        backgroundColor: colors.error[700],
      },
    },
    success: {
      backgroundColor: colors.success[500],
      color: colors.text.inverse,
      border: 'none',
      hover: {
        backgroundColor: colors.success[600],
      },
      active: {
        backgroundColor: colors.success[700],
      },
    },
  };

  const sizes = {
    sm: {
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: typography.fontSize['body-sm'].size,
      height: '32px',
    },
    md: {
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.fontSize.body.size,
      height: '40px',
    },
    lg: {
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: typography.fontSize['body-lg'].size,
      height: '48px',
    },
  };

  const buttonStyle = {
    ...variants[variant],
    ...sizes[size],
    borderRadius: borderRadius.md,
    fontWeight: typography.fontWeight.medium,
    transition: transitions.base,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: fullWidth ? '100%' : 'auto',
    fontFamily: typography.fontFamily.sans,
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`transition-all duration-300 hover:shadow-md active:scale-95 ${className}`}
      style={buttonStyle}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin"
          style={{ width: '16px', height: '16px' }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!loading && leftIcon && (
        <span className="flex items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="flex items-center">{rightIcon}</span>
      )}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outlined',
    'ghost',
    'danger',
    'success',
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
};
