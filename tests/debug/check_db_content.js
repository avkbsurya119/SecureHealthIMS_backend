
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// Use service role key if available for admin actions, but anon key should work for reading public/authenticated data if RLS allows
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAndSeed() {
    console.log('Checking database content...');

    const { count: doctorCount, error: docError } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
    if (docError) console.error('Error counting doctors:', docError);
    else console.log(`Doctors count: ${doctorCount}`);

    const { count: patientCount, error: patError } = await supabase.from('patients').select('*', { count: 'exact', head: true });
    if (patError) console.error('Error counting patients:', patError);
    else console.log(`Patients count: ${patientCount}`);

    const { data: pendingDocs, error: pendingError } = await supabase.from('doctors').select('id, name').eq('verified', false);
    if (pendingError) console.error('Error fetching pending doctors:', pendingError);
    else console.log(`Pending doctors: ${pendingDocs?.length}`);

    if (doctorCount === 0 && patientCount === 0) {
        console.log('Database appears empty. Seeding data...');
        // TODO: Seed data logic here if needed, but for now just reporting is enough to know WHY dashboard is empty.
    }
}

checkAndSeed();
