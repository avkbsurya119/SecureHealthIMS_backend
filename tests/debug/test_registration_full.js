
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testFullRegistration() {
    const realUID = '172c3b17-adb7-4e85-a9ce-c2043bb6ef3f';
    const email = 'svvishnubuddy@gmail.com';

    const userData = {
        id: realUID,
        email: email,
        full_name: 'Test Full Reg',
        phone: '1234567890',
        date_of_birth: '1990-01-01',
        gender: 'male',
        blood_group: 'A+',
        address: 'Test Address',
        allergies: 'None',
        medical_history: 'None',
        emergency_contact: 'Friend',
        emergency_phone: '9876543210',
        role: 'patient',
        is_active: true,
        profile_completed: true,
        approval_status: 'approved'
    };

    console.log(`--- TESTING FULL REGISTRATION FOR UID: ${realUID} ---`);
    const { data, error } = await supabase.from('users').insert(userData).select().single();

    if (error) {
        console.log('ERROR CAPTURED:');
        console.log('Code:', error.code);
        console.log('Message:', error.message);
        console.log('Details:', error.details);
        console.log('Hint:', error.hint);
    } else {
        console.log('SUCCESS! Full user record created:', data);
    }
    console.log('--- TEST END ---');
}

testFullRegistration();
setTimeout(() => process.exit(0), 5000);
