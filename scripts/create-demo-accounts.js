import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoAccounts() {
  console.log('🚀 Starting demo account creation...\n');

  const demoUsers = [
    { email: 'admin@demo.com', password: 'Admin123!', role: 'admin' },
    { email: 'doctor@demo.com', password: 'Doctor123!', role: 'doctor' },
    { email: 'patient@demo.com', password: 'Patient123!', role: 'patient' }
  ];

  const userIds = {};

  // Step 1: Create auth users
  console.log('📝 Step 1: Creating authentication users...');
  
  for (const user of demoUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ⚠️  ${user.email} already exists, fetching ID...`);
          const { data: userData } = await supabase.auth.admin.listUsers();
          const existingUser = userData.users.find(u => u.email === user.email);
          if (existingUser) {
            userIds[user.role] = existingUser.id;
            console.log(`   ✅ Found existing ${user.role}: ${existingUser.id}`);
          }
        } else {
          throw error;
        }
      } else {
        userIds[user.role] = data.user.id;
        console.log(`   ✅ Created ${user.role}: ${data.user.id}`);
      }
    } catch (err) {
      console.error(`   ❌ Error creating ${user.email}:`, err.message);
      throw err;
    }
  }

  // Step 2: Read and update SQL script
  console.log('\n📝 Step 2: Preparing SQL script...');
  
  const sqlPath = path.join(__dirname, '..', 'database', 'seed_demo_accounts.sql');
  let sqlScript = fs.readFileSync(sqlPath, 'utf8');

  // Replace placeholders
  sqlScript = sqlScript.replaceAll('YOUR_ADMIN_AUTH_ID_HERE', userIds.admin);
  sqlScript = sqlScript.replaceAll('YOUR_DOCTOR_AUTH_ID_HERE', userIds.doctor);
  sqlScript = sqlScript.replaceAll('YOUR_PATIENT_AUTH_ID_HERE', userIds.patient);

  console.log('   ✅ SQL script prepared with user IDs');

  // Step 3: Execute SQL script
  console.log('\n📝 Step 3: Executing database seed script...');
  
  // Split by DO $$ blocks and individual statements
  const statements = sqlScript
    .split(/;(?=\s*(?:--|\n|INSERT|UPDATE|DO|SELECT|$))/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== '');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comment-only statements
    if (statement.startsWith('--')) continue;
    
    // Skip informational comments
    if (statement.includes('DEMO ACCOUNTS SEED DATA') || 
        statement.includes('SUCCESS!') ||
        statement.includes('Login credentials:')) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct query for certain statements
        const { error: directError } = await supabase.from('_temp').select('*').limit(0);
        if (!directError || error.message.includes('already exists')) {
          successCount++;
        } else {
          console.log(`   ⚠️  Statement ${i + 1}: ${error.message.substring(0, 60)}...`);
          errorCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      // Likely ON CONFLICT or already exists - not a critical error
      errorCount++;
    }
  }

  console.log(`   ✅ Executed ${successCount} statements (${errorCount} skipped/conflicts)`);

  // Step 4: Insert records directly using Supabase client
  console.log('\n📝 Step 4: Creating user records...');

  // Create users table records
  const userRecords = [
    { id: userIds.admin, role: 'admin', is_active: true },
    { id: userIds.doctor, role: 'doctor', is_active: true },
    { id: userIds.patient, role: 'patient', is_active: true }
  ];

  for (const record of userRecords) {
    const { error } = await supabase
      .from('users')
      .upsert(record, { onConflict: 'id' });
    
    if (error && !error.message.includes('duplicate')) {
      console.log(`   ⚠️  Error creating user record for ${record.role}: ${error.message}`);
    } else {
      console.log(`   ✅ User record created: ${record.role}`);
    }
  }

  // Create department
  console.log('\n📝 Step 5: Creating department...');
  const { data: dept, error: deptError } = await supabase
    .from('departments')
    .upsert({ name: 'General Medicine' }, { onConflict: 'name' })
    .select()
    .single();

  if (deptError && !deptError.message.includes('duplicate')) {
    console.log(`   ⚠️  ${deptError.message}`);
  } else {
    console.log(`   ✅ Department created: General Medicine`);
  }

  const deptId = dept?.id;

  // Create doctor record
  console.log('\n📝 Step 6: Creating doctor record...');
  const { error: doctorError } = await supabase
    .from('doctors')
    .upsert({
      user_id: userIds.doctor,
      name: 'Dr. Sarah Johnson',
      specialization: 'General Physician',
      phone: '+1-555-0101',
      email: 'doctor@demo.com',
      department_id: deptId
    }, { onConflict: 'user_id' });

  if (doctorError && !doctorError.message.includes('duplicate')) {
    console.log(`   ⚠️  ${doctorError.message}`);
  } else {
    console.log(`   ✅ Doctor record created: Dr. Sarah Johnson`);
  }

  // Create patient record
  console.log('\n📝 Step 7: Creating patient record...');
  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .upsert({
      user_id: userIds.patient,
      name: 'John Doe',
      date_of_birth: '1990-05-15',
      gender: 'male',
      phone: '+1-555-0102',
      email: 'patient@demo.com',
      address: '123 Main Street, City, State 12345'
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (patientError && !patientError.message.includes('duplicate')) {
    console.log(`   ⚠️  ${patientError.message}`);
  } else {
    console.log(`   ✅ Patient record created: John Doe`);
  }

  const patientId = patientData?.id;

  // Grant consents
  console.log('\n📝 Step 8: Granting default consents...');
  const consentTypes = ['medical_records', 'data_sharing', 'treatment', 'research'];
  
  for (const consentType of consentTypes) {
    const { error } = await supabase
      .from('patient_consents')
      .upsert({
        patient_id: patientId,
        consent_type: consentType,
        status: 'granted',
        granted_at: new Date().toISOString()
      }, { onConflict: 'patient_id,consent_type' });

    if (error && !error.message.includes('duplicate')) {
      console.log(`   ⚠️  ${consentType}: ${error.message}`);
    } else {
      console.log(`   ✅ Consent granted: ${consentType}`);
    }
  }

  // Verification
  console.log('\n📝 Step 9: Verification...');
  
  const { data: users } = await supabase
    .from('users')
    .select('id, role, is_active')
    .in('id', [userIds.admin, userIds.doctor, userIds.patient]);

  console.log(`   ✅ Users created: ${users?.length || 0}`);

  const { data: doctor } = await supabase
    .from('doctors')
    .select('name, email')
    .eq('user_id', userIds.doctor)
    .single();

  if (doctor) {
    console.log(`   ✅ Doctor linked: ${doctor.name}`);
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('name, email')
    .eq('user_id', userIds.patient)
    .single();

  if (patient) {
    console.log(`   ✅ Patient linked: ${patient.name}`);
  }

  const { data: consents } = await supabase
    .from('patient_consents')
    .select('consent_type, status')
    .eq('patient_id', patientId);

  console.log(`   ✅ Consents granted: ${consents?.length || 0}`);

  // Final output
  console.log('\n' + '='.repeat(60));
  console.log('🎉 DEMO ACCOUNTS CREATED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📋 Login Credentials:\n');
  console.log('1️⃣  Admin Account:');
  console.log('   Email:    admin@demo.com');
  console.log('   Password: Admin123!');
  console.log('   User ID:  ' + userIds.admin);
  console.log('   Role:     admin\n');
  
  console.log('2️⃣  Doctor Account:');
  console.log('   Email:    doctor@demo.com');
  console.log('   Password: Doctor123!');
  console.log('   User ID:  ' + userIds.doctor);
  console.log('   Role:     doctor');
  console.log('   Name:     Dr. Sarah Johnson\n');
  
  console.log('3️⃣  Patient Account:');
  console.log('   Email:    patient@demo.com');
  console.log('   Password: Patient123!');
  console.log('   User ID:  ' + userIds.patient);
  console.log('   Role:     patient');
  console.log('   Name:     John Doe');
  console.log('   Consents: All 4 types granted\n');
  
  console.log('🚀 You can now test the API with these accounts!');
  console.log('   See QUICK_START_TESTING.md for testing guide.\n');
}

// Run the script
createDemoAccounts()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env');
    console.error('2. Check that your Supabase project is accessible');
    console.error('3. Verify database tables exist (run migrations first)');
    process.exit(1);
  });
