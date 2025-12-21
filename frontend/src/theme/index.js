/**
 * Theme System - Central Export
 *
 * This file exports all theme-related functionality
 * for easy import throughout the application.
 */

// Design Tokens
export * from './tokens';
export { default as theme } from './tokens';

// Re-export commonly used tokens for convenience
import { colors, typography, spacing, shadows, borderRadius } from './tokens';

export const designTokens = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
};

// Color utilities
export const getColor = colorPath => {
  const parts = colorPath.split('.');
  let result = colors;

  for (const part of parts) {
    if (result && typeof result === 'object') {
      result = result[part];
    } else {
      return undefined;
    }
  }

  return result;
};

// Typography utilities
export const getTypography = size => {
  return typography.fontSize[size] || typography.fontSize.body;
};

// Spacing utilities
export const getSpacing = size => {
  return spacing[size] || spacing.md;
};

/**
 * Usage Examples:
 *
 * // Import all tokens
 * import { colors, typography, spacing } from './theme';
 *
 * // Import specific utilities
 * import { getColor, getTypography } from './theme';
 *
 * // Use utilities
 * const primaryColor = getColor('primary.500');
 * const headingStyle = getTypography('h1');
 */
