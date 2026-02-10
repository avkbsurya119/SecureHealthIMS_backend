/**
 * Comprehensive Backend Endpoint Testing Script
 * Tests all API endpoints and verifies database connectivity
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to make requests
async function makeRequest(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test logging
function logTest(name, passed, message = '', data = null) {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`  ${status} ${name}`);
  
  if (message) {
    console.log(`    ${colors.cyan}→${colors.reset} ${message}`);
  }
  
  if (data && !passed) {
    console.log(`    ${colors.yellow}Data:${colors.reset}`, JSON.stringify(data, null, 2));
  }

  results.tests.push({ name, passed, message, data });
  if (passed) results.passed++;
  else results.failed++;
}

function logSection(name) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}${name}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

// Test suites
async function testHealthEndpoint() {
  logSection('1. Health Check Endpoint');
  
  const response = await makeRequest('GET', '/health');
  
  logTest(
    'GET /api/health',
    response.ok && response.status === 200,
    response.ok ? 'Server is healthy' : 'Server health check failed',
    response.data
  );
  
  if (response.data?.database) {
    logTest(
      'Database connection',
      response.data.database === 'connected',
      response.data.database === 'connected' ? 'Database is connected' : 'Database connection failed',
      response.data
    );
  }
}

async function testAuthEndpoints() {
  logSection('2. Authentication Endpoints');
  
  // Test patient registration
  const patientData = {
    email: `test.patient.${Date.now()}@example.com`,
    password: 'SecurePass123!',
    name: 'Test Patient',
    phone: '1234567890',
    date_of_birth: '1990-01-01',
    gender: 'male',
    address: '123 Test St'
  };
  
  const registerResponse = await makeRequest('POST', '/auth/register/patient', patientData);
  logTest(
    'POST /api/auth/register/patient',
    registerResponse.status === 201 || registerResponse.status === 200,
    registerResponse.ok ? 'Patient registration successful' : `Registration failed: ${registerResponse.data?.error?.message || 'Unknown error'}`,
    registerResponse.data
  );

  // Test doctor registration
  const doctorData = {
    email: `test.doctor.${Date.now()}@example.com`,
    password: 'SecurePass123!',
    name: 'Dr. Test',
    phone: '9876543210',
    specialization: 'General Medicine',
    license_number: `LIC${Date.now()}`,
    qualification: 'MBBS, MD'
  };
  
  const doctorRegResponse = await makeRequest('POST', '/auth/register/doctor', doctorData);
  logTest(
    'POST /api/auth/register/doctor',
    doctorRegResponse.status === 201 || doctorRegResponse.status === 200,
    doctorRegResponse.ok ? 'Doctor registration successful' : `Registration failed: ${doctorRegResponse.data?.error?.message || 'Unknown error'}`,
    doctorRegResponse.data
  );

  // Test login
  const loginResponse = await makeRequest('POST', '/auth/login/patient', {
    email: patientData.email,
    password: patientData.password
  });
  
  logTest(
    'POST /api/auth/login/patient',
    loginResponse.ok,
    loginResponse.ok ? 'Patient login successful' : `Login failed: ${loginResponse.data?.error?.message || 'Unknown error'}`,
    loginResponse.ok ? { token: 'received' } : loginResponse.data
  );

  return loginResponse.data?.token || null;
}

async function testMedicalRecordsEndpoints(token) {
  logSection('3. Medical Records Endpoints');
  
  if (!token) {
    console.log(`  ${colors.yellow}⊘ SKIP${colors.reset} No authentication token available`);
    results.skipped += 5;
    return;
  }

  // Test get my medical records
  const myRecordsResponse = await makeRequest('GET', '/medical-records/me', null, token);
  logTest(
    'GET /api/medical-records/me',
    myRecordsResponse.ok,
    myRecordsResponse.ok ? `Retrieved ${myRecordsResponse.data?.data?.total || 0} records` : `Failed: ${myRecordsResponse.data?.error?.message || 'Unknown error'}`,
    myRecordsResponse.data
  );

  // Test create medical record (will fail if not doctor, but we're testing the endpoint)
  const createRecordResponse = await makeRequest('POST', '/medical-records', {
    patient_id: '00000000-0000-0000-0000-000000000000',
    diagnosis: 'Test diagnosis',
    prescription: 'Test prescription',
    notes: 'Test notes'
  }, token);
  
  logTest(
    'POST /api/medical-records',
    createRecordResponse.status === 201 || createRecordResponse.status === 403,
    createRecordResponse.status === 403 ? 'Endpoint working (requires doctor role)' : createRecordResponse.ok ? 'Record created' : `Failed: ${createRecordResponse.data?.error?.message || 'Unknown error'}`,
    createRecordResponse.status === 403 ? null : createRecordResponse.data
  );
}

async function testAppointmentsEndpoints(token) {
  logSection('4. Appointments Endpoints');
  
  if (!token) {
    console.log(`  ${colors.yellow}⊘ SKIP${colors.reset} No authentication token available`);
    results.skipped += 3;
    return;
  }

  // Test get my appointments
  const myAppointmentsResponse = await makeRequest('GET', '/appointments/me', null, token);
  logTest(
    'GET /api/appointments/me',
    myAppointmentsResponse.ok,
    myAppointmentsResponse.ok ? `Retrieved ${myAppointmentsResponse.data?.data?.total || 0} appointments` : `Failed: ${myAppointmentsResponse.data?.error?.message || 'Unknown error'}`,
    myAppointmentsResponse.data
  );

  // Test create appointment
  const createAppointmentResponse = await makeRequest('POST', '/appointments', {
    patient_id: '00000000-0000-0000-0000-000000000000',
    doctor_id: '00000000-0000-0000-0000-000000000000',
    appointment_date: '2026-03-01',
    appointment_time: '14:30'
  }, token);
  
  logTest(
    'POST /api/appointments',
    createAppointmentResponse.status === 201 || createAppointmentResponse.status === 403 || createAppointmentResponse.status === 404,
    createAppointmentResponse.status === 403 ? 'Endpoint working (requires proper role)' : createAppointmentResponse.ok ? 'Appointment created' : `Failed: ${createAppointmentResponse.data?.error?.message || 'Unknown error'}`,
    createAppointmentResponse.status === 403 ? null : createAppointmentResponse.data
  );
}

async function testConsentEndpoints(token) {
  logSection('5. Consent Management Endpoints');
  
  if (!token) {
    console.log(`  ${colors.yellow}⊘ SKIP${colors.reset} No authentication token available`);
    results.skipped += 4;
    return;
  }

  // Test get my consents
  const myConsentsResponse = await makeRequest('GET', '/consent/me', null, token);
  logTest(
    'GET /api/consent/me',
    myConsentsResponse.ok,
    myConsentsResponse.ok ? `Retrieved ${myConsentsResponse.data?.data?.total || 0} consent records` : `Failed: ${myConsentsResponse.data?.error?.message || 'Unknown error'}`,
    myConsentsResponse.data
  );

  // Test grant consent
  const grantConsentResponse = await makeRequest('POST', '/consent/grant', {
    consent_type: 'medical_records'
  }, token);
  
  logTest(
    'POST /api/consent/grant',
    grantConsentResponse.ok,
    grantConsentResponse.ok ? 'Consent granted successfully' : `Failed: ${grantConsentResponse.data?.error?.message || 'Unknown error'}`,
    grantConsentResponse.data
  );

  // Test consent history
  const historyResponse = await makeRequest('GET', '/consent/history', null, token);
  logTest(
    'GET /api/consent/history',
    historyResponse.ok,
    historyResponse.ok ? `Retrieved ${historyResponse.data?.data?.total || 0} history records` : `Failed: ${historyResponse.data?.error?.message || 'Unknown error'}`,
    historyResponse.data
  );
}

async function testAuditEndpoints(token) {
  logSection('6. Audit Log Endpoints');
  
  if (!token) {
    console.log(`  ${colors.yellow}⊘ SKIP${colors.reset} No authentication token available`);
    results.skipped += 2;
    return;
  }

  // Test get my audit logs
  const myAuditResponse = await makeRequest('GET', '/audit/me', null, token);
  logTest(
    'GET /api/audit/me',
    myAuditResponse.ok,
    myAuditResponse.ok ? `Retrieved ${myAuditResponse.data?.data?.total || 0} audit logs` : `Failed: ${myAuditResponse.data?.error?.message || 'Unknown error'}`,
    myAuditResponse.data
  );

  // Test get all audit logs (admin only)
  const allAuditResponse = await makeRequest('GET', '/audit/all', null, token);
  logTest(
    'GET /api/audit/all',
    allAuditResponse.ok || allAuditResponse.status === 403,
    allAuditResponse.status === 403 ? 'Endpoint working (requires admin role)' : allAuditResponse.ok ? `Retrieved ${allAuditResponse.data?.data?.total || 0} audit logs` : `Failed: ${allAuditResponse.data?.error?.message || 'Unknown error'}`,
    allAuditResponse.status === 403 ? null : allAuditResponse.data
  );
}

async function testVisitsEndpoints(token) {
  logSection('7. Visits Endpoints');
  
  if (!token) {
    console.log(`  ${colors.yellow}⊘ SKIP${colors.reset} No authentication token available`);
    results.skipped += 2;
    return;
  }

  // Test get my visits
  const myVisitsResponse = await makeRequest('GET', '/visits/me', null, token);
  logTest(
    'GET /api/visits/me',
    myVisitsResponse.ok || myVisitsResponse.status === 404,
    myVisitsResponse.ok ? `Retrieved ${myVisitsResponse.data?.data?.total || 0} visits` : myVisitsResponse.status === 404 ? 'No visits found (expected)' : `Failed: ${myVisitsResponse.data?.error?.message || 'Unknown error'}`,
    myVisitsResponse.ok ? myVisitsResponse.data : null
  );
}

async function testPrescriptionsEndpoints(token) {
  logSection('8. Prescriptions Endpoints');
  
  if (!token) {
    console.log(`  ${colors.yellow}⊘ SKIP${colors.reset} No authentication token available`);
    results.skipped += 2;
    return;
  }

  // Test get my prescriptions
  const myPrescriptionsResponse = await makeRequest('GET', '/prescriptions/me', null, token);
  logTest(
    'GET /api/prescriptions/me',
    myPrescriptionsResponse.ok || myPrescriptionsResponse.status === 404,
    myPrescriptionsResponse.ok ? `Retrieved ${myPrescriptionsResponse.data?.data?.total || 0} prescriptions` : myPrescriptionsResponse.status === 404 ? 'No prescriptions found (expected)' : `Failed: ${myPrescriptionsResponse.data?.error?.message || 'Unknown error'}`,
    myPrescriptionsResponse.ok ? myPrescriptionsResponse.data : null
  );
}

async function testAdminEndpoints(token) {
  logSection('9. Admin Endpoints');
  
  if (!token) {
    console.log(`  ${colors.yellow}⊘ SKIP${colors.reset} No authentication token available`);
    results.skipped += 2;
    return;
  }

  // Test get pending verifications
  const pendingResponse = await makeRequest('GET', '/admin/pending-verifications', null, token);
  logTest(
    'GET /api/admin/pending-verifications',
    pendingResponse.ok || pendingResponse.status === 403,
    pendingResponse.status === 403 ? 'Endpoint working (requires admin role)' : pendingResponse.ok ? `Retrieved ${pendingResponse.data?.data?.length || 0} pending verifications` : `Failed: ${pendingResponse.data?.error?.message || 'Unknown error'}`,
    pendingResponse.status === 403 ? null : pendingResponse.data
  );

  // Test get all accounts
  const accountsResponse = await makeRequest('GET', '/admin/accounts', null, token);
  logTest(
    'GET /api/admin/accounts',
    accountsResponse.ok || accountsResponse.status === 403,
    accountsResponse.status === 403 ? 'Endpoint working (requires admin role)' : accountsResponse.ok ? `Retrieved ${accountsResponse.data?.data?.total || 0} accounts` : `Failed: ${accountsResponse.data?.error?.message || 'Unknown error'}`,
    accountsResponse.status === 403 ? null : accountsResponse.data
  );
}

// Main test runner
async function runAllTests() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     Backend API Endpoint Testing Suite                ║${colors.reset}`);
  console.log(`${colors.cyan}║     Testing: ${BASE_URL.padEnd(38)}║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  let token = null;

  try {
    await testHealthEndpoint();
    token = await testAuthEndpoints();
    await testMedicalRecordsEndpoints(token);
    await testAppointmentsEndpoints(token);
    await testConsentEndpoints(token);
    await testAuditEndpoints(token);
    await testVisitsEndpoints(token);
    await testPrescriptionsEndpoints(token);
    await testAdminEndpoints(token);
  } catch (error) {
    console.error(`\n${colors.red}Fatal error during testing:${colors.reset}`, error.message);
  }

  // Print summary
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                    Test Summary                        ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  const total = results.passed + results.failed + results.skipped;
  console.log(`  Total Tests:    ${total}`);
  console.log(`  ${colors.green}Passed:${colors.reset}         ${results.passed}`);
  console.log(`  ${colors.red}Failed:${colors.reset}         ${results.failed}`);
  console.log(`  ${colors.yellow}Skipped:${colors.reset}        ${results.skipped}`);
  
  const passRate = total > 0 ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) : 0;
  console.log(`  ${colors.cyan}Pass Rate:${colors.reset}      ${passRate}%\n`);

  if (results.failed > 0) {
    console.log(`${colors.red}Some tests failed. Check the output above for details.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}All tests passed! ✓${colors.reset}\n`);
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
});
