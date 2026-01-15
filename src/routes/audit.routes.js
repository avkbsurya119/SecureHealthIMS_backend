/**
 * Audit Logs Routes
 * Secure endpoints for viewing audit logs
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePatientOrAdmin, requireRole } from '../middleware/rbac.middleware.js';
import { validateUUID } from '../middleware/validation.middleware.js';
import {
  getMyAuditLogs,
  getAllAuditLogs,
  getPatientAuditLogs
} from '../controllers/audit.controller.js';

const router = express.Router();

/**
 * GET /api/audit/me
 * Get my audit logs (patient view - who accessed my data)
 * 
 * Security:
 * - Patient can see who accessed their data
 * - HIPAA transparency requirement
 */
router.get(
  '/me',
  authenticate,
  requirePatientOrAdmin,
  getMyAuditLogs
);

/**
 * GET /api/audit/all
 * Get all audit logs (admin view)
 * 
 * Security:
 * - Admin-only
 * - Full system audit trail
 */
router.get(
  '/all',
  authenticate,
  requireRole('admin'),
  getAllAuditLogs
);

/**
 * GET /api/audit/patient/:patientId
 * Get audit logs for a specific patient (admin view)
 * 
 * Security:
 * - Admin-only
 * - View all access to patient data
 */
router.get(
  '/patient/:patientId',
  authenticate,
  validateUUID('patientId'),
  requireRole('admin'),
  getPatientAuditLogs
);

export default router;
