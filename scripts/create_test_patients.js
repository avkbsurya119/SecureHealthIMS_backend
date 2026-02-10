import { supabase } from '../src/config/supabaseClient.js';

async function createTestPatients() {
    console.log('Creating test patient data...\n');

    const testPatients = [
        {
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

    console.log('Step 1: Checking existing patients...');
    const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('role', 'patient');

    if (checkError) {
        console.error('Error checking existing patients:', checkError);
        process.exit(1);
    }

    console.log(`Found ${existing?.length || 0} existing patient(s)\n`);

    const existingEmails = new Set(existing?.map(p => p.email) || []);
    const patientsToCreate = testPatients.filter(p => !existingEmails.has(p.email));

    if (patientsToCreate.length === 0) {
        console.log('✓ All test patients already exist. No action needed.');
        process.exit(0);
    }

    console.log(`Step 2: Creating ${patientsToCreate.length} new patient(s)...\n`);

    for (const patient of patientsToCreate) {
        console.log(`Creating patient: ${patient.full_name} (${patient.email})`);

        // First, create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: patient.email,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: {
                full_name: patient.full_name
            }
        });

        if (authError) {
            console.error(`  ❌ Failed to create auth user: ${authError.message}`);
            continue;
        }

        console.log(`  ✓ Created auth user with ID: ${authData.user.id}`);

        // Then, create/update user record
        const { error: userError } = await supabase
            .from('users')
            .upsert({
                id: authData.user.id,
                ...patient
            });

        if (userError) {
            console.error(`  ❌ Failed to create user record: ${userError.message}`);
        } else {
            console.log(`  ✓ Created user record`);
        }

        console.log('');
    }

    // Verify creation
    console.log('Step 3: Verifying patient data...');
    const { data: allPatients, error: verifyError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role')
        .eq('role', 'patient');

    if (verifyError) {
        console.error('Error verifying patients:', verifyError);
    } else {
        console.log(`\n✓ Total patients in database: ${allPatients?.length || 0}`);
        allPatients?.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.full_name} - ${p.email}`);
        });
    }

    // Test search
    console.log('\nStep 4: Testing search functionality...');
    const { data: searchResults, error: searchError } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('role', 'patient')
        .or('full_name.ilike.%Test%,email.ilike.%Test%,phone.ilike.%Test%');

    if (searchError) {
        console.error('Search test failed:', searchError);
    } else {
        console.log(`✓ Search for "Test" returned ${searchResults?.length || 0} result(s)`);
        searchResults?.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.full_name} - ${p.email}`);
        });
    }

    console.log('\n✅ Test patient creation complete!');
    console.log('\nYou can now:');
    console.log('1. Log in to the Doctor Dashboard');
    console.log('2. Go to Patients tab');
    console.log('3. Search for "Test" to see these patients');

    process.exit(0);
}

createTestPatients().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
