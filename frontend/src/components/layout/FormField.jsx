import PropTypes from 'prop-types';
import { colors, borderRadius, spacing, typography } from '../../theme/tokens';

/**
 * FormField Component
 * Reusable form field with label, input, error message, and help text
 *
 * @param {Object} props
 * @param {string} props.id - Field ID
 * @param {string} props.label - Field label
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {string} props.placeholder - Input placeholder
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {string} props.error - Error message
 * @param {string} props.helpText - Help text below input
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {React.ReactNode} props.leftIcon - Icon on left side
 * @param {React.ReactNode} props.rightIcon - Icon on right side
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.inputMode - Input mode for mobile keyboards
 */
export default function FormField({
  id,
  label,
  type = 'text',
  name,
  value,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  onChange,
  onBlur,
  leftIcon,
  rightIcon,
  className = '',
  inputMode,
  ...rest
}) {
  const hasError = !!error;

  const inputStyle = {
    width: '100%',
    padding: `${spacing.sm} ${leftIcon || rightIcon ? spacing.xl : spacing.md}`,
    fontSize: typography.fontSize.body.size,
    fontFamily: typography.fontFamily.sans,
    color: colors.text.primary,
    backgroundColor: disabled ? colors.surface.base : colors.surface.white,
    border: `1px solid ${hasError ? colors.error[500] : colors.border.base}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: spacing.xs,
    fontSize: typography.fontSize['body-sm'].size,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  };

  const errorStyle = {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.caption.size,
    color: colors.error[500],
  };

  const helpTextStyle = {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.caption.size,
    color: colors.text.secondary,
  };

  return (
    <div className={`form-field ${className}`}>
      {/* Label */}
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
          {required && (
            <span style={{ color: colors.error[500], marginLeft: '4px' }}>
              *
            </span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div style={{ position: 'relative' }}>
        {/* Left Icon */}
        {leftIcon && (
          <div
            style={{
              position: 'absolute',
              left: spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.text.secondary,
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          inputMode={inputMode}
          style={inputStyle}
          className="focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          {...rest}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div
            style={{
              position: 'absolute',
              right: spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.text.secondary,
            }}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && <p style={errorStyle}>{error}</p>}

      {/* Help Text */}
      {!hasError && helpText && <p style={helpTextStyle}>{helpText}</p>}
    </div>
  );
}

FormField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  helpText: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  className: PropTypes.string,
  inputMode: PropTypes.string,
};

/**
 * TextArea Component (extends FormField for multiline input)
 */
export function TextAreaField({
  id,
  label,
  name,
  value,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  onChange,
  onBlur,
  rows = 4,
  className = '',
  ...rest
}) {
  const hasError = !!error;

  const textareaStyle = {
    width: '100%',
    padding: spacing.md,
    fontSize: typography.fontSize.body.size,
    fontFamily: typography.fontFamily.sans,
    color: colors.text.primary,
    backgroundColor: disabled ? colors.surface.base : colors.surface.white,
    border: `1px solid ${hasError ? colors.error[500] : colors.border.base}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    transition: 'all 0.2s ease',
    resize: 'vertical',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: spacing.xs,
    fontSize: typography.fontSize['body-sm'].size,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  };

  const errorStyle = {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.caption.size,
    color: colors.error[500],
  };

  const helpTextStyle = {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.caption.size,
    color: colors.text.secondary,
  };

  return (
    <div className={`form-field ${className}`}>
      {/* Label */}
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
          {required && (
            <span style={{ color: colors.error[500], marginLeft: '4px' }}>
              *
            </span>
          )}
        </label>
      )}

      {/* Textarea */}
      <textarea
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
        rows={rows}
        style={textareaStyle}
        className="focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        {...rest}
      />

      {/* Error Message */}
      {hasError && <p style={errorStyle}>{error}</p>}

      {/* Help Text */}
      {!hasError && helpText && <p style={helpTextStyle}>{helpText}</p>}
    </div>
  );
}

TextAreaField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  helpText: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  rows: PropTypes.number,
  className: PropTypes.string,
};
