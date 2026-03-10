/**
 * Validation Utilities
 * Security: Input validation for sensitive data
 */

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid UUID
 */
export const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
};

/**
 * Sanitize string for logging (prevent log injection)
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} - Sanitized string
 */
export const sanitizeForLog = (str, maxLength = 100) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[\r\n\t]/g, ' ').substring(0, maxLength);
};

/**
 * Extract and validate patient ID from request
 * @param {object} req - Express request object
 * @returns {string|null} - Valid patient ID or null
 */
export const extractPatientId = (req) => {
  const patientId = req.params.patientId ||
                   req.query.patientId ||
                   req.patientId ||
                   req.body?.patient_id;

  if (!patientId) return null;
  if (!isValidUUID(patientId)) return null;

  return patientId;
};
