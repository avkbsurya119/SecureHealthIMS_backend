
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRegistration() {
    // We need a valid UID from auth.users that is NOT in the users table
    // Let's just try to insert a dummy one first to see the error message if it fails
    const dummyId = '00000000-0000-0000-0000-000000000000';

    const userData = {
        id: dummyId,
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '1234567890',
        date_of_birth: '1990-01-01',
        gender: 'male',
        role: 'patient',
        is_active: true,
        profile_completed: true,
        approval_status: 'approved'
    };

    console.log('Attempting to insert test user...');
    const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

    if (error) {
        console.error('Registration failed with error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Registration succeeded:', data);
    }
}

testRegistration();
