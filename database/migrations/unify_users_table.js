
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Navigate up two directories to find .env file (assuming migration script is in database/migrations)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const projectUrl = process.env.SUPABASE_URL;
const projectRef = projectUrl.split('.')[0].replace('https://', '');
const dbUrl = `postgres://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;

const sql = postgres(dbUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1
});

async function migrate() {
    try {
        console.log('Adding unified profile columns to users table...');

        await sql`
      ALTER TABLE users 
      -- Basic Profile
      ADD COLUMN IF NOT EXISTS full_name       TEXT,
      ADD COLUMN IF NOT EXISTS phone           TEXT,
      ADD COLUMN IF NOT EXISTS date_of_birth   DATE,
      ADD COLUMN IF NOT EXISTS gender          TEXT,
      ADD COLUMN IF NOT EXISTS address         TEXT,
      
      -- Status
      ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS approval_status  TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending','approved','declined')),

      -- Patient Profile Fields
      ADD COLUMN IF NOT EXISTS allergies         TEXT,
      ADD COLUMN IF NOT EXISTS blood_group       TEXT,
      ADD COLUMN IF NOT EXISTS medical_history   TEXT,
      ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
      ADD COLUMN IF NOT EXISTS emergency_phone   TEXT,

      -- Doctor/Nurse Profile Fields
      ADD COLUMN IF NOT EXISTS specialization    TEXT,
      ADD COLUMN IF NOT EXISTS license_number    TEXT,
      ADD COLUMN IF NOT EXISTS education         TEXT,
      ADD COLUMN IF NOT EXISTS experience_years  INTEGER,
      ADD COLUMN IF NOT EXISTS hospital_affiliation TEXT,
      ADD COLUMN IF NOT EXISTS nursing_license   TEXT,
      ADD COLUMN IF NOT EXISTS department        TEXT;
    `;

        // Only set default values for existing columns if needed, but for NEW columns it's fine.
        // However, existing users might have NULLs. We can backfill if needed, but let's stick to schema change first.

        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
