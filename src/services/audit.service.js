/**
 * Audit Service
 * Centralized audit logging functionality
 * Security: All logs are immutable and timestamped
 */

import { supabase } from '../config/supabaseClient.js';

export class AuditService {
  /**
   * Log an audit event
   * @param {Object} params - Audit event parameters
   * @param {string} params.userId - User performing the action
   * @param {string} params.patientId - Patient affected (if applicable)
   * @param {string} params.action - Action type (READ, CREATE, UPDATE, DELETE, EXPORT)
   * @param {string} params.resource - Resource name (e.g., 'medical_records')
   * @param {string} params.resourceId - Specific resource ID
   * @param {string} params.ipAddress - Request IP address
   * @param {string} params.userAgent - Request user agent
   * @param {Object} params.details - Additional details (JSONB)
   * @returns {Promise<Object>} - Created audit log record
   */
  static async log({
    userId,
    patientId = null,
    action,
    resource,
    resourceId = null,
    ipAddress = null,
    userAgent = null,
    requestId = null,
    details = null
  }) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          patient_id: patientId,
          action,
          resource,
          resource_id: resourceId,
          ip_address: ipAddress,
          details: details ? JSON.stringify(details) : null
        })
        .select()
        .single();

      if (error) {
        // Log to console but don't fail the request
        console.error('Audit logging failed:', error);
        return null;
      }

      return data;
    } catch (error) {
      // Never let audit logging failure break the application
      console.error('Audit logging exception:', error);
      return null;
    }
  }

  /**
   * Log READ action
   */
  static async logRead(userId, patientId, resource, resourceId, metadata = {}) {
    return this.log({
      userId,
      patientId,
      action: 'READ',
      resource,
      resourceId,
      ...metadata
    });
  }

  /**
   * Log CREATE action
   */
  static async logCreate(userId, patientId, resource, resourceId, metadata = {}) {
    return this.log({
      userId,
      patientId,
      action: 'CREATE',
      resource,
      resourceId,
      ...metadata
    });
  }

  /**
   * Log UPDATE action
   */
  static async logUpdate(userId, patientId, resource, resourceId, metadata = {}) {
    return this.log({
      userId,
      patientId,
      action: 'UPDATE',
      resource,
      resourceId,
      ...metadata
    });
  }

  /**
   * Log DELETE action
   */
  static async logDelete(userId, patientId, resource, resourceId, metadata = {}) {
    return this.log({
      userId,
      patientId,
      action: 'DELETE',
      resource,
      resourceId,
      ...metadata
    });
  }

  /**
   * Log EXPORT action
   */
  static async logExport(userId, patientId, resource, metadata = {}) {
    return this.log({
      userId,
      patientId,
      action: 'EXPORT',
      resource,
      ...metadata
    });
  }

  /**
   * Get audit logs for a specific patient
   * @param {string} patientId - Patient UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of audit log records
   */
  static async getPatientAuditLogs(patientId, options = {}) {
    const {
      limit = 100,
      offset = 0,
      action = null,
      startDate = null,
      endDate = null
    } = options;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('patient_id', patientId)
      .neq('user_id', patientId) // Exclude patient's own actions
      .order('created_at', { ascending: false });

    if (action) {
      query = query.eq('action', action);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get all audit logs (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of audit log records
   */
  static async getAllAuditLogs(options = {}) {
    const {
      limit = 100,
      offset = 0,
      action = null,
      userId = null,
      resource = null,
      startDate = null,
      endDate = null
    } = options;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (action) {
      query = query.eq('action', action);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (resource) {
      query = query.eq('resource', resource);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get audit summary for a patient
   * Shows who accessed their data and when
   */
  static async getPatientAccessSummary(patientId) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('user_id, action, resource, created_at')
      .eq('patient_id', patientId)
      .neq('user_id', patientId) // Exclude patient's own actions
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return data || [];
  }
}
