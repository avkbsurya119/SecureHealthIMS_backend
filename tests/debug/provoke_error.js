
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function provoke() {
    const testId = '00000000-0000-0000-0000-000000000001'; // Dummy UUID
    const userData = {
        id: testId,
        email: `test_provoke_${Date.now()}@example.com`,
        full_name: 'Test Provoke',
        phone: '0000000000',
        date_of_birth: '1990-01-01',
        gender: 'male',
        role: 'patient',
        is_active: true,
        profile_completed: true,
        approval_status: 'approved'
    };

    console.log('--- PROVOKING ERROR ---');
    const { data, error } = await supabase.from('users').insert(userData).select().single();

    if (error) {
        console.log('ERROR CAPTURED:');
        console.log('Code:', error.code);
        console.log('Message:', error.message);
        console.log('Details:', error.details);
        console.log('Hint:', error.hint);
        if (error.message.includes('trigger') || error.details?.includes('trigger')) {
            console.log('CONFIRMED: Trigger issue.');
        }
    } else {
        console.log('SUCCESS (Unexpected):', data);
        // Clean up
        await supabase.from('users').delete().eq('id', testId);
    }
    console.log('--- PROVOKING END ---');
}

provoke();
setTimeout(() => process.exit(0), 5000);
