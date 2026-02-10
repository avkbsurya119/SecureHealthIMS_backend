# 🚀 Quick Start Guide - Testing the Secure Healthcare Backend

## ✅ Prerequisites

- ✅ Server is running (`npm run dev`)
- ✅ Database migrations applied
- ✅ Supabase Auth configured
- ✅ Postman installed

---

## 📝 Step 1: Get Authentication Token

### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Create a test user or use existing
4. Get the JWT token from the user session

### Option B: Using Supabase API (via Postman)
```
POST https://your-project.supabase.co/auth/v1/token?grant_type=password

Headers:
  apikey: your-anon-key
  Content-Type: application/json

Body:
{
  "email": "test@example.com",
  "password": "yourpassword"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  ...
}
```

---

## 📝 Step 2: Configure Postman

### 1. Create Environment
- Name: `Healthcare Backend - Local`
- Variables:
  ```
  base_url: http://localhost:5000/api
  token: <paste-your-jwt-token-here>
  ```

### 2. Set Default Headers
Add to all requests:
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

---

## 🧪 Step 3: Test Endpoints

### Test 1: Health Check (No Auth Required)
```
GET {{base_url}}/health

Expected: 200 OK
{
  "status": "ok",
  "timestamp": "..."
}
```

---

### Test 2: Grant Consent (Patient Role Required)

**Prerequisites**: Your user must have role='patient' and linked patient record

```
POST {{base_url}}/consent/grant

Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "consent_type": "medical_records"
}

Expected: 200 OK
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

---

### Test 3: Create Medical Record (Doctor Role Required)

**Prerequisites**: Your user must have role='doctor' and linked doctor record

```
POST {{base_url}}/medical-records

Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "patient_id": "existing-patient-uuid",
  "diagnosis": "Patient presents with symptoms of...",
  "prescription": "Prescribed: Medication X, 500mg twice daily",
  "notes": "Follow-up recommended in 2 weeks"
}

Expected: 201 Created
{
  "success": true,
  "message": "Medical record created successfully",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "doctor_id": "uuid",
    "diagnosis": "...",
    "created_by": "uuid",
    "created_at": "..."
  }
}
```

---

### Test 4: Get Patient Medical Records (Requires Consent)

```
GET {{base_url}}/medical-records/patient/<patient-uuid>

Expected if consent granted: 200 OK
{
  "success": true,
  "data": {
    "patient": {
      "id": "uuid",
      "name": "John Doe"
    },
    "records": [...],
    "consent_status": {
      "checked": true,
      "granted": true,
      "reason": "explicit_grant"
    }
  }
}

Expected if NO consent: 403 Forbidden
{
  "success": false,
  "error": {
    "message": "Patient has not granted consent to access medical records",
    "type": "ConsentRequiredError"
  }
}
```

---

### Test 5: Revoke Consent

```
POST {{base_url}}/consent/revoke

Body:
{
  "consent_type": "medical_records"
}

Expected: 200 OK
{
  "success": true,
  "message": "Consent revoked for medical_records. Access to related data has been blocked."
}
```

---

### Test 6: Try to Access After Revoke

```
GET {{base_url}}/medical-records/patient/<patient-uuid>

Expected: 403 Forbidden
{
  "success": false,
  "error": {
    "message": "Patient has not granted consent to access medical records",
    "type": "ConsentRequiredError"
  }
}
```

---

### Test 7: View Audit Logs (Patient)

```
GET {{base_url}}/audit/me

