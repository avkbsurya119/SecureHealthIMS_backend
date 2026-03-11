# SecureHealthIMS Testing Documentation

## Comprehensive Testing Strategy & Guide

| Document Metadata | |
|-------------------|-----------------|
| **Project** | SecureHealthIMS |
| **Version** | 1.0.0 |
| **Date** | March 11, 2026 |
| **Classification** | Quality Assurance |
| **Author** | QA Team |

---

## Table of Contents

1. [Testing Overview](#1-testing-overview)
2. [Testing Strategy](#2-testing-strategy)
3. [Test Environment Setup](#3-test-environment-setup)
4. [Backend Testing](#4-backend-testing)
5. [Frontend Testing](#5-frontend-testing)
6. [Security Testing](#6-security-testing)
7. [Integration Testing](#7-integration-testing)
8. [Manual Testing Procedures](#8-manual-testing-procedures)
9. [Quality Gates](#9-quality-gates)
10. [Test Data Management](#10-test-data-management)

---

## 1. Testing Overview

### 1.1 Testing Philosophy

SecureHealthIMS follows a comprehensive testing approach to ensure:

- **Security**: Healthcare data protection and HIPAA compliance
- **Reliability**: Consistent application behavior
- **Performance**: Responsive user experience
- **Accessibility**: Usable by all users

### 1.2 Test Coverage Goals

| Component | Target Coverage | Priority |
|-----------|-----------------|----------|
| Authentication | 90% | Critical |
| Authorization (RBAC) | 95% | Critical |
| Consent Management | 95% | Critical |
| API Endpoints | 80% | High |
| Frontend Components | 70% | Medium |
| UI Integration | 60% | Medium |

### 1.3 Testing Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  (Manual/Automated)
        │   (10%)     │
       ─┴─────────────┴─
      ┌─────────────────┐
      │ Integration     │  (API Tests)
      │ Tests (30%)     │
     ─┴─────────────────┴─
    ┌───────────────────────┐
    │     Unit Tests        │  (Functions, Components)
    │       (60%)           │
    └───────────────────────┘
```

---

## 2. Testing Strategy

### 2.1 Test Types

| Test Type | Scope | Tools | Frequency |
|-----------|-------|-------|-----------|
| Unit Tests | Individual functions/components | Jest, Vitest | Every commit |
| Integration Tests | API endpoints, DB operations | Custom scripts | Every PR |
| Security Tests | Auth, consent, injection | Manual + npm audit | Every PR |
| E2E Tests | User workflows | Manual | Release |
| Performance Tests | Load, response time | Manual | Release |

### 2.2 Testing Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| Local | Development testing | Mock/seed data |
| CI | Automated testing | Test fixtures |
| Production | Smoke testing | Read-only checks |

### 2.3 Test Automation Strategy

**Automated:**
- Linting (ESLint)
- Syntax validation
- Security audits (npm audit)
- Database connectivity tests
- Basic API health checks

**Manual:**
- User workflow testing
- UI/UX validation
- Cross-browser testing
- Accessibility testing
- Security penetration testing

---

## 3. Test Environment Setup

### 3.1 Backend Test Setup

```bash
# Clone repository
git clone https://github.com/avkbsurya119/SecureHealthIMS_backend.git
cd SecureHealthIMS_backend

# Install dependencies
npm install

# Create test environment file
cp .env.example .env.test

# Configure test environment variables
# .env.test
NODE_ENV=test
PORT=3001
SUPABASE_URL=<test-project-url>
SUPABASE_SERVICE_ROLE_KEY=<test-service-key>
FRONTEND_URL=http://localhost:5173
```

### 3.2 Frontend Test Setup

```bash
# Clone repository
git clone https://github.com/avkbsurya119/SecureHealthIMS_frontend.git
cd SecureHealthIMS_frontend

# Install dependencies
npm install

# Create test environment
cp .env.example .env.test

# Configure
# .env.test
VITE_API_URL=http://localhost:3001
```

### 3.3 Test Database Setup

```sql
-- Create test-specific seed data
INSERT INTO users (id, email, full_name, role, verified)
VALUES
  ('test-patient-uuid', 'testpatient@test.com', 'Test Patient', 'patient', true),
  ('test-doctor-uuid', 'testdoctor@test.com', 'Test Doctor', 'doctor', true),
  ('test-admin-uuid', 'testadmin@test.com', 'Test Admin', 'admin', true);
```

---

## 4. Backend Testing

### 4.1 Available Test Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Syntax Check | `node --check src/server.js` | Validate JavaScript syntax |
| Linting | `npm run lint` | Run ESLint |
| DB Connection | `node scripts/db_test.js` | Test database connectivity |
| Admin Flow | `node scripts/test_admin_flow.js` | Test admin operations |
| JWT Verification | `node scripts/verify_jwt_login.js` | Test authentication |

### 4.2 Running Tests

```bash
# Syntax validation
node --check src/server.js
node --check src/app.js

# Linting
npm run lint

# Database connectivity test
node scripts/db_test.js

# Integration tests
node scripts/test_admin_flow.js
node scripts/verify_jwt_login.js
```

### 4.3 API Endpoint Testing

#### 4.3.1 Authentication Tests

| Test Case | Endpoint | Expected Result |
|-----------|----------|-----------------|
| Valid login | POST /api/auth/login | 200 + JWT token |
| Invalid credentials | POST /api/auth/login | 401 Unauthorized |
| Missing token | GET /api/auth/me | 401 Unauthorized |
| Expired token | GET /api/auth/me | 401 Unauthorized |
| Invalid token | GET /api/auth/me | 401 Unauthorized |

#### 4.3.2 Authorization Tests

| Test Case | Role | Endpoint | Expected |
|-----------|------|----------|----------|
| Patient access own data | patient | GET /api/patients/me | 200 |
| Patient access others | patient | GET /api/patients/:otherId | 403 |
| Doctor search patients | doctor | GET /api/patients/search | 200 |
| Patient search patients | patient | GET /api/patients/search | 403 |
| Admin approve doctor | admin | POST /api/admin/approve/:id | 200 |
| Doctor approve doctor | doctor | POST /api/admin/approve/:id | 403 |

#### 4.3.3 Consent Tests

| Test Case | Setup | Action | Expected |
|-----------|-------|--------|----------|
| Access without consent | Consent revoked | GET patient records | 403 |
| Access with consent | Consent granted | GET patient records | 200 |
| Grant consent | Patient logged in | POST /api/consent/grant | 200 |
| Revoke consent | Consent granted | POST /api/consent/revoke | 200 |
| Post-revoke access | Consent just revoked | GET patient records | 403 |

### 4.4 Sample Test Cases (cURL)

```bash
# Test 1: Health check
curl -X GET http://localhost:3000/api/health

# Test 2: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Test 3: Protected endpoint with token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Test 4: Create appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"doctor_id":"uuid","date":"2026-03-15","time":"10:00"}'

# Test 5: Grant consent
curl -X POST http://localhost:3000/api/consent/grant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <patient-token>" \
  -d '{"consent_type":"medical_records"}'
```

---

## 5. Frontend Testing

### 5.1 Test Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Lint | `npm run lint` | Run ESLint |
| Build Test | `npm run build` | Verify production build |
| Preview | `npm run preview` | Test production build locally |

### 5.2 Component Testing Checklist

#### 5.2.1 Authentication Components

- [ ] LoginForm renders correctly
- [ ] Form validation works (email format, password length)
- [ ] Login error messages display
- [ ] Redirect to dashboard on success
- [ ] RegisterForm renders correctly
- [ ] Role selection works (patient/doctor)
- [ ] OTP verification step works
- [ ] Doctor shows pending approval message

#### 5.2.2 Dashboard Components

**PatientDashboard:**
- [ ] Overview tab displays correctly
- [ ] Medical history loads and displays
- [ ] Prescriptions tab works
- [ ] Appointments tab shows data
- [ ] Book appointment form works
- [ ] Profile editing works
- [ ] Privacy/Consent toggle works
- [ ] Audit logs display correctly

**DoctorDashboard:**
- [ ] Overview shows appointments count
- [ ] Patient search works
- [ ] Create visit record form works
- [ ] Create prescription form works
- [ ] Appointment status update works

**AdminDashboard:**
- [ ] User list loads
- [ ] Doctor approval works
- [ ] Ban/Unban functionality works
- [ ] Audit logs tab displays

#### 5.2.3 Chatbot Component

- [ ] Chat panel opens/closes
- [ ] Text messages send correctly
- [ ] Bot responses display
- [ ] Voice recording works
- [ ] Multilingual responses work
- [ ] Navigation actions work
- [ ] Appointment booking flow works

### 5.3 Cross-Browser Testing

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | Required |
| Firefox | Latest | Required |
| Safari | Latest | Recommended |
| Edge | Latest | Recommended |

### 5.4 Responsive Testing

| Breakpoint | Width | Test Devices |
|------------|-------|--------------|
| Mobile | < 480px | iPhone, Android |
| Tablet | 480-768px | iPad |
| Desktop | > 768px | Laptop, Monitor |

---

## 6. Security Testing

### 6.1 Automated Security Checks

```bash
# Dependency vulnerability scan
npm audit

# Check for high/critical vulnerabilities
npm audit --audit-level=high
```

### 6.2 Security Test Checklist

#### 6.2.1 Authentication Security

- [ ] Passwords are not stored in plain text
- [ ] JWT tokens expire correctly
- [ ] Invalid tokens are rejected
- [ ] Rate limiting prevents brute force
- [ ] OTP expires after 10 minutes
- [ ] Failed logins don't reveal user existence

#### 6.2.2 Authorization Security

- [ ] Patients cannot access other patients' data
- [ ] Doctors cannot access data without consent
- [ ] Admins cannot access medical records
- [ ] Role changes require re-authentication
- [ ] URL manipulation doesn't bypass auth

#### 6.2.3 Input Validation

- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output encoding)
- [ ] UUID format validated on all IDs
- [ ] File upload validation (chatbot voice)
- [ ] JSON payload size limits enforced

#### 6.2.4 Security Headers

Verify using [SecurityHeaders.com](https://securityheaders.com):

- [ ] Content-Security-Policy present
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security (HTTPS)
- [ ] X-XSS-Protection: 1; mode=block

### 6.3 OWASP Top 10 Testing

| Vulnerability | Test Method | Expected Result |
|---------------|-------------|-----------------|
| Injection | SQL/NoSQL in inputs | Rejected/sanitized |
| Broken Auth | Token manipulation | 401 Unauthorized |
| Sensitive Data | Check responses | No passwords/keys |
| XXE | XML payloads | Rejected |
| Broken Access | Role bypass attempts | 403 Forbidden |
| Security Misconfig | Header scan | All headers present |
| XSS | Script in inputs | Encoded/rejected |
| Insecure Deserialization | Malformed JSON | 400 Bad Request |
| Using Vulnerable Components | npm audit | No high/critical |
| Insufficient Logging | Check audit logs | All access logged |

---

## 7. Integration Testing

### 7.1 End-to-End Workflows

#### 7.1.1 Patient Registration Flow

```
1. POST /api/auth/register/initiate
   → Expect: 200, OTP sent

2. POST /api/auth/register/verify
   → Expect: 200, Account created

3. POST /api/auth/login
   → Expect: 200, JWT token

4. GET /api/auth/me
   → Expect: 200, User profile
```

#### 7.1.2 Appointment Booking Flow

```
1. POST /api/auth/login (patient)
   → Get token

2. GET /api/doctors
   → Get available doctors

3. POST /api/appointments
   → Create appointment

4. GET /api/appointments/me
   → Verify appointment listed

5. (Doctor) PATCH /api/appointments/:id/status
   → Confirm appointment

6. (Patient) GET /api/appointments/me
   → Verify status updated
```

#### 7.1.3 Consent Flow

```
1. POST /api/consent/grant
   → Grant medical_records consent

2. (Doctor) GET /api/patients/search
   → Patient appears in search

3. POST /api/consent/revoke
   → Revoke consent

4. (Doctor) GET /api/patients/search
   → Patient no longer appears

5. GET /api/audit/me
   → All access logged
```

### 7.2 Database Integration Tests

```bash
# Run database connectivity test
node scripts/db_test.js

# Expected output:
# ✓ Connected to Supabase
# ✓ Users table accessible
# ✓ Read permissions working
# ✓ Write permissions working
```

---

## 8. Manual Testing Procedures

### 8.1 User Acceptance Testing (UAT)

#### 8.1.1 Patient UAT Checklist

| # | Test Case | Steps | Expected | Pass/Fail |
|---|-----------|-------|----------|-----------|
| 1 | Registration | Register new patient account | Account created, can login | |
| 2 | Login | Login with credentials | Dashboard displayed | |
| 3 | Profile | Edit profile details | Changes saved | |
| 4 | Consent | Toggle data sharing | Consent status updated | |
| 5 | Appointments | Book new appointment | Appointment created | |
| 6 | View History | View medical history | Records displayed | |
| 7 | Prescriptions | View prescriptions | List displayed | |
| 8 | Audit | View access logs | Who accessed shown | |
| 9 | Chatbot | Ask question | Response received | |
| 10 | Voice | Send voice message | Transcribed and responded | |

#### 8.1.2 Doctor UAT Checklist

| # | Test Case | Steps | Expected | Pass/Fail |
|---|-----------|-------|----------|-----------|
| 1 | Registration | Register as doctor | Pending approval shown | |
| 2 | Approval | Admin approves | Can login after approval | |
| 3 | Search | Search for patient | Consented patients appear | |
| 4 | Visit Record | Create visit record | Record saved | |
| 5 | Prescription | Create prescription | Prescription saved | |
| 6 | Appointments | View appointments | List displayed | |
| 7 | Accept/Decline | Update appointment status | Status changed | |
| 8 | Profile | Update specialization | Changes saved | |

#### 8.1.3 Admin UAT Checklist

| # | Test Case | Steps | Expected | Pass/Fail |
|---|-----------|-------|----------|-----------|
| 1 | Login | Login as admin | Admin dashboard shown | |
| 2 | View Users | View all users | List displayed | |
| 3 | Approve Doctor | Approve pending doctor | Doctor activated | |
| 4 | Ban User | Ban a user | User cannot login | |
| 5 | Unban User | Unban user | User can login | |
| 6 | Audit Logs | View system logs | All activity shown | |

### 8.2 Regression Testing

Before each release, verify:

- [ ] All existing features still work
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Performance hasn't degraded
- [ ] Security controls intact

---

## 9. Quality Gates

### 9.1 CI Pipeline Gates

| Gate | Tool | Threshold | Blocking |
|------|------|-----------|----------|
| Linting | ESLint | 0 errors | Yes |
| Build | Vite/npm | Exit 0 | Yes |
| Syntax | Node.js | Exit 0 | Yes |
| Security | npm audit | No high/critical | Conditional |
| Tests | Custom scripts | All pass | Yes |

### 9.2 PR Merge Requirements

- [ ] All CI checks pass
- [ ] No linting errors
- [ ] Build succeeds
- [ ] Security audit clean
- [ ] Code review approved

### 9.3 Release Checklist

- [ ] All automated tests pass
- [ ] Manual UAT completed
- [ ] Security testing completed
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Version numbers updated

---

## 10. Test Data Management

### 10.1 Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Patient | testpatient@test.com | TestPass123! | Patient flow testing |
| Doctor | testdoctor@test.com | TestPass123! | Doctor flow testing |
| Admin | testadmin@test.com | TestPass123! | Admin flow testing |

### 10.2 Seed Data

```sql
-- Demo patient with consent
INSERT INTO patients (id, user_id, date_of_birth, gender)
VALUES ('demo-patient', 'demo-patient-user', '1990-01-15', 'male');

INSERT INTO patient_consents (patient_id, consent_type, status)
VALUES
  ('demo-patient', 'medical_records', 'granted'),
  ('demo-patient', 'data_sharing', 'granted');
```

### 10.3 Test Data Cleanup

```sql
-- Clean up test data after testing
DELETE FROM audit_logs WHERE user_id LIKE 'test-%';
DELETE FROM appointments WHERE patient_id LIKE 'test-%';
DELETE FROM visits WHERE patient_id LIKE 'test-%';
DELETE FROM prescriptions WHERE patient_id LIKE 'test-%';
DELETE FROM patient_consents WHERE patient_id LIKE 'test-%';
DELETE FROM patients WHERE id LIKE 'test-%';
DELETE FROM doctors WHERE id LIKE 'test-%';
DELETE FROM users WHERE id LIKE 'test-%';
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-11 | QA Team | Initial release |

---

**End of Document**

*SecureHealthIMS Testing Documentation v1.0.0*
