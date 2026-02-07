import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = `postgres://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${process.env.SUPABASE_URL.split('//')[1].split('.')[0]}.supabase.co:5432/postgres`;

console.log('Connecting to DB...');
const sql = postgres(dbUrl);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
    try {
        console.log('Running migration...');

        // 1. Add verified column
        console.log('Adding verified column to patients...');
        await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE`;

        console.log('Adding verified column to doctors...');
        await sql`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE`;

        console.log('Columns added.');

        // 2. Create Admin User
        const adminEmail = 'admin@securehealth.com';
        const adminPassword = 'AdminPassword123!';

        console.log('Checking for existing admin user...');
        // Check if admin exists in auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`);
        }

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
            console.log('Admin auth user created with ID:', adminId);
        } else {
            adminId = existingAdmin.id;
            console.log('Admin auth user already exists with ID:', adminId);
        }

        // Ensure admin is in public.users table
        console.log('Verifying admin in public.users table...');
        const result = await sql`SELECT * FROM users WHERE id = ${adminId}`;

        if (result.length === 0) {
            console.log('Inserting admin into public.users table...');
            await sql`INSERT INTO users (id, role) VALUES (${adminId}, 'admin')`;
            console.log('Admin inserted into public.users');
        } else {
            console.log('Admin already in public.users');
        }

        console.log('Migration complete successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
