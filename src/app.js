/**
 * Secure Healthcare Management System - Main Application
 * 
 * This is the central entry point for the SecureHealthIMS backend.
 * It initializes the Express application, configures security middleware,
 * sets up rate limiting, and mounts all API routes.
 * 
 * Architectural Features:
 * - RBAC (Role-Based Access Control)
 * - Consent Management Framework
 * - Automated Audit Logging
 * - HIPAA Compliance Guards
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { authLimiter, apiLimiter, consentLimiter } from './middleware/rateLimit.middleware.js'

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
import adminRoutes from './routes/admin.routes.js'
import doctorsRoutes from './routes/doctors.routes.js'
import chatbotRoutes from './routes/chatbot.routes.js'

// Import error handlers
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js'

const app = express()

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet: Sets various HTTP headers for security
app.use(helmet())

// CORS: Configure allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://secure-health-ims-frontend.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// HTTPS Enforcement: Reject insecure HTTP requests in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is over HTTPS (behind proxy)
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'HTTPS required. Please use HTTPS to access this API.',
          code: 'HTTPS_REQUIRED'
        }
      });
    }
    next();
  });
}

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting for authentication and sensitive endpoints


// ============================================================================
// API ROUTES
// ============================================================================

// Public routes (no authentication required)
app.use('/api/health', apiLimiter, healthRoutes)
app.use('/api/auth', authLimiter, authRoutes) // Authentication routes with strict rate limiting

// Protected routes (authentication required - enforced within routes)
app.use('/api/patients', apiLimiter, patientsRoutes) // Legacy patient routes
app.use('/api/medical-records', apiLimiter, medicalRecordsRoutes)
app.use('/api/appointments', apiLimiter, appointmentsRoutes)
app.use('/api/consent', consentLimiter, consentRoutes)
app.use('/api/audit', apiLimiter, auditRoutes)
app.use('/api/visits', apiLimiter, visitsRoutes) // EPIC 3: Clinical Records
app.use('/api/prescriptions', apiLimiter, prescriptionsRoutes) // EPIC 3: Treatment Workflow
app.use('/api/admin', apiLimiter, adminRoutes) // Admin routes
app.use('/api/doctors', apiLimiter, doctorsRoutes) // Doctors search
app.use('/api/chatbot', apiLimiter, chatbotRoutes) // AI Chatbot


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
