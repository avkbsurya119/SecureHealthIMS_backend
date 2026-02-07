import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = `postgres://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${process.env.SUPABASE_URL.split('//')[1].split('.')[0]}.supabase.co:5432/postgres`;
console.log('URL constructed (masking password):', dbUrl.replace(process.env.SUPABASE_DB_PASSWORD, '***'));

const sql = postgres(dbUrl, { connect_timeout: 5 });

async function test() {
    try {
        console.log('Attempting to connect...');
        const result = await sql`SELECT 1 as val`;
        console.log('Connection successful!', result);
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

test();
