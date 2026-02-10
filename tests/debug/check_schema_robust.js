
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

console.log('--- SCHEMA CHECK START ---');
console.log('URL:', process.env.SUPABASE_URL);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('1. Testing connection...');
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('Connection successful. Row count:', data);
    } catch (e) {
        console.error('Connection failed:', e.message);
    }

    console.log('2. Attempting to fetch one row from users...');
    try {
        const { data, error } = await supabase.from('users').select('*').limit(1);
        if (error) {
            console.error('Fetch failed:', error.message);
            if (error.message.includes('column')) {
                console.log('Hint: Likely a column mismatch.');
            }
        } else if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('Table is empty.');

            // Try to find columns by attempting a bad insert
            console.log('3. Attempting bad insert to provoke error...');
            const { error: insErr } = await supabase.from('users').insert({ xyz_unknown_column: 1 });
            console.log('Provoked error message:', insErr?.message);
        }
    } catch (e) {
        console.error('Unexpected error:', e.message);
    }
    console.log('--- SCHEMA CHECK END ---');
}

run();
setTimeout(() => { console.log('Timeout reached, exiting.'); process.exit(1); }, 10000);
