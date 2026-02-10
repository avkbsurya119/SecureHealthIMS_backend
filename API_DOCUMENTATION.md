# 🏥 Secure Healthcare Management System - API Documentation

## 📋 Overview

Complete backend API for a secure healthcare management system with:
- ✅ **JWT Authentication** via Supabase Auth
- ✅ **Role-Based Access Control** (admin, doctor, nurse, patient)
- ✅ **Consent Management** (default DENY policy)
- ✅ **Audit Logging** (immutable trail of all access)
- ✅ **HIPAA/GDPR Compliant**

**Base URL**: `http://localhost:3000/api`

---

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### How to Get a Token

1. **Sign Up/Sign In** via Supabase Auth (use Supabase client library or REST API)
2. Extract the `access_token` from the response
3. Use the token in all subsequent API requests

---

## 📌 API Endpoints

### 🏥 Medical Records

#### 1. Create Medical Record
```
POST /api/medical-records
```

**Auth**: Required (Doctor only)

**Request Body**:
```json
{
  "patient_id": "uuid",
  "diagnosis": "Patient diagnosed with...",
  "prescription": "Prescribed medication...",
  "notes": "Additional notes..."
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Medical record created successfully",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "doctor_id": "uuid",
    "diagnosis": "...",
    "prescription": "...",
    "notes": "...",
    "created_by": "uuid",
    "created_at": "2026-01-15T10:00:00Z"
  }
}
```

**Security**:
- ✅ Only doctors can create
- ✅ Automatically sets `created_by` to logged-in doctor
- ✅ Logged in audit trail

---

#### 2. Get Patient Medical Records
```
GET /api/medical-records/patient/:patientId
```

**Auth**: Required

**Query Parameters**:
- None

**Response** (200):
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "patient": {
      "id": "uuid",
      "name": "John Doe"
    },
    "records": [
      {
        "id": "uuid",
        "diagnosis": "...",
        "prescription": "...",
        "notes": "...",
        "created_at": "2026-01-15T10:00:00Z",
        "doctors": {
          "id": "uuid",
          "name": "Dr. Smith",
          "specialization": "Cardiology"
        }
      }
    ],
    "total": 5,
    "consent_status": {
      "checked": true,
      "granted": true,
      "reason": "explicit_grant"
    }
  }
}
```

**Security**:
- ✅ Patients can access their own records (no consent check)
- ✅ Doctors/Nurses require explicit consent grant
- ✅ Admin can access with override (logged)

**Error** (403 - No Consent):
```json
{
  "success": false,
  "error": {
    "message": "Patient has not granted consent to access medical records",
    "type": "ConsentRequiredError"
  }
}
```

---

#### 3. Get My Medical Records (Patient View)
```
GET /api/medical-records/me
```

**Auth**: Required (Patient only)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "records": [...],
    "total": 5
  }
}
```

**Security**:
- ✅ Patient-only endpoint
- ✅ Automatically filters by logged-in patient

---

#### 4. Get Single Medical Record
```
GET /api/medical-records/:recordId
```

**Auth**: Required

**Security**: Requires consent check

---

#### 5. Update Medical Record
```
PUT /api/medical-records/:recordId
```

**Auth**: Required (Doctor only)

**Request Body**:
```json
{
  "diagnosis": "Updated diagnosis",
  "prescription": "Updated prescription",
  "notes": "Updated notes"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Medical record updated successfully",
  "data": {...}
}
```

**Security**:
- ✅ Only the doctor who created the record can update it
- ✅ Automatically sets `updated_by` and `updated_at`
- ✅ Logged in audit trail

---

### 📅 Appointments

#### 1. Create Appointment
```
POST /api/appointments
```

**Auth**: Required (Doctor, Nurse, or Admin)

**Request Body**:
```json
{
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "appointment_date": "2026-01-20",
  "appointment_time": "14:30"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "doctor_id": "uuid",
    "appointment_date": "2026-01-20",
    "appointment_time": "14:30:00",
    "status": "scheduled",
    "created_by": "uuid",
    "patients": {...},
    "doctors": {...}
  }
}
```

**Security**:
- ✅ Automatically sets `created_by`
- ✅ Prevents double booking (unique constraint on doctor/date/time)

---

#### 2. Get My Appointments
```
GET /api/appointments/me
```

**Auth**: Required

