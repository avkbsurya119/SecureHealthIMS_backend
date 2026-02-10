
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DOCTOR_ID = '608a3980-8a90-4999-b97b-75e765212160'; // Vishnu S (Doctor)
const PATIENT_ID = 'bb27efa9-d056-4ea9-803c-6a7062a6eaf2'; // Patient

async function verifyClinical() {
    console.log("--- Verifying Clinical Flow (Unified IDs) ---");

    // 1. Create Visit
    console.log("\n1. Creating Visit...");
    const visitData = {
        patient_id: PATIENT_ID,
        doctor_id: DOCTOR_ID,
        visit_date: new Date().toISOString().split('T')[0],
        diagnosis: 'Verification Test Diagnosis',
        notes: 'Clinical verification test notes'
    };

    const { data: vData, error: vErr } = await supabase.from('visits').insert(visitData).select().single();
    if (vErr) {
        console.error("Visit Creation FAILED:", vErr.message);
    } else {
        console.log("Visit Creation SUCCESS! ID:", vData.id);

        // 2. Create Prescription linked to Visit
        console.log("\n2. Creating Prescription...");
        const prescriptionData = {
            patient_id: PATIENT_ID,
            doctor_id: DOCTOR_ID,
            visit_id: vData.id,
            medication_name: 'TestMed 500',
            dosage: '500mg',
            frequency: 'Once daily',
            duration: '5 days',
            instructions: 'Take with food'
        };

        const { data: pData, error: pErr } = await supabase.from('prescriptions').insert(prescriptionData).select().single();
        if (pErr) {
            console.error("Prescription Creation FAILED:", pErr.message);
        } else {
            console.log("Prescription Creation SUCCESS! ID:", pData.id);
        }
    }
}

verifyClinical();
setTimeout(() => process.exit(0), 5000);
