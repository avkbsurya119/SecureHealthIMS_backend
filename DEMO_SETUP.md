# 🎯 Demo Account Setup Guide

This guide will help you create demo accounts to test the secure healthcare backend.

---

## 📋 Quick Setup Steps

### Step 1: Create Auth Users in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add User"** and create these three accounts:

#### Account 1: Admin
- **Email**: `admin@demo.com`
- **Password**: `Admin123!`
- **Email Confirmation**: Toggle OFF (for demo)

#### Account 2: Doctor
- **Email**: `doctor@demo.com`
- **Password**: `Doctor123!`
- **Email Confirmation**: Toggle OFF (for demo)

#### Account 3: Patient
- **Email**: `patient@demo.com`
- **Password**: `Patient123!`
- **Email Confirmation**: Toggle OFF (for demo)

---

### Step 2: Get User IDs

After creating the auth users:

1. In Supabase Dashboard, go to **SQL Editor**
2. Run this query:

```sql
SELECT id, email FROM auth.users 
WHERE email IN ('admin@demo.com', 'doctor@demo.com', 'patient@demo.com')
ORDER BY email;
```

3. **Copy the UUIDs** - you'll need them in the next step

Example output:
```
id                                   | email
-------------------------------------|------------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | admin@demo.com
b2c3d4e5-f6a7-8901-bcde-f12345678901 | doctor@demo.com
c3d4e5f6-a7b8-9012-cdef-123456789012 | patient@demo.com
```

---

### Step 3: Prepare SQL Script

1. Open the file: `database/seed_demo_accounts.sql`
2. **Find and replace** all placeholder UUIDs with your actual auth user IDs:

Replace these placeholders:
- `YOUR_ADMIN_AUTH_ID_HERE` → Paste admin UUID
- `YOUR_DOCTOR_AUTH_ID_HERE` → Paste doctor UUID  
- `YOUR_PATIENT_AUTH_ID_HERE` → Paste patient UUID

**Tip**: Use Ctrl+H (Find & Replace) in your editor to replace all at once

---

### Step 4: Run the Seed Script

1. Go back to Supabase **SQL Editor**
2. Click **"New Query"**
3. Copy the **entire contents** of `database/seed_demo_accounts.sql` (after replacing UUIDs)
4. Paste into the SQL Editor
5. Click **"Run"** or press **Ctrl+Enter**

You should see success messages and a verification query at the end.

---

### Step 5: Verify Setup

Run this verification query in SQL Editor:

```sql
-- Check admin user
SELECT u.id, u.role, u.is_active 
FROM users u 
WHERE u.role = 'admin' 
LIMIT 1;

-- Check doctor with linked record
SELECT u.id, u.role, d.name, d.email 
FROM users u 
JOIN doctors d ON u.id = d.user_id 
LIMIT 1;

-- Check patient with consents
SELECT 
  u.id, 
  u.role, 
  p.name, 
  COUNT(pc.id) as consent_count
FROM users u 
JOIN patients p ON u.id = p.user_id
LEFT JOIN patient_consents pc ON p.id = pc.patient_id
WHERE u.role = 'patient'
GROUP BY u.id, u.role, p.name
LIMIT 1;
```

Expected results:
- ✅ 1 admin user
- ✅ 1 doctor with linked doctor record
- ✅ 1 patient with 4 granted consents

---

## 🔐 Login Credentials

After setup, use these credentials in Postman:

### Admin Account
```
Email: admin@demo.com
Password: Admin123!
Role: admin
```

**Can do**:
- View all audit logs
- View any patient's consents
- Override access controls (logged as admin_override)

---

### Doctor Account
```
Email: doctor@demo.com
Password: Doctor123!
Role: doctor
Name: Dr. Sarah Johnson
Specialization: General Physician
```

**Can do**:
- Create medical records
- Create appointments
- View patient records (with consent)
- Update own medical records

---

### Patient Account
```
Email: patient@demo.com
Password: Patient123!
Role: patient
Name: John Doe
DOB: 1990-05-15
```

