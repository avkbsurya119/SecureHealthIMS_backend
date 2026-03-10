import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deleteUserByEmail(email) {
    try {
        console.log(`Deleting user with email: ${email}`);

        // First, find the user in auth.users
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) throw listError;

        const user = users.find(u => u.email === email);

        if (!user) {
            console.log('User not found in auth.users');
            return;
        }

        console.log('Found user:', user.id);

        // Delete from auth.users first (this should cascade to users table)
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);

        if (authDeleteError) {
            console.error('Error deleting from auth.users:', authDeleteError);
            throw authDeleteError;
        }

        console.log('User deleted from auth.users successfully');

        // Verify deletion
        const { data: { users: remainingUsers }, error: verifyError } = await supabase.auth.admin.listUsers();
        if (verifyError) throw verifyError;

        const stillExists = remainingUsers.find(u => u.email === email);
        if (stillExists) {
            console.log('Warning: User still exists in auth.users after deletion attempt');
        } else {
            console.log('Confirmed: User completely removed');
        }

    } catch (error) {
        console.error('Error deleting user:', error);
    }
}