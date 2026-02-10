
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.SUPABASE_URL, {
    user: 'postgres',
    pass: process.env.SUPABASE_DB_PASSWORD,
    ssl: 'require',
    max: 1
});

async function migrate() {
    try {
        console.log('Adding columns to patients table...');

        await sql`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS blood_group TEXT,
      ADD COLUMN IF NOT EXISTS allergies TEXT,
      ADD COLUMN IF NOT EXISTS medical_history TEXT;
    `;

        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
