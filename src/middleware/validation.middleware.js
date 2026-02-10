/**
 * Validation Schemas and Middleware
 * Input validation for all API endpoints
 * Security: Prevent injection and malformed data
 */

import { ValidationError } from '../utils/errors.js';

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validation helper functions
 */
export const validators = {
  isUUID(value) {
    return UUID_REGEX.test(value);
  },

  isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  isDate(value) {
    return !isNaN(Date.parse(value));
  },

  isIn(value, allowedValues) {
    return allowedValues.includes(value);
  },

  isString(value) {
    return typeof value === 'string';
  },

  isNotEmpty(value) {
    return value !== null && value !== undefined && value !== '';
  },

  isLength(value, min, max) {
    if (typeof value !== 'string') return false;
    return value.length >= min && value.length <= max;
  }
};

/**
 * Schema definitions for different resources
 */
export const schemas = {
  // Medical Records
  medicalRecord: {
    create: {
      patient_id: { required: true, type: 'uuid' },
      diagnosis: { required: true, type: 'string', minLength: 1, maxLength: 1000 },
      prescription: { required: false, type: 'string', maxLength: 2000 },
      notes: { required: false, type: 'string', maxLength: 5000 }
    },
    update: {
      diagnosis: { required: false, type: 'string', minLength: 1, maxLength: 1000 },
      prescription: { required: false, type: 'string', maxLength: 2000 },
      notes: { required: false, type: 'string', maxLength: 5000 }
    }
  },

  // Appointments
  appointment: {
    create: {
      patient_id: { required: false, type: 'uuid' }, // Optional because controller fills it from token for patients
      doctor_id: { required: true, type: 'uuid' },
      date: { required: true, type: 'date' },
      time: { required: true, type: 'time' }
    },
    updateStatus: {
      status: {
        required: true,
        type: 'enum',
        values: ['scheduled', 'completed', 'cancelled']
      },
      cancellation_reason: { required: false, type: 'string', maxLength: 500 }
    }
  },

  // Consent
  consent: {
    grant: {
      consent_type: {
        required: true,
        type: 'enum',
        values: ['medical_records', 'data_sharing', 'treatment', 'research', 'marketing', 'emergency_contact']
      }
    }
  },


  // Authentication
  auth: {
    register: {
      email: { required: true, type: 'email' },
      password: { required: true, type: 'string', minLength: 8, maxLength: 100 },
      role: { required: true, type: 'enum', values: ['patient', 'doctor'] },
      name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
      phone: { required: false, type: 'string', maxLength: 20 },
      // Patient-specific
      date_of_birth: { required: false, type: 'date' },
      gender: { required: false, type: 'enum', values: ['male', 'female', 'other'] },
      address: { required: false, type: 'string', maxLength: 500 },
      // Doctor-specific
      specialization: { required: false, type: 'string', maxLength: 100 },
      department_id: { required: false, type: 'uuid' }
    },
    login: {
      email: { required: true, type: 'email' },
      password: { required: true, type: 'string' }
    }
  },

  // Visits (EPIC 3)
  visit: {
    create: {
      patient_id: { required: true, type: 'uuid' },
      doctor_id: { required: true, type: 'uuid' },
      visit_date: { required: true, type: 'date' },
      visit_time: { required: false, type: 'time' },
      chief_complaint: { required: false, type: 'string', maxLength: 500 },
      findings: { required: false, type: 'string', maxLength: 2000 },
      notes: { required: false, type: 'string', maxLength: 3000 }
    },
    update: {
      visit_date: { required: false, type: 'date' },
      visit_time: { required: false, type: 'time' },
      chief_complaint: { required: false, type: 'string', maxLength: 500 },
      findings: { required: false, type: 'string', maxLength: 2000 },
      notes: { required: false, type: 'string', maxLength: 3000 }
    }
  },

  // Prescriptions (EPIC 3)
  prescription: {
    create: {
      patient_id: { required: true, type: 'uuid' },
      doctor_id: { required: true, type: 'uuid' },
      visit_id: { required: false, type: 'uuid' },
      medication_name: { required: true, type: 'string', minLength: 1, maxLength: 200 },
      dosage: { required: true, type: 'string', minLength: 1, maxLength: 100 },
      frequency: { required: true, type: 'string', minLength: 1, maxLength: 100 },
      duration: { required: false, type: 'string', maxLength: 100 },
      notes: { required: false, type: 'string', maxLength: 1000 }
    },
    update: {
      medication_name: { required: false, type: 'string', minLength: 1, maxLength: 200 },
      dosage: { required: false, type: 'string', minLength: 1, maxLength: 100 },
      frequency: { required: false, type: 'string', minLength: 1, maxLength: 100 },
      duration: { required: false, type: 'string', maxLength: 100 },
      notes: { required: false, type: 'string', maxLength: 1000 }
    }
  }
};

/**
 * Validator shortcuts for controllers
 */
validators.register = schemas.auth.register;
validators.login = schemas.auth.login;

/**
 * Validate a value against schema rules
 */
function validateField(field, value, rules, errors) {
  // Required check
  if (rules.required && !validators.isNotEmpty(value)) {
    errors.push(`${field} is required`);
    return;
  }

  // Skip other validations if value is empty and not required
  if (!validators.isNotEmpty(value) && !rules.required) {
    return;
  }

  // Type validations
  switch (rules.type) {
    case 'uuid':
      if (!validators.isUUID(value)) {
        errors.push(`${field} must be a valid UUID`);
      }
      break;

    case 'email':
      if (!validators.isEmail(value)) {
        errors.push(`${field} must be a valid email address`);
      }
      break;

    case 'date':
      if (!validators.isDate(value)) {
        errors.push(`${field} must be a valid date`);
      }
      break;

    case 'time':
      if (!validators.isString(value) || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        errors.push(`${field} must be a valid time (HH:MM format)`);
      }
      break;

    case 'string':
      if (!validators.isString(value)) {
        errors.push(`${field} must be a string`);
      }
      break;

    case 'enum':
      if (!validators.isIn(value, rules.values)) {
        errors.push(`${field} must be one of: ${rules.values.join(', ')}`);
      }
      break;
  }

  // Length validations
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${field} must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`${field} must not exceed ${rules.maxLength} characters`);
  }
}

/**
 * Validation middleware factory
 * @param {Object} schema - Validation schema
 * @param {string} source - Where to get data (body, params, query)
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const errors = [];

    // Validate each field in schema
    for (const [field, rules] of Object.entries(schema)) {
      validateField(field, data[field], rules, errors);
    }

    // If there are validation errors, throw ValidationError
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  };
};

/**
 * Validate UUID parameter
 */
export const validateUUID = (paramName = 'id') => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!validators.isUUID(value)) {
      throw new ValidationError(`Invalid ${paramName}: must be a valid UUID`);
    }

    next();
  };
};

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}