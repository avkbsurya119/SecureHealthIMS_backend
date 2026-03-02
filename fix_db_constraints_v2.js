import postgres from 'postgres';

async function run() {
    // Try transaction pooler port 6543 which often has better availability
    const dbUrl = 'postgres://postgres:dbProject42SafeX9@db.fkqhsgweypbrafwjmnmj.supabase.co:6543/postgres';

    const sql = postgres(dbUrl, {
        connect_timeout: 10,
        idle_timeout: 5,
    });

    try {
        console.log('Attempting to connect via postgres library...');

        // Test connection
        const [{ now }] = await sql`SELECT now()`;
        console.log('Connected! Server time:', now);

        console.log('Dropping conflicting constraints...');
        await sql`ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey CASCADE`;
        await sql`ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey CASCADE`;

        console.log('SUCCESS: Constraints dropped!');

    } catch (err) {
        console.error('MIGRATION FAILED:', err.message);
    } finally {
        await sql.end();
    }
}

run();
