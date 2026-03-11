# SecureHealthIMS API Documentation

## Comprehensive REST API Reference

| Document Metadata | |
|-------------------|-----------------|
| **Project** | SecureHealthIMS |
| **Version** | 2.0.0 |
| **Date** | March 11, 2026 |
| **Classification** | Technical Reference |
| **Base URL (Production)** | https://securehealthims-backend.onrender.com |
| **Base URL (Development)** | http://localhost:3000 |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Error Handling](#3-error-handling)
4. [Rate Limiting](#4-rate-limiting)
5. [API Endpoints](#5-api-endpoints)
   - [Health Check](#51-health-check)
   - [Authentication](#52-authentication-endpoints)
   - [Patients](#53-patient-endpoints)
   - [Doctors](#54-doctor-endpoints)
   - [Appointments](#55-appointment-endpoints)
   - [Visits](#56-visit-endpoints)
   - [Prescriptions](#57-prescription-endpoints)
   - [Consent Management](#58-consent-endpoints)
   - [Audit Logs](#59-audit-endpoints)
   - [Admin](#510-admin-endpoints)
   - [AI Chatbot](#511-chatbot-endpoints)
6. [Data Models](#6-data-models)
7. [Security Features](#7-security-features)
8. [Testing Guide](#8-testing-guide)

---

## 1. Overview

### 1.1 API Architecture

The SecureHealthIMS API follows RESTful principles with:

- JSON request/response format
- JWT-based authentication via Supabase Auth
- Role-Based Access Control (RBAC) - admin, doctor, nurse, patient
- Patient consent management (DEFAULT DENY policy)
- Comprehensive audit logging for HIPAA/GDPR compliance
- AI Chatbot with multilingual voice support

### 1.2 Request Format

All API requests should include:

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### 1.3 Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "type": "ErrorType"
  }
}
```

---

## 2. Authentication

### 2.1 JWT Token

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Token Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "patient|doctor|admin|nurse",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 2.3 Token Expiration

| Token Type | Expiration |
|------------|------------|
| Access Token | 24 hours |
| OTP Token | 10 minutes |

### 2.4 Roles & Permissions

| Role | Description | Access Level |
|------|-------------|--------------|
| `patient` | Patient users | Own data only |
| `doctor` | Medical professionals | Patient data (with consent) |
| `nurse` | Nursing staff | Limited patient data |
| `admin` | System administrators | User management only (no medical data) |

---

## 3. Error Handling

### 3.1 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions / Consent required |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### 3.2 Error Types

| Error Type | Description |
|------------|-------------|
| `AuthenticationError` | Authentication required or failed |
| `UnauthorizedError` | Role not authorized |
| `ConsentRequiredError` | Patient consent not granted |
| `OwnershipError` | Resource ownership validation failed |
| `ValidationError` | Input validation failed |
| `NotFoundError` | Resource not found |

---

## 4. Rate Limiting

### 4.1 Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 10 requests | 15 minutes |
| API (General) | 100 requests | 15 minutes |
| Chatbot | 30 requests | 1 minute |

### 4.2 Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## 5. API Endpoints

### 5.1 Health Check

#### GET /api/health

Check API server health status.

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-11T10:00:00.000Z"
  }
}
```

---

### 5.2 Authentication Endpoints

#### POST /api/auth/register/initiate

Initiate registration with email verification (OTP sent).

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to email"
}
```

---

#### POST /api/auth/register/verify

Complete registration with OTP verification.

**Authentication:** Not required

**Request Body (Patient):**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "token": "12345678",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "patient",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "address": "123 Main St, City"
}
```

**Request Body (Doctor):**
```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123!",
  "token": "12345678",
  "name": "Dr. Jane Smith",
  "phone": "+1234567890",
  "role": "doctor",
  "specialization": "Cardiology",
  "department_id": "uuid-optional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful"
}
```

**Note:** Doctor accounts require admin approval before they can log in.

---

#### POST /api/auth/login

User login.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "patient",
      "verified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error (Pending Approval):**
```json
{
  "success": false,
  "error": {
    "message": "Your account is pending approval by an administrator"
  }
}
```

---

#### GET /api/auth/me

Get current authenticated user profile.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "patient",
    "phone": "+1234567890",
    "address": "123 Main St",
    "blood_group": "O+",
    "allergies": "None",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

#### PUT /api/auth/profile

Update user profile.

**Authentication:** Required

**Request Body (Patient):**
```json
{
  "phone": "+1234567890",
  "address": "456 New St, City",
  "blood_group": "O+",
  "dob": "1990-01-15",
  "gender": "male",
  "allergies": "None",
  "medical_history": "No major conditions",
  "emergency_contact": "Jane Doe",
  "emergency_phone": "+0987654321"
}
```

**Request Body (Doctor):**
```json
{
  "phone": "+1234567890",
  "specialization": "Cardiology",
  "license_number": "LIC-12345",
  "education": "MBBS, MD",
  "experience_years": 10,
  "hospital_affiliation": "City Hospital"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Profile updated successfully"
}
```

---

#### POST /api/auth/logout

Logout current user.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5.3 Patient Endpoints

#### GET /api/patients/search

Search patients (Doctor only, requires consent).

**Authentication:** Required (Doctor)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (name, email, phone) - min 2 chars |

**Request:**
```
GET /api/patients/search?q=john
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "date_of_birth": "1990-01-15",
      "gender": "male",
      "blood_group": "O+"
    }
  ]
}
```

**Note:** Only returns patients who have granted consent for data sharing.

---

#### GET /api/patients/me

Get current patient's own data.

**Authentication:** Required (Patient)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "blood_group": "O+",
    "address": "123 Main St"
  }
}
```

---

#### POST /api/patients/register-user

Register patient in the unified users table (for legacy patients).

**Authentication:** Required (Patient)

**Request Body:**
```json
{
  "full_name": "John Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "blood_group": "O+",
  "allergies": "Penicillin",
  "medical_history": "None",
  "emergency_contact": "Jane Doe",
  "emergency_phone": "+0987654321"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully registered in the system"
  }
}
```

---

### 5.4 Doctor Endpoints

#### GET /api/doctors

List all verified doctors.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Dr. Jane Smith",
      "specialization": "Cardiology",
      "department": "Cardiology Department"
    }
  ]
}
```

---

### 5.5 Appointment Endpoints

#### GET /api/appointments/me

Get current user's appointments.

**Authentication:** Required

**Response (Patient):**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "date": "2026-03-15",
        "time": "10:00",
        "status": "Pending",
        "reason": "Regular checkup",
        "doctor_details": {
          "name": "Dr. Jane Smith",
          "specialization": "Cardiology"
        }
      }
    ]
  }
}
```

**Response (Doctor):**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "date": "2026-03-15",
        "time": "10:00",
        "status": "Pending",
        "reason": "Regular checkup",
        "users": {
          "name": "John Doe"
        }
      }
    ]
  }
}
```

---

#### POST /api/appointments

Create a new appointment.

**Authentication:** Required (Patient)

**Request Body:**
```json
{
  "doctor_id": "uuid",
  "date": "2026-03-15",
  "time": "10:00",
  "reason": "Regular checkup"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2026-03-15",
    "time": "10:00",
    "status": "Pending"
  },
  "message": "Appointment created successfully"
}
```

---

#### PATCH /api/appointments/:id/status

Update appointment status (Doctor only).

**Authentication:** Required (Doctor)

**Request Body:**
```json
{
  "status": "Confirmed|Cancelled|Completed|No-Show",
  "decline_reason": "Optional reason for cancellation"
}
```

**Status Transitions:**
- `Pending` → `Confirmed` or `Cancelled`
- `Confirmed` → `Completed` or `No-Show` (only after appointment time)
- `Completed`, `Cancelled`, `No-Show` → (no changes allowed)

**Response:**
```json
{
  "success": true,
  "message": "Appointment status updated"
}
```

---

### 5.6 Visit Endpoints

#### GET /api/visits/me

Get current patient's visit history.

**Authentication:** Required (Patient)

**Response:**
```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": "uuid",
        "visit_date": "2026-03-01",
        "chief_complaint": "Headache",
        "diagnosis": "Migraine",
        "notes": "Prescribed pain relief",
        "doctor": {
          "name": "Dr. Jane Smith",
          "specialization": "Neurology"
        }
      }
    ]
  }
}
```

---

#### POST /api/visits

Create a new visit record (Doctor only).

**Authentication:** Required (Doctor)

**Request Body:**
```json
{
  "patient_id": "uuid",
  "visit_date": "2026-03-11",
  "chief_complaint": "Chest pain",
  "diagnosis": "Angina",
  "notes": "Recommended follow-up in 2 weeks"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Visit record created successfully"
}
```

**Security:** Requires patient consent for medical records access.

---

### 5.7 Prescription Endpoints

#### GET /api/prescriptions/me

Get current patient's prescriptions.

**Authentication:** Required (Patient)

**Response:**
```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": "uuid",
        "medication_name": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "3 times daily",
        "duration": "7 days",
        "instructions": "Take after meals",
        "users": {
          "name": "Dr. Jane Smith",
          "specialization": "General Medicine"
        }
      }
    ]
  }
}
```

---

#### POST /api/prescriptions

Create a new prescription (Doctor only).

**Authentication:** Required (Doctor)

**Request Body:**
```json
{
  "patient_id": "uuid",
  "medication_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "3 times daily",
  "duration": "7 days",
  "instructions": "Take after meals",
  "notes": "Complete full course"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Prescription created successfully"
}
```

---

### 5.8 Consent Endpoints

#### GET /api/consent/me

Get current patient's consent settings.

**Authentication:** Required (Patient)

**Response:**
```json
{
  "success": true,
  "data": {
    "consents": [
      {
        "consent_type": "medical_records",
        "status": "granted",
        "granted_at": "2026-03-01T00:00:00.000Z"
      },
      {
        "consent_type": "data_sharing",
        "status": "revoked",
        "revoked_at": "2026-03-10T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### POST /api/consent/grant

Grant consent for a specific type.

**Authentication:** Required (Patient)

**Request Body:**
```json
{
  "consent_type": "medical_records|data_sharing|treatment|research"
}
```

**Consent Types:**
| Type | Description |
|------|-------------|
| `medical_records` | Access to medical history |
| `data_sharing` | Share with healthcare providers |
| `treatment` | Treatment-related data sharing |
| `research` | Use in research studies |

**Response:**
```json
{
  "success": true,
  "message": "Consent granted for medical_records"
}
```

---

#### POST /api/consent/revoke

Revoke consent for a specific type.

**Authentication:** Required (Patient)

**Request Body:**
```json
{
  "consent_type": "medical_records"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent revoked for medical_records. Access to related data has been blocked."
}
```

**Note:** Revoking consent immediately blocks access for all healthcare providers.

---

### 5.9 Audit Endpoints

#### GET /api/audit/me

Get audit logs for current patient (who accessed their data).

**Authentication:** Required (Patient)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "action": "READ",
        "resource": "medical_records",
        "created_at": "2026-03-11T10:00:00.000Z",
        "performer": {
          "name": "Dr. Jane Smith",
          "role": "doctor",
          "specialization": "Cardiology"
        }
      }
    ]
  }
}
```

---

#### GET /api/audit/all

Get all audit logs (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max results (default: 100) |
| `offset` | number | No | Pagination offset |
| `action` | string | No | Filter by action type |
| `user_id` | string | No | Filter by user |

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [ ... ]
  }
}
```

---

### 5.10 Admin Endpoints

#### GET /api/admin/users

Get all users (Admin only).

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "patient",
      "verified": true,
      "consent": true,
      "specialization": null,
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/admin/approve/:id

Approve a doctor account.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "message": "Doctor approved successfully"
}
```

---

#### POST /api/admin/ban/:id

Ban a user account.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "role": "patient|doctor|nurse"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User banned successfully"
}
```

---

#### POST /api/admin/unban/:id

Unban a user account.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "role": "patient|doctor|nurse"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User unbanned successfully"
}
```

---

### 5.11 Chatbot Endpoints

The AI chatbot is powered by Google Gemini for text processing and Sarvam AI for multilingual voice support (Speech-to-Text and Text-to-Speech).

#### POST /api/chatbot/message

Send a text message to the AI chatbot.

**Authentication:** Required

**Request Body:**
```json
{
  "message": "What are my upcoming appointments?",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "You have 2 upcoming appointments. Your next appointment is with Dr. Jane Smith on March 15, 2026 at 10:00 AM.",
    "action": {
      "action": "set_tab",
      "target": "appointments"
    },
    "pendingBooking": null
  }
}
```

**Action Types:**
| Action | Target | Description |
|--------|--------|-------------|
| `navigate` | `/path` | Navigate to a specific route |
| `set_tab` | `tab_name` | Switch to a dashboard tab |

---

#### POST /api/chatbot/voice

Send a voice message to the AI chatbot (multilingual support).

**Authentication:** Required

**Request:**
```
Content-Type: multipart/form-data

audio: <audio_file> (webm, wav)
conversationHistory: <JSON string>
```

**Supported Languages:**
- English (en-IN)
- Hindi (hi-IN)
- Tamil (ta-IN)
- Telugu (te-IN)
- Kannada (kn-IN)
- Malayalam (ml-IN)
- Bengali (bn-IN)
- Gujarati (gu-IN)
- Marathi (mr-IN)
- And more Indian languages

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": "What are my appointments?",
    "response": "You have 2 upcoming appointments...",
    "language_code": "hi-IN",
    "audioBase64": "base64_encoded_audio_response"
  }
}
```

**Note:** The response audio is generated in the same language as the input speech.

---

#### POST /api/chatbot/confirm-booking

Confirm a pending appointment booking from chatbot.

**Authentication:** Required (Patient)

**Request Body:**
```json
{
  "doctor_id": "uuid",
  "doctor_name": "Dr. Jane Smith",
  "date": "2026-03-15",
  "time": "10:00"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "doctor_name": "Dr. Jane Smith",
    "date": "2026-03-15",
    "time": "10:00",
    "status": "Pending"
  }
}
```

---

## 6. Data Models

### 6.1 User

```typescript
interface User {
  id: string;           // UUID
  email: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin';
  phone?: string;
  address?: string;
  verified: boolean;
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
}
```

### 6.2 Patient

```typescript
interface Patient {
  id: string;           // UUID
  user_id: string;      // FK to users
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  emergency_contact?: string;
  emergency_phone?: string;
}
```

### 6.3 Doctor

```typescript
interface Doctor {
  id: string;           // UUID
  user_id: string;      // FK to users
  name: string;
  specialization: string;
  department_id?: string;
  license_number?: string;
  education?: string;
  experience_years?: number;
}
```

### 6.4 Appointment

```typescript
interface Appointment {
  id: string;           // UUID
  patient_id: string;   // FK to users
  doctor_id: string;    // FK to users
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'No-Show';
  reason?: string;
  decline_reason?: string;
  created_at: string;
}
```

### 6.5 Consent

```typescript
interface PatientConsent {
  id: string;
  patient_id: string;
  consent_type: 'medical_records' | 'data_sharing' | 'treatment' | 'research';
  status: 'granted' | 'revoked';
  granted_at?: string;
  revoked_at?: string;
}
```

### 6.6 Audit Log

```typescript
interface AuditLog {
  id: string;
  user_id: string;
  patient_id?: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT';
  resource: string;
  resource_id?: string;
  ip_address?: string;
  details?: object;
  created_at: string;
}
```

---

## 7. Security Features

### 7.1 Authentication Security

- Passwords must be minimum 8 characters
- JWT tokens expire after 24 hours
- OTP tokens (8-digit) expire after 10 minutes
- Failed login attempts are rate-limited (10/15min)
- Doctor accounts require admin approval

### 7.2 Consent-Based Access (DEFAULT DENY)

- Patient data is inaccessible by default
- Explicit consent required for each data type
- Consent can be revoked at any time
- Revoking consent immediately blocks access
- All consent changes logged in immutable history

### 7.3 Audit Logging

- All data access is logged
- Logs are immutable (cannot be modified or deleted)
- Patients can view who accessed their data
- Tracks: user, action, resource, timestamp, IP

### 7.4 Input Validation

- All IDs validated as UUIDs
- SQL injection prevented via parameterized queries
- XSS prevented via output encoding
- Type validation on all inputs

### 7.5 Security Headers

Implemented via Helmet middleware:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection

---

## 8. Testing Guide

### 8.1 Test Workflow

1. **Register as Patient:**
   - `POST /api/auth/register/initiate` with email/password
   - `POST /api/auth/register/verify` with OTP and details

2. **Login:**
   - `POST /api/auth/login` to get JWT token

3. **Grant Consent:**
   - `POST /api/consent/grant` with `consent_type: medical_records`

4. **Create Appointment:**
   - `POST /api/appointments` with doctor and date

5. **View Data:**
   - `GET /api/appointments/me`
   - `GET /api/visits/me`
   - `GET /api/prescriptions/me`

6. **Check Audit Logs:**
   - `GET /api/audit/me` to see who accessed your data

### 8.2 Doctor Workflow

1. **Register as Doctor:**
   - Same as patient but with `role: doctor`
   - Wait for admin approval

2. **Search Patients:**
   - `GET /api/patients/search?q=name`

3. **Create Visit Record:**
   - `POST /api/visits` with patient_id and diagnosis

4. **Create Prescription:**
   - `POST /api/prescriptions` with medication details

5. **Manage Appointments:**
   - `GET /api/appointments/me`
   - `PATCH /api/appointments/:id/status`

### 8.3 Admin Workflow

1. **View All Users:**
   - `GET /api/admin/users`

2. **Approve Doctor:**
   - `POST /api/admin/approve/:id`

3. **Ban/Unban User:**
   - `POST /api/admin/ban/:id`
   - `POST /api/admin/unban/:id`

4. **View System Audit:**
   - `GET /api/audit/all`

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-15 | API Team | Initial release |
| 2.0.0 | 2026-03-11 | API Team | Added chatbot endpoints, updated consent flow, added doctor workflow |

---

**End of Document**

*SecureHealthIMS API Documentation v2.0.0*
