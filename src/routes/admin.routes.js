import express from 'express';
import {
    getPendingDoctors,
    getAllUsers,
    approveDoctor,
    banUser,
    getDoctorDetails
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = express.Router();

// protect all admin routes
router.use(authenticate, requireRole('admin'));

/**
 * @route   GET /api/admin/requests
 * @desc    Get all pending doctor registration requests
 * @access  Private (Admin only)
 */
router.get('/requests', getPendingDoctors);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (doctors and patients)
 * @access  Private (Admin only)
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/admin/doctors/:id
 * @desc    Get specific doctor details
 * @access  Private (Admin only)
 */
router.get('/doctors/:id', getDoctorDetails);

/**
 * @route   POST /api/admin/approve/:id
 * @desc    Approve a doctor account
 * @access  Private (Admin only)
 */
router.post('/approve/:id', approveDoctor);

/**
 * @route   POST /api/admin/ban/:id
 * @desc    Ban a user account (doctor or patient)
 * @access  Private (Admin only)
 */
router.post('/ban/:id', banUser);

export default router;
