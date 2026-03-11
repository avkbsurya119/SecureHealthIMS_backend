import postgres from 'postgres';

async function run() {
    const dbUrl = 'postgres://postgres:dbProject42SafeX9@localhost:5432/postgres';

    const sql = postgres(dbUrl, {
        connect_timeout: 10,
    });

    try {
        console.log('Attempting to connect via localhost...');
        const result = await sql`SELECT now()`;
        console.log('Connected! Server time:', result[0].now);

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
