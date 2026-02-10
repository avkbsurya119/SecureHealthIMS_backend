
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findUnregistered() {
    console.log('Fetching auth users...');
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Failed to list auth users:', authError.message);
        return;
    }

    console.log(`Found ${authUsers.length} auth users.`);

    for (const au of authUsers) {
        const { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', au.id)
            .maybeSingle();

        if (!userRecord) {
            console.log(`Found unregistered UID: ${au.id} (Email: ${au.email})`);
            return;
        }
    }
    console.log('All auth users are already registered in users table.');
}

findUnregistered();
