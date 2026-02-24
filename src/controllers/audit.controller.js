/**
 * Audit Logs Controller
 * Handles viewing of audit logs
 * Security: Immutable logs, patient can see who accessed their data
 */

import { AuditService } from '../services/audit.service.js';
import { ApiResponse } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * GET My Audit Logs (Patient View)
 * GET /api/audit/me
 * 
 * Security:
 * - Patient can see who accessed their data
 * - Transparency for HIPAA compliance
 */
export const getMyAuditLogs = asyncHandler(async (req, res) => {
  const patientId = req.user.id; // Use unified user.id (Auth UUID)
  const { limit = 50, offset = 0, action, from_date, to_date } = req.query;

  const logs = await AuditService.getPatientAuditLogs(patientId, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    action,
    startDate: from_date,
    endDate: to_date
  });

  const summary = await AuditService.getPatientAccessSummary(patientId);

  return ApiResponse.success(res, {
    logs,
    total: logs.length,
    summary: {
      recent_access: summary.slice(0, 10),
      note: 'This shows who has accessed your medical data'
    },
    filters: {
      action,
      from_date,
      to_date
    }
  });
});

/**
 * GET All Audit Logs (Admin View)
 * GET /api/audit/all
 * 
 * Security:
 * - Admin-only
 * - Full system audit trail
 */
export const getAllAuditLogs = asyncHandler(async (req, res) => {
  const {
    limit = 100,
    offset = 0,
    action,
    user_id,
    resource,
    from_date,
    to_date
  } = req.query;

  const logs = await AuditService.getAllAuditLogs({
    limit: parseInt(limit),
    offset: parseInt(offset),
    action,
    userId: user_id,
    resource,
    startDate: from_date,
    endDate: to_date
  });

  return ApiResponse.success(res, {
    logs,
    total: logs.length,
    filters: {
      action,
      user_id,
      resource,
      from_date,
      to_date
    },
    note: 'Audit logs are immutable and cannot be modified or deleted'
  });
});

/**
 * GET Audit Logs for a Patient (Admin View)
 * GET /api/audit/patient/:patientId
 * 
 * Security:
 * - Admin-only
 * - View all access to specific patient's data
 */
export const getPatientAuditLogs = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { limit = 100, offset = 0, action } = req.query;

  const logs = await AuditService.getPatientAuditLogs(patientId, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    action
  });

  const summary = await AuditService.getPatientAccessSummary(patientId);

  return ApiResponse.success(res, {
    patient_id: patientId,
    logs,
    total: logs.length,
    summary: {
      recent_access: summary.slice(0, 20)
    }
  });
});
