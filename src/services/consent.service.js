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
    // Check if patientId is actually a user_id from the users table
    // Clinical tables like patient_consents use the internal patients.id
    
    let internalPatientId = patientId;

    // Fast check: if it's not in patient_consents, it might be a user_id
    const { data: consentData, error: consentError } = await supabase
      .from('patient_consents')
      .select('status')
      .eq('patient_id', patientId)
      .eq('consent_type', consentType)
      .eq('status', 'granted')
      .single();

    if (!consentError && consentData) {
      return true;
    }

    // If not found, it might be a user_id (UUID from users table)
    // We need to find the corresponding patients.id
    const { data: patientRecord } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', patientId)
      .single();

    if (patientRecord) {
      const { data: retryData } = await supabase
        .from('patient_consents')
        .select('status')
        .eq('patient_id', patientRecord.id)
        .eq('consent_type', consentType)
        .eq('status', 'granted')
        .single();
      
      return !!(retryData && retryData.status === 'granted');
    }

    return false;
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

    // Check if consent exists
    const { data: existing } = await supabase
      .from('patient_consents')
      .select('id')
      .eq('patient_id', patientId)
      .eq('consent_type', consentType)
      .single();

    let result;

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('patient_consents')
        .update({
          status: 'granted',
          granted_at: now,
          denied_at: null // Clear denied_at if re-granting
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('patient_consents')
        .insert({
          patient_id: patientId,
          consent_type: consentType,
          status: 'granted',
          granted_at: now
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result;
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
        denied_at: now
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
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }
}
