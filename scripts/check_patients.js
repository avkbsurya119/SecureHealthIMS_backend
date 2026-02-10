import { supabase } from '../src/config/supabaseClient.js';

async function checkPatientData() {
    console.log('='.repeat(60));
    console.log('PATIENT SEARCH DIAGNOSTIC REPORT');
    console.log('='.repeat(60));
    console.log('');

    // Check users table for patients
    console.log('1. USERS TABLE (role=patient):');
    console.log('-'.repeat(60));
    const { data: usersPatients, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role, date_of_birth, gender, blood_group')
        .eq('role', 'patient');

    if (usersError) {
        console.error('❌ Error querying users:', usersError.message);
    } else {
        console.log(`✓ Found ${usersPatients?.length || 0} patient(s) in users table`);
        if (usersPatients && usersPatients.length > 0) {
            usersPatients.forEach((p, i) => {
                console.log(`\n  Patient ${i + 1}:`);
                console.log(`    - ID: ${p.id}`);
                console.log(`    - Name: ${p.full_name || '(null)'}`);
                console.log(`    - Email: ${p.email || '(null)'}`);
                console.log(`    - Phone: ${p.phone || '(null)'}`);
                console.log(`    - Gender: ${p.gender || '(null)'}`);
                console.log(`    - DOB: ${p.date_of_birth || '(null)'}`);
                console.log(`    - Blood Group: ${p.blood_group || '(null)'}`);
            });
        }
    }
    console.log('');

    // 2. Check patients table
    console.log('2. PATIENTS TABLE (all records):');
    console.log('-'.repeat(60));
    const { data: patientsTable, error: patientsError } = await supabase
        .from('patients')
        .select('*');

    if (patientsError) {
        console.error('❌ Error querying patients:', patientsError.message);
    } else {
        console.log(`✓ Found ${patientsTable?.length || 0} record(s) in patients table`);
        if (patientsTable && patientsTable.length > 0) {
            patientsTable.forEach((p, i) => {
                console.log(`\n  Record ${i + 1}:`);
                console.log(`    - ID: ${p.id}`);
                console.log(`    - User ID: ${p.user_id || '(null)'}`);
                console.log(`    - Name: ${p.name || '(null)'}`);
                console.log(`    - Email: ${p.email || '(null)'}`);
                console.log(`    - Phone: ${p.phone || '(null)'}`);
            });
        }
    }
    console.log('');

    // 3. Check all users (any role)
    console.log('3. ALL USERS (any role):');
    console.log('-'.repeat(60));
    const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, full_name, email, role, is_active');

    if (allUsersError) {
        console.error('❌ Error querying all users:', allUsersError.message);
    } else {
        console.log(`✓ Found ${allUsers?.length || 0} total user(s)`);
        const roleCount = {};
        allUsers?.forEach(u => {
            roleCount[u.role] = (roleCount[u.role] || 0) + 1;
        });
        console.log('\n  Role Distribution:');
        Object.entries(roleCount).forEach(([role, count]) => {
            console.log(`    - ${role}: ${count}`);
        });
    }
    console.log('');

    // 4. Test the exact search query
    console.log('4. TESTING SEARCH QUERY (q="Test"):');
    console.log('-'.repeat(60));
    const searchPattern = '%Test%';
    const { data: searchResults, error: searchError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role')
        .eq('role', 'patient')
        .or(`full_name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern}`)
        .limit(20);

    if (searchError) {
        console.error('❌ Search error:', searchError.message);
    } else {
        console.log(`✓ Search returned ${searchResults?.length || 0} result(s)`);
        if (searchResults && searchResults.length > 0) {
            searchResults.forEach((p, i) => {
                console.log(`\n  Result ${i + 1}:`);
                console.log(`    - Name: ${p.full_name}`);
                console.log(`    - Email: ${p.email}`);
                console.log(`    - Phone: ${p.phone}`);
            });
        }
    }
    console.log('');

    // 5. Summary and recommendations
    console.log('='.repeat(60));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(60));

    const patientCount = usersPatients?.length || 0;
    const patientsTableCount = patientsTable?.length || 0;

    if (patientCount === 0 && patientsTableCount === 0) {
        console.log('❌ NO PATIENT DATA FOUND');
        console.log('   → No patients in users table');
        console.log('   → No records in patients table');
        console.log('   → RECOMMENDATION: Create test patient data');
    } else if (patientCount === 0 && patientsTableCount > 0) {
        console.log('⚠️  DATA MISMATCH DETECTED');
        console.log(`   → ${patientsTableCount} record(s) in patients table`);
        console.log('   → 0 patients in users table');
        console.log('   → RECOMMENDATION: Sync patients table data to users table');
    } else if (patientCount > 0) {
        console.log('✓ PATIENT DATA EXISTS');
        console.log(`   → ${patientCount} patient(s) in users table`);

        // Check if any have null full_name
        const nullNames = usersPatients.filter(p => !p.full_name);
        if (nullNames.length > 0) {
            console.log(`   ⚠️  ${nullNames.length} patient(s) have null full_name`);
            console.log('   → RECOMMENDATION: Populate full_name field for searchability');
        }

        if (searchResults?.length === 0) {
            console.log('   ⚠️  Search for "Test" returned 0 results');
            console.log('   → RECOMMENDATION: Check if patient names contain "Test"');
        }
    }

    console.log('='.repeat(60));

    process.exit(0);
}

checkPatientData().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

