
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRealUID() {
    const realUID = '172c3b17-adb7-4e85-a9ce-c2043bb6ef3f';
    const email = 'svvishnubuddy@gmail.com';

    const userData = {
        id: realUID,
        email: email,
        full_name: 'Test Real User',
        phone: '1112223333',
        date_of_birth: '1995-05-05',
        gender: 'male',
        role: 'patient',
        is_active: true,
        profile_completed: true,
        approval_status: 'approved'
    };

    console.log(`--- TESTING REAL UID: ${realUID} ---`);
    const { data, error } = await supabase.from('users').insert(userData).select().single();

    if (error) {
        console.log('ERROR CAPTURED:');
        console.log('Code:', error.code);
        console.log('Message:', error.message);
        console.log('Details:', error.details);
        console.log('Hint:', error.hint);
    } else {
        console.log('SUCCESS! User record created:', data);
        // Do NOT delete yet, let's verify it persists
    }
    console.log('--- TEST END ---');
}

testRealUID();
setTimeout(() => process.exit(0), 5000);
