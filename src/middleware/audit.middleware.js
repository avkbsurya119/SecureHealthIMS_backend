/**
 * Audit Logging Middleware
 * Automatically logs all API actions after authorization
 * Security: Provides complete traceability of all data access
 */

import { AuditService } from '../services/audit.service.js';
import { isValidUUID } from '../utils/validation.utils.js';

/**
 * Extract IP address from request
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null;
}

/**
 * Auto-audit middleware
 * Logs the request AFTER it completes successfully
 * 
 * Usage: Add after authentication/authorization, before controller
 * Automatically detects action type from HTTP method
 */
export const auditLog = (resource) => {
  return async (req, res, next) => {
    // Capture original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Track if response was sent
    let responseSent = false;

    // Override res.json to capture successful responses
    res.json = function (data) {
      if (!responseSent && res.statusCode >= 200 && res.statusCode < 400) {
        responseSent = true;
        logAudit(req, res, resource, data);
      }
      return originalJson(data);
    };

    // Override res.send as fallback
    res.send = function (data) {
      if (!responseSent && res.statusCode >= 200 && res.statusCode < 400) {
        responseSent = true;
        logAudit(req, res, resource, data);
      }
      return originalSend(data);
    };

    next();
  };
};

/**
 * Perform audit logging
 */
async function logAudit(req, res, resource, responseData) {
  try {
    // Determine action from HTTP method
    const actionMap = {
      'GET': 'READ',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    };

    const action = actionMap[req.method] || 'READ';

    // Extract and validate patient ID from various sources
    const rawPatientId = req.patientId ||
      req.params.patientId ||
      req.params.id ||
      req.query.patientId ||
      req.body?.patient_id ||
      req.record?.patient_id ||
      req.appointment?.patient_id ||
      null;
    const patientId = rawPatientId && isValidUUID(rawPatientId) ? rawPatientId : null;

    // Extract and validate resource ID from response or params
    const rawResourceId = req.params.id ||
      req.params.recordId ||
      req.params.appointmentId ||
      responseData?.data?.id ||
      null;
    const resourceId = rawResourceId && isValidUUID(rawResourceId) ? rawResourceId : null;

    // Build details object
    const details = {
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      consent_checked: req.consentChecked || false,
      consent_granted: req.consentGranted || false,
      consent_reason: req.consentReason || undefined,
      role: req.user?.role
    };

    // Log the audit event
    await AuditService.log({
      userId: req.user?.id || null,
      patientId,
      action,
      resource,
      resourceId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || null,
      requestId: req.id || null,
      details
    });
  } catch (error) {
    // Never let audit logging failure break the response
    console.error('Audit logging middleware error:', error);
  }
}

/**
 * Explicit audit logging for specific actions
 * Use when you need more control over what's logged
 */
export const logAction = async (req, action, resource, resourceId, details = {}) => {
  try {
    const rawPatientId = req.params.patientId || req.patientId || details.patientId || null;
    const patientId = rawPatientId && isValidUUID(rawPatientId) ? rawPatientId : null;

    await AuditService.log({
      userId: req.user?.id || null,
      patientId,
      action,
      resource,
      resourceId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || null,
      requestId: req.id || null,
      details: {
        ...details,
        role: req.user?.role
      }
    });
  } catch (error) {
    console.error('Manual audit logging error:', error);
  }
};
