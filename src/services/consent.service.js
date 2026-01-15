/**
 * Consent Service
 * Centralized logic for patient consent checking
 * Security: DEFAULT DENY - access requires explicit consent grant
 */

import { supabase } from '../config/supabaseClient.js';

export class ConsentService {
  /**
   * Check if patient has granted consent for a specific type
   * @param {string} patientId - Patient UUID
   * @param {string} consentType - Type of consent (medical_records, data_sharing, etc.)
   * @returns {Promise<boolean>} - true if consent granted, false otherwise
   */
  static async hasConsent(patientId, consentType) {
    const { data, error } = await supabase
      .from('patient_consents')
      .select('status')
      .eq('patient_id', patientId)
      .eq('consent_type', consentType)
      .eq('status', 'granted')
      .single();

    // DEFAULT DENY: No consent record or error = no access
    if (error || !data) {
      return false;
    }

    return data.status === 'granted';
  }

  /**
   * Check multiple consent types at once
   * @param {string} patientId - Patient UUID
   * @param {Array<string>} consentTypes - Array of consent types
   * @returns {Promise<Object>} - Object mapping consent types to boolean
   */
  static async checkMultipleConsents(patientId, consentTypes) {
    const { data, error } = await supabase
      .from('patient_consents')
      .select('consent_type, status')
      .eq('patient_id', patientId)
      .in('consent_type', consentTypes);

    const consentMap = {};
    
    // Initialize all to false (DEFAULT DENY)
    consentTypes.forEach(type => {
      consentMap[type] = false;
    });

    // Set to true only if explicitly granted
    if (!error && data) {
      data.forEach(consent => {
        if (consent.status === 'granted') {
          consentMap[consent.consent_type] = true;
        }
      });
    }

    return consentMap;
  }

  /**
   * Grant consent
   * @param {string} patientId - Patient UUID
   * @param {string} consentType - Type of consent
   * @param {string} userId - User granting consent (should be patient)
   * @returns {Promise<Object>} - Created/updated consent record
   */
  static async grantConsent(patientId, consentType, userId) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('patient_consents')
      .upsert({
        patient_id: patientId,
        consent_type: consentType,
        status: 'granted',
        granted_at: now,
        revoked_at: null,
        updated_at: now
      }, {
        onConflict: 'patient_id,consent_type'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Revoke consent
   * @param {string} patientId - Patient UUID
   * @param {string} consentType - Type of consent
   * @param {string} userId - User revoking consent
   * @returns {Promise<Object>} - Updated consent record
   */
  static async revokeConsent(patientId, consentType, userId) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('patient_consents')
      .update({
        status: 'revoked',
        revoked_at: now,
        updated_at: now
      })
      .eq('patient_id', patientId)
      .eq('consent_type', consentType)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get all consents for a patient
   * @param {string} patientId - Patient UUID
   * @returns {Promise<Array>} - List of consent records
   */
  static async getPatientConsents(patientId) {
    const { data, error } = await supabase
      .from('patient_consents')
      .select('*')
      .eq('patient_id', patientId)
      .order('consent_type');

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get consent history for a patient
   * @param {string} patientId - Patient UUID
   * @returns {Promise<Array>} - List of consent history records
   */
  static async getConsentHistory(patientId) {
    const { data, error } = await supabase
      .from('consent_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('changed_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }
}
