/**
 * Prescriptions Routes (EPIC 3: Clinical Records & Treatment Workflow)
 * Secure endpoints for medication prescription management
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDoctor, requireAnyRole } from '../middleware/rbac.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { validate, validateUUID, schemas } from '../middleware/validation.middleware.js';
import {
  createPrescription,
  getPrescriptionById,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  updatePrescription,
  deletePrescription
} from '../controllers/prescriptions.controller.js';

const router = express.Router();

/**
 * POST /api/prescriptions
 * Create a new prescription
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. requireDoctor - Only doctors can create prescriptions (3.3)
 * 3. validate - Validate request body and dosage fields
 * 4. auditLog - Log the creation
 * 5. createPrescription - Controller
 */
router.post(
  '/',
  authenticate,
  requireDoctor,
  validate(schemas.prescription.create),
  auditLog('prescriptions'),
  createPrescription
);

/**
 * GET /api/prescriptions/patient/:patientId
 * Get all prescriptions for a specific patient
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. validateUUID - Validate patient ID format
 * 3. auditLog - Log the read
 * 4. getPatientPrescriptions - Controller (3.4)
 */
router.get(
  '/patient/:patientId',
  authenticate,
  validateUUID('patientId'),
  auditLog('prescriptions'),
  getPatientPrescriptions
);

/**
 * GET /api/prescriptions/doctor/:doctorId
 * Get all prescriptions issued by a specific doctor
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. validateUUID - Validate doctor ID format
 * 3. requireAnyRole - Doctor or admin only
 * 4. auditLog - Log the read
 * 5. getDoctorPrescriptions - Controller
 */
router.get(
  '/doctor/:doctorId',
  authenticate,
  validateUUID('doctorId'),
  requireAnyRole(['admin', 'doctor']),
  auditLog('prescriptions'),
  getDoctorPrescriptions
);

/**
 * GET /api/prescriptions/:prescriptionId
 * Get a specific prescription
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. validateUUID - Validate prescription ID format
 * 3. auditLog - Log the read
 * 4. getPrescriptionById - Controller (3.4)
 */
router.get(
  '/:prescriptionId',
  authenticate,
  validateUUID('prescriptionId'),
  auditLog('prescriptions'),
  getPrescriptionById
);

/**
 * PUT /api/prescriptions/:prescriptionId
 * Update a prescription
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. requireDoctor - Only doctors can update (3.3)
 * 3. validateUUID - Validate prescription ID format
 * 4. validate - Validate request body and dosage fields
 * 5. auditLog - Log the update
 * 6. updatePrescription - Controller (ownership check inside)
 */
router.put(
  '/:prescriptionId',
  authenticate,
  requireDoctor,
  validateUUID('prescriptionId'),
  validate(schemas.prescription.update),
  auditLog('prescriptions'),
  updatePrescription
);

/**
 * DELETE /api/prescriptions/:prescriptionId
 * Delete a prescription
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. requireDoctor - Only doctors can delete
 * 3. validateUUID - Validate prescription ID format
 * 4. auditLog - Log the deletion
 * 5. deletePrescription - Controller (ownership check inside)
 */
router.delete(
  '/:prescriptionId',
  authenticate,
  requireDoctor,
  validateUUID('prescriptionId'),
  auditLog('prescriptions'),
  deletePrescription
);

export default router;
