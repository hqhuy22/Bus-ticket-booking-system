import PropTypes from 'prop-types';
import { colors, borderRadius, shadows, spacing } from '../../theme/tokens';

/**
 * Card Component
 * Reusable card container with consistent styling
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.header - Optional card header
 * @param {React.ReactNode} props.footer - Optional card footer
 * @param {string} props.variant - Card style variant (default, outlined, elevated)
 * @param {string} props.padding - Padding size (none, sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler (makes card clickable)
 * @param {boolean} props.hoverable - Add hover effect
 */
export default function Card({
  children,
  header,
  footer,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hoverable = false,
  ...rest
}) {
  const variants = {
    default: {
      backgroundColor: colors.surface.white,
      border: 'none',
      boxShadow: shadows.sm,
    },
    outlined: {
      backgroundColor: colors.surface.white,
      border: `1px solid ${colors.border.base}`,
      boxShadow: 'none',
    },
    elevated: {
      backgroundColor: colors.surface.white,
      border: 'none',
      boxShadow: shadows.md,
    },
  };

  const paddingValues = {
    none: '0',
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
  };

  const isClickable = onClick || hoverable;

  const cardStyle = {
    ...variants[variant],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  };

  return (
    <div
      className={`rounded-lg transition-all duration-300 ${
        isClickable
          ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
          : ''
      } ${className}`}
      style={cardStyle}
      onClick={onClick}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick(e);
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
    >
      {/* Card Header */}
      {header && (
        <div
          className="border-b"
          style={{
            padding: paddingValues[padding],
            borderColor: colors.border.base,
          }}
        >
          {header}
        </div>
      )}

      {/* Card Content */}
      <div
        style={{
          padding: paddingValues[padding],
        }}
      >
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div
          className="border-t"
          style={{
            padding: paddingValues[padding],
            borderColor: colors.border.base,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.node,
  footer: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'outlined', 'elevated']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  onClick: PropTypes.func,
  hoverable: PropTypes.bool,
};
