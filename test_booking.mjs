import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

dotenv.config();

async function run() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Find a patient
    const { data: users } = await supabase.from('users').select('*').eq('role', 'patient').limit(1);
    const patient = users[0];

    // Find a doctor
    const { data: doctors } = await supabase.from('users').select('*').eq('role', 'doctor').limit(1);
    const doctor = doctors[0];

    // Create JWT for patient
    const token = jwt.sign(
        { id: patient.id, role: patient.role, email: patient.email },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
    );

    console.log("Testing with doctor_id:", doctor.id);

    // Try booking
    const apptRes = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ doctor_id: doctor.id, date: '2026-03-25', time: '10:00' })
    });
    const apptData = await apptRes.json();
    console.log('Appt Result:', apptData);
}
run();
