import pg from 'pg';
const { Client } = pg;

async function run() {
    const connectionString = 'postgresql://postgres:dbProject42SafeX9@db.fkqhsgweypbrafwjmnmj.supabase.co:5432/postgres';
    const client = new Client({
        connectionString,
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log('Attempting to connect to Supabase DB...');
        await client.connect();
        console.log('Connected successfully!');

        // Drop the conflicting constraints that require patient_id/doctor_id 
        // to be in both tables (users and patients/doctors) simultaneously 
        // with different IDs.
        const query = `
      ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey CASCADE;
      ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey CASCADE;
    `;

        console.log('Executing DROP CONSTRAINT query...');
        const res = await client.query(query);
        console.log('Results:', res);
        console.log('Successfully dropped conflicting constraints!');

    } catch (err) {
        console.error('DATABASE MIGRATION FAILED:', err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        await client.end();
        console.log('Connection closed.');
    }
}

run();
