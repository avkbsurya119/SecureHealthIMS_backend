import postgres from 'postgres';
import dns from 'dns';

// Try to use a specific DNS server
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
    const projectRef = 'fkqhsgweypbrafwjmnmj';
    const dbUrl = `postgres://postgres:dbProject42SafeX9@db.${projectRef}.supabase.co:5432/postgres`;

    console.log('Resolving host manually first...');
    try {
        const addresses = await new Promise((resolve, reject) => {
            dns.resolve4(`db.${projectRef}.supabase.co`, (err, addresses) => {
                if (err) reject(err);
                else resolve(addresses);
            });
        });
        console.log('Resolved Addresses:', addresses);
    } catch (err) {
        console.warn('DNS Resolution failed even with custom servers:', err.message);
    }

    const sql = postgres(dbUrl, {
        connect_timeout: 15,
    });

    try {
        console.log('Attempting to connect via hostname with custom DNS...');
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
