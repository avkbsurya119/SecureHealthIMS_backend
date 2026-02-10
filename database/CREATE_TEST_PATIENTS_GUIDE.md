# Creating Test Patient Data

The patient search is failing because there are no users with `role='patient'` in the database. Here are multiple ways to create test patient data:

## Option 1: Via Supabase Dashboard (Recommended - Fastest)

1. **Go to your Supabase Dashboard**: https://fkqhsgweypbrafwjmnmj.supabase.co

2. **Navigate to**: Table Editor → `users` table

3. **Click "Insert row"** and add the following test patients:

### Test Patient 1:
```
id: (auto-generated UUID)
email: test.patient1@example.com
full_name: Test Patient One
phone: +1-555-0001
date_of_birth: 1990-01-15
gender: male
blood_group: O+
role: patient
is_active: true
profile_completed: true
approval_status: approved
```

### Test Patient 2:
```
id: (auto-generated UUID)
email: test.patient2@example.com
full_name: Test Patient Two
phone: +1-555-0002
date_of_birth: 1985-05-20
gender: female
blood_group: A+
role: patient
is_active: true
profile_completed: true
approval_status: approved
```

### Test Patient 3:
```
id: (auto-generated UUID)
email: john.doe@example.com
full_name: John Doe
phone: +1-555-0003
date_of_birth: 1995-03-10
gender: male
blood_group: B+
role: patient
is_active: true
profile_completed: true
approval_status: approved
```

## Option 2: Via SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL script at: `Backend/database/create_test_patients.sql`

## Option 3: Via Node.js Script (If Supabase admin API is configured)

```bash
cd Backend
node scripts/create_test_patients.js
```

**Note**: This requires the `SUPABASE_SERVICE_ROLE_KEY` to be set in your `.env` file.

## Verification

After creating the test data, verify it works:

1. **Check the data exists**:
   - Go to Supabase Dashboard → Table Editor → `users`
   - Filter by `role = 'patient'`
   - You should see 3 patients

2. **Test the search endpoint**:
   ```bash
   # Get a doctor JWT token first by logging in as a doctor
   curl -H "Authorization: Bearer YOUR_DOCTOR_JWT_TOKEN" \
        "http://localhost:5000/api/patients/search?q=Test"
   ```

3. **Test in the UI**:
   - Log in as a doctor
   - Go to Doctor Dashboard → Patients tab
   - Search for "Test" - you should see "Test Patient One" and "Test Patient Two"
   - Search for "John" - you should see "John Doe"

## Why This Fixes the Issue

The backend controller searches the `users` table with this query:
```sql
SELECT * FROM users 
WHERE role = 'patient' 
AND (full_name ILIKE '%query%' OR email ILIKE '%query%' OR phone ILIKE '%query%')
```

Without any users having `role='patient'`, the search returns 0 results. Adding these test patients will make the search functional.
