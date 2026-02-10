/**
 * Medical Records Routes
 * Secure endpoints for medical record management
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDoctor, requireRecordOwnership, requirePatientOrAdmin } from '../middleware/rbac.middleware.js';
import { requireMedicalRecordsConsent } from '../middleware/consent.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { validate, validateUUID, schemas } from '../middleware/validation.middleware.js';
import {
  createMedicalRecord,
  getPatientMedicalRecords,
  getMedicalRecord,
  updateMedicalRecord,
  getMyMedicalRecords
} from '../controllers/medicalRecords.controller.js';

const router = express.Router();

/**
 * POST /api/medical-records
 * Create a new medical record
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. requireDoctor - Only doctors can create records
 * 3. validate - Validate request body
 * 4. auditLog - Log the creation
 * 5. createMedicalRecord - Controller
 */
router.post(
  '/',
  authenticate,
  requireDoctor,
  validate(schemas.medicalRecord.create),
  auditLog('medical_records'),
  createMedicalRecord
);

/**
 * GET /api/medical-records/me
 * Get my own medical records (patient view)
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. requirePatientOrAdmin - Only patients can access
 * 3. auditLog - Log the read
 * 4. getMyMedicalRecords - Controller
 */
router.get(
  '/me',
  authenticate,
  requirePatientOrAdmin,
  auditLog('medical_records'),
  getMyMedicalRecords
);

/**
 * GET /api/medical-records/patient/:patientId
 * Get all medical records for a specific patient
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. validateUUID - Validate patient ID
 * 3. requireMedicalRecordsConsent - Check consent (skips for patient self-access)
 * 4. auditLog - Log the read
 * 5. getPatientMedicalRecords - Controller
 */
router.get(
  '/patient/:patientId',
  authenticate,
  validateUUID('patientId'),
  requireMedicalRecordsConsent,
  auditLog('medical_records'),
  getPatientMedicalRecords
);

/**
 * GET /api/medical-records/:recordId
 * Get a specific medical record
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. validateUUID - Validate record ID
 * 3. requireMedicalRecordsConsent - Check consent
 * 4. auditLog - Log the read
 * 5. getMedicalRecord - Controller
 */
router.get(
  '/:recordId',
  authenticate,
  validateUUID('recordId'),
  requireMedicalRecordsConsent,
  auditLog('medical_records'),
  getMedicalRecord
);

/**
 * PUT /api/medical-records/:recordId
 * Update a medical record
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. validateUUID - Validate record ID
 * 3. requireRecordOwnership - Only creator can update
 * 4. validate - Validate request body
 * 5. auditLog - Log the update
 * 6. updateMedicalRecord - Controller
 */
router.put(
  '/:recordId',
  authenticate,
  validateUUID('recordId'),
  requireRecordOwnership,
  validate(schemas.medicalRecord.update),
  auditLog('medical_records'),
  updateMedicalRecord
);

export default router;