**Query Parameters**:
- `status` (optional): `scheduled`, `completed`, `cancelled`
- `from_date` (optional): `2026-01-01`
- `to_date` (optional): `2026-01-31`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "appointments": [...],
    "total": 10
  }
}
```

**Security**:
- ✅ Patients see their own appointments
- ✅ Doctors see appointments assigned to them
- ✅ Admin sees all appointments

---

#### 3. Get Appointment by ID
```
GET /api/appointments/:appointmentId
```

**Auth**: Required

**Security**: Requires ownership (patient or assigned doctor)

---

#### 4. Update Appointment Status
```
PATCH /api/appointments/:appointmentId/status
```

**Auth**: Required

**Request Body**:
```json
{
  "status": "completed",
  "cancellation_reason": "Patient requested cancellation" // Required if status is "cancelled"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Appointment completed successfully",
  "data": {...}
}
```

**Security**:
- ✅ Validates status transitions:
  - `scheduled` → `completed` or `cancelled` ✅
  - `completed` → (no changes allowed) ❌
  - `cancelled` → (no changes allowed) ❌
- ✅ Requires `cancellation_reason` for cancelled status
- ✅ Sets `cancelled_at`, `cancelled_by` automatically

---

#### 5. Get Patient Appointments
```
GET /api/appointments/patient/:patientId
```

**Auth**: Required (Doctor, Nurse, or Admin)

**Query Parameters**:
- `status` (optional): Filter by status

---

### 🛡️ Consent Management

#### 1. Grant Consent
```
POST /api/consent/grant
```

**Auth**: Required (Patient only)

**Request Body**:
```json
{
  "consent_type": "medical_records"
}
```

**Consent Types**:
- `medical_records` - Access to medical history
- `data_sharing` - Share with third parties
- `research` - Use in research studies
- `marketing` - Marketing communications
- `emergency_contact` - Emergency contact access

**Response** (200):
```json
{
  "success": true,
  "message": "Consent granted for medical_records",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "consent_type": "medical_records",
    "status": "granted",
    "granted_at": "2026-01-15T10:00:00Z"
  }
}
```

**Security**:
- ✅ Patient-only endpoint
- ✅ Automatically logged in `consent_history` table
- ✅ Immediately grants access to doctors/nurses

---

#### 2. Revoke Consent
```
POST /api/consent/revoke
```

**Auth**: Required (Patient only)

**Request Body**:
```json
{
  "consent_type": "medical_records"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Consent revoked for medical_records. Access to related data has been blocked.",
  "data": {...}
}
```

**Security**:
- ✅ Immediately blocks access to data
- ✅ Logged in immutable `consent_history`

---

#### 3. Get My Consents
```
GET /api/consent/me
```

**Auth**: Required (Patient only)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "consents": [
      {
        "consent_type": "medical_records",
        "status": "granted",
        "granted_at": "2026-01-15T10:00:00Z"
      },
      {
        "consent_type": "data_sharing",
        "status": "denied"
      }
    ],
    "total": 5,
    "summary": {
      "granted": 1,
      "denied": 3,
      "revoked": 1
    }
  }
}
```

---

#### 4. Get Consent History
```
GET /api/consent/history
```

**Auth**: Required (Patient only)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "consent_type": "medical_records",
        "previous_status": null,
        "new_status": "granted",
        "changed_at": "2026-01-15T10:00:00Z"
      },
      {
        "consent_type": "medical_records",
        "previous_status": "granted",
        "new_status": "revoked",
        "changed_at": "2026-01-15T11:00:00Z"
      }
    ],
    "total": 2,
    "note": "This is an immutable audit trail of all consent changes"
  }
}
```

**Security**:
- ✅ Immutable audit trail
- ✅ Cannot be deleted or modified

---

#### 5. Get Patient Consents (Admin)
```
GET /api/consent/patient/:patientId
```

**Auth**: Required (Admin only)

**Security**: Admin read-only view of patient consent

---

### 📜 Audit Logs

#### 1. Get My Audit Logs (Patient View)
```
GET /api/audit/me
```

**Auth**: Required (Patient only)

**Query Parameters**:
- `limit` (optional, default 50): Number of records
- `offset` (optional, default 0): Pagination offset
- `action` (optional): `READ`, `CREATE`, `UPDATE`, `DELETE`, `EXPORT`
- `from_date` (optional): Start date
- `to_date` (optional): End date

**Response** (200):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "user_id": "doctor-uuid",
        "action": "READ",
        "resource": "medical_records",
        "resource_id": "record-uuid",
        "timestamp": "2026-01-15T10:00:00Z",
        "ip_address": "192.168.1.1",
        "details": {...}
      }
    ],
    "total": 25,
    "summary": {
      "recent_access": [...],
      "note": "This shows who has accessed your medical data"
    }
  }
}
```

