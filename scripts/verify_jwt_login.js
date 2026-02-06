
// import fetch from 'node-fetch'; // Using global fetch (Node 18+)

const BASE_URL = 'http://localhost:5000/api/auth';

// Test credentials (assuming these exist or we can register/login with them)
// We'll try to login with a known user, or register a new one if needed.
// Since I don't know existing users for sure, I'll try to register a new random user.

const randomId = Math.floor(Math.random() * 10000);
const email = `test.patient.${randomId}@example.com`;
const password = 'Password@123';

const registerUser = async () => {
    console.log(`Attempting to register user: ${email}`);
    const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            role: 'patient',
            name: 'Test Patient',
            date_of_birth: '1990-01-01',
            gender: 'male'
        })
    });

    const data = await response.json();
    console.log('Register Response Status:', response.status);

    if (response.status === 201) {
        console.log('✅ Registration successful');
        console.log('Token received:', data.data.token ? 'YES' : 'NO');
        return data.data.token;
    } else {
        console.error('❌ Registration failed:', data);

        // If user already exists, try login
        if (data.message && data.message.includes('already exists')) {
            console.log('⚠️ User exists, trying login...');
            return await loginUser();
        }
        return null;
    }
};

const loginUser = async () => {
    console.log(`Attempting to login user: ${email}`);
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password
        })
    });

    const data = await response.json();
    console.log('Login Response Status:', response.status);

    if (response.status === 200) {
        console.log('✅ Login successful');
        console.log('Token received:', data.data.token ? 'YES' : 'NO');
        return data.data.token;
    } else {
        console.error('❌ Login failed:', data);
        return null;
    }
};

const verifyMe = async (token) => {
    console.log('Attempting to access protected route /me');
    const response = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    console.log('Me Response Status:', response.status);

    if (response.status === 200) {
        console.log('✅ Protected route accessed successfully');
        console.log('User Role:', data.data.role);
        console.log('User Email:', data.data.email);
    } else {
        console.error('❌ Protected route access failed:', data);
    }
};

const run = async () => {
    try {
        let token = await registerUser();

        if (token) {
            await verifyMe(token);
        } else {
            console.error('Could not get token, aborting verification.');
        }
    } catch (error) {
        console.error('Verification script error:', error);
    }
};

run();
