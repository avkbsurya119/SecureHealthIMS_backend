/**
 * Consent Routes
 * Secure endpoints for consent management
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePatientOrAdmin, requireRole } from '../middleware/rbac.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { validate, validateUUID, schemas } from '../middleware/validation.middleware.js';
import {
  grantConsent,
  revokeConsent,
  getMyConsents,
  getConsentHistory,
  getPatientConsents
} from '../controllers/consent.controller.js';

const router = express.Router();

/**
 * POST /api/consent/grant
 * Grant consent for a specific type
 * 
 * Security:
 * - Patient-only
 * - Automatically logged in consent_history table
 */
router.post(
  '/grant',
  authenticate,
  requirePatientOrAdmin,
  validate(schemas.consent.grant),
  auditLog('patient_consents'),
  grantConsent
);

/**
 * POST /api/consent/revoke
 * Revoke consent for a specific type
 * 
 * Security:
 * - Patient-only
 * - Immediately blocks access to related data
 */
router.post(
  '/revoke',
  authenticate,
  requirePatientOrAdmin,
  validate(schemas.consent.grant), // Uses same schema
  auditLog('patient_consents'),
  revokeConsent
);

/**
 * GET /api/consent/me
 * Get my consent status
 * 
 * Security:
 * - Patient can view their own consents
 */
router.get(
  '/me',
  authenticate,
  requirePatientOrAdmin,
  auditLog('patient_consents'),
  getMyConsents
);

/**
 * GET /api/consent/history
 * Get my consent history
 * 
 * Security:
 * - Patient can view their own consent history
 * - Immutable audit trail
 */
router.get(
  '/history',
  authenticate,
  requirePatientOrAdmin,
  auditLog('consent_history'),
  getConsentHistory
);

/**
 * GET /api/consent/patient/:patientId
 * Get consent status for a specific patient (Admin only)
 * 
 * Security:
 * - Admin-only
 * - Read-only view
 */
router.get(
  '/patient/:patientId',
  authenticate,
  validateUUID('patientId'),
  requireRole('admin'),
  auditLog('patient_consents'),
  getPatientConsents
);

export default router;
