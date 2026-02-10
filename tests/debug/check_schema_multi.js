
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

console.log('--- MULTI-TABLE SCHEMA CHECK START ---');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable(tableName) {
    console.log(`Checking table: ${tableName}...`);
    try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (error) {
            console.error(`Error checking ${tableName}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Columns in ${tableName}:`, Object.keys(data[0]));
        } else {
            console.log(`${tableName} is empty. Provoking error for columns...`);
            const { error: insErr } = await supabase.from(tableName).insert({ __dummy_col__: 1 });
            console.log(`Provoked error for ${tableName}:`, insErr?.message);
        }
    } catch (e) {
        console.error(`Unexpected error for ${tableName}:`, e.message);
    }
}

async function run() {
    await checkTable('users');
    await checkTable('patients');
    console.log('--- MULTI-TABLE SCHEMA CHECK END ---');
}

run();
setTimeout(() => { console.log('Timeout reached, exiting.'); process.exit(1); }, 10000);
