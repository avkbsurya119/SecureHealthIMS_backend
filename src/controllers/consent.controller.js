/**
 * Consent Controller
 * Handles patient consent management
 * Security: Only patients can manage their own consent
 */

import { ConsentService } from '../services/consent.service.js';
import { ApiResponse } from '../utils/errors.js';
import { UnauthorizedError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * GRANT Consent
 * POST /api/consent/grant
 * 
 * Security:
 * - Patient-only endpoint
 * - Automatically logged in consent_history
 */
export const grantConsent = asyncHandler(async (req, res) => {
  const { consent_type } = req.body;
  const patientId = req.patientId; // Set by requirePatientOrAdmin middleware

  const consent = await ConsentService.grantConsent(
    patientId,
    consent_type,
    req.user.id
  );

  return ApiResponse.success(res, consent, `Consent granted for ${consent_type}`);
});

/**
 * REVOKE Consent
 * POST /api/consent/revoke
 * 
 * Security:
 * - Patient-only endpoint
 * - Immediately blocks access to data
 * - Logged in consent_history
 */
export const revokeConsent = asyncHandler(async (req, res) => {
  const { consent_type } = req.body;
  const patientId = req.patientId; // Set by requirePatientOrAdmin middleware

  const consent = await ConsentService.revokeConsent(
    patientId,
    consent_type,
    req.user.id
  );

  return ApiResponse.success(
    res,
    consent,
    `Consent revoked for ${consent_type}. Access to related data has been blocked.`
  );
});

/**
 * GET My Consents
 * GET /api/consent/me
 * 
 * Security:
 * - Patient can view their own consent status
 */
export const getMyConsents = asyncHandler(async (req, res) => {
  const patientId = req.patientId; // Set by requirePatientOrAdmin middleware

  const consents = await ConsentService.getPatientConsents(patientId);

  return ApiResponse.success(res, {
    consents,
    total: consents.length,
    summary: {
      granted: consents.filter(c => c.status === 'granted').length,
      denied: consents.filter(c => c.status === 'denied').length,
      revoked: consents.filter(c => c.status === 'revoked').length
    }
  });
});

/**
 * GET Consent History
 * GET /api/consent/history
 * 
 * Security:
 * - Patient can view their own consent history
 * - Immutable audit trail
 */
export const getConsentHistory = asyncHandler(async (req, res) => {
  const patientId = req.patientId; // Set by requirePatientOrAdmin middleware

  const history = await ConsentService.getConsentHistory(patientId);

  return ApiResponse.success(res, {
    history,
    total: history.length,
    note: 'This is an immutable audit trail of all consent changes'
  });
});

/**
 * GET Consent Status for Patient (Admin View)
 * GET /api/consent/patient/:patientId
 * 
 * Security:
 * - Admin-only endpoint
 * - Read-only view of patient consent
 */
export const getPatientConsents = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const consents = await ConsentService.getPatientConsents(patientId);
  const history = await ConsentService.getConsentHistory(patientId);

  return ApiResponse.success(res, {
    patient_id: patientId,
    consents,
    history,
    summary: {
      granted: consents.filter(c => c.status === 'granted').length,
      denied: consents.filter(c => c.status === 'denied').length,
      revoked: consents.filter(c => c.status === 'revoked').length
    }
  });
});
