import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const projectUrl = process.env.SUPABASE_URL;
const projectRef = projectUrl.split('.')[0].replace('https://', '');
const dbUrl = `postgres://postgres:${process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD}@db.${projectRef}.supabase.co:6543/postgres`;

const sql = postgres(dbUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1
});

async function check() {
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `;
        console.log('Columns in users table:', columns.map(c => c.column_name));
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

check();
