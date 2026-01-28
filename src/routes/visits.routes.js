/**
 * Visits Routes (EPIC 3: Clinical Records & Treatment Workflow)
 * Secure endpoints for clinical visit/encounter management
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDoctor, requireAnyRole } from '../middleware/rbac.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { validate, validateUUID, schemas } from '../middleware/validation.middleware.js';
import {
  createVisit,
  getVisitById,
  getPatientVisits,
  getDoctorVisits,
  updateVisit,
  deleteVisit
} from '../controllers/visits.controller.js';

const router = express.Router();

/**
 * POST /api/visits
 * Create a new visit record
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. requireDoctor - Only doctors can create records (3.1)
 * 3. validate - Validate request body
 * 4. auditLog - Log the creation
 * 5. createVisit - Controller
 */
router.post(
  '/',
  authenticate,
  requireDoctor,
  validate(schemas.visit.create),
  auditLog('visits'),
  createVisit
);

/**
 * GET /api/visits/patient/:patientId
 * Get all visits for a specific patient (visit history)
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. validateUUID - Validate patient ID format
 * 3. auditLog - Log the read
 * 4. getPatientVisits - Controller (3.2)
 */
router.get(
  '/patient/:patientId',
  authenticate,
  validateUUID('patientId'),
  auditLog('visits'),
  getPatientVisits
);

/**
 * GET /api/visits/doctor/:doctorId
 * Get all visits created by a specific doctor
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. validateUUID - Validate doctor ID format
 * 3. requireAnyRole - Doctor or admin only (3.6)
 * 4. auditLog - Log the read
 * 5. getDoctorVisits - Controller
 */
router.get(
  '/doctor/:doctorId',
  authenticate,
  validateUUID('doctorId'),
  requireAnyRole(['admin', 'doctor']),
  auditLog('visits'),
  getDoctorVisits
);

/**
 * GET /api/visits/:visitId
 * Get a specific visit record
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. validateUUID - Validate visit ID format
 * 3. auditLog - Log the read
 * 4. getVisitById - Controller (3.2)
 */
router.get(
  '/:visitId',
  authenticate,
  validateUUID('visitId'),
  auditLog('visits'),
  getVisitById
);

/**
 * PUT /api/visits/:visitId
 * Update a visit record
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. requireDoctor - Only doctors can update (3.6)
 * 3. validateUUID - Validate visit ID format
 * 4. validate - Validate request body
 * 5. auditLog - Log the update
 * 6. updateVisit - Controller (ownership check inside)
 */
router.put(
  '/:visitId',
  authenticate,
  requireDoctor,
  validateUUID('visitId'),
  validate(schemas.visit.update),
  auditLog('visits'),
  updateVisit
);

/**
 * DELETE /api/visits/:visitId
 * Delete a visit record
 * 
 * Security Chain:
 * 1. authenticate - Verify JWT token
 * 2. requireDoctor - Only doctors can delete (3.6)
 * 3. validateUUID - Validate visit ID format
 * 4. auditLog - Log the deletion
 * 5. deleteVisit - Controller (ownership check inside)
 */
router.delete(
  '/:visitId',
  authenticate,
  requireDoctor,
  validateUUID('visitId'),
  auditLog('visits'),
  deleteVisit
);

export default router;
