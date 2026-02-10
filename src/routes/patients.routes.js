import express from 'express';
import { searchPatients, getPatientById, registerPatientAsUser, getMyPatientData } from '../controllers/patients.controller.js';
import { authenticate, requireRole, authenticateSupabaseOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes that work BEFORE user is in users table (Supabase auth only)
router.get('/me', authenticateSupabaseOnly, getMyPatientData);
router.post('/register-user', authenticateSupabaseOnly, registerPatientAsUser);

// Routes that require full authentication (user must be in users table)
router.use(authenticate);

// Search Patients (Doctor/Admin/Nurse only)
router.get('/search', requireRole(['doctor', 'admin', 'nurse']), searchPatients);

// Get Patient by ID (Accessible to medical staff)
// Note: Patients should access their own profile via /profile/me or /auth/me
router.get('/:id', requireRole(['doctor', 'admin', 'nurse']), getPatientById);

export default router;

