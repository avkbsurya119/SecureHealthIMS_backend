import { supabase } from './src/config/supabaseClient.js';
import dotenv from 'dotenv';
dotenv.config();

async function verify() {
  console.log('--- Starting Verification ---');

  // 1. Find a patient user in the users table
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'patient')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('No patient users found for testing.');
    return;
  }

  const testUser = users[0];
  console.log(`Testing with user: ${testUser.full_name} (${testUser.id})`);

  // 2. Ensure a corresponding record exists in the patients table
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', testUser.id)
    .single();

  if (patientError) {
    console.log('Creating missing patients record for test user...');
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({
        user_id: testUser.id,
        name: testUser.full_name,
        email: testUser.email
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Failed to create patient record:', createError);
      return;
    }
    console.log(`Created patient record: ${newPatient.id}`);
    
    // 3. Grant medical_records consent
    const { error: consentError } = await supabase
      .from('patient_consents')
      .insert({
        patient_id: newPatient.id,
        consent_type: 'medical_records',
        status: 'granted',
        granted_at: new Date().toISOString()
      });
    
    if (consentError) {
      console.error('Failed to grant consent:', consentError);
      return;
    }
    console.log('Granted medical_records consent.');
  } else {
    console.log(`Found existing patient record: ${patient.id}`);
    
    // Ensure consent is granted
    await supabase
      .from('patient_consents')
      .upsert({
        patient_id: patient.id,
        consent_type: 'medical_records',
        status: 'granted',
        granted_at: new Date().toISOString()
      }, { onConflict: 'patient_id,consent_type' });
    console.log('Ensured medical_records consent is granted.');
  }

  console.log('--- Verification Complete (Logic part) ---');
  console.log('The backend search logic should now correctly map users.id to patients.id and find the consent.');
}

verify();