**Can do**:
- View own medical records
- Grant/revoke consent
- View consent history
- View own audit logs
- View own appointments

**Pre-granted consents**: All 4 types granted by default for easy testing

---

## 🧪 Test the Accounts

### Get JWT Token (using Supabase Auth)

Use Postman to login:

```
POST https://{{YOUR_PROJECT_REF}}.supabase.co/auth/v1/token?grant_type=password

Headers:
  apikey: {{YOUR_SUPABASE_ANON_KEY}}
  Content-Type: application/json

Body:
{
  "email": "admin@demo.com",
  "password": "Admin123!"
}
```

Response will include `access_token` - use this in your API requests:
```
Authorization: Bearer {{access_token}}
```

---

### Quick Test Sequence

#### 1. Test Admin Access
```bash
GET http://localhost:5000/api/audit/all
Authorization: Bearer {{admin_token}}

# Should see all audit logs
```

---

#### 2. Test Doctor - Create Medical Record
```bash
POST http://localhost:5000/api/medical-records
Authorization: Bearer {{doctor_token}}
Content-Type: application/json

{
  "patient_id": "{{patient_uuid}}",
  "diagnosis": "Routine checkup - healthy",
  "prescription": "None required",
  "notes": "All vitals normal"
}

# Should succeed - doctor can create records
```

---

#### 3. Test Patient - View Own Records
```bash
GET http://localhost:5000/api/medical-records/me
Authorization: Bearer {{patient_token}}

# Should see medical records (consent pre-granted)
```

---

#### 4. Test Patient - Revoke Consent
```bash
POST http://localhost:5000/api/consent/revoke
Authorization: Bearer {{patient_token}}
Content-Type: application/json

{
  "consent_type": "medical_records"
}

# Should succeed - consent revoked
```

---

#### 5. Test Doctor - Try Access After Revoke
```bash
GET http://localhost:5000/api/medical-records/patient/{{patient_uuid}}
Authorization: Bearer {{doctor_token}}

# Should FAIL with 403 - consent required
```

---

#### 6. Test Patient - View Audit Log
```bash
GET http://localhost:5000/api/audit/me
Authorization: Bearer {{patient_token}}

# Should see all access attempts including the failed one
```

---

## 🔧 Troubleshooting

### Issue: "User not found in users table"

**Cause**: Auth user exists but not linked in `users` table

**Solution**: Re-run the seed script with correct UUIDs

---

### Issue: "No patient/doctor record linked"

**Cause**: Mismatch between auth user ID and `user_id` in patients/doctors table

**Fix**:
```sql
-- Check what's linked
SELECT 
  u.id as user_id,
  u.role,
  d.id as doctor_id,
  p.id as patient_id
FROM users u
LEFT JOIN doctors d ON u.id = d.user_id
LEFT JOIN patients p ON u.id = p.user_id
WHERE u.id = 'YOUR_USER_UUID';

-- If missing, update the link
UPDATE patients 
SET user_id = 'YOUR_CORRECT_UUID' 
WHERE email = 'patient@demo.com';
```

---

### Issue: Can't get JWT token

**Cause**: Auth user not created or password incorrect

**Solution**: 
1. Check in Supabase Dashboard → Authentication → Users
2. Verify email and password
3. Try resetting password if needed

---

## 📝 Sample Data Included

After running the seed script, you'll have:

- ✅ **3 users**: admin, doctor, patient
- ✅ **1 department**: General Medicine
- ✅ **1 doctor record**: Dr. Sarah Johnson
- ✅ **1 patient record**: John Doe
- ✅ **4 consents**: All granted for patient
- ✅ **1 medical record**: Past checkup
- ✅ **1 appointment**: Upcoming appointment (7 days from now)

---

## 🎉 You're Ready!

Demo accounts are set up and ready to test the secure healthcare backend!

Refer to [QUICK_START_TESTING.md](QUICK_START_TESTING.md) for comprehensive testing scenarios.

---

**Need help?** Check the troubleshooting section or review the SQL seed script for details.
