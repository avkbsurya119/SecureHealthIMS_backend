import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedAdmin() {
    try {
        console.log('Seeding Admin User...');

        const adminEmail = 'admin@securehealth.com';
        const adminPassword = 'AdminPassword123!';

        // Check if admin exists in auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) throw listError;

        const existingAdmin = users.find(u => u.email === adminEmail);

        let adminId;
        if (!existingAdmin) {
            console.log('Creating new admin auth user...');
            const { data, error } = await supabase.auth.admin.createUser({
                email: adminEmail,
                password: adminPassword,
                email_confirm: true,
                user_metadata: { role: 'admin' }
            });
            if (error) throw error;
            adminId = data.user.id;
            console.log('Admin auth user created:', adminId);
        } else {
            adminId = existingAdmin.id;
            console.log('Admin auth user already exists:', adminId);
        }

        // Insert into public.users table using Service Role (bypasses RLS)
        console.log('Upserting admin into public.users table...');
        const { error: insertError } = await supabase
            .from('users')
            .upsert({
                id: adminId,
                role: 'admin',
                is_active: true
            }, { onConflict: 'id' });

        if (insertError) {
            throw new Error(`Failed to insert into users table: ${insertError.message}`);
        }

        console.log('Admin seeded successfully.');

    } catch (error) {
        console.error('Seed Admin failed:', error);
        process.exit(1);
    }
}

seedAdmin();
