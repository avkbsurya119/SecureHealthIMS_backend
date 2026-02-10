import { supabase } from '../src/config/supabaseClient.js';

/**
 * Simple script to insert test patients directly into users table
 * This bypasses auth user creation and just populates the data needed for search
 */

async function insertTestPatients() {
    console.log('Inserting test patient data...\n');

    // Note: These UUIDs need to match existing auth.users records
    // OR you need to create auth users first in Supabase dashboard
    // For now, we'll try to insert and see what happens

    const testPatients = [
        {
            id: '00000000-0000-0000-0000-000000000001', // Placeholder UUID
            email: 'test.patient1@example.com',
            full_name: 'Test Patient One',
            phone: '+1-555-0001',
            date_of_birth: '1990-01-15',
            gender: 'male',
            blood_group: 'O+',
            role: 'patient',
            is_active: true,
            profile_completed: true,
            approval_status: 'approved'
        },
        {
            id: '00000000-0000-0000-0000-000000000002',
            email: 'test.patient2@example.com',
            full_name: 'Test Patient Two',
            phone: '+1-555-0002',
            date_of_birth: '1985-05-20',
            gender: 'female',
            blood_group: 'A+',
            role: 'patient',
            is_active: true,
            profile_completed: true,
            approval_status: 'approved'
        },
        {
            id: '00000000-0000-0000-0000-000000000003',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
            phone: '+1-555-0003',
            date_of_birth: '1995-03-10',
            gender: 'male',
            blood_group: 'B+',
            role: 'patient',
            is_active: true,
            profile_completed: true,
            approval_status: 'approved'
        }
    ];

    console.log('WARNING: This script uses placeholder UUIDs.');
    console.log('If you get foreign key errors, you need to:');
    console.log('1. Create auth users in Supabase Dashboard first, OR');
    console.log('2. Use the SQL script in database/create_test_patients.sql\n');

    for (const patient of testPatients) {
        console.log(`Inserting: ${patient.full_name}`);

        const { data, error } = await supabase
            .from('users')
            .insert(patient)
            .select();

        if (error) {
            console.error(`  ❌ Error: ${error.message}`);
            if (error.message.includes('foreign key')) {
                console.log('  → This means the auth user doesn\'t exist.');
                console.log('  → Please use the Supabase Dashboard method instead.');
                console.log('  → See: Backend/database/CREATE_TEST_PATIENTS_GUIDE.md\n');
                process.exit(1);
            }
        } else {
            console.log(`  ✓ Success`);
        }
    }

    console.log('\n✅ Test patients inserted!');
    process.exit(0);
}

insertTestPatients().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
