import express from 'express';
import { getMyPrescriptions, getPrescriptionsByPatient, getPrescriptionById, createPrescription, updatePrescription, getDoctorPrescriptions } from '../controllers/prescriptions.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Patient Routes
router.get('/me', requireRole('patient'), getMyPrescriptions);

// Doctor Routes
router.post('/', requireRole('doctor'), createPrescription);
router.put('/:prescriptionId', requireRole('doctor'), updatePrescription);
router.get('/doctor/me', requireRole('doctor'), getDoctorPrescriptions);

// Shared Routes
// Updated controller logic to allow patient (own) and doctor (own)
router.get('/:prescriptionId', requireRole(['patient', 'doctor', 'nurse']), getPrescriptionById);

// Staff Routes (Doctor, Nurse)
router.get('/patient/:patientId', requireRole(['doctor', 'nurse']), getPrescriptionsByPatient);

export default router;
