
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('Querying information_schema via Supabase...');
    const { data, error } = await supabase
        .rpc('get_table_columns', { table_name_input: 'users' });

    // If RPC is not available, try a raw query via a dummy table if allowed, 
    // but Usually we can't do raw SQL via supabase-js without an RPC.

    // Let's try to just select one row and see the keys
    const { data: row, error: selectError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (selectError) {
        console.error('Select failed:', selectError);
    } else if (row && row.length > 0) {
        console.log('Columns in users table (from row):', Object.keys(row[0]));
    } else {
        console.log('Users table is empty. Trying to find columns another way...');
        // Try to insert a row with an obviously wrong column to see the error
        const { error: insertError } = await supabase
            .from('users')
            .insert({ non_existent_column_test: true });
        console.log('Insert error (should reveal columns or "column not found"):', insertError?.message);
    }
}

checkSchema();
