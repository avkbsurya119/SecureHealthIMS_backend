
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getSpecializations, getDoctors } from '../controllers/doctors.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/doctors/specializations
 * @desc    Get all unique specializations
 * @access  Private
 */
router.get('/specializations', getSpecializations);

/**
 * @route   GET /api/doctors
 * @desc    Get approved doctors (filterable by specialization)
 * @access  Private
 */
router.get('/', getDoctors);

export default router;
