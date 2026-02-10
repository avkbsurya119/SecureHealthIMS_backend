import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error('Error: DATABASE_URL or SUPABASE_DB_URL is required.');
    process.exit(1);
}

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1
});

async function migrate() {
    console.log('Starting migration for visits and prescriptions schema...');

    try {
        // 1. Update Visits Table
        console.log('Updating visits table schema...');
        await sql`
            DO $$ 
            BEGIN
                -- Drop old constraints if they exist
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'visits_patient_id_fkey') THEN
                    ALTER TABLE visits DROP CONSTRAINT visits_patient_id_fkey;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'visits_doctor_id_fkey') THEN
                    ALTER TABLE visits DROP CONSTRAINT visits_doctor_id_fkey;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'visits_created_by_fkey') THEN
                    ALTER TABLE visits DROP CONSTRAINT visits_created_by_fkey;
                END IF;

                -- Add new constraints linking to users table
                ALTER TABLE visits 
                    ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
                    ADD CONSTRAINT visits_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
                    ADD CONSTRAINT visits_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
            END $$;
        `;

        // 2. Update Prescriptions Table
        console.log('Updating prescriptions table schema...');
        await sql`
            DO $$ 
            BEGIN
                -- Drop old constraints if they exist
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'prescriptions_patient_id_fkey') THEN
                    ALTER TABLE prescriptions DROP CONSTRAINT prescriptions_patient_id_fkey;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'prescriptions_doctor_id_fkey') THEN
                    ALTER TABLE prescriptions DROP CONSTRAINT prescriptions_doctor_id_fkey;
                END IF;

                -- Add new constraints linking to users table
                ALTER TABLE prescriptions 
                    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
                    ADD CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;
            END $$;
        `;

        console.log('Migration successful: Schema updated to link to users table.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
