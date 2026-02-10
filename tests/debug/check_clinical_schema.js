
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("--- Checking SCHEMA for 'visits' and 'prescriptions' ---");

    // Check visits
    const { data: vCols, error: vErr } = await supabase.rpc('get_column_info', { table_name: 'visits' });
    // If RPC doesn't exist, we'll try a different approach or just provoke an error

    // Actually, let's just try to insert a record with missing fields and catch the error
    console.log("\n1. Testing 'visits' insert with missing visit_time...");
    const { error: vInsertErr } = await supabase.from('visits').insert({
        patient_id: '00000000-0000-0000-0000-000000000000', // Dummy
        doctor_id: '00000000-0000-0000-0000-000000000000',
        visit_date: '2026-01-01'
    });
    console.log("Visits Insert Error:", vInsertErr?.message || "Success (Surprisingly)");

    console.log("\n2. Testing 'prescriptions' insert...");
    const { error: pInsertErr } = await supabase.from('prescriptions').insert({
        patient_id: '00000000-0000-0000-0000-000000000000',
        medication_name: 'Test'
    });
    console.log("Prescriptions Insert Error:", pInsertErr?.message || "Success");

    console.log("\n--- SCHEMA INFO (VIA PROVOCATION) ---");
}

checkSchema();
setTimeout(() => process.exit(0), 5000);