Expected: 200 OK
{
  "success": true,
  "data": {
    "logs": [
      {
        "user_id": "doctor-uuid",
        "action": "READ",
        "resource": "medical_records",
        "timestamp": "2026-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "recent_access": [...],
      "note": "This shows who has accessed your medical data"
    }
  }
}
```

---

### Test 8: Create Appointment

```
POST {{base_url}}/appointments

Body:
{
  "patient_id": "patient-uuid",
  "doctor_id": "doctor-uuid",
  "appointment_date": "2026-01-20",
  "appointment_time": "14:30"
}

Expected: 201 Created
```

---

### Test 9: Get My Appointments

```
GET {{base_url}}/appointments/me

Expected: 200 OK
{
  "success": true,
  "data": {
    "appointments": [...],
    "total": 5
  }
}
```

---

### Test 10: Update Appointment Status

```
PATCH {{base_url}}/appointments/<appointment-uuid>/status

Body:
{
  "status": "completed"
}

Expected: 200 OK

OR to cancel:
{
  "status": "cancelled",
  "cancellation_reason": "Patient requested cancellation"
}
```

---

## ❌ Common Errors & Solutions

### Error: 401 Unauthenticated
```json
{
  "error": {
    "message": "Access token required"
  }
}
```
**Solution**: Add `Authorization: Bearer <token>` header

---

### Error: 403 Unauthorized
```json
{
  "error": {
    "message": "This action requires doctor role"
  }
}
```
**Solution**: Ensure your user has the correct role in the `users` table

---

### Error: 403 Consent Required
```json
{
  "error": {
    "message": "Patient has not granted consent to access medical records"
  }
}
```
**Solution**: Grant consent first using `POST /api/consent/grant`

---

### Error: 422 Validation Error
```json
{
  "error": {
    "message": "Validation failed",
    "details": ["patient_id must be a valid UUID"]
  }
}
```
**Solution**: Fix the input data according to validation requirements

---

### Error: 404 Not Found
```json
{
  "error": {
    "message": "Patient not found"
  }
}
```
**Solution**: Verify the UUID exists in the database

---

## 🔧 Troubleshooting

### Issue: "No patient record linked to this account"

**Cause**: User exists but no patient record with `user_id` set

**Solution**:
```sql
-- Link existing patient to user
UPDATE patients 
SET user_id = 'your-user-uuid' 
WHERE id = 'your-patient-uuid';
```

---

### Issue: "No doctor record linked to this account"

**Cause**: User exists but no doctor record with `user_id` set

**Solution**:
```sql
-- Link existing doctor to user
UPDATE doctors 
SET user_id = 'your-user-uuid' 
WHERE id = 'your-doctor-uuid';
```

---

### Issue: Role not matching

**Solution**:
```sql
-- Check current role
SELECT id, role, is_active FROM users WHERE id = 'your-user-uuid';

-- Update role
UPDATE users SET role = 'doctor' WHERE id = 'your-user-uuid';
```

---

## 📊 Testing Workflow

### Complete Test Scenario:

1. **Setup** (One-time):
   ```
   - Create user in Supabase Auth
   - Create patient record and link via user_id
   - Create doctor record and link via user_id
   - Set appropriate roles in users table
   ```

2. **Test as Patient**:
   ```
   a. Get token for patient user
   b. GET /consent/me (see default DENIED consents)
   c. POST /consent/grant (grant medical_records)
   d. GET /consent/history (see consent change)
   e. GET /medical-records/me (see my records)
   f. GET /audit/me (see who accessed my data)
   ```

3. **Test as Doctor**:
   ```
   a. Get token for doctor user
   b. POST /medical-records (create new record)
   c. GET /medical-records/patient/<id> (access with consent)
   d. PUT /medical-records/<id> (update own record)
   e. POST /appointments (create appointment)
   ```

4. **Test Consent Enforcement**:
   ```
   a. As patient: POST /consent/revoke
   b. As doctor: GET /medical-records/patient/<id> (should FAIL)
   c. As patient: POST /consent/grant
   d. As doctor: GET /medical-records/patient/<id> (should SUCCEED)
   ```

5. **Test Ownership**:
   ```
   a. As Doctor A: POST /medical-records (create record)
   b. As Doctor B: PUT /medical-records/<id> (should FAIL)
   c. As Doctor A: PUT /medical-records/<id> (should SUCCEED)
   ```

6. **Test Admin**:
   ```
   a. Set role='admin' for a user
   b. GET /audit/all (see all audit logs)
   c. GET /consent/patient/<id> (see patient consents)
   d. Access any resource (logged as admin_override)
   ```

---

## ✅ Success Criteria

- [ ] Can authenticate with JWT token
- [ ] Can grant and revoke consent
- [ ] Consent enforcement blocks unauthorized access
- [ ] Can create medical records as doctor
- [ ] Can access own medical records as patient
- [ ] Cannot access records without consent
- [ ] Can create and manage appointments
- [ ] Can view audit logs showing data access
- [ ] Validation errors are clear and helpful
- [ ] All actions are logged in audit trail

---

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify database schema is up to date
3. Ensure JWT token is valid (not expired)
4. Confirm user has appropriate role and linked records
5. Review API_DOCUMENTATION.md for endpoint details

---

**Happy Testing! 🚀**

The backend is production-ready and waiting for your tests!
