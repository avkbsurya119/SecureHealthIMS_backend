import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDoctor() {
    const email = 'dr.test@securehealth.com';
    const password = 'Password123!';
    const name = 'Dr. Sam Test';
    const specialization = 'Cardiology';
    const phone = '555-0101';

    try {
        console.log(`Creating auth user for ${email}...`);

        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'doctor' }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log('User already exists in Auth, continuing to DB check...');
                // Try to get the existing user ID
                const { data: existingUsers } = await supabase.auth.admin.listUsers();
                const existing = existingUsers.users.find(u => u.email === email);
                if (existing) {
                    await proceedWithDB(existing.id);
                } else {
                    throw new Error('User exists but could not find ID');
                }
            } else {
                throw authError;
            }
        } else {
            await proceedWithDB(authData.user.id);
        }

        async function proceedWithDB(userId) {
            console.log(`Ensuring records for user ${userId} in DB...`);

            // 2. Insert/Update users table
            const { error: userError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    email,
                    full_name: name,
                    role: 'doctor',
                    approval_status: 'approved',
                    specialization,
                    phone,
                    is_active: true
                });

            if (userError) throw userError;
            console.log('User record created/updated in users table.');

            // 3. Insert/Update doctors table (used by dropdown)
            const { error: doctorError } = await supabase
                .from('doctors')
                .upsert({
                    user_id: userId,
                    name,
                    email,
                    phone,
                    specialization,
                    verified: true
                });

            if (doctorError) throw doctorError;
            console.log('Doctor record created/updated in doctors table.');

            console.log('\nSUCCESS!');
            console.log('---------------------------');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            console.log('---------------------------');
        }

    } catch (error) {
        console.error('FAILED:', error.message);
    }
}

createDoctor();
