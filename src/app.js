/**
 * Secure Healthcare Management System - Main Application
 * Backend API with RBAC, Consent Management, and Audit Logging
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Import routes
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import patientsRoutes from './routes/patients.routes.js'
import medicalRecordsRoutes from './routes/medicalRecords.routes.js'
import appointmentsRoutes from './routes/appointments.routes.js'
import consentRoutes from './routes/consent.routes.js'
import auditRoutes from './routes/audit.routes.js'
import visitsRoutes from './routes/visits.routes.js'
import prescriptionsRoutes from './routes/prescriptions.routes.js'

// Import error handlers
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js'

const app = express()

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet: Sets various HTTP headers for security
app.use(helmet())

// CORS: Configure allowed origins
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting for authentication and sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per 15 minutes
  message: 'Too many authentication attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
})

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
})

// Strict rate limiting for consent changes
const consentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many consent changes, please try again later'
})

// ============================================================================
// API ROUTES
// ============================================================================

// Public routes (no authentication required)
app.use('/api/health', healthRoutes)
app.use('/api/auth', authLimiter, authRoutes) // Authentication routes with strict rate limiting

// Protected routes (authentication required - enforced within routes)
app.use('/api/patients', patientsRoutes) // Legacy patient routes
app.use('/api/medical-records', apiLimiter, medicalRecordsRoutes)
app.use('/api/appointments', apiLimiter, appointmentsRoutes)
app.use('/api/consent', consentLimiter, consentRoutes)
<<<<<<< HEAD
app.use('/api/audit', apiLimiter, auditRoutes)
=======
app.use('/api/audit', authLimiter, auditRoutes)
app.use('/api/visits', authLimiter, visitsRoutes) // EPIC 3: Clinical Records
app.use('/api/prescriptions', authLimiter, prescriptionsRoutes) // EPIC 3: Treatment Workflow
>>>>>>> ccffe3c4e76f14e5fba92a18e0ea124f69d471a9

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler - must be after all routes
app.use(notFoundHandler)

// Global error handler - must be last
app.use(errorHandler)

// ============================================================================
// EXPORT
// ============================================================================

export default app
