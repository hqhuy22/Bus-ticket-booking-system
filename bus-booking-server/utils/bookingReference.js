/**
 * Booking Reference Generation Utility
 * Creates unique, user-friendly booking reference numbers
 */

/**
 * Generate a unique booking reference
 * Format: BKG-XXXXXX-YYYY
 * - XXXXXX: Base36 timestamp (compact)
 * - YYYY: Random alphanumeric string
 *
 * @returns {string} Unique booking reference
 */
export function generateBookingReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BKG-${timestamp}-${random}`;
}

/**
 * Validate booking reference format
 * @param {string} reference - Booking reference to validate
 * @returns {boolean} True if valid format
 */
export function isValidBookingReference(reference) {
  if (!reference || typeof reference !== 'string') {
    return false;
  }

  // Format: BKG-XXXXXX-YYYY (alphanumeric)
  const pattern = /^BKG-[A-Z0-9]+-[A-Z0-9]+$/;
  return pattern.test(reference);
}

/**
 * Generate a guest customer identifier
 * Used for linking bookings without account creation
 * @param {string} email - Guest email
 * @param {string} phone - Guest phone
 * @returns {string} Guest identifier
 */
export function generateGuestIdentifier(email, phone) {
  const emailPart = email ? email.toLowerCase().substring(0, 8) : '';
  const phonePart = phone ? phone.replace(/\D/g, '').slice(-4) : '';
  const timestamp = Date.now().toString(36).toUpperCase();
  return `GUEST-${timestamp}-${emailPart}-${phonePart}`.substring(0, 50);
}
