import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const doctors = [
    {
        email: 'dr.priya.nair@curalink.com',
        password: 'DrPriya@2026',
        name: 'Dr. Priya Nair',
        specialization: 'General Medicine',
        phone: '555-0201'
    },
    {
        email: 'dr.rohan.mehta@curalink.com',
        password: 'DrRohan@2026',
        name: 'Dr. Rohan Mehta',
        specialization: 'General Medicine',
        phone: '555-0202'
    }
];

async function createDoctor(doc) {
    console.log(`\n--- Creating ${doc.name} (${doc.email}) ---`);

    async function proceedWithDB(userId) {
        const { error: userError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                email: doc.email,
                full_name: doc.name,
                role: 'doctor',
                approval_status: 'approved',
                specialization: doc.specialization,
                phone: doc.phone,
                is_active: true
            });

        if (userError) throw userError;
        console.log('  ✓ users table record created/updated');

        const { error: doctorError } = await supabase
            .from('doctors')
            .upsert({
                user_id: userId,
                name: doc.name,
                email: doc.email,
                phone: doc.phone,
                specialization: doc.specialization,
                verified: true
            });

        if (doctorError) throw doctorError;
        console.log('  ✓ doctors table record created/updated');
        console.log(`  ✓ Done: ${doc.name} is ready.`);
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: doc.email,
        password: doc.password,
        email_confirm: true,
        user_metadata: { role: 'doctor' }
    });

    if (authError) {
        if (authError.message.toLowerCase().includes('already') || authError.message.toLowerCase().includes('registered')) {
            console.log('  Auth user already exists, looking up ID...');
            const { data: list } = await supabase.auth.admin.listUsers();
            const existing = list.users.find(u => u.email === doc.email);
            if (!existing) throw new Error('Could not find existing auth user');
            await proceedWithDB(existing.id);
        } else {
            throw authError;
        }
    } else {
        await proceedWithDB(authData.user.id);
    }
}

async function main() {
    for (const doc of doctors) {
        await createDoctor(doc);
    }

    console.log('\n========================================');
    console.log('CREDENTIALS SUMMARY');
    console.log('========================================');
    doctors.forEach(doc => {
        console.log(`\n${doc.name}`);
        console.log(`  Email:          ${doc.email}`);
        console.log(`  Password:       ${doc.password}`);
        console.log(`  Specialization: ${doc.specialization}`);
        console.log(`  Verified:       true`);
    });
    console.log('\n========================================');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
