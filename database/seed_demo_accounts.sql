-- =====================================================
-- DEMO ACCOUNTS SEED DATA
-- =====================================================
-- This script creates demo accounts for testing
-- Run this in your Supabase SQL Editor
-- =====================================================

-- First, you need to create the auth users in Supabase Dashboard:
-- Go to Authentication > Users > Add User
-- Create these users with the following emails:
-- 1. admin@demo.com (password: Admin123!)
-- 2. doctor@demo.com (password: Doctor123!)
-- 3. patient@demo.com (password: Patient123!)

-- After creating auth users, run this script
-- Replace the UUIDs below with the actual user IDs from Supabase Auth

-- =====================================================
-- STEP 1: Create Users in the users table
-- =====================================================

-- Note: Replace 'YOUR_AUTH_USER_ID_HERE' with actual auth.users ID from Supabase
-- You can get these IDs by running: SELECT id, email FROM auth.users;

-- Demo Admin User
INSERT INTO users (id, role, is_active, created_at, updated_at)
VALUES (
  'YOUR_ADMIN_AUTH_ID_HERE', -- Replace with actual auth user ID for admin@demo.com
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Demo Doctor User
INSERT INTO users (id, role, is_active, created_at, updated_at)
VALUES (
  'YOUR_DOCTOR_AUTH_ID_HERE', -- Replace with actual auth user ID for doctor@demo.com
  'doctor',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Demo Patient User
INSERT INTO users (id, role, is_active, created_at, updated_at)
VALUES (
  'YOUR_PATIENT_AUTH_ID_HERE', -- Replace with actual auth user ID for patient@demo.com
  'patient',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =====================================================
-- STEP 2: Create Demo Department
-- =====================================================

INSERT INTO departments (id, name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'General Medicine',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING
RETURNING id;

-- Store the department ID for use in doctor record
DO $$
DECLARE
  dept_id UUID;
BEGIN
  SELECT id INTO dept_id FROM departments WHERE name = 'General Medicine' LIMIT 1;
  
  -- =====================================================
  -- STEP 3: Create Demo Doctor Record
  -- =====================================================
  
  INSERT INTO doctors (
    id,
    user_id,
    name,
    specialization,
    phone,
    email,
    department_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'YOUR_DOCTOR_AUTH_ID_HERE', -- Replace with actual auth user ID
    'Dr. Sarah Johnson',
    'General Physician',
    '+1-555-0101',
    'doctor@demo.com',
    dept_id,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    specialization = EXCLUDED.specialization,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id,
    updated_at = NOW();
END $$;

-- =====================================================
-- STEP 4: Create Demo Patient Record
-- =====================================================

INSERT INTO patients (
  id,
  user_id,
  name,
  date_of_birth,
  gender,
  phone,
  email,
  address,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_PATIENT_AUTH_ID_HERE', -- Replace with actual auth user ID
  'John Doe',
  '1990-05-15',
  'male',
  '+1-555-0102',
  'patient@demo.com',
  '123 Main Street, City, State 12345',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  date_of_birth = EXCLUDED.date_of_birth,
  gender = EXCLUDED.gender,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  updated_at = NOW();

-- =====================================================
-- STEP 5: Grant Default Consents for Demo Patient
-- =====================================================

-- Grant all consents for the demo patient (for easy testing)
INSERT INTO patient_consents (
  id,
  patient_id,
  consent_type,
  status,
  granted_at,
  created_at
)
SELECT 
  gen_random_uuid(),
  p.id,
  consent_type,
  'granted',
  NOW(),
  NOW()
FROM patients p
CROSS JOIN (
  VALUES 
    ('medical_records'),
    ('data_sharing'),
    ('treatment'),
    ('research')
) AS consent_types(consent_type)
WHERE p.user_id = 'YOUR_PATIENT_AUTH_ID_HERE' -- Replace with actual auth user ID
ON CONFLICT (patient_id, consent_type) 
DO UPDATE SET 
  status = 'granted',
  granted_at = NOW();

-- =====================================================
-- STEP 6: Create Sample Medical Records
-- =====================================================

DO $$
DECLARE
  patient_id_var UUID;
  doctor_id_var UUID;
  doctor_user_id_var UUID := 'YOUR_DOCTOR_AUTH_ID_HERE'; -- Replace
BEGIN
  -- Get patient and doctor IDs
  SELECT id INTO patient_id_var FROM patients WHERE user_id = 'YOUR_PATIENT_AUTH_ID_HERE';
  SELECT id INTO doctor_id_var FROM doctors WHERE user_id = doctor_user_id_var;
  
  -- Create sample medical record
  INSERT INTO medical_records (
    id,
    patient_id,
    doctor_id,
    diagnosis,
    prescription,
    notes,
    created_by,
    updated_by,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    patient_id_var,
    doctor_id_var,
    'Annual physical examination - All vital signs normal',
    'Multivitamin supplement, 1 tablet daily',
    'Patient in good health. Recommend follow-up in 1 year.',
    doctor_user_id_var,
    doctor_user_id_var,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  );
END $$;

-- =====================================================
-- STEP 7: Create Sample Appointment
-- =====================================================

DO $$
DECLARE
  patient_id_var UUID;
  doctor_id_var UUID;
  doctor_user_id_var UUID := 'YOUR_DOCTOR_AUTH_ID_HERE'; -- Replace
BEGIN
  -- Get patient and doctor IDs
  SELECT id INTO patient_id_var FROM patients WHERE user_id = 'YOUR_PATIENT_AUTH_ID_HERE';
  SELECT id INTO doctor_id_var FROM doctors WHERE user_id = doctor_user_id_var;
  
  -- Create upcoming appointment
  INSERT INTO appointments (
    id,
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    status,
    created_by,
    updated_by,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    patient_id_var,
    doctor_id_var,
    CURRENT_DATE + INTERVAL '7 days',
    '14:00:00',
    'scheduled',
    doctor_user_id_var,
    doctor_user_id_var,
    NOW(),
    NOW()
  );
END $$;

-- =====================================================
-- VERIFICATION: Check created accounts
-- =====================================================

-- View all demo users
SELECT 
  u.id,
  u.role,
  u.is_active,
  COALESCE(d.name, p.name, 'Admin User') as name,
  COALESCE(d.email, p.email, 'admin@demo.com') as email
FROM users u
LEFT JOIN doctors d ON u.id = d.user_id
LEFT JOIN patients p ON u.id = p.user_id
WHERE u.id IN (
  'YOUR_ADMIN_AUTH_ID_HERE',
  'YOUR_DOCTOR_AUTH_ID_HERE',
  'YOUR_PATIENT_AUTH_ID_HERE'
);

-- View demo patient consents
SELECT 
  pc.consent_type,
  pc.status,
  pc.granted_at
FROM patient_consents pc
JOIN patients p ON pc.patient_id = p.id
WHERE p.user_id = 'YOUR_PATIENT_AUTH_ID_HERE';

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Demo accounts created successfully!
-- 
-- Login credentials:
-- 1. Admin:   admin@demo.com / Admin123!
-- 2. Doctor:  doctor@demo.com / Doctor123!
-- 3. Patient: patient@demo.com / Patient123!
-- =====================================================
