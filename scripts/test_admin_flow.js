// Native fetch is available in Node.js 18+

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let doctorToken = '';
let patientToken = '';
let doctorId = '';
let patientId = '';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTest() {
    console.log('Starting Admin Flow Test...');

    try {
        // 1. Register Doctor (Should be unverified)
        console.log('\n1. Registering Doctor...');
        const docRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `doc_${Date.now()}@test.com`,
                password: 'Password123!',
                role: 'doctor',
                name: 'Test Doctor',
                specialization: 'Cardiology'
            })
        });
        const docData = await docRes.json();
        console.log('Doctor Register Response:', docData);
        if (!docData.success) throw new Error('Doctor registration failed');
        if (docData.data.token) throw new Error('Doctor should NOT receive token on register!');
        doctorId = docData.data.user.id;

        // 2. Doctor Login (Should Fail)
        console.log('\n2. Doctor Login (Expect Failure)...');
        const docLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: docData.data.user.email,
                password: 'Password123!'
            })
        });
        const docLoginData = await docLoginRes.json();
        console.log('Doctor Login Response:', docLoginData);
        if (docLoginRes.status !== 401) throw new Error('Doctor should be blocked!');

        // 3. Register Patient (Should be verified)
        console.log('\n3. Registering Patient...');
        const patRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `pat_${Date.now()}@test.com`,
                password: 'Password123!',
                role: 'patient',
                name: 'Test Patient',
                date_of_birth: '1990-01-01',
                gender: 'male'
            })
        });
        const patData = await patRes.json();
        console.log('Patient Register Response:', patData);
        if (!patData.success) throw new Error('Patient registration failed');
        if (!patData.data.token) throw new Error('Patient SHOULD receive token!');
        patientId = patData.data.user.id;

        // 4. Admin Login
        console.log('\n4. Admin Login...');
        const adminRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@securehealth.com',
                password: 'AdminPassword123!'
            })
        });
        const adminData = await adminRes.json();
        console.log('Admin Login Response:', adminData);
        if (!adminData.success) throw new Error('Admin login failed');
        adminToken = adminData.data.token;

        // 5. Admin Approve Doctor
        console.log(`\n5. Admin Approving Doctor ${doctorId}...`);
        const approveRes = await fetch(`${BASE_URL}/admin/approve/${doctorId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        const approveData = await approveRes.json();
        console.log('Approve Response:', approveData);
        if (!approveData.success) throw new Error('Approval failed');

        // 6. Doctor Login Retry (Should Succeed)
        console.log('\n6. Doctor Login Retry (Expect Success)...');
        const docLoginRes2 = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: docData.data.user.email,
                password: 'Password123!'
            })
        });
        const docLoginData2 = await docLoginRes2.json();
        console.log('Doctor Login Response:', docLoginData2);
        if (!docLoginData2.success) throw new Error('Doctor login failed after approval');

        // 7. Admin Ban Patient
        console.log(`\n7. Admin Banning Patient ${patientId}...`);
        const banRes = await fetch(`${BASE_URL}/admin/ban/${patientId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'patient' })
        });
        const banData = await banRes.json();
        console.log('Ban Response:', banData);
        if (!banData.success) throw new Error('Ban failed');

        // 8. Patient Login Retry (Should Fail)
        console.log('\n8. Patient Login Retry (Expect Failure)...');
        const patLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: patData.data.user.email,
                password: 'Password123!'
            })
        });
        const patLoginData = await patLoginRes.json();
        console.log('Patient Login Response:', patLoginData);
        if (patLoginRes.status !== 401) throw new Error('Patient should be blocked!');

        console.log('\n✅ TEST COMPLETED SUCCESSFULLY');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

runTest();
