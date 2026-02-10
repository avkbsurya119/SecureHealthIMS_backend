import express from 'express';
import { getMyVisits, getVisitById, createVisit, updateVisit, getDoctorVisits } from '../controllers/visits.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Patient Routes
router.get('/me', requireRole('patient'), getMyVisits);

// Doctor Routes
router.post('/', requireRole('doctor'), createVisit);
router.put('/:visitId', requireRole('doctor'), updateVisit);
router.get('/doctor/me', requireRole('doctor'), getDoctorVisits);

// Shared Routes (with specific logic inside controller or here)
// getVisitById has logic to allow Patient (own) OR Doctor (own/linked)
// For now, let's allow both to access specific ID if they know it, controller handles security.
// Actually, controller currently checks: if (patient && visit.patient_id != user.id) throw
// We need to update controller `getVisitById` to also allow the Doctor who created it.
router.get('/:visitId', requireRole(['patient', 'doctor']), getVisitById);

export default router;
