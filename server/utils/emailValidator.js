import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

/**
 * Validate email format using strict regex
 * @param {string} email - Email address to validate
 * @returns {boolean} True if format is valid
 */
export function isValidEmailFormat(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Check if email domain has valid MX records (mail servers)
 * This verifies that the domain can receive emails
 * @param {string} email - Email address to check
 * @returns {Promise<{valid: boolean, reason?: string}>}
 */
export async function checkEmailDomainExists(email) {
  try {
    // Extract domain from email
    const domain = email.split('@')[1];

    if (!domain) {
      return { valid: false, reason: 'Invalid email format' };
    }

    // Check for MX records (mail exchange servers)
    try {
      const mxRecords = await resolveMx(domain);

      if (mxRecords && mxRecords.length > 0) {
        // Domain has mail servers, email can potentially receive mail
        return { valid: true, mxRecords: mxRecords.length };
      } else {
        return { valid: false, reason: 'No mail servers found for this domain' };
      }
    } catch (dnsError) {
      // DNS lookup failed - domain doesn't exist or has no MX records
      if (dnsError.code === 'ENODATA') {
        return { valid: false, reason: 'Domain has no mail servers (no MX records)' };
      } else if (dnsError.code === 'ENOTFOUND') {
        return { valid: false, reason: 'Domain does not exist' };
      } else {
        return { valid: false, reason: `DNS error: ${dnsError.code}` };
      }
    }
  } catch (error) {
    console.error('Email domain check error:', error);
    return { valid: false, reason: 'Unable to verify email domain' };
  }
}

/**
 * Comprehensive email validation (format + domain existence)
 * @param {string} email - Email address to validate
 * @returns {Promise<{valid: boolean, reason?: string, checkType?: string}>}
 */
export async function validateEmail(email) {
  // First check format
  if (!isValidEmailFormat(email)) {
    return {
      valid: false,
      reason: 'Invalid email format. Only letters, numbers, and . _ % + - are allowed',
      checkType: 'format',
    };
  }

  // Then check domain existence (MX records)
  const domainCheck = await checkEmailDomainExists(email);

  if (!domainCheck.valid) {
    return {
      valid: false,
      reason: domainCheck.reason,
      checkType: 'domain',
    };
  }

  return {
    valid: true,
    checkType: 'full',
    mxRecords: domainCheck.mxRecords,
  };
}

/**
 * List of common disposable/temporary email domains to block (optional)
 */
export const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'yopmail.com',
];

/**
 * Check if email is from a disposable/temporary email service
 * @param {string} email - Email address to check
 * @returns {boolean} True if disposable
 */
export function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}
