import { ValidationError } from '../types';

/**
 * Validates if a string is a valid URL format
 * @param url - The URL string to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates if validity period is a positive integer
 * @param validity - The validity period in minutes
 * @returns boolean indicating if validity is valid
 */
export function isValidValidity(validity: number): boolean {
  return Number.isInteger(validity) && validity > 0;
}

/**
 * Validates if shortcode is alphanumeric and of reasonable length
 * @param shortcode - The custom shortcode to validate
 * @returns boolean indicating if shortcode is valid
 */
export function isValidShortcode(shortcode: string): boolean {
  if (!shortcode) return true; // Optional field
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(shortcode) && shortcode.length >= 3 && shortcode.length <= 20;
}

/**
 * Validates URL creation form data
 * @param originalUrl - The original URL to shorten
 * @param validityMinutes - Optional validity period in minutes
 * @param customShortcode - Optional custom shortcode
 * @returns Array of validation errors (empty if valid)
 */
export function validateUrlCreation(
  originalUrl: string,
  validityMinutes?: number,
  customShortcode?: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate original URL
  if (!originalUrl || originalUrl.trim() === '') {
    errors.push({
      field: 'originalUrl',
      message: 'Original URL is required'
    });
  } else if (!isValidUrl(originalUrl.trim())) {
    errors.push({
      field: 'originalUrl',
      message: 'Please enter a valid URL (must start with http:// or https://)'
    });
  }

  // Validate validity period
  if (validityMinutes !== undefined) {
    if (!isValidValidity(validityMinutes)) {
      errors.push({
        field: 'validityMinutes',
        message: 'Validity period must be a positive integer (minutes)'
      });
    }
  }

  // Validate custom shortcode
  if (customShortcode && !isValidShortcode(customShortcode)) {
    errors.push({
      field: 'customShortcode',
      message: 'Shortcode must be alphanumeric and between 3-20 characters'
    });
  }

  return errors;
}

/**
 * Generates a random alphanumeric shortcode
 * @param length - Length of the shortcode (default: 6)
 * @returns Generated shortcode
 */
export function generateShortcode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Formats a date to a readable string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Checks if a URL has expired
 * @param expiresAt - Expiration date
 * @returns boolean indicating if URL has expired
 */
export function isExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
