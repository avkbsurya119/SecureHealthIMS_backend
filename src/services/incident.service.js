import { supabase } from '../config/supabaseClient.js';

export class IncidentService {
  /**
   * Log a security incident
   * @param {Object} params - Incident parameters
   * @param {string} params.eventType - e.g., 'FAILED_LOGIN', 'SUSPICIOUS_ACCESS'
   * @param {string} params.severity - 'low', 'medium', 'high', 'critical'
   * @param {string} params.ipAddress - Request IP
   * @param {string} params.userAgent - Request user agent
   * @param {Object} params.details - Additional context
   */
  static async log({
    eventType,
    severity = 'medium',
    ipAddress = null,
    userAgent = null,
    details = {}
  }) {
    try {
      const { error } = await supabase
        .from('incident_logs')
        .insert({
          event_type: eventType,
          severity,
          ip_address: ipAddress,
          user_agent: userAgent,
          details
        });

      if (error) {
        console.error('Incident logging failed:', error);
      }
    } catch (error) {
      console.error('Incident logging exception:', error);
    }
  }

  static async getLogs(limit = 100) {
    const { data, error } = await supabase
      .from('incident_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