**Security**:
- ✅ Patient can see who accessed their data
- ✅ HIPAA transparency requirement
- ✅ Logs are immutable

---

#### 2. Get All Audit Logs (Admin)
```
GET /api/audit/all
```

**Auth**: Required (Admin only)

**Query Parameters**:
- `limit`, `offset`, `action`, `user_id`, `resource`, `from_date`, `to_date`

**Security**: Admin-only, full system audit trail

---

#### 3. Get Patient Audit Logs (Admin)
```
GET /api/audit/patient/:patientId
```

**Auth**: Required (Admin only)

**Security**: Admin view of all access to specific patient data

---

## 🔒 Security Features

### Authentication
- ✅ JWT token verification via Supabase Auth
- ✅ Inactive user rejection (`is_active = false`)
- ✅ Token expiration handling

### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Ownership checks (doctors can only modify their own records)
- ✅ Consent enforcement (default DENY)

### Consent Management
- ✅ **DEFAULT DENY** policy
- ✅ Explicit consent required for doctor/nurse access
- ✅ Patient always has access to own data
- ✅ Immutable consent history

### Audit Logging
- ✅ All API actions logged
- ✅ Immutable logs (cannot be modified or deleted)
- ✅ Tracks: user, patient, action, resource, timestamp, IP
- ✅ Patient can see who accessed their data

### Input Validation
- ✅ UUID validation
- ✅ Required field checks
- ✅ Enum validation (status, consent types)
- ✅ Length validation
- ✅ Date/time format validation

### Error Handling
- ✅ Standardized error responses
- ✅ No sensitive data leaks in errors
- ✅ Appropriate HTTP status codes:
  - `200` - Success
  - `201` - Created
  - `401` - Unauthenticated
  - `403` - Unauthorized / Consent Required
  - `404` - Not Found
  - `422` - Validation Error
  - `500` - Internal Server Error

---

## 🧪 Testing with Postman

### 1. Setup Environment Variables

Create a Postman environment with:
- `base_url`: `http://localhost:3000/api`
- `token`: `<your-jwt-token>`

### 2. Authentication Setup

1. Obtain JWT token from Supabase Auth
2. Add to Headers in all requests:
   ```
   Authorization: Bearer {{token}}
   ```

### 3. Test Workflow

1. **Create Consent** (as Patient):
   - `POST /consent/grant` with `consent_type: medical_records`

2. **Create Medical Record** (as Doctor):
   - `POST /medical-records` with patient_id, diagnosis, etc.

3. **View Medical Records** (as Doctor):
   - `GET /medical-records/patient/:patientId`
   - Should succeed if consent granted

4. **Revoke Consent** (as Patient):
   - `POST /consent/revoke` with `consent_type: medical_records`

5. **Try to View Records Again** (as Doctor):
   - `GET /medical-records/patient/:patientId`
   - Should fail with 403 Consent Required

6. **View Audit Logs** (as Patient):
   - `GET /audit/me`
   - See all access to your data

---

## 🛡️ HIPAA/GDPR Compliance

This API implements:

✅ **Access Control**: Role-based permissions  
✅ **Consent Management**: Explicit opt-in required  
✅ **Audit Logging**: Complete traceability  
✅ **Data Minimization**: Only authorized access  
✅ **Transparency**: Patients can see who accessed their data  
✅ **Immutability**: Audit logs cannot be tampered with  
✅ **Encryption**: HTTPS required in production  
✅ **Authentication**: JWT-based secure authentication  

---

## 📊 Error Response Format

All errors follow this standard format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "type": "ErrorType",
    "details": ["Array of validation errors (if applicable)"],
    "timestamp": "2026-01-15T10:00:00Z"
  }
}
```

---

## 🚀 Getting Started

1. **Start Server**: `npm run dev`
2. **Import Postman Collection**: (see next section)
3. **Get JWT Token**: Sign in via Supabase Auth
4. **Set Token**: Add to environment variables
5. **Test Endpoints**: Follow test workflow above

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- All IDs are UUIDs
- Rate limiting is applied to sensitive endpoints
- Audit logs are automatically created for all actions
- Consent changes are immediately effective

---

**Last Updated**: January 15, 2026  
**API Version**: 1.0.0  
**Status**: Production-Ready ✅
